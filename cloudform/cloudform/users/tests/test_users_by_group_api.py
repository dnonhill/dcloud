from rest_framework import status
from hamcrest import assert_that, contains_inanyorder, has_entry, equal_to

from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from zouth.tests.utils import extract_response_error


class UsersByGroupAPITestCase(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users"]

    def test_fetch_operators(self):
        self._login_as("cloud001")
        response = self.client.get("/api/groups/operator/users/", None, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(
            response.data["results"],
            contains_inanyorder(
                has_entry("username", "admin001"), has_entry("username", "admin002")
            ),
        )
