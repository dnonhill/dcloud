from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from hamcrest import assert_that, equal_to, has_length
from rest_framework import status

from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from cloudform.tickets.models import Ticket, Approvement, Approver
from cloudform.projects.models import DataCenter, DataCenter


class ApprovementModelTestCase(TestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "data-center",
        "approver",
        "approvements",
        "tickets",
        "ticket-items",
        "data-center-level",
    ]

    def test_create_approvement_for_new_ticket(self):
        ticket = self.ticket
        approver = self.approver_1
        data_center = self.data_center_1

        actual = Approvement.create_for_ticket(ticket, approver, data_center)

        self.assertEqual(actual.approver, approver)
        self.assertEqual(actual.ticket, ticket)

    def test_create_approvement_to_replace_existing(self):
        ticket = self.ticket
        approver_2 = self.approver_2
        data_center = self.data_center_1
        
        Approvement.create_for_ticket(ticket, approver_2, data_center)

        approvements = Approvement.objects.filter(ticket=ticket).all()
        assert_that(approvements, has_length(2))
        assert_that(approvements[1].approver, equal_to(approver_2))

    def test_cannot_reapprove_approved_approvement(self):
        approvement = Approvement.objects.filter(is_approved=True).first()

        try:
            approvement.approve(True)
            raise Exception("cannot reapproved")
        except ValidationError as ve:
            assert_that(
                ve.message,
                equal_to("Cannot approve approvement for approved/rejected request."),
            )

    # def test_cannot_approve_when_ticket_has_been_change(self):
    #     ticket = Ticket.objects.filter(status="created").first()

    @property
    def ticket(self):
        return Ticket.objects.first()

    @property
    def approver_1(self):
        return Approver.objects.get(pk=101)

    @property
    def approver_2(self):
        return Approver.objects.get(pk=201)
    
    @property
    def data_center_1(self):
        return DataCenter.objects.get(pk=1)
    
    @property
    def data_center_2(self):
        return DataCenter.objects.get(pk=2)


class ApprovementAPITestCase(AuthorizedUserRequiredTestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "tickets",
        "ticket-items",
        "approvements",
        "data-center",
        "data-center-level",
        "approver",
    ]

    def test_approve(self):
        self._login_as("aprv001")
        data = {"ticket_timestamp": "2019-08-06 03:06:33.584034+00:00"}
        before_call = timezone.now()
        response = self.client.put(
            reverse("approver-approvement-approve", kwargs={"pk": 1}),
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        approvement = Approvement.objects.get(pk=response.data["id"])
        self.assertEqual(approvement.is_approved, True)
        self.assertEqual(approvement.ticket.status, "approved")

        self.assertGreaterEqual(approvement.approved_at, before_call)

    def test_reject(self):
        self._login_as("aprv001")
        data = {
            "reason": "too expensive",
            "ticket_timestamp": "2019-08-06 03:06:33.584034+00:00",
        }
        before_call = timezone.now()
        response = self.client.put(
            reverse("approver-approvement-reject", kwargs={"pk": 1}),
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        approvement = Approvement.objects.get(pk=response.data["id"])
        self.assertEqual(approvement.is_approved, False)
        self.assertEqual(approvement.reason, data["reason"])
        self.assertEqual(approvement.ticket.status, "rejected")

        self.assertGreaterEqual(approvement.approved_at, before_call)

    def test_cannot_reject_without_reason(self):
        self._login_as("aprv001")
        approvement = Approvement.objects.filter(is_approved=None).first()
        data = {"ticket_timestamp": "2019-08-06 03:06:33.584034+00:00"}
        response = self.client.put(
            reverse("approver-approvement-reject", kwargs={"pk": approvement.pk}),
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        approvement = Approvement.objects.get(pk=approvement.pk)
        self.assertEqual(approvement.approved_at, None)
        self.assertEqual(approvement.ticket.status, "reviewed")

    def test_cannot_approve_or_reject_of_other_approver(self):
        self._login_as("aprv002")
        response = self.client.put(
            reverse("approver-approvement-reject", kwargs={"pk": 1}), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
        approvement = Approvement.objects.get(pk=1)
        self.assertEqual(approvement.approved_at, None)
        self.assertEqual(approvement.ticket.status, "reviewed")

    def test_cannot_reapprove(self):
        self._login_as("aprv001")
        approvement = Approvement.objects.filter(is_approved=True).first()
        response = self.client.put(
            reverse("approver-approvement-approve", kwargs={"pk": approvement.id}),
            format="json",
        )
        self.assertContains(
            response,
            "Cannot approve the approved request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def test_cannot_approve_ticket_which_timestamp_not_match(self):
        self._login_as("aprv001")
        approvement = Approvement.objects.filter(is_approved=None).first()
        response = self.client.put(
            reverse("approver-approvement-approve", kwargs={"pk": approvement.id}),
            format="json",
        )
        # self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code, response.data)
        self.assertContains(
            response,
            "Ticket was updated while you are review",
            status_code=status.HTTP_409_CONFLICT,
        )
