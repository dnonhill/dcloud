from cloudform.projects.models.resource import RESOURCE_TYPE_VM
from cloudform.tests.factory import (
    make_project,
    make_application,
    make_task_template,
    make_ticket,
    make_resource,
    make_data_center,
)
from cloudform.tests.fixtures.base import Fixture
from cloudform.tickets.models.ticket import TicketItem


class PrimaryFixture(Fixture):
    def make(self, *args, **kwargs):
        make_default_datacenters()
        make_default_projects()
        make_default_applications()
        make_default_task_templates(*args, **kwargs)
        make_default_ticket()
        make_default_resource()


def make_default_datacenters():
    make_data_center("AWS", tenant="default", available_resources=["vm", "other"], pk=1)
    make_data_center(
        "Azure", tenant="default", available_resources=["vm", "other"], pk=2
    )
    make_data_center(
        "Google Cloud", tenant="default", available_resources=["vm", "other"], pk=3
    )


def make_default_projects():
    make_project(
        "jc003",
        "name003",
        owner_id=1000,
        members=[1000, 1003],
        created_by_id=1,
        updated_by_id=1,
        expired_date="2013-03-18T13:19:37+00:00",
        pk=3,
    )


def make_default_applications():
    make_application(
        3,
        "Backend",
        "Backend",
        supporter_name="Roong",
        supporter_email="roon@web.com",
        supporter_organization="world",
        pk=3,
        created_by_id=1000,
    )


def make_default_task_templates(user):
    make_task_template(
        TicketItem.TICKET_ITEM_ACTION_CREATE,
        RESOURCE_TYPE_VM,
        user,
        (
            {"name": "task1"},
            {
                "name": "task2",
                "script_name": "b",
                "script_variables": """{
                    "vm_name": "{{request.specification.name}}",
                    "cfme_vm_cpus": "{{request.specification.cpu}}",
                    "cfme_vm_memory_mb": "{{request.specification.memory}}"
                }""",
            },
            {"name": "task3", "script_name": "c", "script_variables": "{}"},
            {"name": "task4"},
        ),
    )
    make_task_template(
        TicketItem.TICKET_ITEM_ACTION_DELETE,
        RESOURCE_TYPE_VM,
        user,
        (
            {"name": "task1"},
            {
                "name": "task2",
                "script_name": "d",
                "script_variables": """{"vm_del": "{{resource.name}}"}""",
            },
        ),
    )


def make_default_ticket():
    make_ticket(3, "request 001", "created", data_center_or_id=1, pk=1)
    make_ticket(3, "request 002", "created", data_center_or_id=2, pk=2)


def make_default_resource():
    make_resource(3, "current-vm-00", RESOURCE_TYPE_VM, pk=1)
