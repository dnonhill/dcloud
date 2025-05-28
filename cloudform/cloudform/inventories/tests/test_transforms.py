from django.test import TestCase
from ..transforms import Inventorytransform
import json


class InventtoryTranformTest(TestCase):
    def setUp(self):
        self.resource_detail = {
            "os": "Windows 2016+Antivirus",
            "cpu": 2,
            "name": "test-testdb-p01",
            "distro": None,
            "memory": 4,
            "os_disk": 100,
            "os_type": "windows",
            "database": {
                "name": "test_ds, test_ShareService",
                "engine": "Microsoft SQL Server 2016",
                "data_size": 10,
                "display_engine": "Microsoft SQL Server 2016"
            },
            "hostname": "test-testdb-p01",
            "memory_mb": 4096,
            "webserver": None,
            "display_os": "Windows Server 2016",
            "ip_address": "1.1.1.1",
            "environment": "Production",
            "network_zone": "database",
            "storage_tier": "1_bronze",
            "data_disk_1_size": 100,
            "data_disk_2_size": 400,
            "protection_level": "p4",
            "initial_db_account": "testusr",
            "display_environment": "Production",
            "display_network_zone": "No internet connection (Database/Internal Zone)",
            "display_storage_tier": "Normal - General purpose",
            "display_protection_level": "P4 - Backup Daily, No DR"
        }

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

        self.vm_detail_error = {
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

        self.open_shift = {
            "cpu": 4,
            "memory": 8,
            "members": ["keng.W", "jeng.w", "jins.r", "kie.w", "kong.p", "nnis.k"],
            "namespace": "test-dev-01010",
            "project_url": "https://example.com/k8s/cluster/projects/foo0111-icm-dev",
            "main_storage": 250
        }

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


    def test_transform_vm_resourec(self):
        result = Inventorytransform.transform(self.resource_detail, json.dumps(self.vm_detail))
        self.assertEqual(result["cpu"], 4)
        self.assertEqual(result["memory"], 8)
        self.assertEqual(result["os_disk"], 20)
        self.assertEqual(result["data_disk_1_size"], 40)
        self.assertEqual(result["data_disk_2_size"], 40)

    def test_transform_should_return_result_detail_when_vm_detail_empty(self):
        result = Inventorytransform.transform(self.resource_detail, {})
        self.assertEqual(result["cpu"], 2)
        self.assertEqual(result["memory"], 4)
        self.assertEqual(result["os_disk"], 100)
        self.assertEqual(result["data_disk_1_size"], 100)
        self.assertEqual(result["data_disk_2_size"], 400)

    def test_transform_should_return_result_detail_when_vm_detail_is_error(self):
        result = Inventorytransform.transform(self.resource_detail, self.vm_detail_error)
        self.assertEqual(result["cpu"], 2)
        self.assertEqual(result["memory"], 4)
        self.assertEqual(result["os_disk"], 100)
        self.assertEqual(result["data_disk_1_size"], 100)
        self.assertEqual(result["data_disk_2_size"], 400)

    def test_transform_open_shift_resource(self):
        result = Inventorytransform.transform_openshift(self.open_shift, json.dumps(self.open_shift_detail))
        self.assertEqual(result["cpu"], 10)
        self.assertEqual(result["memory"], 16)
        self.assertEqual(result["main_storage"], 50)

    def test_transform_open_shift_resource_is_empty(self):
        result = Inventorytransform.transform_openshift(self.open_shift, {})
        self.assertEqual(result["cpu"], 4)
        self.assertEqual(result["memory"], 8)
        self.assertEqual(result["main_storage"], 250)

    def test_transform_open_shift_resource_is_empty_not_found(self):
        result = Inventorytransform.transform_openshift(self.open_shift, self.open_shift_empty)
        self.assertEqual(result["cpu"], 4)
        self.assertEqual(result["memory"], 8)
        self.assertEqual(result["main_storage"], 250)
