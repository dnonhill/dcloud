import logging

from django.core.management import BaseCommand
from django.core.exceptions import ObjectDoesNotExist

from cloudform.inventories.models import InventoryList
from cloudform.inventories import tasks

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Collect billing immediately"

    def get_inventory_list(self, vm_name):
        """
        Query inventory_list instance from vm_name.
        """
        logger.info(f'Get {vm_name} instance from Model: InventoryList')
        obj = None
        try:
            obj = InventoryList.objects.get(name=vm_name)
        except ObjectDoesNotExist:
            logger.error(f'Not found {vm_name} in Model: InventoryList')
        return obj

    def add_arguments(self, parser):
        parser.add_argument("-n", "--vm_name", type=str, help="Virtual machine name")

    def handle(self, *args, **options):
        # Take vm_name
        if options["vm_name"]:
            arg_vm_name = options["vm_name"]

        inventory_list = self.get_inventory_list(arg_vm_name)
        if inventory_list is None:
            return

        tasks.update_inventory(inventory_list.vm_id, inventory_list.id, 'vm')
