from rest_framework import status
from hamcrest import assert_that, equal_to, has_length

from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from zouth.tests.utils import extract_response_error


class DataCenterApiTestCase(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users", "data-center", "approver", "data-center-level",]

    def test_fetch_data_centers(self):
        self._login_as("req001")
        response = self.client.get("/api/data-centers/", format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )

        assert_that(response.data, 0)

    def test_fetch_approvers_by_datacenter(self):
        self._login_as("req001")
        response = self.client.get("/api/data-centers/1/approvers/", format="json")

        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response),
        )
        assert_that(response.data, 0)
