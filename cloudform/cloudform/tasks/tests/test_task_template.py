from hamcrest import assert_that, contains, equal_to, is_, has_length

from cloudform.projects.models.resource import RESOURCE_TYPE_VM
from cloudform.tasks.models import TaskTemplate, TASK_TYPE_MANUAL, TASK_TYPE_SCRIPT
from cloudform.tests import Fixtures, AuthorizedUserRequiredTestCase
from cloudform.tests.factory import make_ticket_item, make_task_group
from cloudform.tickets.models import Ticket
from cloudform.tickets.models.ticket import TicketItem


class TaskTemplateTest(AuthorizedUserRequiredTestCase):
    def setUp(self):
        super().setUp()

        self.user = self.login_as("cloud001")
        Fixtures.primary.make(self.user)

        self.ticket = Ticket.objects.get(pk=1)

    def test_generate_template_tasks(self):
        task_group = self._create_match_task_group()

        tasks = TaskTemplate.generate_tasks(task_group)

        # Check valid sequence of tasks generate from task template
        task_types = list(map(lambda t: t.task_type, tasks))
        assert_that(
            task_types,
            contains(
                TASK_TYPE_MANUAL, TASK_TYPE_SCRIPT, TASK_TYPE_SCRIPT, TASK_TYPE_MANUAL
            ),
        )

        # Check task_template reference back
        script_task_a, script_task_b = tasks[1], tasks[2]
        assert_that(
            (script_task_a.task_template.name, script_task_a.task_template.script_name),
            equal_to(("task2", "b")),
        )
        assert_that(
            (script_task_b.task_template.name, script_task_b.task_template.script_name),
            equal_to(("task3", "c")),
        )

        # Check no task_template reference back for manual tasks
        manual_task_a, manual_task_b = tasks[0], tasks[3]
        assert_that(manual_task_a.task_template, is_(None))
        assert_that(manual_task_b.task_template, is_(None))

    def test_generate_taskgroup_task(self):
        task_group = self._create_unmatch_task_group()

        tasks = TaskTemplate.generate_tasks(task_group)
        task_types = list(map(lambda t: t.task_type, tasks))

        assert_that(task_types, contains(TASK_TYPE_MANUAL))

        task = next(iter(tasks))

        assert_that(task.description, equal_to("update vm"))
        assert_that(task.task_type, equal_to(TASK_TYPE_MANUAL))
        assert_that(task.sequence, is_(1))

    # TODO Move this method into TaskGroupTest class
    def test_tasks_generated_when_task_group_create(self):
        task_group = self._create_match_task_group()
        assert_that(task_group.tasks.all(), has_length(4))

        task_group = self._create_unmatch_task_group()
        assert_that(task_group.tasks.all(), has_length(1))

    def _create_match_task_group(self):
        return make_task_group(
            make_ticket_item(
                TicketItem.TICKET_ITEM_ACTION_CREATE,
                self.ticket,
                resource_type=RESOURCE_TYPE_VM,
            )
        )

    def _create_unmatch_task_group(self):
        return make_task_group(
            make_ticket_item(
                TicketItem.TICKET_ITEM_ACTION_UPDATE,
                self.ticket,
                resource_type=RESOURCE_TYPE_VM,
            )
        )
