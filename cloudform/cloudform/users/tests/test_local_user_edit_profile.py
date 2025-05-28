from hamcrest import assert_that, equal_to
from rest_framework import status

from cloudform.tests import AuthorizedUserRequiredTestCase
from cloudform.users.models import LocalUser, User
from zouth.tests.utils import extract_response_error


class LocalUserActionTest(AuthorizedUserRequiredTestCase):
    def setUp(self):
        super().setUp()
        user = LocalUser.objects.create(
            id=99,
            username="test@local.com",
        )
        user.set_password("old_password")
        user.save()

    def test_edit_profile_by_local_user(self):
        self.login_as("test@local.com")
        new_profile = dict(
            first_name="test first",
            last_name="test last",
            telephone="123456",
            mobile="234567",
            department="test departo",
            company="test comp",
            organization="test org"
        )

        request = self.client.post("/api/users/profile/edit/", data=new_profile)
        assert_that(
            request.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(request)
        )

        # Assert changed profile.
        user = LocalUser.objects.get(username="test@local.com")
        assert_that(user.first_name, equal_to(new_profile["first_name"]))
        assert_that(user.last_name, equal_to(new_profile["last_name"]))
        assert_that(user.telephone, equal_to(new_profile["telephone"]))
        assert_that(user.mobile, equal_to(new_profile["mobile"]))
        assert_that(user.department, equal_to(new_profile["department"]))
        assert_that(user.company, equal_to(new_profile["company"]))
        assert_that(user.organization, equal_to(new_profile["organization"]))

    def test_edit_profile_by_non_local_user(self):
        self.login_as("req001")
        new_profile = dict(
            first_name="test first",
            last_name="test last",
            telephone="123456",
            mobile="234567",
            department="test departo",
            company="test comp",
            organization="test org"
        )

        request = self.client.post("/api/users/profile/edit/", data=new_profile)
        assert_that(
            request.status_code,
            equal_to(status.HTTP_403_FORBIDDEN),
            extract_response_error(request)
        )

    def test_change_password_success(self):
        self.login_as("test@local.com")
        data = dict(
            old_password="old_password",
            new_password="new_password"
        )

        request = self.client.post("/api/users/profile/change-password/", data=data)
        assert_that(
            request.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(request)
        )

        # Assert changed password.
        user = LocalUser.objects.get(username="test@local.com")
        assert_that(user.check_password(data["new_password"]), equal_to(True))
        assert_that(user.check_password(data["old_password"]), equal_to(False))

    def test_change_password_with_wrong_old_password(self):
        self.login_as("test@local.com")
        data = dict(
            old_password="wrong_password",
            new_password="new_password"
        )

        request = self.client.post("/api/users/profile/change-password/", data=data)
        assert_that(
            request.status_code,
            equal_to(status.HTTP_400_BAD_REQUEST),
            extract_response_error(request)
        )

        # Assert changed password.
        user = LocalUser.objects.get(username="test@local.com")
        assert_that(user.check_password(data["new_password"]), equal_to(False))

    def test_change_password_by_non_local_user(self):
        self.login_as("req001")
        data = dict(
            old_password="wrong_password",
            new_password="new_password"
        )

        request = self.client.post("/api/users/profile/change-password/", data=data)
        assert_that(
            request.status_code,
            equal_to(status.HTTP_403_FORBIDDEN),
            extract_response_error(request)
        )
