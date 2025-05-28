import logging
import json
import jmespath

from channels.generic.http import AsyncHttpConsumer
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
from django.utils import dateparse
from rest_framework import serializers

from cloudform import awx
from cloudform.tasks.models import Task


logger = logging.getLogger(__name__)


class AwxHookSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    status = serializers.ChoiceField(
        required=True, choices=("running", "successful", "canceled", "failed")
    )
    finished = serializers.DateTimeField(required=True)


class TaskStatusConsumer(AsyncHttpConsumer):
    methods = ("POST",)
    group = "taskstatus"

    async def handle(self, body):
        try:
            logger.info(body)
            await self._handle(body)
        except Exception as ex:
            logger.exception("Error while handling request", ex)
            await self._send_status_message(500, str(ex))

    async def _handle(self, body):

        # Check allowed HTTP methods
        method = self.scope["method"]
        if method not in self.methods:
            await self._send_status_message(405, "Unallowed HTTP methods")
            return

        # Check secret token
        try:
            secret = self._hook_secret_from_headers()
            self._validate_secret_token(secret)
        except ValueError as e:
            if isinstance(e, awx.UnauthorizedSecretToken):
                await self._send_status_message(403, str(e))
            elif isinstance(e, awx.InvalidSecretToken):
                await self._send_status_message(401, str(e))
            return

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            await self._send_status_message(400, "Invalid JSON format")
            return

        serializer = AwxHookSerializer(data=data)
        if not serializer.is_valid():
            await self._send_status_message(400, "Invalid task status request format")

        payload = serializer.data
        task = Task.objects.filter(acknowledge_id=payload["id"]).first()

        if not task:
            await self._send_status_message(404, "Task not found")
            return

        task.finish_time = dateparse.parse_datetime(payload["finished"])
        task.is_success = self._check_success(payload["status"])

        if task.is_success:
            task_result = awx.job_stdout(payload["id"])
            task_result = self._filter_result(task, task_result)
            task.apply_result(task_result)

        task.save()

        await self.channel_layer.group_send(
            self.group, {"type": "taskstatus.complete", "task": self._task_json(task)}
        )

        await self.send_response(
            200,
            json.dumps({"status": "success"}).encode("UTF-8"),
            headers=[(b"Content-Type", b"application/json")],
        )

    def _task_json(self, task):
        task_dict = model_to_dict(
            task,
            fields=(
                "id",
                "description",
                "complete",
                "task_type",
                "start_time",
                "finish_time",
                "is_success",
            ),
        )
        task_dict.update({"job_url": task.job_url})
        task_json = json.dumps(task_dict, cls=DjangoJSONEncoder)
        return task_json

    def _validate_secret_token(self, secret_challenge):
        awx.validate_awx_secret(secret_challenge)

    def _hook_secret_from_headers(self):
        headers = {
            k.decode("UTF-8"): v.decode("UTF-8") for k, v in self.scope["headers"]
        }
        secret = headers.get(awx.HOOK_SECRET_HTTP_HEADER, None)
        return secret

    async def _send_status_message(self, status, message):
        await self.send_response(
            status=status, body=json.dumps({"message": message}).encode("UTF-8")
        )

    def _check_success(self, status):
        return status == "successful"

    def _filter_result(self, task, task_result):
        return WebHookTaskResultFilter(task).filter(task_result)


class WebHookTaskResultFilter:
    result_task_name = "result"

    def __init__(self, task):
        self.task = task

    def _extract(self, task_result):
        query = (
            f"plays[*].tasks[?name=='{self.result_task_name}'].results[][][].content"
        )
        filtered = jmespath.search(query, task_result)
        return filtered

    def _collapse(self, results):
        """Collapse all result dictionaries into one skip the result which is not dict type`"""
        results = [result for result in results if isinstance(result, dict)]
        collapse = {}
        for result in results:
            collapse.update(result)
        return collapse

    def _select(self, task_result):
        return task_result

    def filter(self, task_result):
        # Extract content variables of tasks which have the same name as self.result_task_name
        task_result = self._extract(task_result)
        # Collapse all extracted variable list into one dictionary
        task_result = self._collapse(task_result)
        # Select variables according to the task type and task action
        task_result = self._select(task_result)

        return task_result
