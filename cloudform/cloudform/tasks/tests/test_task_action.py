from hamcrest import none, assert_that, is_

from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from cloudform.projects.models import Resource
from cloudform.projects.models.resource import RESOURCE_TYPE_VM
from cloudform.tasks.models import TaskResultAction
from cloudform.tests.factory import make_ticket_item
from cloudform.tickets.models import Ticket


class TaskResultActionTest(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users", "projects", "applications", "tickets", "resources"]

    def setUp(self):
        self.ticket = Ticket.objects.get(pk=1)
        self.resource = Resource.objects.get(pk=1)
        self.user = self._login_as("req001")

    def test_create_result_action(self):
        item = make_ticket_item("create", self.ticket, resource_type=RESOURCE_TYPE_VM)
        action = TaskResultAction(item)
        action.execute({})

    def test_update_result_action(self):
        item = make_ticket_item("update", self.ticket, self.resource)
        action = TaskResultAction(item)
        action.execute({})

    def test_delete_result_action(self):
        item = make_ticket_item("delete", self.ticket, self.resource)

        action = TaskResultAction(item)
        action.execute({})

        # Keep ticket item and resource relationship
        # But deactivate resource
        assert_that(self.resource, not (none()))
        assert_that(self.resource.active_flag, is_(False))
