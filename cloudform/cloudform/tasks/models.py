import json
import re
from typing import Optional
import logging

from django.contrib import auth
from django.contrib.postgres.fields import JSONField
from django.conf import settings
from django.db import models, transaction
from django.dispatch import Signal
from django.utils import timezone
from django_celery_beat.models import CrontabSchedule, PeriodicTask
import jmespath

from cloudform.projects.models.resource import (
    Resource,
    RESOURCE_TYPES,
    RESOURCE_TYPE_VM,
    RESOURCE_TYPE_OPENSHIFT,
)
from cloudform import awx
from cloudform.tickets.models import Ticket, TicketItem
from cloudform.users.models import Operator, CloudAdmin
from zouth.audit.models import AuditModel
from cloudform.inventories.models import InventoryList
from cloudform.inventories import tasks

ticket_assigned = Signal(providing_args=["instance"])
ticket_completed = Signal(providing_args=["instance"])

logger = logging.getLogger(__name__)

class Assignment(AuditModel):
    ticket = models.ForeignKey(
        Ticket, related_name="assignments", on_delete=models.PROTECT
    )
    assignee = models.ForeignKey(Operator, related_name="+", on_delete=models.PROTECT)
    assigner = models.ForeignKey(CloudAdmin, related_name="+", on_delete=models.PROTECT)

    closed_at = models.DateTimeField(null=True)

    overdue_alerted_at = models.DateTimeField(null=True)

    note = models.TextField(null=True, blank=True)

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        is_created = not self.pk
        if is_created:
            self.ticket.status = "assigned"
            self.ticket.save()
            # TaskTemplate.generate_task(self.request)
            for item in self.ticket.items.all():
                TaskGroup(ticket_item=item).save()

        super().save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields,
        )

        if is_created:
            ticket_assigned.send_robust(sender=self.__class__, instance=self)

    def reassign(self, assigner: CloudAdmin, assignee: Operator, note):
        self.assigner = assigner
        self.assignee = assignee
        self.updated_by = assigner
        self.note = note
        self.save()

        ticket_assigned.send_robust(sender=self.__class__, instance=self)

    def close(self, note: Optional[str] = None):
        if not self.active_flag:
            return

        with transaction.atomic():
            self.ticket.close(self.assignee, note)

            self.active_flag = False
            self.closed_at = timezone.now()
            self.save()
            ticket_completed.send_robust(sender=self.__class__, instance=self)

    def get_absolute_url(self):
        return "/my-assignments/%i" % self.id


