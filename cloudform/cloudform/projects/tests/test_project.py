from datetime import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from hamcrest import (
    assert_that,
    equal_to,
    not_,
    has_properties,
    has_item,
    has_entry,
    empty,
    only_contains,
    has_length,
    is_in,
)
from rest_framework import status
from rest_framework.test import APITestCase

from cloudform.projects import models
from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from cloudform.projects.models import Project
from zouth.tests.utils import extract_response_error


User = get_user_model()


class ProjectModelTestCase(APITestCase):
    fixtures = ["groups", "users", "projects"]

    def test_list_owned_project(self):
        user = self._get_project_owner()
        result = models.Project.of_members(user)

        project_users = [item.members.all() for item in result]
        assert_that(project_users, only_contains(has_item(user)))

    def test_list_owned_project_by_user_without_any_project(self):
        user = self._get_user_without_project()
        result = models.Project.of_members(user)

        assert not result, f"{result} must empty"

    def test_transfer_project_owner(self):
        current_owner = self._get_project_owner()
        new_owner = User.objects.get(pk=1001)
        project = models.Project.of_members(current_owner).first()

        project.transfer_owner(new_owner)
        assert_that(project.owner, equal_to(new_owner))
        project_members = project.members.all()
        assert_that(project_members, has_item(new_owner))
        assert_that(project.members, not_(has_item(current_owner)))

    def test_cannot_delete_project_with_active_applications(self):
        project = models.Project.objects.get(id=1)
        project.applications.create(
            name="hello",
            description="long hello",
            supporter_name="dummy",
            supporter_email="dummy",
            supporter_department="dummy",
            supporter_organization="dummy",
            created_by=self._get_project_owner(),
        )
        assert_that(project.can_delete, equal_to(False))

    def test_can_delete_project_without_application(self):
        project = models.Project.objects.get(id=4)
        assert_that(project.applications.all(), has_length(0))
        assert_that(project.can_delete, equal_to(True))

    def test_can_delete_project_with_only_inactive_applications(self):
        project = models.Project.objects.get(id=1)
        project.applications.create(
            name="hello",
            description="long hello",
            supporter_name="dummy",
            supporter_email="dummy",
            supporter_department="dummy",
            supporter_organization="dummy",
            active_flag=False,
            created_by=self._get_project_owner(),
        )
        assert_that(project.can_delete, equal_to(True))

    @staticmethod
    def _get_project_owner():
        return User.objects.get(pk=1000)

    @staticmethod
    def _get_user_without_project():
        return User.objects.get(pk=999)


