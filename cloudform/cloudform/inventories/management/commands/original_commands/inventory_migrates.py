import json
import logging
from django.db import transaction
from django.core.management import CommandError, BaseCommand
from cloudform.projects.models.resource import (
    Resource,
    RESOURCE_TYPE_VM,
    RESOURCE_TYPE_OPENSHIFT
)
from cloudform.inventories import tasks
from cloudform.inventories.transforms import Inventorytransform
from cloudform.inventories.models import InventoryList
from django_celery_beat.models import PeriodicTask


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Inventory migrates"

    def skip_migrate(self, resource):
        if resource.resource_type == RESOURCE_TYPE_VM:
            return (resource.data_center.endpoint_vm is None) or (resource.data_center.endpoint_vm == "")
        elif resource.resource_type == RESOURCE_TYPE_OPENSHIFT:
            return (resource.data_center.endpoint_openshif is None) or (resource.data_center.endpoint_openshif == "")

    @transaction.atomic
    def migrates_resource(self, resource):
        if resource.resource_type == RESOURCE_TYPE_VM:
            vm_id = tasks.get_vm_id(resource.name, resource.data_center)
            logger.info(f'VM: {vm_id}\r\n')
            if not len(vm_id) or None:
                logger.error(f'\nresource id {resource.id} name {resource.name} not found\r\n')
                return
            if isinstance(vm_id, dict):
                if vm_id.get('messages'):
                    # return resource.id
                    raise ValueError(str(vm_id.get('messages')))
            vm_id = vm_id[0]
            details = json.loads(tasks.get_vm_info(
                vm_id["vm"],
                "vm",
                data_center_ref=resource.data_center
            ))
            if details.get('type'):
                logger.error('resource detail\r\n')
                logger.error(f'\nresource id {resource.id} name {resource.name} not found\r\n')
                return
            details = Inventorytransform.transform_vm_info_to_spec(details)
            details = Inventorytransform.transform(resource.details, details)
            self.create_inventory_and_periodic_task(resource, details, vm=vm_id)
        elif resource.resource_type == RESOURCE_TYPE_OPENSHIFT:
            details = json.loads(tasks.get_vm_info(
                resource.name,
                "container-cluster",
                data_center_ref=resource.data_center
            ))
            if not details["items"]:
                logger.error(f'\nresource id {resource.id} name {resource.name} not found\r\n')
                return
            details = Inventorytransform.transform_openshift_to_spec(details)
            details = Inventorytransform.transform_openshift(resource.details, details)
            self.create_inventory_and_periodic_task(resource, details)

    @transaction.atomic
    def migrates(self):
        resources = Resource.objects.all()
        resource_ids = []
        for resource in resources:
            if self.skip_migrate(resource):
                logger.error(f'skip resource not found url data center')
                logger.error(f'skip resource id {resource.id}')
                logger.error(f'skip resource name {resource.name}')
                logger.error(f'skip resource data center {resource.data_center}')
                continue
            logger.info(f'Resource ID {resource.id}')
            result = self.migrates_resource(resource)
            if result:
                resource_ids.append(resource_ids)
        logger.info(f'resource id not add {resource_ids}')

    def create_inventory_and_periodic_task(self, resources, details, vm=None):
        vm_id = None
        if vm:
            vm_id = vm['vm']
        inventoryList = InventoryList.objects.create(
            project=resources.application.project.name,
            application=resources.application.name,
            name=resources.name,
            secondary_name=resources.secondary_name,
            resource_type=resources.resource_type,
            data_center_ref=resources.data_center,
            job_code=resources.application.project.job_code,
            vm_id=vm_id,
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
        logger.info('migrates inventory done! ')
