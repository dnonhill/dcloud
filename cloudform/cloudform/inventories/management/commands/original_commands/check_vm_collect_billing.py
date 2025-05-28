import json
import logging
from django.core.management import CommandError, BaseCommand
from cloudform.inventories.v_center import VCenterManagement
from cloudform.projects.models.data_center import DataCenter
from cloudform.inventories.models import InventoryList
logger = logging.getLogger(__name__)
import time

class Command(BaseCommand):
    help = "Check billing"

    def get_cluster(self, data_center):
        logger.info('get cluster ...')
        vm_service = VCenterManagement()
        url = "{}/api/vcenter/cluster".format(
           data_center.endpoint_vm
        )
        vm_info = vm_service.v_center_service(
            data_center,
            url
        )
        # debug
        print(f"get_cluster vm_info => {vm_info.__dict__}")
        if vm_info.status_code != 200:
            logger.error('get cluster error')
            raise Exception('get cluster error')

        # debug
        print(f"get_cluster => {vm_info.json()}")

        return vm_info.json()

    def get_vm(self, data_center, clusters):
        logger.info('get cluster ...')
        vm_service = VCenterManagement()
        vms = []
        for cluster in clusters:
            cluster_name = cluster['cluster']
            # debug
            print(f"cluster_name => {cluster_name}")
            try:
                logger.info(f'get vm at cluster {cluster["cluster"]}')
                url = "{}/api/vcenter/vm?clusters={}".format(
                    data_center.endpoint_vm,
                    cluster_name
                )
                vm_info = vm_service.v_center_service(
                    data_center,
                    url
                )
                # debug
                print(f"vm_info.status_code = {vm_info.status_code}")

                if vm_info.status_code == 200:
                    # debug
                    print(f"get_vm => {vm_info.json()}")
                    return vm_info.json()
                else:
                    resp = vm_info.json()
                    if resp['type'] == 'com.vmware.vapi.std.errors.unable_to_allocate_resource':
                        vms = []
                        vms += self.get_vm_from_each_host(data_center, cluster_name)
                        # debug
                        print(f"get_vm => {vms}")
                        return vms
            except Exception as e:
                logger.error(f'get vm at cluster {cluster["cluster"]}')
                logger.error(e)
                continue

    def get_vm_from_each_host(self, data_center, cluster_name):
        hosts = self.get_host(data_center)
        vms = []
        for host in hosts:
            hostname = host["host"]
            logger.info(f'get vm at cluster {cluster_name} and host {hostname}')
            url = "{}/api/vcenter/vm?clusters={}&hosts={}".format(
                data_center.endpoint_vm,
                cluster_name,
                hostname,
            )
            vm_service = VCenterManagement()
            vm_info = vm_service.v_center_service(
                data_center,
                url,
            )
            vms += vm_info.json()
        return vms

    def get_host(self, data_center):
        vm_service = VCenterManagement()
        url = "{}/api/vcenter/host".format(
           data_center.endpoint_vm
        )
        vm_info = vm_service.v_center_service(
            data_center,
            url
        )
        if vm_info.status_code != 200:
            logger.error('get host error')
            raise Exception('get host error')
        return vm_info.json()

    def add_arguments(self, parser):
        parser.add_argument("-e", "--endpoint", type=str, help="vCenter endpoint URL")

    def handle(self, *args, **options):
        logger.info('Start command check vm')

        if options["endpoint"]:
            arg_endpoint_url = options["endpoint"]
        #data_center = DataCenter.objects.exclude(endpoint_vm=None).first()
        data_center = DataCenter.objects.get(endpoint_vm=arg_endpoint_url)
        # debug
        print(f"datacenter => {data_center.__dict__}")
        clusters = self.get_cluster(data_center)
        vms = self.get_vm(data_center, clusters)
        logger.info(f'Number of vm {len(vms)}')
        include, exclude = self.check_vm_has_included_with_billing(vms)
        # logger.info('---------------------------------------------------\n')
        # logger.info('---------included collect billing data-------------\n')
        # logger.info('---------------------------------------------------\n')
        # logger.info(include)
        logger.info('---------------------------------------------------\n')
        logger.info('-------------exclude collect billing data----------\n')
        logger.info(exclude)
        logger.info('---------------------------------------------------\n')
        logger.info(len(exclude))
        logger.info('done!!!!')

    def check_vm_has_included_with_billing(self, vms):
        vm_invetory = InventoryList.objects.filter(resource_type="vm")
        include = []
        exclude = []
        logger.info(vm_invetory)
        for vm in vms:
            is_have_this_vm = vm_invetory.filter(vm_id=vm['vm']).first()
            if is_have_this_vm is not None:
                include.append(vm)
                continue
            exclude.append(vm)
        return include, exclude