class ProjectViewSetTestCase(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users", "projects", "applications"]

    def test_create_project(self):
        user = self._login_as("req001")
        data = {
            "job_code": "test job code",
            "name": "test project name",
            "expired_date": datetime.fromisoformat("2019-01-01T00:00:00.000+07:00"),
        }

        response = self.client.post(reverse("project-list"), data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_201_CREATED),
            extract_response_error(response),
        )

        obj = models.Project.objects.get(pk=response.data["id"])
        # Create project as given parameter
        assert_that(
            obj,
            has_properties(
                name=data["name"],
                job_code=data["job_code"],
                expired_date=data["expired_date"],
            ),
        )

        # User related fields
        assert_that(obj, has_properties(owner=user, created_by=user, updated_by=user))
        self.assertQuerysetEqual(obj.members.all(), [repr(user)])

    def test_list_projects_should_return_only_owned_project(self):
        user = self._login_as("req001")
        response = self.client.get(reverse("project-list"), format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        my_projects = Project.objects.filter(members=user).values_list("id", flat=True)

        assert_that(
            response.data["results"], only_contains(has_entry("id", is_in(my_projects)))
        )

    def test_retrieve_project_as_member_of_the_project(self):
        user = self._login_as("req001")
        project_id = self.get_project_id_of_user(user)

        url = reverse("project-detail", args=(project_id,))
        response = self.client.get(url, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

    def test_list_all_projects_or_retrieve_as_admin_of_system(self):
        self._login_as("admin001")
        list_response = self.client.get(reverse("project-list") + "?all", format="json")
        assert_that(
            list_response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(list_response),
        )

        assert_that(list_response.data, not_(empty()))
        all_project_count = models.Project.objects.count()
        assert_that(list_response.data["results"], has_length(all_project_count))

        project_id = models.Project.objects.first().id
        fetch_response = self.client.get(
            reverse("project-detail", args=(project_id,)), format="json"
        )
        assert_that(
            fetch_response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(fetch_response),
        )

    def test_edit_the_project(self):
        user = self._login_as("req001")
        project_id = self.get_project_id_of_user(user)
        data = {
            "id": project_id,
            "job_code": "test job code",
            "name": "test project name 2",
            "expired_date": datetime.fromisoformat("2019-01-01T00:00:00.000+07:00"),
        }

        response = self.client.put(
            reverse("project-detail", args=(project_id,)), data=data, format="json"
        )
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        obj = models.Project.objects.get(pk=response.data["id"])
        # Update project as given parameter
        assert_that(
            obj,
            has_properties(
                name=data["name"],
                job_code=data["job_code"],
                expired_date=data["expired_date"],
            ),
        )

    def test_edit_project_as_non_member(self):
        self._login_as("req002")

        other_user = User.objects.get(username="req001")
        project_id = self.get_project_id_of_user(other_user)
        data = {
            "id": project_id,
            "job_code": "test job code",
            "name": "test project name 2",
            "expired_date": datetime.fromisoformat("2019-01-01T00:00:00.000+07:00"),
        }

        response = self.client.put(
            reverse("project-detail", args=(project_id,)), data=data, format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_404_NOT_FOUND),
            extract_response_error(response),
        )

    def test_delete_project(self):
        user = self._login_as("req001")
        project_id = 4  # Project without applications
        response = self.client.delete(
            reverse("project-detail", args=(project_id,)), format="json"
        )

        assert_that(
            response.status_code,
            equal_to(status.HTTP_204_NO_CONTENT),
            extract_response_error(response),
        )

        project = models.Project.objects.get(pk=project_id)
        assert_that(project.active_flag, equal_to(False))

    def test_transfer_project_owner_by_owner(self):
        project_owner = self._login_as("req001")
        project_id = (
            models.Project.objects.filter(owner__id=project_owner.id).first().id
        )
        self._transfer_project_success(project_id)

    def test_transfer_project_owner_by_cloud_admin(self):
        self._login_as("cloud001")
        project_owner = User.objects.get(username="req001")
        project_id = (
            models.Project.objects.filter(owner__id=project_owner.id).first().id
        )
        self._transfer_project_success(project_id)

    def test_transfer_project_owner_by_non_owner(self):
        self._login_as("req002")
        owner_user = User.objects.get(username="req001")
        project_id = models.Project.objects.filter(owner__id=owner_user.id).first().id

        response = self._transfer_project(project_id, owner_user)

        assert_that(
            response.status_code,
            equal_to(status.HTTP_404_NOT_FOUND),
            extract_response_error(response),
        )

        refreshed_project = models.Project.objects.get(pk=project_id)
        assert_that(refreshed_project.owner, equal_to(owner_user))

    def _transfer_project(self, project_id, new_user):
        data = {
            "new_owner": {
                "domain": new_user.domain,
                "is_local": new_user.is_local,
                "username": new_user.username,
            }
        }
        response = self.client.post(
            reverse("project-detail", args=(project_id,)) + "transfer-owner/",
            data=data,
            format="json",
        )

        return response

    def _transfer_project_success(self, project_id):
        new_user = User.objects.get(username="req002")
        response = self._transfer_project(project_id, new_user)
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        refreshed_project = models.Project.objects.get(pk=project_id)
        assert_that(refreshed_project.owner, equal_to(new_user))

    @staticmethod
    def get_project_id_of_user(user):
        return models.Project.of_members(user).first().id
