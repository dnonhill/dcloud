import json
from django.core.management.base import BaseCommand, CommandError
from cloudform.inventories.management.libs.datetime import to_utc
from cloudform.inventories.management.libs.inventory import get_inventorylist_by_app, list_inventory_since
from cloudform.inventories.management.libs.vcenter import get_vm_info
from cloudform.inventories.transforms import Inventorytransform


class Command(BaseCommand):
    """
    Command for debug inventory

    Example:
        ./manage.py inventory_ts get vminfo -n TBKC-DAPPS-05
        ./manage.py inventory_ts get vmpower -n TBKC-DAPPS-05
        ./manage.py inventory_ts list inventory -n TBKC-DAPPS-05 --since 2024-07-08
    """

    def add_arguments(self, parser):
        subparsers = parser.add_subparsers(dest='lv1', required=True)
        get_cmd = subparsers.add_parser('get')
        list_cmd = subparsers.add_parser('list')

        #
        # get cmd
        #
        get_subcmd = get_cmd.add_subparsers(dest='lv2', required=True)
        # Get vm info options
        vminfo_parser = get_subcmd.add_parser('vminfo')
        vminfo_parser.add_argument('-n', '--app_name', type=str)
        # Get vm power state options
        vmpower_parser = get_subcmd.add_parser('vmpower')
        vmpower_parser.add_argument('-n', '--app_name', type=str)

        #
        # list cmd
        #
        list_subcmd = list_cmd.add_subparsers(dest='lv2', required=True)
        inventory_parser = list_subcmd.add_parser('inventory')
        inventory_parser.add_argument('-n', '--app_name', type=str)
        inventory_parser.add_argument('--since', type=str, help='2024-05-01')

    def handle(self, *args, **options) -> None:
        lv1 = options.get('lv1')
        lv2 = options.get('lv2')

        if lv1 == 'get':
            if lv2 == 'vminfo':
                self.get_vminfo(options)
            elif lv2 == 'vmpower':
                self.get_vmpower(options)
        elif lv1 == 'list':
            if lv2 == 'inventory':
                self.list_inventory(options)

    def get_vminfo(self, options):
        app_name = options['app_name']
        inventory_list = get_inventorylist_by_app(app_name)
        vm_info = get_vm_info(inventory_list)
        print(vm_info)

    def get_vmpower(self, options):
        app_name = options['app_name']

        results = []
        for app in app_name.split(','):
            inventory_list = get_inventorylist_by_app(app)
            vm_info = get_vm_info(inventory_list)
            specification = Inventorytransform.transform(inventory_list.details, json.loads(vm_info))
            power_state = specification.get("power_state")
            results.append((app, power_state))
            print(results)

    def list_inventory(self, options):
        if not options['app_name']:
            raise CommandError('Please specify option [-n|--app_name]')

        if not options['since']:
            raise CommandError('Please specify option [--since]')

        app_name = options['app_name']
        since = options['since']

        since_date_time = f'{since} 00:00:00'
        queryset = list_inventory_since(app_name, to_utc(since_date_time))
        print(queryset.count())
        for item in queryset:
            print(item.__dict__)
