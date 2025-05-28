import json
from pprint import pprint
import unittest
import pytest

from cloudform.inventories.v_center import VCenterManagement
from cloudform.inventories.transforms import Inventorytransform
from cloudform.inventories.management.commands.original_commands.check_vm_collect_billing import Command
from cloudform.inventories.models import InventoryList
from cloudform.projects.models import DataCenter
from cloudform.inventories.tasks import get_vm_info, get_vm_id


@pytest.mark.django_db
class TestVcenterApi(unittest.TestCase):

    def new_datacenter(self):
        from dataclasses import dataclass
        @dataclass
        class DataCenter:
            username: str
            password: str
            endpoint_vm: str
        dc = DataCenter("administrator@vsphere.local", "NetApp123!", "https://10.224.121.200")
        return dc

    def create_some_inventory_list(self):
        dc = DataCenter.objects.create(
            name='unittest',
            available_resources=[],
        )

        InventoryList.objects.create(
            application='unittest',
            name = 'unittest-vm-1',
            vm_id = 'vm-2851', # real id
            resource_type = 'vm',
            data_center_ref = dc,
            job_code = '0000',
            details = {},
        )

        InventoryList.objects.create(
            application='unittest',
            name = 'unittest-vm-2',
            vm_id = 'vm-2842', # real id
            resource_type = 'vm',
            data_center_ref = dc,
            job_code = '0000',
            details = {},
        )

        InventoryList.objects.create(
            application='unittest',
            name = 'unittest-vm-3',
            vm_id = 'vm-2802', # real id
            resource_type = 'vm',
            data_center_ref = dc,
            job_code = '0000',
            details = {},
        )

        show_all = InventoryList.objects.all()
        pprint(show_all)


    def test_new_login(self):
        user = "administrator@vsphere.local"
        passwd = "NetApp123!"
        url = "https://10.224.121.200"
        path = f"/tmp/{user}"

        # remove session file
        import os
        os.remove(path)

        # create session and save headers to file
        vcm = VCenterManagement()
        session = vcm.new_login(user, passwd, url)
        pprint(session.__dict__)

        self.assertTrue(os.path.isfile(path))


    def test_get_vm_id(self):
        dc = self.new_datacenter()
        real_vm_name = 'hci-vdb-datastore-2004-0-2'
        real_vm_id = 'vm-2752'
        result = get_vm_id(real_vm_name, dc)
        self.assertNotEqual(len(result), 0)
        self.assertEqual(result[0]["vm"], real_vm_id)


    def test_get_vm_info(self):
        real_vm_name = 'hci-vdb-datastore-2004-0-2'
        real_vm_id = 'vm-2752'
        resource_type = 'vm'
        dc = DataCenter.objects.create(
            name='unittest',
            available_resources=[],
            username="administrator@vsphere.local",
            password="NetApp123!",
            endpoint_vm="https://10.224.121.200",
        )
        result = get_vm_info(real_vm_id, resource_type, data_center_ref=dc)
        result_dict = json.loads(result)
        self.assertEqual(result_dict["identity"]["name"], real_vm_name)


    def test_check_vm_collect_billing(self):
        """
        Test file: cloudform.inventories.management.commands.check_vm_collect_billing
        """
        dc = self.new_datacenter()
        comm = Command()

        # Test function Command.get_cluster()
        cluster = comm.get_cluster(dc)
        # Test function Command.get_vm()
        vms = comm.get_vm(dc, cluster)

        # Test function Command.check_vm_has_included_with_billing()
        self.create_some_inventory_list()
        (include, exclude) = comm.check_vm_has_included_with_billing(vms)

        # Assertions
        self.assertEqual(len(include), 3)

    def test_get_host(self):
        dc = self.new_datacenter()
        comm = Command()
        result = comm.get_host(dc)

        # This datacenter have 1 host.
        self.assertEqual(len(result), 1)

    def test_get_vm_from_each_host(self):
        dc = self.new_datacenter()
        comm = Command()
        clusters = comm.get_cluster(dc)
        for cluster in clusters:
            cluster_name = cluster['cluster']
            vms = comm.get_vm_from_each_host(dc, cluster_name)

        # This cluster have only 1 host and 146 guests (test date: 23/10/18)
        self.assertGreaterEqual(len(vms), 146)
