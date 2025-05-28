import json
import time
import csv
import logging
from django.conf import settings
from django.db import transaction
from django.core.management import CommandError, BaseCommand
from cloudform.projects.models.data_center import DataCenter
from cloudform.inventories import tasks
from cloudform.inventories.transforms import Inventorytransform
from cloudform.inventories.models import InventoryList
from django_celery_beat.models import PeriodicTask
from cloudform.projects.models.resource import (
    Resource,
    RESOURCE_TYPE_VM,
    RESOURCE_TYPE_OPENSHIFT
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Migrates inventory mananual"

    def migrates(self):
        url = f'{settings.BASE_DIR}/inventories/vm_list/VmList-to-loadinventory-v1.csv'
        vm_list = []
        with open(url, mode='r', encoding='utf-8-sig') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            line_count = 0
            for raw in csv_reader:
                try:
                    time.sleep(1)
                    if line_count != 0:
                        logger.info(f'START INSERT ROW {line_count}')
                        vm_obj = {
                            'vm_id': raw.get('vm-id'),
                            'vm_name': raw.get('vm-name'),
                            'power_state': raw.get('value/power_state'),
                            'cpu': int(raw.get('value/cpu_count')),
                            'memory': int(raw.get('value/memory_size_MiB')),
                            'date_center': int(raw.get('DatacenterID')),
                            'project_name': raw.get('Project'),
                            'job_code': raw.get('JobCode'),
                            'application': raw.get('Aplication')
                        }
                        logger.info(f'VM ID {vm_obj.get("vm_id")}')
                        logger.info(f'VM name {vm_obj.get("vm_name")}')
                        logger.info(f'VM power state {vm_obj.get("power_state")}')
                        logger.info(f'VM cpu {vm_obj.get("cpu")}')
                        logger.info(f'VM memory {vm_obj.get("memory")}')
                        logger.info(f'VM date_center {vm_obj.get("date_center")}')
                        logger.info(f'VM project_name {vm_obj.get("project_name")}')
                        logger.info(f'VM job_code {vm_obj.get("job_code")}')
                        logger.info(f'VM application {vm_obj.get("application")}')
                        data_center = DataCenter.objects.get(pk=vm_obj.get('date_center'))
                        self.migrates_resource(
                            vm_obj.get('vm_id'),
                            data_center=data_center,
                            resource=vm_obj
                        )
                        vm_list.append(vm_obj)
                    line_count += 1
                except Exception as e:
                    logger.error('ERROR MIGRATE INVENTORY CSV')
                    logger.error(f'CSV ROW {line_count}')
                    logger.error(f'VM NAME {raw.get("vm-id")}')
                    logger.error(f'VM NAME {raw.get("vm-name")}')
                    logger.error(f'ERROR DETAIL {str(e)}')
                    continue
        return vm_list

    @transaction.atomic
    def migrates_resource(self, vm_id, data_center, resource):
        details = json.loads(tasks.get_vm_info(
            vm_id,
            "vm",
            data_center_ref=data_center
        ))
        if details.get('type'):
            logger.error(f'VM ID NOT FOUND {vm_id}')
            return
        details = Inventorytransform.transform_vm_info_to_spec(details)
        self.create_inventory_and_periodic_task(resource, details, vm=vm_id, data_center=data_center)

    def create_inventory_and_periodic_task(
        self,
        resources,
        details,
        data_center,
        vm=None
    ):
        inventoryList = InventoryList.objects.create(
            project=resources.get('project_name'),
            application=resources.get('application'),
            name=resources.get('vm_name'),
            secondary_name=None,
            resource_type=RESOURCE_TYPE_VM,
            data_center_ref=data_center,
            job_code=resources.get('job_code'),
            vm_id=resources.get('vm_id'),
            details=details,
        )

        vm_name = inventoryList.name
        if inventoryList.resource_type == "vm":
            vm_name = inventoryList.vm_id
        periodic_task = PeriodicTask.objects.filter(name=vm_name)
        if len(periodic_task):
            vm_name = f'{vm_name}-copy'
        logger.info(f'periodic_task name {vm_name}')
        inventoryList.create_billing_periodic_task(
            vm_name=vm_name,
            inventory_id=inventoryList.id,
            resource_type=inventoryList.resource_type,
        )

    def handle(self, *args, **options):
       self.migrates()
       logger.info('MIGRATE DONE !!!')
