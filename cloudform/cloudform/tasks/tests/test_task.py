import unittest
from unittest.mock import patch

from django.urls import reverse
from hamcrest import assert_that, has_length, equal_to, not_none, raises, is_, not_
from rest_framework import status

from cloudform.projects.models.resource import RESOURCE_TYPE_VM, Resource
from cloudform.tasks.models import Task, TaskGroup
from cloudform.tests import AuthorizedUserRequiredTestCase
from cloudform.tests.factory import make_ticket_item, make_assignment
from cloudform.tests.fixtures import Fixtures
from cloudform.tickets.models.ticket import Ticket, TicketItem
from cloudform.users.models import CloudAdmin
from zouth.tests.utils import extract_response_error


def make_assignments(user):
    assigner = CloudAdmin.objects.get(username="cloud001")
    ticket_1 = Ticket.objects.get(pk=1)
    ticket_item_1 = make_ticket_item(
        TicketItem.TICKET_ITEM_ACTION_CREATE,
        ticket_1,
        resource_type=RESOURCE_TYPE_VM,
        specification={"name": "test-dcloud-001", "cpu": "2", "memory": "4096"},
    )
    make_assignment(ticket_1, assigner, user)

    ticket_2 = Ticket.objects.get(pk=2)
    del_resource = Resource.objects.get(pk=1)
    ticket_item_2 = make_ticket_item(
        TicketItem.TICKET_ITEM_ACTION_DELETE,
        ticket_2,
        resource=del_resource,
        resource_type=RESOURCE_TYPE_VM,
    )
    make_assignment(ticket_2, assigner, user)

    task_group_1 = TaskGroup.objects.filter(ticket_item=ticket_item_1).first()
    task_group_2 = TaskGroup.objects.filter(ticket_item=ticket_item_2).first()
    return task_group_1, task_group_2


class TaskGroupTaskAPITest(AuthorizedUserRequiredTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.login_as("admin001")

        Fixtures.primary.make(self.user)

        self.task_group, _ = make_assignments(self.user)

    def test_task_group_list_tasks(self):
        response = self.client.get(
            reverse("task-groups-tasks", args=(self.task_group.id,)), format="json"
        )
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

    def test_task_group_new_task(self):
        data = {"description": "New Task 1"}
        response = self.client.post(
            reverse("task-groups-tasks", args=(self.task_group.id,)),
            data=data,
            format="json",
        )
        assert_that(
            response.status_code,
            equal_to(status.HTTP_201_CREATED),
            extract_response_error(response),
        )

        tasks = self.task_group.tasks.all()
        assert_that(tasks, has_length(5))


class TaskExecutionTest(AuthorizedUserRequiredTestCase):
    def setUp(self):
        super().setUp()

        self.user = self.login_as("cloud001")
        Fixtures.primary.make(self.user)

        self.task_group_1, self.task_group_2 = make_assignments(self.user)
        self.manual_task = self.task_group_2.tasks.first()
        self.script_to_create = self.task_group_1.tasks.order_by("sequence").all()[1]
        self.script_to_delete = self.task_group_2.tasks.order_by("sequence").all()[1]

    def test_run_manual_task_throw_error(self):
        assert_that(self.manual_task.execute, raises(RuntimeError))

    @patch("cloudform.tasks.models.awx", autospec=True)
    def test_run_script_to_create_vm(self, mock_awx):
        mock_awx.launch_job.return_value = 1

        self.script_to_create.execute()

        mock_awx.launch_job.assert_called_once_with(
            "b",
            extra_vars={
                "vm_name": "test-dcloud-001",
                "cfme_vm_cpus": "2",
                "cfme_vm_memory_mb": "4096",
            },
        )

        assert_that(self.script_to_create.acknowledge_id, is_(1))
        assert_that(self.script_to_create.start_time, is_(not_none()))

    @patch("cloudform.tasks.models.awx", autospec=True)
    def test_run_script_to_delete_vm(self, mock_awx):
        mock_awx.launch_job.return_value = 2

        self.script_to_delete.execute()

        mock_awx.launch_job.assert_called_once_with(
            "d", extra_vars={"vm_del": "current-vm-00"}
        )

        assert_that(self.script_to_delete.acknowledge_id, is_(2))
        assert_that(self.script_to_delete.start_time, is_(not_none()))


class HiddenExtraVariablesTest(unittest.TestCase):
    def test_hidden_extra_vars(self):
        script_vars = {
            "vm_name": "{{item.request.name}}",
            "cfme_vm_memory_mb": "{{item.request.memory}}",
            "cfme_vm_password": "",
        }
        item_vars = {"request": {"name": "test-dcloud-01", "memory": "1024"}}

        extra_vars = Task.gen_extra_vars(script_vars, item_vars)
        extra_vars = Task.hidden_vars(extra_vars)
        generated = extra_vars.get("cfme_vm_password", "")

        assert_that(generated, is_(not_("")))
        assert_that(generated, has_length(10))


class GenerateExtraVariablesTest(unittest.TestCase):
    def test_basic_substitution(self):
        script_vars = {
            "vm_name": "{{item.request.name}}",
            "cfme_vm_memory_mb": "{{item.request.memory}}",
        }
        item_vars = {"request": {"name": "test-dcloud-01", "memory": "1024"}}

        extra_vars = Task.gen_extra_vars(script_vars, item_vars)

        assert_that(
            extra_vars, is_({"vm_name": "test-dcloud-01", "cfme_vm_memory_mb": "1024"})
        )

    def test_substitute_value(self):
        item = {
            "request": {"a": 1, "b": 2, "c": 3},
            "resource": {"a": 4, "b": 5, "c": 6},
        }

        assert_that(Task.substitute_var(123, item), is_(123))
        assert_that(Task.substitute_var("{{item.request.a}}", item), is_(1))
        assert_that(Task.substitute_var("{{request.b}}", item), is_(2))
        assert_that(Task.substitute_var("{{ item.resource.b }}", {}), is_(""))
