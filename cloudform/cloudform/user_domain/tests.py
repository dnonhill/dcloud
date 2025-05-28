from django.test import TestCase
from hamcrest import assert_that, is_

from .serializers import UserDomainSearchSerializer


class UserDomainSearchSerializerTest(TestCase):
    def test_serializer_attributes(self):
        data = (
            "john@doe",
            {"givenName": "Snake", "firstname": "John", "lastname": "Doe"},
        )
        serializer = UserDomainSearchSerializer(data=data)
        assert_that(serializer.is_valid(), is_(True))
        assert_that(serializer.data["attributes"], data[1])
