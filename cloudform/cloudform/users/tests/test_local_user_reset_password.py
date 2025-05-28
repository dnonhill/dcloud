from django.test import TestCase
from django.contrib.auth.models import Group as DjangoGroup
from django.urls import reverse
from hamcrest import assert_that, equal_to, has_item
from rest_framework import status
from rest_framework.test import APITestCase

from zouth.tests.utils import extract_response_error
from cloudform.users.models import LocalUser, Group


class LocalUserTestCase(TestCase):
    def test_create_new_user(self):
        email = "tansinee@xxx.com"

        user = LocalUser(email=email)
        user.save()

        assert_that(user.email, equal_to(email))
        assert_that(user.username, equal_to(email))
        assert_that(user.is_local, equal_to(True))

        assert_that(user.check_password(""), equal_to(False))
        assert_that(user.groups.all(), has_item(self.requestor_group))

    def test_generate_token(self):
        email = "tansinee@xxx.com"
        user = LocalUser(email=email)
        user.save()

        token = user.generate_password_token()
        assert_that(user.check_password_token(token), equal_to(True))
        assert_that(user.check_password_token(token + "1234"), equal_to(False))

    def setUp(self) -> None:
        self.requestor_group = DjangoGroup(name=Group.REQUESTOR)
        self.requestor_group.save()


class LocalUserActionTest(APITestCase):
    email = "tansinee@xxx.com"

    def setUp(self) -> None:
        DjangoGroup(name=Group.REQUESTOR).save()
        user = LocalUser(email=self.email)
        user.save()

    def test_reset_new_password_with_valid_token(self):
        token = self.get_user().generate_password_token()
        new_password = "hello-world-password"
        set_password_body = {"token": token, "password": new_password}

        url = reverse("externalUsers-reset-password", args=(self.email,))
        set_password_resp = self.client.post(url, set_password_body, format="json")

        assert_that(
            set_password_resp.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(set_password_resp),
        )

        # Assert that password can use for next login
        login_url = "/api/auth/token/"
        login_body = {"username": self.email, "password": new_password}
        login_resp = self.client.post(login_url, data=login_body, format="json")
        assert_that(
            login_resp.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(login_resp),
        )

    def test_reset_new_password_with_invalid_token(self):
        new_password = "hello-world-password"
        data = {"token": "abc1234325", "password": new_password}

        url = reverse("externalUsers-reset-password", args=(self.email,))
        response = self.client.post(url, data, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_400_BAD_REQUEST),
            extract_response_error(response),
        )

    def test_sending_reset_password_signal(self):
        url = reverse("externalUsers-forget-password", args=(self.email,))
        response = self.client.post(url, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

    @classmethod
    def get_user(cls):
        return LocalUser.objects.get(username=cls.email)
