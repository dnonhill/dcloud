import json
import pytz

from django.test import TestCase
from unittest.mock import patch
from django.urls import reverse
from django_celery_beat.models import CrontabSchedule, PeriodicTask
from rest_framework import status
from hamcrest import assert_that, is_, equal_to, not_, none, has_length, has_entries

from cloudform.projects.models import Resource
from cloudform.tasks.models import TaskGroup, TASK_TYPE_SCRIPT
from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from zouth.tests.utils import extract_response_error


class TaskGroupModelTestCase(TestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "resources",
        "assignments",
    ]

    @patch("cloudform.inventories.tasks.get_vm_id")
    def test_mark_complete_of_create_task(self, mock):
        mock.return_value = [{"vm": "test vm"}]
        create_task = TaskGroup.objects.get(pk=1)
        result = {"hostname": "test vm", "ipAddress": "127.0.0.1"}
        create_task.mark_complete(result)

        assert_that(create_task.complete, equal_to(True))

        new_resource = Resource.objects.get(name="test vm")
        specification = create_task.ticket_item.specification
        assert_that(new_resource.details, has_entries(**specification))
        assert_that(new_resource.details, has_entries(**result))

    def test_vcenter_create_billing_periodic_task_after_create_task(self):
        create_task = TaskGroup.objects.get(pk=1)
        vm_id = "vm-40"
        inventory = create_task.create_inventory_list(create_task.ticket_item.resource_id, vm_id)
        result = {"hostname": vm_id, "ipAddress": "127.0.0.1"}
        create_task.create_billing_periodic_task(
            vm_name=create_task.get_vm_name(create_task.ticket_item.resource_type, result),
            inventory_id=inventory.id,
            resource_type=create_task.ticket_item.resource_type
        )
        billing_periodic_task = PeriodicTask.objects.filter(
            name=create_task.get_vm_name(
                create_task.ticket_item.resource_type,
                result
            )
        ).values().first()
        expected_billing_periodic_task_arguments = {
            "vm_name": vm_id,
            "inventory_id": inventory.id,
            "resource_type": "vm"
        }
        expected_billing_periodic_task = {
            "name": vm_id,
            "task": "cloudform.inventories.tasks.update_inventory",
            "crontab_id": 1,
            "kwargs": json.dumps(expected_billing_periodic_task_arguments),
            "enabled": True,
        }
        hourly_billing_schedule = CrontabSchedule.objects.filter(
            pk=billing_periodic_task["crontab_id"]
        ).values()[0]
        expected_hourly_billing_schedule = {
            "id": 1,
            "minute": "0",
            "hour": "*",
            "day_of_week": "*",
            "day_of_month": "*",
            "month_of_year": "*",
            "timezone": pytz.utc
        }
        assert_that(billing_periodic_task, has_entries(**expected_billing_periodic_task))
        assert_that(hourly_billing_schedule, has_entries(**expected_hourly_billing_schedule))

    def test_openshift_create_billing_periodic_task_after_create_task(self):
        create_task = TaskGroup.objects.get(pk=3)
        vm_id = "nwtestoc"
        inventory = create_task.create_inventory_list(create_task.ticket_item.resource_id, vm_id)
        result = {"namespace": vm_id, "project_url": "https://project.com"}
        create_task.create_billing_periodic_task(
            vm_name=create_task.get_vm_name(create_task.ticket_item.resource_type, result),
            inventory_id=inventory.id,
            resource_type=create_task.ticket_item.resource_type
        )
        billing_periodic_task = PeriodicTask.objects.filter(
            name=create_task.get_vm_name(
                create_task.ticket_item.resource_type,
                result
            )
        ).values().first()
        expected_billing_periodic_task_arguments = {
            "vm_name": vm_id,
            "inventory_id": inventory.id,
            "resource_type": "container-cluster"
        }
        expected_billing_periodic_task = {
            "name": vm_id,
            "task": "cloudform.inventories.tasks.update_inventory",
            "crontab_id": 1,
            "kwargs": json.dumps(expected_billing_periodic_task_arguments),
            "enabled": True,
        }
        hourly_billing_schedule = CrontabSchedule.objects.filter(
            pk=billing_periodic_task["crontab_id"]
        ).values()[0]
        expected_hourly_billing_schedule = {
            "id": 1,
            "minute": "0",
            "hour": "*",
            "day_of_week": "*",
            "day_of_month": "*",
            "month_of_year": "*",
            "timezone": pytz.utc
        }
        assert_that(billing_periodic_task, has_entries(**expected_billing_periodic_task))
        assert_that(hourly_billing_schedule, has_entries(**expected_hourly_billing_schedule))

    @patch("cloudform.inventories.tasks.get_vm_id")
    def test_mark_complete_of_update_task(self, mock):
        mock.return_value = [{"vm": "vm-41"}]
        update_task = TaskGroup.objects.get(pk=2)
        result = {"hostname": "vm-41", "ipAddress": "127.0.0.1"}
        update_task.mark_complete(result)

        assert_that(update_task.complete, equal_to(True))

        updated_resource = update_task.ticket_item.resource
        specification = update_task.ticket_item.specification
        assert_that(updated_resource.details, has_entries(**specification))
        assert_that(updated_resource.details, has_entries(**result))

    def test_collect_results_from_script_results(self):
        task_group = TaskGroup.objects.get(pk=1)
        task_group.tasks.create(
            description="First task",
            sequence=1,
            task_type=TASK_TYPE_SCRIPT,
            complete=True,
            result={"hostname": "vm001.ptt.corp", "ipAddress": "135.32.54.1"}
        )
        task_group.tasks.create(
            description="Blank task",
            sequence=2,
            task_type=TASK_TYPE_SCRIPT,
            complete=True
        )
        task_group.tasks.create(
            description="Override value task",
            sequence=3,
            task_type=TASK_TYPE_SCRIPT,
            complete=True,
            result={"ipAddress": "135.32.54.2", "db": "Hello DB"}
        )

        results = task_group.collect_results()
        assert_that(results, equal_to({
            "hostname": "vm001.ptt.corp",
            "ipAddress": "135.32.54.2",
            "db": "Hello DB",
        }))


class TaskGroupAPITestCase(AuthorizedUserRequiredTestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "resources",
        "assignments",
    ]

    def test_retrieve(self):
        self._login_as("admin001")
        response = self.client.get(
            reverse("task-groups-detail", args=(1,)), format="json"
        )
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

    def test_list_as_nested_assignment(self):
        self._login_as("admin001")
        url = "/api/assignments/1/task-groups/"
        response = self.client.get(url, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(response.data, has_length(1))
        assert_that(response.data[0]["id"], equal_to(1))

    @patch("cloudform.inventories.tasks.get_vm_id")
    def test_mark_as_complete(self, mock):
        mock.return_value = [{"vm": "test vm"}]
        self._login_as("admin001")
        data = {"result": {"message": "hello", "hostname": "test vm"}}
        url = reverse("task-groups-detail", args=(1,)) + "mark-complete/"
        response = self.client.post(url, data=data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        actual_tasks = TaskGroup.objects.get(id=1)
        assert_that(actual_tasks.complete, is_(True))
        assert_that(actual_tasks.result, equal_to({"message": "hello", "hostname": "test vm"}))

        actual_resource = Resource.objects.get(name="test vm")
        assert_that(actual_resource, not_(none()))
