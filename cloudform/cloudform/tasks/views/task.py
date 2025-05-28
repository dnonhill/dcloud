from time import time

from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from cloudform.tasks.models import Task, TASK_TYPE_SCRIPT, Assignment
from cloudform.tasks.serializers import TaskSerializer
from cloudform.users.models import Group


class TaskPermission(IsAuthenticated):
    READONLY_GROUPS = [Group.CLOUD_ADMIN, Group.OPERATOR]

    def has_permission(self, request, view):
        current_groups = self.extract_user_groups(request)
        is_ops_team = any(
            (group for group in current_groups if group in self.READONLY_GROUPS)
        )
        return is_ops_team

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return self.is_assignee(request, obj.task)

    @staticmethod
    def extract_user_groups(request):
        current_user = request.user
        current_groups = current_user.groups.values_list("name", flat=True)
        return current_groups

    @staticmethod
    def is_assignee(request, obj):
        return (
            Assignment.objects.filter(ticket__items=obj.ticket_item.id)
            .filter(assignee=request.user.id)
            .exists()
        )


class TaskViewSet(GenericViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = Task.objects
    serializer_class = TaskSerializer

    @action(detail=True, url_path="mark-complete", methods=["post"])
    def mark_complete(self, request, pk=None):
        task = self.get_object()
        task.mark_complete()

        serializer = self.get_serializer(task)
        return Response(data=serializer.data)

    @action(detail=True, url_path="unmark-complete", methods=["post"])
    def unmark_complete(self, request, pk=None):
        task = self.get_object()
        task.unmark_complete()

        serializer = self.get_serializer(task)
        return Response(data=serializer.data)

    @action(detail=True, url_path="run-script", methods=["post"])
    def run_script(self, request, pk=None):
        task_vars = request.data.get("vars", dict())
        if not isinstance(task_vars, dict):
            raise ValidationError("Task variables should be in key-value object format")

        task = self.get_object()
        try:
            task.execute(custom_extra_vars=task_vars)
        except Exception as err:
            raise ValidationError(detail=str(err), code="task.runscript.failed")

        serializer = self.get_serializer(task)
        return Response(data=serializer.data)

    @action(detail=True, url_path="extra-vars", methods=["get"])
    def extra_vars(self, request, pk=None):
        task = self.get_object()
        if task.task_type != TASK_TYPE_SCRIPT:
            raise ValidationError(
                detail="Extra variables available for script task only",
                code="task.extravars.invalid",
            )

        data = task.extra_vars()
        return Response(data=data)

    @action(detail=True, url_path="duplicate", methods=["post"])
    def duplicate(self, request, pk=None):
        task = self.get_object()
        new_task = Task(
            description=task.description,
            task_type=task.task_type,
            sequence=int(time()),
            task_template=task.task_template,
            task_group=task.task_group
        )
        new_task.save()

        serializer = self.get_serializer(new_task)
        return Response(data=serializer.data)

    @action(detail=True, url_path="get-status", methods=["post"])
    def get_status(self, request, pk=None):
        job_id = request.data.get("jobId", dict())
        task = self.get_object()
        data = task.get_status(job_id)
        return Response(data=data)
