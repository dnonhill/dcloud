from datetime import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from hamcrest import (
    assert_that,
    equal_to,
    only_contains,
    has_entry,
    has_key,
    has_properties,
    has_length,
    not_,
    empty,
    none,
)
from rest_framework import status
from rest_framework.test import APITestCase

from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from cloudform.projects.models import Application, DataCenter
from cloudform.tickets.models import Ticket, TicketItem
from zouth.tests.utils import extract_response_error


class TicketModelTestCase(APITestCase):
    fixtures = ["groups", "users", "projects", "applications", "data-center"]

    def test_create_ticket_successfully_with_initial_status(self):
        requestor = self._get_requestor()
        ticket = Ticket.objects.create(
            ticket_no="abc-01234",
            application=self._get_application(),
            data_center=DataCenter.objects.first(),
            job_code="1234567890",
            created_by=requestor,
            created_at=datetime.now(),
            updated_by=requestor,
            updated_at=datetime.now(),
        )

        TicketItem.objects.create(
            ticket=ticket,
            action="create",
            resource_type="other",
            specification={"description": "Fill me something"},
        )

        assert_that(ticket.status, equal_to("created"))

    @staticmethod
    def _get_requestor():
        return get_user_model().objects.get(pk=1004)

    @staticmethod
    def _get_application():
        return Application.objects.first()


