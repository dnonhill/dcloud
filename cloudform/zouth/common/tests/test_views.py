import unittest
from hamcrest import assert_that, equal_to

from rest_framework import status, serializers
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotFound,
    ValidationError,
    ErrorDetail,
)

from zouth.common import views


class SampleSerializer(serializers.Serializer):
    field_1 = serializers.IntegerField(max_value=10)
    field_2 = serializers.CharField()


class CustomExceptionHandlerTestCase(unittest.TestCase):
    def test_parsing_authentication_failed(self):
        exception = AuthenticationFailed(
            detail="Session expired.", code="session_expired"
        )

        actual = views.custom_exception_handler(exception, None)

        assert_that(actual.status_code, equal_to(status.HTTP_401_UNAUTHORIZED))
        assert_that(
            actual.data,
            equal_to(
                {
                    "message": "Session expired.",
                    "code": "session_expired",
                    "status_code": 401,
                }
            ),
        )

    def test_parsing_not_found(self):
        exception = NotFound(detail="Object is not found")

        actual = views.custom_exception_handler(exception, None)

        assert_that(actual.status_code, equal_to(status.HTTP_404_NOT_FOUND))
        assert_that(
            actual.data,
            equal_to(
                {
                    "message": "Object is not found",
                    "code": "not_found",
                    "status_code": 404,
                }
            ),
        )

    def test_validation_error(self):
        exception = None
        try:
            serializer = SampleSerializer(data={"field_1": 200})
            serializer.is_valid(raise_exception=True)
        except ValidationError as ex:
            exception = ex

        actual = views.custom_exception_handler(exception, None)

        assert_that(actual.status_code, equal_to(status.HTTP_400_BAD_REQUEST))
        assert_that(
            actual.data,
            equal_to(
                {
                    "message": "Invalid input.",
                    "code": "invalid",
                    "status_code": 400,
                    "details": {
                        "field_1": [
                            ErrorDetail(
                                string="Ensure this value is less than or equal to 10.",
                                code="max_value",
                            )
                        ],
                        "field_2": [
                            ErrorDetail(
                                string="This field is required.", code="required"
                            )
                        ],
                    },
                }
            ),
        )
