from django.test import TestCase
from ..transforms import Inventorytransform
import json


class InventtoryTranformOpenShiftTest(TestCase):
    def setUp(self):
        self.open_shift_info_1 = {
            "kind": "ResourceQuotaList",
            "apiVersion": "v1",
            "metadata": {
                "selfLink": "/api/v1/namespaces/test-dcloud-nonprod/resourcequotas",
                "resourceVersion": "354770149"
            },
            "items": [
                {
                    "spec": {
                        "hard": {
                            "limits.cpu": "2",
                            "limits.memory": "2Gi",
                            "ontap-silver-p4.storageclass.storage.k8s.io/requests.storage": "0",
                            "requests.storage": "12Gi"
                        }
                    },
                }
            ]
        }

        self.open_shift_info_2 = {
            "kind": "ResourceQuotaList",
            "apiVersion": "v1",
            "metadata": {
                "selfLink": "/api/v1/namespaces/test-dcloud-nonprod/resourcequotas",
                "resourceVersion": "354770149"
            },
            "items": [
                {
                    "spec": {
                        "hard": {
                            "limits.cpu": "8",
                            "limits.memory": "16Gi",
                            "ontap-silver-p4.storageclass.storage.k8s.io/requests.storage": "0",
                            "requests.storage": "50Gi"
                        }
                    },
                }
            ]
        }

    def test_should_returm_cpu_value(self):
        expected_cpu = 2

        result = Inventorytransform.transform_openshift_to_spec(self.open_shift_info_1)

        assert result["cpu"] == expected_cpu

    def test_should_returm_othor_cpu_value(self):
        expected_cpu = 8

        result = Inventorytransform.transform_openshift_to_spec(self.open_shift_info_2)

        assert result["cpu"] == expected_cpu

    def test_should_returm_memory_value(self):
        expected_memory = 2

        result = Inventorytransform.transform_openshift_to_spec(self.open_shift_info_1)

        assert result["memory"] == expected_memory

    def test_should_returm_othor_memory_value(self):
        expected_memory = 16

        result = Inventorytransform.transform_openshift_to_spec(self.open_shift_info_2)

        assert result["memory"] == expected_memory

    def test_should_returm_main_storage_value(self):
        expected_main_storage = 12

        result = Inventorytransform.transform_openshift_to_spec(self.open_shift_info_1)

        assert result["main_storage"] == expected_main_storage

    def test_should_returm_othor_main_storage_value(self):
        expected_main_storage = 50

        result = Inventorytransform.transform_openshift_to_spec(self.open_shift_info_2)

        assert result["main_storage"] == expected_main_storage
