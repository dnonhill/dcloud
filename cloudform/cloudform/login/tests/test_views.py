from rest_framework.test import APITestCase
from rest_framework import status
from hamcrest import assert_that, equal_to, has_key

from zouth.tests.utils import extract_response_error


class LoginAPITestCase(APITestCase):
    fixtures = ["groups", "users"]
    test_user = {"domain": "ptt", "username": "req001", "password": "password"}

    def test_login_success(self):
        response = self.client.post("/api/token/", data=self.test_user, format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assert_that(response.data, has_key("access"))
        assert_that(response.data, has_key("refresh"))
        assert_that(response.data, has_key("profile"))

    def test_login_should_has_session(self):
        response = self.client.post("/api/token/", data=self.test_user, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue("sessionid" in response.cookies)

