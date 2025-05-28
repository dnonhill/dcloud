import json

from django.test import TestCase
from hamcrest import assert_that, equal_to

from cloudform.tasks.models import TaskResultInterpreter


class VmResultInterpreterTest(TestCase):
    Interpreter = TaskResultInterpreter.VmResultInterpreter

    def test_parsing_complete_vm_result(self):
        original_result = json.loads(
            """
            {
              "item": "disk_lists",
              "vm_name": "dcloud-awxx-test",
              "disk_lists": [
                {
                  "type": "thin",
                  "size_gb": "50",
                  "datastore": "ST_HQ_BRONZE_P4_01"
                },
                {
                  "type": "thin",
                  "size_gb": "11",
                  "datastore": "ST_HQ_BRONZE_P4_01"
                },
                {
                  "type": "thin",
                  "size_gb": "12",
                  "datastore": "ST_HQ_BRONZE_P4_01"
                }
              ],
              "cfme_vm_cpus": 2,
              "ansible_loop_var": "item",
              "cfme_vm_hostname": "test-dcloud-01",
              "cfme_vm_memory_mb": 4096,
              "cfme_vm_network_list": [
                {
                  "ip": "10.224.4.51",
                  "name": "pds_staging_app_3833_10.224.4.x_24",
                  "type": "static",
                  "gateway": "10.224.4.1",
                  "netmask": "255.255.255.0",
                  "device_type": "vmxnet3",
                  "start_connected": true
                }
              ]
            }
        """
        )

        actual = self.Interpreter().interpret(original_result)
        assert_that(
            actual,
            equal_to(
                dict(
                    hostname="dcloud-awxx-test",
                    ip_address="10.224.4.51",
                    data_disk_0_size=50,
                    data_disk_1_size=11,
                    data_disk_2_size=12,
                    cpu=2,
                    memory_mb=4096,
                    memory=4,
                )
            ),
        )

    def test_result_with_missing_fields(self):
        original_result = json.loads(
            """
            {
              "item": "disk_lists",
              "vm_name": "dcloud-awxx-test",
              "disk_lists": [
                {
                  "type": "thin",
                  "size_gb": "50",
                  "datastore": "ST_HQ_BRONZE_P4_01"
                }
              ],
              "cfme_vm_cpus": 2,
              "ansible_loop_var": "item",
              "cfme_vm_hostname": "test-dcloud-01",
              "cfme_vm_network_list": [
                {
                  "ip": "10.224.4.51",
                  "name": "pds_staging_app_3833_10.224.4.x_24",
                  "type": "static",
                  "gateway": "10.224.4.1",
                  "netmask": "255.255.255.0",
                  "device_type": "vmxnet3",
                  "start_connected": true
                }
              ]
            }
        """
        )

        actual = self.Interpreter().interpret(original_result)
        assert_that(
            actual,
            equal_to(
                dict(
                    hostname="dcloud-awxx-test",
                    ip_address="10.224.4.51",
                    data_disk_0_size=50,
                    cpu=2,
                )
            ),
        )


class OpenshiftInterpreterTest(TestCase):
    Interpreter = TaskResultInterpreter.OpenshiftInterpreter

    def test_parsing_complete_results(self):
        result = json.loads(
            """{
                "item": "oc_quota_size",
                "oc_cpu": 2,
                "oc_memory": 4,
                "oc_storage": "10",
                "oc_quota_size": "12",
                "oc_project_name": "test-dcloud-02",
                "ansible_loop_var": "item",
                "parsed_project_url": "https://console-staging.platform.pttgrp.com/console/project/test-parsed-url"
            }"""
        )

        actual = self.Interpreter().interpret(result)
        assert_that(
            actual,
            equal_to(
                dict(
                    namespace="test-dcloud-02",
                    cpu=2,
                    memory=4,
                    main_storage=10,
                    project_url="https://console-staging.platform.pttgrp.com/console/project/test-parsed-url"
                )
            ),
        )