class TaskGroup(models.Model):
    ticket_item = models.OneToOneField(to=TicketItem, on_delete=models.PROTECT)
    complete = models.BooleanField(default=False)
    result = JSONField(default=dict)

    @property
    def assignment(self):
        return Assignment.objects.filter(ticket=self.ticket_item.ticket).first

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        tasks_generated = self.pk is None

        super().save(force_insert, force_update, using, update_fields)

        if tasks_generated:
            tasks = TaskTemplate.generate_tasks(self)
            for task in tasks:
                task.save()

    @transaction.atomic
    def mark_complete(self, result=None):
        self.result = result if result else {}
        self.complete = True
        self.save()

        # Apply result to entities
        self.apply_result(self.result)

        # Skip resource type "other"
        if self.ticket_item.resource_type == "other":
            return

        # stop periodic_task when delete resource
        if self.ticket_item.action == "delete":
            inventory_list_delete = InventoryList.objects.filter(name=self.ticket_item.resource.name).first()
            if not inventory_list_delete:
                return
            inventory_list_delete.stop_one_periodic_task()
            return

        # Create Inventory resource
        if not self.__is_by_pass_create_inventory():
            vm_id = None
            vm_name = self.get_vm_name(self.ticket_item.resource_type, self.result)
            if self.ticket_item.resource_type == "vm":
                vm = tasks.get_vm_id(
                    vm_name,
                    self.ticket_item.resource.data_center
                )
                logger.info('\n===== PRINT VM FROM VCENTER =====\n')
                logger.info(vm)
                logger.info('\n===== ENDPRINT =====\n')
                if len(vm) == 0:
                    raise RuntimeError("vm name not found or can not mark complete")
                vm_name = vm[0]["vm"]
                vm_id = vm[0]["vm"]

                is_have_periodic_task = PeriodicTask.objects.filter(name=vm_id).first()
                if is_have_periodic_task:
                    self.__update_inventory_list(self.ticket_item.resource.name)
                    return
            if self.ticket_item.resource_type == "container-cluster":
                is_have_periodic_task = PeriodicTask.objects.filter(name=vm_name).first()
                if is_have_periodic_task:
                    self.__update_inventory_list(self.ticket_item.resource.name)
                    return

            inventory = self.create_inventory_list(self.ticket_item.resource_id, vm_id)

            # Create Celery periodic task
            self.create_billing_periodic_task(
                vm_name=vm_name,
                inventory_id=inventory.id,
                resource_type=self.ticket_item.resource_type
            )

    def __is_by_pass_create_inventory(self):
        if self.ticket_item.resource_type == RESOURCE_TYPE_VM:
            return self.ticket_item.resource.data_center.endpoint_vm is None
        elif self.ticket_item.resource_type == RESOURCE_TYPE_OPENSHIFT:
            return self.ticket_item.resource.data_center.endpoint_openshif is None
        return False

    def create_billing_periodic_task(self, vm_name, inventory_id, resource_type):
        PeriodicTask.objects.create(
            crontab=self.get_billing_schedule(),
            name=vm_name,
            task="cloudform.inventories.tasks.update_inventory",
            kwargs=json.dumps(
                {
                    "vm_name": vm_name,
                    "inventory_id": inventory_id,
                    "resource_type": resource_type
                }
            )
        )
    def __update_inventory_list(self, resource_name):
        inventoryList = InventoryList.objects.get(name=resource_name)
        inventoryList.save()

    def create_inventory_list(self, resource_id, vm_id):
        resource = Resource.objects.filter(pk=resource_id).first()
        if resource:
            inventoryList = InventoryList.objects.create(
                project=resource.application.project.name,
                application=resource.application.name,
                name=resource.name,
                vm_id=vm_id,
                secondary_name=resource.secondary_name,
                resource_type=resource.resource_type,
                data_center_ref=resource.data_center,
                job_code=resource.job_code,
                active_flag=True,
                details=resource.details,
            )
            return inventoryList
        raise Exception(f"resoure id {resource_id} does not exit.")

    def get_billing_schedule(self):
        hourly_billing_schedule, _ = CrontabSchedule.objects.get_or_create(
            minute="0",
            hour="*",
            day_of_week="*",
            day_of_month="*",
            month_of_year="*"
        )
        return hourly_billing_schedule


    def get_vm_name(self, resource_type, result):
        if resource_type == "vm":
            vm_name = result["hostname"]
        elif resource_type == "container-cluster":
            vm_name = result["namespace"]
        return vm_name


    def apply_result(self, result):
        TaskResultAction(self.ticket_item).execute(result)

    def ticket_vars(self):
        return {}

    def collect_results(self):
        results = {}
        for task in self.tasks.order_by("sequence").all():
            if task.result:
                results.update(task.result)

        return results


class TaskTemplate(AuditModel):
    resource_type = models.CharField(max_length=255)
    action = models.CharField(max_length=255)
    task_sequence = models.IntegerField()
    name = models.CharField(max_length=255)

    script_name = models.TextField(blank=True)
    script_variables = models.TextField(default=dict)

    def __str__(self):
        return self.name

    @classmethod
    def generate_tasks(cls, task_group: TaskGroup):
        templates = (
            TaskTemplate.objects.filter(
                action=task_group.ticket_item.action,
                resource_type=task_group.ticket_item.resource_type,
            )
            .order_by("task_sequence")
            .all()
        )

        if templates:
            return [
                Task(**template.task_template_kwargs(task_group))
                for template in templates
            ]

        return [Task(**cls.taskgroup_task_kwargs(task_group))]

    def task_template_kwargs(self, task_group: TaskGroup):
        if self.script_name:
            task_type = TASK_TYPE_SCRIPT
            task_template = self
        else:
            task_type = TASK_TYPE_MANUAL
            task_template = None

        return {
            "task_type": task_type,
            "sequence": self.task_sequence,
            "description": self.name,
            "task_template": task_template,
            "task_group": task_group,
        }

    @classmethod
    def taskgroup_task_kwargs(cls, task_group):
        return {
            "task_type": TASK_TYPE_MANUAL,
            "description": f"{task_group.ticket_item.action} {task_group.ticket_item.resource_type}",
            "sequence": 1,
            "task_group": task_group,
        }

    @property
    def variables(self):
        return (
            json.loads(self.script_variables)
            if self.script_variables is not None
            else {}
        )


TASK_TYPE_MANUAL = "manual"
TASK_TYPE_SCRIPT = "script"

# Task type constants
TASK_TYPES = (TASK_TYPE_MANUAL, TASK_TYPE_SCRIPT)

SUB_PATTERN = re.compile(r"({{\s*([a-zA-Z_][a-zA-Z_0-9.]+)\s*}})")


