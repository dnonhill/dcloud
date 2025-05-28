from rest_framework import status
from hamcrest import assert_that, equal_to

from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase


class FetchUsersTestCase(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users"]

    def test_fetch_my_profile(self):
        self._login_as("cloud001")
        response = self.client.get("/api/users/profile/", None, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            _extract_response_error(response),
        )
        assert_that(response.data["username"], equal_to("cloud001"))

    def test_fetch_other_profile(self):
        self._login_as("cloud001")
        response = self.client.get("/api/users/req001/", None, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            _extract_response_error(response),
        )
        assert_that(response.data["username"], equal_to("req001"))

    def test_unauthorized_fetch_proflie(self):
        response = self.client.get("/api/users/profile/", None, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_401_UNAUTHORIZED),
            _extract_response_error(response),
        )


def _extract_response_error(response):
    return response.data if hasattr(response, "data") else response

