from django.test import TestCase
from django.urls import reverse
from hamcrest import (
    assert_that,
    equal_to,
    has_properties,
    has_entry,
    only_contains,
    has_length,
)
from rest_framework import status

from cloudform.projects import models
from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from cloudform.projects.models.resource import RESOURCE_TYPE_VM
from zouth.tests.utils import extract_response_error


class ApplicationModelTestCase(TestCase):
    fixtures = ["groups", "users", "projects", "applications", "data-center"]

    def test_application_without_resources_and_tickets_can_be_delete(self):
        blank_application = models.Application.objects.first()
        assert_that(blank_application.can_delete, equal_to(True))

    def test_application_with_deleted_resource_can_be_delete(self):
        application = models.Application.objects.first()
        application.resources.create(
            name="inactive resource",
            resource_type=RESOURCE_TYPE_VM,
            data_center=models.DataCenter.objects.first(),
            active_flag=False
        )

        assert_that(application.can_delete, equal_to(True))

    def test_application_with_inactive_ticket_can_be_delete(self):
        application = models.Application.objects.first()
        application.tickets.create(
            data_center=models.DataCenter.objects.first(),
            job_code="1234567890123456",
            status="rejected"
        )

        assert_that(application.can_delete, equal_to(True))

    def test_application_with_active_ticket_cannot_be_delete(self):
        application = models.Application.objects.first()
        application.tickets.create(
            data_center=models.DataCenter.objects.first(),
            job_code="1234567890123456",
            status="assigned"
        )

        assert_that(application.can_delete, equal_to(False))

    def test_application_with_active_resource_cannot_be_delete(self):
        application = models.Application.objects.first()
        application.resources.create(
            name="inactive resource",
            resource_type=RESOURCE_TYPE_VM,
            data_center=models.DataCenter.objects.first(),
        )

        assert_that(application.can_delete, equal_to(False))


class ApplicationViewSetTestCase(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users", "projects", "applications"]

    application_request = {
        "name": "test application name",
        "description": "this is description",
        "supporter_name": "App owner",
        "supporter_email": "owner@app.com",
        "supporter_organization": "App",
    }

    def test_create_application_success_by_default_url(self):
        user = self._login_as("req001")
        request = self.application_request
        request["project"] = self._get_project_of_user(user).pk

        self._test_create_application_success(reverse("application-list"), request)

    def test_create_application_success_by_nested_url(self):
        user = self._login_as("req001")
        request = self.application_request
        project_id = self._get_project_of_user(user).pk
        request["project"] = project_id

        self._test_create_application_success(
            f"/api/projects/{project_id}/applications/", request
        )

    def test_cannot_create_application_by_unauthorized_user(self):
        user = self._login_as("admin001")
        project = self._get_project_of_other_user(user)

        request = self.application_request
        request["project"] = project.pk
        response = self.client.post(reverse("application-list"), request, format="json")

        self._assert_response_is_forbidden(response)

    def test_cannot_create_application_owned_by_other_user_with_project_field(self):
        user = self._login_as("admin001")
        request = self.application_request
        project = self._get_project_of_other_user(user)
        request["project"] = project.pk

        response = self.client.post(reverse("application-list"), request, format="json")
        self._assert_response_is_forbidden(response)

    def test_cannot_create_application_under_archived_project(self):
        self._login_as("req001")
        request = self.application_request

        project_id = 4 # Blank project
        project = models.Project.objects.get(pk=project_id)
        project.delete()
        assert_that(project.active_flag, equal_to(False))

        request["project"] = project_id
        response = self.client.post(
            f"/api/projects/{project_id}/applications/", request
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_400_BAD_REQUEST),
            extract_response_error(response)
        )

    def test_list_applications_of_the_project(self):
        user = self._login_as("req001")
        project_id = self._get_project_of_user(user).pk

        response = self.client.get(f"/api/projects/{project_id}/applications/")
        assert_that(
            response.data["results"],
            only_contains(has_entry("project", has_entry("id", project_id))),
        )

    def test_list_all_applications_as_op_team(self):
        self._login_as("cloud001")

        response = self.client.get(f"/api/applications/?all")

        app_size_in_db = models.Application.objects.count()
        assert_that(response.data["results"], has_length(app_size_in_db))

    def test_retrieve_applications_of_the_project_as_project_member(self):
        user = self._login_as("req001")
        project_id = self._get_project_of_user(user).pk
        application_id = 1

        response = self.client.get(
            f"/api/projects/{project_id}/applications/{application_id}/"
        )
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(response.data["id"], equal_to(application_id))

    def test_retrieve_applications_of_the_project_as_op_team(self):
        self._login_as("admin001")
        application_id = 1

        response = self.client.get(f"/api/applications/{application_id}/")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(response.data["id"], equal_to(application_id))

    def _test_create_application_success(self, url, request, project_id=None):
        response = self.client.post(url, request, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_201_CREATED),
            response.data if hasattr(response, "data") else response,
        )

        actual_object = self._get_actual_application(response.data["id"])
        # Given parameters
        assert_that(
            actual_object,
            has_properties(
                name=request["name"],
                description=request["description"],
                supporter_name=request["supporter_name"],
                supporter_email=request["supporter_email"],
                supporter_organization=request["supporter_organization"],
            ),
        )

        # Nested object
        project_id = project_id or request["project"]
        assert_that(actual_object.project.id, equal_to(project_id))

    @staticmethod
    def _get_project_of_user(user):
        return models.Project.objects.filter(members=user).first()

    @staticmethod
    def _get_project_of_other_user(user):
        return models.Project.objects.exclude(members=user).first()

    @staticmethod
    def _get_actual_application(application_id):
        return models.Application.objects.get(pk=application_id)

    @staticmethod
    def _assert_response_is_forbidden(response):
        assert_that(
            response.status_code,
            equal_to(status.HTTP_403_FORBIDDEN),
            extract_response_error(response),
        )
