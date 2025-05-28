from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from hamcrest import assert_that, close_to


class PriceSettingViewSetTest(TestCase):
    fixtures = ["pricing"]
    spec = """{
        "cpu": 2,
        "memory": 4,
        "storage_tier": "platinum",
        "protection_level": "p1",
        "os_dist": 50
    }"""

    # cpu 2 * 17.412 = 34.824
    # ram 4 * 11.178 = 44.712  => 79.536
    # antivirus 1 * 7.7208 = 7.7208 => 87.2568
    # disk 50 * 0.6242 = 31.21 => 118.4668
    # DR cpu of protection level p1 2 * 5.2236 = 10.4472 => 128.914

    def test_calculate(self):
        data = {"action": "create", "resource_type": "vm", "specification": self.spec}

        response = self.client.get(reverse("pricing-calculate"), data, format="json")

        assert_that(response.status_code, status.HTTP_200_OK)
        assert_that(response.data["price"], close_to(Decimal(128.914), 1e-8))
