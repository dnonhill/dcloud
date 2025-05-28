from django.core.management.base import BaseCommand

from cloudform.inventories.management.libs.datetime import to_utc
from cloudform.inventories.management.libs.elasticsearch import list_inventory_doc, list_pricedetail_doc
from cloudform.projects.models.data_center import DataCenter


class Command(BaseCommand):
    """
    Command for debug elasticsearch

    Example:
        ./manage.py els_ts list -n TBKC-DAPPS-05 -dc ThaiOil -sd 2024-05-01 -ed 2024-05-01
    """

    def add_arguments(self, parser):
        subparsers = parser.add_subparsers(dest='command', required=True)
        command_parser = subparsers.add_parser('list')

        # List
        command_parser.add_argument('-n', '--app_name', type=str, help='Application name or VM name')
        command_parser.add_argument('-dc', '--datacenter', type=str, help='Datacenter name')
        command_parser.add_argument('-sd', '--start_date', type=str, help='Start date: 2024-05-01')
        command_parser.add_argument('-ed', '--end_date', type=str, help='End date: 2024-05-31')

    def handle(self, *args, **options):
        command = options['command']

        if command == 'list':
            self.list(options)

    def list(self, options):
        start_date = f'{options["start_date"]} 00:00:00'
        end_date = f'{options["end_date"]} 23:59:59'
        datacenter = options['datacenter']
        app_name = options['app_name']

        # Get Datacenter full name
        datacenter = DataCenter.objects.get(name__icontains=datacenter)
        datacenter_name = datacenter.name

        #
        # List documents
        #
        print('##################')
        print('# LIST INVENTORY #')
        print('##################')
        list_inventory_doc(to_utc(start_date), to_utc(end_date), datacenter_name, app_name)
        print('---------------')

        print('##################')
        print('LIST PRICE_DETAILS')
        print('##################')
        list_pricedetail_doc(to_utc(start_date), to_utc(end_date), datacenter_name, app_name)
        print('---------------')
