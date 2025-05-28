from django.core.management.base import BaseCommand

from cloudform.inventories.management.libs.datetime import to_utc
from cloudform.inventories.management.libs.elasticsearch import create_doc_from_inventory, delete_doc
from cloudform.inventories.management.libs.inventory import get_inventorylist_price_and_power_state, list_inventory_created_between
from cloudform.inventories.management.libs.yaml import read_yaml_param
from cloudform.projects.models.data_center import DataCenter


class Command(BaseCommand):
    """
    Read application list from YAML file and replace elasticsearch documents with latest updated price that calculate from latest VM information that retrieved from vCenter

    Example YAML : ./fix_power_state_example.yaml
    """

    def add_arguments(self, parser):
        parser.add_argument('-f', '--file', type=str, help='Path to YAML file')

    def handle(self, *args, **options):
        yaml_file = options['file']
        param = read_yaml_param(yaml_file)

        start_date = f'{param["date_between"]["start"]} 00:00:00'
        end_date = f'{param["date_between"]["end"]} 23:59:59'
        datacenter = param["datacenter"]
        app_list = param['app_list']

        # Get Datacenter full name
        datacenter = DataCenter.objects.get(name__icontains=datacenter)
        datacenter_name = datacenter.name

        #
        # Delete documents
        #
        for app in app_list:
            # Delete documents in price_detils index.
            delete_doc(to_utc(start_date), to_utc(end_date), datacenter_name, app, 'price_details')

            # Delete documents in inventory index.
            delete_doc(to_utc(start_date), to_utc(end_date), datacenter_name, app, 'inventory')

            print(f'Remove documents for {app}')

        #
        # Create documents
        #
        for app in app_list:
            # Calculate the price
            inventorylist, price_detail, power_state = get_inventorylist_price_and_power_state(app)

            # List of inventory that occur each hour
            inventory_queryset = list_inventory_created_between(
                to_utc(start_date),
                to_utc(end_date),
                datacenter_name,
                app,
            )

            # Create documents for each hour
            for inventory in inventory_queryset:
                create_doc_from_inventory(inventorylist, inventory.create_date, price_detail, power_state)

            print(f'Create documents for {app}')