class Task(AuditModel):
    task_group = models.ForeignKey(
        TaskGroup, related_name="tasks", on_delete=models.PROTECT
    )

    description = models.CharField(max_length=255)
    sequence = models.IntegerField()
    task_type = models.CharField(max_length=255, choices=zip(TASK_TYPES, TASK_TYPES))
    task_template = models.ForeignKey(
        TaskTemplate, related_name="+", on_delete=models.SET_NULL, null=True
    )
    complete = models.BooleanField(default=False)
    start_time = models.DateTimeField(null=True)
    finish_time = models.DateTimeField(null=True)
    is_success = models.NullBooleanField()
    result = JSONField(default=dict)
    acknowledge_id = models.IntegerField(null=True)

    @property
    def job_url(self):
        if self.acknowledge_id is None:
            return None
        return f"{settings.AWX_API_HOST}/#/jobs/playbook/{self.acknowledge_id}"

    def execute(self, *args, **kwargs):
        if self.task_type == TASK_TYPE_MANUAL:
            raise RuntimeError("Manual task cannot be run")

        self.run_script(*args, **kwargs)
        self.save()

    def extra_vars(self):
        _extra_vars = Task.gen_extra_vars(
            self.task_template.variables, self.task_group.ticket_item.variables
        )
        _extra_vars = Task.hidden_vars(_extra_vars)
        return _extra_vars

    _HIDDEN_FIELDS = {"PASSWORD": ("password", "pass", "passwd", "pwd")}

    @classmethod
    def hidden_vars(cls, extra_vars):
        hidden_vars = {
            key: cls._hidden_val(key, value, method)
            for key, value in extra_vars.items()
            for method in cls._hidden_methods(key)
            if method
        }
        if hidden_vars:
            extra_vars = extra_vars.copy()
            extra_vars.update(hidden_vars)
        return extra_vars

    @classmethod
    def _hidden_methods(cls, key):
        return {
            method
            for (method, words) in cls._HIDDEN_FIELDS.items()
            for word in words
            if word in key
        }

    @classmethod
    def _hidden_val(cls, key, value, method):
        if method == "PASSWORD":
            value = cls.hidden_password(key, value)
        return value

    @classmethod
    def hidden_password(cls, key, value):
        return auth.get_user_model().objects.make_random_password()

    @staticmethod
    def gen_extra_vars(script_vars, item_vars):
        result_vars = script_vars.copy()
        for k, v in script_vars.items():
            script_val = result_vars[k] # retrieved value from key
            if isinstance(script_val, dict): # if value is dict
                result_vars[k] = Task.gen_extra_vars(script_val, item_vars)
            elif isinstance(script_val, str): # if value is str
                result_vars[k] = Task.substitute_var(v, item_vars)
        return result_vars

    @staticmethod
    def substitute_var(script_val, item_vars):
        if not isinstance(script_val, (bytes, str)):
            return script_val

        match = re.search(SUB_PATTERN, script_val)
        if match is None:
            return script_val

        key = match.groups(1)[1]
        key = key.split(".")
        key = key[1:] if key[0] == "item" and len(key) > 1 else key

        pos = 0
        val = item_vars
        while pos < len(key) and val is not None:
            if key is None:
                return ""
            key_pos = key[pos]
            val = val.get(key_pos, None)
            pos += 1
        return val or ""

    @property
    def _job_template(self):
        return self.task_template.script_name

    def run_script(self, *args, **kwargs):
        custom_extra_vars = kwargs.get("custom_extra_vars", dict())
        extra_vars = self.extra_vars()
        extra_vars.update(custom_extra_vars)
        self.acknowledge_id = awx.launch_job(self._job_template, extra_vars=extra_vars)

        if self.acknowledge_id:
            self.start_time = timezone.now()

        self.save()

    def get_status(self, job_id):
        job = awx.get_job_status(job_id)

        try:
            self.finish_time = job["finished"]
            self.complete = True
            if job["status"] == 'successful':
                self.is_success = True
            else:
                self.is_success = False

            self.save()
            return job
        except TypeError:
            return job

    def mark_complete(self):
        self.complete = True
        self.save()

    def unmark_complete(self):
        self.complete = False
        self.save()

    def apply_result(self, result):
        item = self.task_group.ticket_item
        interpreter = TaskResultInterpreter(item)
        self.result = interpreter.interpret(result)

        self.save()


