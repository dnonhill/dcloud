from rest_framework import status
from rest_framework.test import APITestCase
from hamcrest import assert_that, equal_to

from zouth.tests.utils import extract_response_error
from cloudform.form_config.models import FormConfig


class FieldConfigTestCase(APITestCase):
    def test_query_by_page(self):
        response = self.client.get("/api/form-config/B/", data=None, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response)
        )
        assert_that(response.data, equal_to({
            "B": {
                "b1": [
                    {"value": "25 Dec", "display": "Saint Clause", "extra_fields": {"emotion": "happy"}},
                    {"value": "14 Feb", "display": "Valentine", "extra_fields": {"emotion": "love"}},
                ],
                "b2": [
                    {"value": "for", "display": "loop", "extra_fields": {}},
                ]
            }
        }))

    def test_query_by_page_and_field(self):
        response = self.client.get("/api/form-config/B/b2/", data=None, format="json")
        assert_that(
            response.status_code,
            equal_to(status.HTTP_200_OK),
            extract_response_error(response)
        )

        assert_that(response.data, equal_to({
            "B": {
                "b2": [
                    {"value": "for", "display": "loop", "extra_fields": {}},
                ]
            }
        }))

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        FormConfig.objects.create(
            page="A",
            field="a1",
            sequence=2,
            value="hello",
            display="aloha",
            extra_fields={"world": "earth"}
        )

        FormConfig.objects.create(
            page="A",
            field="a1",
            sequence=1,
            value="goodbye",
            display="sayonara",
            extra_fields={"world": "mars"}
        )

        FormConfig.objects.create(
            page="B",
            field="b1",
            sequence=3,
            value="14 Feb",
            display="Valentine",
            extra_fields={"emotion": "love"}
        )

        FormConfig.objects.create(
            page="B",
            field="b1",
            sequence=2,
            value="25 Dec",
            display="Saint Clause",
            extra_fields={"emotion": "happy"}
        )

        FormConfig.objects.create(
            page="B",
            field="b2",
            sequence=1,
            value="for",
            display="loop",
            extra_fields={}
        )

