from django.test import TestCase
from ..transforms import Inventorytransform
import json


class InventtoryTranformTest(TestCase):
    def setUp(self):
        self.vm_info_1 = {
                "value": {
                    "memory": {
                        "hot_add_increment_size_MiB": 4,
                        "size_MiB": 16384,
                        "hot_add_enabled": True,
                        "hot_add_limit_MiB": 262144
                    },
                    "disks": [
                        {
                            "value": {
                                "scsi": {
                                    "bus": 0,
                                    "unit": 0
                                },
                                "backing": {
                                    "vmdk_file": "[HQ_SILVER_P3_01] grp-dcpdb-t02/grp-dcpdb-t02_7-000001.vmdk",
                                    "type": "VMDK_FILE"
                                },
                                "label": "Hard disk 1",
                                "type": "SCSI",
                                "capacity": 107374182400
                                },
                                "key": "2000"
                        },
                        {
                            "value": {
                                "scsi": {
                                    "bus": 0,
                                    "unit": 0
                                },
                                "backing": {
                                    "vmdk_file": "[HQ_SILVER_P3_01] grp-dcpdb-t02/grp-dcpdb-t02_7-000001.vmdk",
                                    "type": "VMDK_FILE"
                                },
                                "label": "Hard disk 2",
                                "type": "SCSI",
                                "capacity": 214748364800
                                },
                                "key": "2000"
                        }
                    ],
                    "parallel_ports": [],
                    "sata_adapters": [],
                    "cpu": {
                        "hot_remove_enabled": False,
                        "count": 8,
                        "hot_add_enabled": True,
                        "cores_per_socket": 1
                    },
                    "power_state": "POWERED_ON",
                    "floppies": [],
                    "name": "grp-dcpdb-t02",
                    "guest_OS": "WINDOWS_9_SERVER_64"
                }
        }

        self.vm_info_2 = {
                "value": {
                    "memory": {
                        "hot_add_increment_size_MiB": 4,
                        "size_MiB": 32768,
                        "hot_add_enabled": True,
                        "hot_add_limit_MiB": 262144
                    },
                    "disks": [
                        {
                            "value": {
                                "scsi": {
                                    "bus": 0,
                                    "unit": 0
                                },
                                "backing": {
                                    "vmdk_file": "[HQ_SILVER_P3_01] grp-dcpdb-t02/grp-dcpdb-t02_7-000001.vmdk",
                                    "type": "VMDK_FILE"
                                },
                                "label": "Hard disk 1",
                                "type": "SCSI",
                                "capacity": 214748364800
                                },
                                "key": "2000"
                        }
                    ],
                    "parallel_ports": [],
                    "sata_adapters": [],
                    "cpu": {
                        "hot_remove_enabled": False,
                        "count": 16,
                        "hot_add_enabled": True,
                        "cores_per_socket": 1
                    },
                    "power_state": "POWERED_ON",
                    "floppies": [],
                    "name": "grp-dcpdb-t02",
                    "guest_OS": "CENTOS_64"
                }
        }

    def test_should_returm_memory_value(self):
        expected_memory = 16

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_1)

        assert result["memory"] == expected_memory
        assert result["memory_mb"] == 16384

    def test_should_returm_othor_memory_value(self):
        expected_memory = 32

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_2)

        assert result["memory"] == expected_memory
        assert result["memory_mb"] == 32768

    def test_should_return_os_disk(self):
        expected_os_disk = 100

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_1)

        assert result["os_disk"] == expected_os_disk

    def test_should_return_othor_os_disk(self):
        expected_os_disk = 200

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_2)

        assert result["os_disk"] == expected_os_disk

    def test_should_returm_cpu_value(self):
        expected_cpu = 8

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_1)

        assert result["cpu"] == expected_cpu

    def test_should_returm_othor_cpu_value(self):
        expected_cpu = 16

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_2)

        assert result["cpu"] == expected_cpu

    def test_should_returm_data_disk_1(self):
        expected_data_disk_1 = 200

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_1)

        assert result["data_disk_1_size"] == expected_data_disk_1

    def test_should_return_os_detail(self):
        expected_display_os = "Windows 10 Server (64 bit)"
        expected_os_type = "windows"
        expected_distro = None

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_1)

        assert result["display_os"] == expected_display_os
        assert result["os_type"] == expected_os_type
        assert result["distro"] == expected_distro

    def test_should_return_other_os_detail(self):
        expected_display_os = "CentOS 4/5 (64-bit)"
        expected_os_type = "linux"
        expected_distro = "centos"

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_2)

        assert result["display_os"] == expected_display_os
        assert result["os_type"] == expected_os_type
        assert result["distro"] == expected_distro

    def test_should_returm_protection_level_and_storage_tire(self):
        expected_storage_tier = "2_silver"
        expected_rotection_level = "p3"

        result = Inventorytransform.transform_vm_info_to_spec(self.vm_info_1)

        assert result["storage_tier"] == expected_storage_tier
        assert result["protection_level"] == expected_rotection_level


class InventtoryTranformGetProtectionAndStorageTireTest(TestCase):
    def test_should_return_protection_level(self):
        vmdk_file = "[HQ_SILVER_P3_01] grp-dcpdb-t02/grp-dcpdb-t02_7-000001.vmdk"
        expected = {
            "storage_tier": "2_silver",
            "protection_level": "p3"
        }

        result = Inventorytransform.get_protection_level_and_storage_tire(vmdk_file)

        assert result == expected

    def test_should_return_protection_level_formate_2(self):
        vmdk_file = "[hq_bronze_p4_04] grp-pamcpm-p01/grp-pamcpm-p01_1-000001.vmdk"
        expected = {
            "storage_tier": "1_bronze",
            "protection_level": "p4"
        }

        result = Inventorytransform.get_protection_level_and_storage_tire(vmdk_file)

        assert result == expected

    def test_should_return_protection_level_formate_3(self):
        vmdk_file = "[pttep-hci-silver-p1-04] Test-HQ-ADDC1/Test-HQ-ADDC1.vmdk"
        expected = {
            "storage_tier": "2_silver",
            "protection_level": "p1"
        }

        result = Inventorytransform.get_protection_level_and_storage_tire(vmdk_file)

        assert result == expected

    def test_should_return_protection_level_formate_4(self):
        vmdk_file = "[HQ_BRONZE_P4_01] ptttsg-NaaS-t01/ptttsg-NaaS-t01.vmdk"
        expected = {
            "storage_tier": "1_bronze",
            "protection_level": "p4"
        }

        result = Inventorytransform.get_protection_level_and_storage_tire(vmdk_file)

        assert result == expected
