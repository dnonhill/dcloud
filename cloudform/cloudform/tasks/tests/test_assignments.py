from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from hamcrest import assert_that, only_contains, has_entry, equal_to, is_, empty

from cloudform.tasks.models import Assignment
from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from zouth.tests.utils import extract_response_error


class AssignmentTestCase(AuthorizedUserRequiredTestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "resources",
        "assignments",
    ]

    def test_as_operator_list_should_return_assignment_that_belonged_to_me(self):
        self._login_as("admin001")

        response = self.client.get(reverse("assignments-list"), format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(response.data["results"][0]["id"], 1)

    def test_as_operator_list_with_active_filter(self):
        self._login_as("admin002")

        response = self.client.get(
            reverse("assignments-list") + "?status=active", format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assert_that(response.data["results"], is_(empty()))

    def test_assign_ticket(self):
        user = self._login_as("cloud001")
        data = {"ticket": 12, "assignee": self._get_user_id("admin001")}

        response = self.client.post(reverse("assignments-list"), data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_201_CREATED),
            extract_response_error(response),
        )
        assignment = Assignment.objects.get(pk=response.data["id"])
        assert_that(assignment.ticket.pk, equal_to(data["ticket"]))
        assert_that(assignment.assignee.pk, equal_to(data["assignee"]))
        assert_that(assignment.assigner.pk, equal_to(user.pk))

        assert_that(assignment.ticket.status, equal_to("assigned"))

    def test_operator_cannot_assign_a_request(self):
        self._login_as("admin001")
        data = {"request": 12, "assignee": self._get_user_id("admin001")}

        response = self.client.post(reverse("assignments-list"), data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_403_FORBIDDEN),
            extract_response_error(response),
        )

    def test_reassign_a_pending_ticket(self):
        assigner = self._login_as("cloud001")
        data = {"assignee": self._get_user_id("admin002"), "note": "test-save-note"}

        response = self.client.post(
            reverse("assignments-detail", args=(1,)) + "reassign/", data, format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assignment = Assignment.objects.get(pk=1)
        assert_that(assignment.assignee.pk, equal_to(data["assignee"]))
        assert_that(assignment.assigner.pk, equal_to(assigner.pk))

        assert_that(assignment.ticket.status, equal_to("assigned"))

    def test_reassign_completed_assignment(self):
        self._login_as("cloud001")
        data = {"assignee": self._get_user_id("admin002"), "note": "test-add-note"}

        response = self.client.post(
            reverse("assignments-detail", args=(2,)) + "reassign/", data, format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_405_METHOD_NOT_ALLOWED),
            extract_response_error(response),
        )

    def test_retrieve_assigment(self):
        self._login_as("admin001")
        response = self.client.get(
            reverse("assignments-detail", args=(1,)), format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

    def test_close_assignment(self):
        self._login_as("admin001")
        response = self.client.post(
            reverse("assignments-close", args=(1,)), format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assignment = Assignment.objects.get(pk=1)
        assert_that(assignment.ticket.status, equal_to("completed"))
        assert_that(assignment.ticket.closed_by, equal_to(assignment.assignee))

    def test_close_assignment_with_note(self):
        self._login_as("admin001")
        data = {"note": "Incomplete ticket"}
        response = self.client.post(
            reverse("assignments-close", args=(1,)), data=data, format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assignment = Assignment.objects.get(pk=1)
        assert_that(assignment.ticket.status, equal_to("completed"))
        assert_that(assignment.ticket.note_from_operator, equal_to(data["note"]))

    def test_fetch_assignment_by_ticket(self):
        self._login_as("admin001")
        response = self.client.get("/api/tickets/13/assignment/")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(response.data["ticket"], has_entry("id", 13))

    @staticmethod
    def _get_user_id(username):
        user = get_user_model().objects.get(username=username)
        return user.pk
