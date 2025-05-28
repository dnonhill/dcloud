import json
from django.test import TestCase

from cloudform.projects.models.resource import RESOURCE_TYPE_VM, RESOURCE_TYPE_OPENSHIFT
from cloudform.inventories.error_checks import InventoryErrorCheck
from cloudform.inventories.models import InventoryList
from cloudform.projects.models.data_center import DataCenter


class InventtoryErrorCheckTest(TestCase):
    fixtures = ['data-center']
    def setUp(self):
        data_center = DataCenter.objects.get(pk=1)
        self.inventory_vm = InventoryList.objects.create(
            project="mm-project",
            application="mm-app",
            name="mm-name",
            resource_type=RESOURCE_TYPE_VM,
            data_center_ref=data_center,
            job_code="010101010101",
            details={},
        )

        self.inventory_open_shift = InventoryList.objects.create(
            project="mm-project",
            application="mm-app",
            name="mm-name",
            resource_type=RESOURCE_TYPE_OPENSHIFT,
            data_center_ref=data_center,
            job_code="010101010101",
            details={},
        )

        self.vm_detail = {
            "value": {
                "memory": {
                    "hot_add_increment_size_MiB": 0,
                    "size_MiB": 8192,
                    "hot_add_enabled": False,
                    "hot_add_limit_MiB": 8192
                },
                "disks": [
                    {
                        "value": {
                            "label": "Hard disk 1",
                            "type": "SCSI",
                            "capacity": 21474836480
                        }
                    },
                    {
                        "value": {
                            "label": "Hard disk 2",
                            "type": "SCSI",
                            "capacity": 42949672960
                        }
                    },
                    {
                        "value": {
                            "label": "Hard disk 3",
                            "type": "SCSI",
                            "capacity": 42949672960
                        }
                    }
                ],
                "cpu": {
                    "hot_remove_enabled": False,
                    "count": 4,
                    "hot_add_enabled": False,
                    "cores_per_socket": 1
                },
                "power_state": "POWERED_ON",
                "floppies": [],
                "identity": {
                    "name": "nfs-1",
                    "instance_uuid": "503e28b8-9933-f7e3-269a-22ef3975ee47",
                    "bios_uuid": "423ee734-8482-4105-9e88-502f0081cc7d"
                },
                "name": "nfs-1",
                "guest_OS": "CENTOS_7_64"
            }
        }
        self.vm_detail_error_or_empry = {
            "type": "com.vmware.vapi.std.errors.unauthorized",
            "value": {
                "error_type": "UNAUTHORIZED",
                "messages": [
                    {
                        "args": [
                            "object: vm-111:d6e608b5-3ba4-45a1-a7a9-76bc0879e33c privileges: System.Read"
                        ],
                        "default_message": "The System.Read) privileges are insufficient to user",
                        "id": "vapi.authz.error.no.privs"
                    }
                ]
            }
        }
        self.vm_error = {}
        self.open_shift_detail = {
            "kind": "ResourceQuotaList",
            "apiVersion": "v1",
            "metadata": {
                "selfLink": "/api/v1/namespaces/test-dcloud-nonprod/resourcequotas",
                "resourceVersion": "213676916"
            },
            "items": [
                {
                    "metadata": {
                        "name": "compute-quota",
                        "namespace": "test-dcloud-nonprod",
                        "selfLink": "/api/v1/namespaces/test-dcloud-nonprod/resourcequotas/compute-quota",
                        "uid": "b43d2d27-5f8d-11ea-814c-005056bb9f4c",
                        "resourceVersion": "140092903",
                        "creationTimestamp": "2020-03-06T09:34:40Z"
                    },
                    "spec": {
                        "hard": {
                            "limits.cpu": "10",
                            "limits.memory": "16Gi",
                            "ontap-silver-p4.storageclass.storage.k8s.io/requests.storage": "0",
                            "requests.storage": "50Gi"
                        }
                    },
                    "status": {
                        "hard": {
                            "limits.cpu": "2",
                            "limits.memory": "2Gi",
                            "ontap-silver-p4.storageclass.storage.k8s.io/requests.storage": "0",
                            "requests.storage": "12Gi"
                        },
                        "used": {
                            "limits.cpu": "0",
                            "limits.memory": "0",
                            "ontap-silver-p4.storageclass.storage.k8s.io/requests.storage": "0",
                            "requests.storage": "0"
                        }
                    }
                }
            ]
        }
        self.open_shift_empty = {
            "kind": "ResourceQuotaList",
            "apiVersion": "v1",
            "metadata": {
                "selfLink": "/api/v1/namespaces/test-dcloud-nonprod-1/resourcequotas",
                "resourceVersion": "361053793"
            },
            "items": []
        }
        self.open_shift_error = {}

    def test_should_return_false_when_vm_found(self):
        expected = False

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.vm_detail, self.inventory_vm.resource_type)

        assert result == expected

    def test_should_return_turn_when_vm_not_found(self):
        expected = True

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.vm_detail_error_or_empry, self.inventory_vm.resource_type)

        assert result == expected

    def test_should_return_turn_when_vm_not_format(self):
        expected = True

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.vm_error, self.inventory_vm.resource_type)

        assert result == expected

    def test_should_return_turn_when_vm_is_null(self):
        expected = True

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.vm_error, self.inventory_vm.resource_type)

        assert result == expected

    def test_should_return_false_when_open_shift_found(self):
        expected = False

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.open_shift_detail, self.inventory_open_shift.resource_type)

        assert result == expected

    def test_should_return_turn_when_open_shift_not_found(self):
        expected = True

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.open_shift_empty, self.inventory_open_shift.resource_type)

        assert result == expected

    def test_should_return_turn_when_open_shift_not_match(self):
        expected = True

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(self.open_shift_error, self.inventory_open_shift.resource_type)

        assert result == expected

    def test_should_return_turn_when_open_shift_is_null(self):
        expected = True

        result = InventoryErrorCheck.is_not_found_or_request_detail_error(None, self.inventory_open_shift.resource_type)

        assert result == expected