class TicketAPITestCase(AuthorizedUserRequiredTestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "data-center",
        "data-center-level",
        "approver",
        "tickets",
        "ticket-items",
        "resources",
        "approvements",
    ]

    def test_list_tickets_under_application_as_member_of_application(self):
        user = self._login_as("req001")
        application = self._get_application_of(user)

        url = f"/api/applications/{application.id}/tickets/"
        response = self.client.get(url, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assert_that(
            response.data["results"],
            only_contains(has_entry("application", has_entry("id", application.id))),
        )

    def test_list_tickets_as_member_of_project(self):
        self._login_as("req001")

        url = f"/api/tickets/"
        response = self.client.get(url, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        data = response.data["results"]
        assert_that(data, not_(empty()))
        assert_that(data[0], not_(has_key("items")))

    def test_fetch_individual_ticket_as_project_member(self):
        self._login_as("req001")

        response = self.client.get("/api/tickets/1/", format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assert_that(response.data["items"], not_(empty()))

    def test_fetch_individual_ticket_as_operator(self):
        self._login_as("admin001")

        response = self.client.get("/api/tickets/1/", format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

    def test_fetch_approvement_of_ticket(self):
        self._login_as("req001")

        response = self.client.get("/api/tickets/1/approvement/", format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        ticket = Ticket.objects.get(pk=1)
        assert_that(response.data[0]["ticket_no"], equal_to(ticket.ticket_no))

    def test_list_tickets_of_application_which_not_in_members(self):
        user = self._login_as("aprv001")
        application = self._get_application_of_other(user)

        url = f"/api/applications/{application.id}/tickets/"
        response = self.client.get(url, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assert_that(response.data["results"], equal_to([]))

    def test_requestor_create_ticket_successfully(self):
        user = self._login_as("req001")
        app = self._get_application_of(user)

        data = {
            "application": app.id,
            "data_center": 1,
            "job_code": "1234567890",
            "requested_date": datetime.fromisoformat("2019-01-01T00:00:00.000+07:00"),
            "items": [
                {
                    "action": "create",
                    "resource_type": "other",
                    "specification": {"detail": "Assign me on something."},
                },
                {
                    "action": "update",
                    "resource_type": "vm",
                    "resource": 1,
                    "specification": {"cpu": 5},
                },
            ],
            "approvers": [101],
        }

        response = self.client.post(reverse("ticket-list"), data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_201_CREATED),
            extract_response_error(response),
        )

        actual_obj = Ticket.objects.get(pk=response.data["id"])
        # Main request
        assert_that(actual_obj, has_properties(status="created"))
        assert_that(actual_obj.ticket_no, not_(none()))
        assert_that(actual_obj.application.id, equal_to(app.id))
        assert_that(actual_obj.data_center.id, equal_to(data["data_center"]))
        assert_that(actual_obj.job_code, data["job_code"])

        # Request Item
        items = actual_obj.items.all()
        create_other_item = next((item for item in items if item.action == "create"))
        assert_that(
            create_other_item,
            has_properties(
                action=data["items"][0]["action"],
                resource_type=data["items"][0]["resource_type"],
                specification=data["items"][0]["specification"],
            ),
        )

        upgrade_vm_item = next((item for item in items if item.action == "update"))
        assert_that(
            upgrade_vm_item,
            has_properties(
                action=data["items"][1]["action"],
                resource_type=data["items"][1]["resource_type"],
                specification=data["items"][1]["specification"],
            ),
        )
        assert_that(upgrade_vm_item.resource.id, equal_to(data["items"][1]["resource"]))

        approvement = actual_obj.approvements.first()
        assert_that(approvement.approver.id, equal_to(data["approvers"][0]))

    def test_create_user_of_non_member_application(self):
        self._login_as("aprv001")

        another_user = get_user_model().objects.get(username="req001")
        app = self._get_application_of(another_user)
        data = {
            "application": app.id,
            "requested_date": datetime.fromisoformat("2019-01-01T00:00:00.000+07:00"),
            "data_center": 1,
            "job_code": "1234567890",
            "items": [
                {
                    "action": "create",
                    "resource_type": "other",
                    "specification": {"detail": "Assign me on something."},
                }
            ],
        }

        response = self.client.post(reverse("ticket-list"), data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_403_FORBIDDEN),
            extract_response_error(response),
        )

    def test_create_with_deleted_application(self):
        user = self._login_as("req002")
        app = self._get_application_of(user)
        app.delete()

        data = {
            "application": app.id,
            "data_center": 1,
            "job_code": "1234567890",
            "requested_date": datetime.fromisoformat("2019-01-01T00:00:00.000+07:00"),
            "items": [
                {
                    "action": "create",
                    "resource_type": "other",
                    "specification": {"detail": "Assign me on something."},
                }
            ],
            "approvers": [101],
        }

        response = self.client.post(reverse("ticket-list"), data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_400_BAD_REQUEST),
            extract_response_error(response),
        )

    def test_modify_ticket_successfully(self):
        self._login_as("req001")
        request = Ticket.objects.get(pk=4)
        request_item = request.items.all()[0]

        data = {
            "status": "created",
            "application": request.application.pk,
            "data_center": 1,
            "job_code": "1234567890",
            "items": [
                {
                    "id": request_item.pk,
                    "resource_type": "other",
                    "action": request_item.action,
                    "specification": {"description": "change resource type"},
                },
                {
                    "resource_type": "other",
                    "action": "create",
                    "specification": {"description": "another task"},
                },
            ],
            "approvers": [201],
        }

        response = self.client.put(
            reverse("ticket-detail", kwargs={"pk": request.pk}), data, format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        updated_ticket = Ticket.objects.get(pk=response.data["id"])
        assert_that(updated_ticket, has_properties(ticket_no=request.ticket_no))
        assert_that(updated_ticket.data_center.id, equal_to(data["data_center"]))
        assert_that(updated_ticket.job_code, data["job_code"])

        update_items = updated_ticket.items.all()
        assert_that(update_items, has_length(2))
        assert_that(update_items[1].resource_type, "other")
        assert_that(update_items[1].action, request_item.action)
        assert_that(update_items[1].specification, {"description": "change resource type"})

        assert_that(update_items, has_length(2))
        assert_that(update_items[0].resource_type, "other")
        assert_that(update_items[0].action, 'create')
        assert_that(update_items[0].specification, {"description": "another task"})

        updated_approver = updated_ticket.active_approvement.all()[0].approver.id
        assert_that(updated_approver, equal_to(201))

    def test_remove_items_from_ticket(self):
        self._login_as("req001")
        request = Ticket.objects.get(pk=4)

        data = {
            "status": "created",
            "application": request.application.pk,
            "data_center": 1,
            "job_code": "1234567890",
            "items": [
                {
                    "resource_type": "other",
                    "action": "create",
                    "specification": {"description": "another task"},
                }
            ],
            "approvers": [101],
        }

        response = self.client.put(
            reverse("ticket-detail", kwargs={"pk": request.pk}), data, format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        updated_ticket = Ticket.objects.get(pk=response.data["id"])
        assert_that(updated_ticket, has_properties(ticket_no=request.ticket_no))
        assert_that(updated_ticket.data_center.id, equal_to(data["data_center"]))
        assert_that(updated_ticket.job_code, data["job_code"])

        update_items = updated_ticket.items.all()
        assert_that(update_items, has_length(1))
        assert_that(
            update_items[0],
            has_properties(
                resource_type="other",
                action="create",
                specification={"description": "another task"},
            ),
        )

    def test_cannot_modify_approved_request(self):
        self._login_as("req001")
        ticket = Ticket.objects.get(pk=2)
        data = {
            "status": "created",
            "application": ticket.application.pk,
            "data_center": 1,
            "job_code": "1234567890",
            "items": [
                {
                    "resource_type": "other",
                    "action": "create",
                    "specification": {"description": "another task"},
                }
            ],
            "approver": 101,
        }
        response = self.client.put(
            reverse("ticket-detail", kwargs={"pk": ticket.pk}), data, format="json"
        )

        self.assertEqual(
            response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, response.data
        )

    def test_close_approved_ticket(self):
        user = self._login_as("cloud001")
        ticket_pk = 2
        data = {"note_from_operator": "Hello"}
        response = self.client.post(
            reverse("ticket-detail", kwargs={"pk": ticket_pk}) + "close/", data=data, format="json"
        )

        self.assertEqual(
            response.status_code, status.HTTP_200_OK, response.data
        )

        ticket = Ticket.objects.get(pk=ticket_pk)
        self.assertEqual(ticket.status, "completed")
        self.assertEqual(ticket.note_from_operator, data["note_from_operator"])
        self.assertEqual(ticket.closed_by, user)

    def test_close_non_approved_ticket(self):
        self._login_as("cloud001")
        ticket_pk = 3
        response = self.client.post(
            reverse("ticket-detail", kwargs={"pk": ticket_pk}) + "close/", format="json"
        )

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )

        ticket = Ticket.objects.get(pk=ticket_pk)
        self.assertNotEqual(ticket.status, "completed")

    @staticmethod
    def _get_application_of(user):
        return Application.objects.filter(project__members=user).first()

    @staticmethod
    def _get_application_of_other(user):
        return Application.objects.exclude(project__members=user).first()