class TaskResultAction:
    class BaseTicketItemAction:
        def __init__(self, ticket_item):
            self.ticket_item = ticket_item

        def execute(self, result=None):
            raise NotImplementedError("execute() should be override")

        def _extract_resource_name(self, details, force_default=True):
            if self.ticket_item.resource_type == RESOURCE_TYPE_VM:
                args = ("hostname", RESOURCE_TYPE_VM if force_default else None)
            else:
                args = ("namespace", RESOURCE_TYPE_OPENSHIFT if force_default else None)
            return details.get(*args)

        def _extract_secondary_name(self, details, force_default=None):
            if self.ticket_item.resource_type == RESOURCE_TYPE_VM:
                return details.get("name", RESOURCE_TYPE_VM if force_default else None)
            return None

    class ItemCreateResultAction(BaseTicketItemAction):
        def execute(self, result=None):
            assert self.ticket_item.resource_type is not None, ""
            if self.ticket_item.resource_type not in RESOURCE_TYPES:
                return

            details = self.ticket_item.specification.copy()
            details.update(result)

            name = self._extract_resource_name(details)
            secondary_name = self._extract_secondary_name(details)
            ticket = self.ticket_item.ticket

            resource = Resource.objects.create(
                name=name,
                secondary_name=secondary_name,
                resource_type=self.ticket_item.resource_type,
                application=ticket.application,
                data_center=ticket.data_center,
                job_code=ticket.job_code,
                details=details,
            )

            self.ticket_item.resource = resource
            self.ticket_item.save()

    class ItemUpdateResultAction(BaseTicketItemAction):
        def execute(self, result=None):
            specification = self.ticket_item.specification

            new_spec = self.ticket_item.resource.details.copy()
            new_spec.update(specification)
            new_spec.update(result)

            resource = self.ticket_item.resource
            resource.details.update(new_spec)

            primary_name = self._extract_resource_name(resource.details, force_default=False)
            if primary_name:
                resource.name = primary_name

            secondary_name = self._extract_secondary_name(resource.details, force_default=False)
            if secondary_name:
                resource.secondary_name = secondary_name

            resource.save()

    class ItemDeleteResultAction(BaseTicketItemAction):
        def execute(self, result=None):
            self.ticket_item.resource.delete()
            self.ticket_item.save()

    action_classes = {
        "create": ItemCreateResultAction,
        "update": ItemUpdateResultAction,
        "delete": ItemDeleteResultAction,
    }

    def __init__(self, ticket_item):
        self.ticket_item = ticket_item

    def execute(self, result=None):
        self.action_classes[self.ticket_item.action](self.ticket_item).execute(result)


class TaskResultInterpreter:
    def __init__(self, ticket_item):
        self.ticket_item = ticket_item

    class BaseResultInterpreter:
        def interpret(self, result):
            raise NotImplementedError("interpret() should be override")

    class VmResultInterpreter(BaseResultInterpreter):
        def interpret(self, result):
            def retrieve(path):
                return jmespath.search(path, result)

            parsed_result = dict(
                hostname=retrieve("vm_name"),
                ip_address=retrieve("cfme_vm_network_list[0].ip"),
                data_disk_0_size=retrieve("to_number(disk_lists[0].size_gb)"),
                data_disk_1_size=retrieve("to_number(disk_lists[1].size_gb)"),
                data_disk_2_size=retrieve("to_number(disk_lists[2].size_gb)"),
                cpu=retrieve("to_number(cfme_vm_cpus)"),
                memory_mb=retrieve("to_number(cfme_vm_memory_mb)"),
                network_zone=retrieve("network_zone"),
                environment=retrieve("network_environment"),
            )

            discard_null_values = {
                key: value for key, value in parsed_result.items() if value is not None
            }

            if "memory_mb" in discard_null_values:
                discard_null_values["memory"] = discard_null_values["memory_mb"] / 1024

            return discard_null_values

    class OpenshiftInterpreter(BaseResultInterpreter):
        @staticmethod
        def silent_parse_int(val):
            try:
                return int(val)
            except:
                return None

        def interpret(self, result):
            retrieve = lambda path: jmespath.search(path, result)

            parsed_result = dict(
                namespace=retrieve("oc_project_name"),
                cpu=self.silent_parse_int(retrieve("oc_cpu")),
                memory=self.silent_parse_int(retrieve("oc_memory")),
                main_storage=self.silent_parse_int(retrieve("oc_storage")),
                project_url=retrieve("parsed_project_url"),
                mqserviceid=retrieve("oc_project_id"),
            )

            return {
                key: value for key, value in parsed_result.items() if value is not None
            }

    resource_type_classes = {
        RESOURCE_TYPE_VM: VmResultInterpreter,
        RESOURCE_TYPE_OPENSHIFT: OpenshiftInterpreter,
    }

    def interpret(self, result):
        interpreter = self.resource_type_classes.get(
            self.ticket_item.resource_type, None
        )
        if interpreter is not None:
            return interpreter().interpret(result)

        return result
