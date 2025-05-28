
# import ssl
# from pyVim.connect import SmartConnect, Disconnect
# from pyVmomi import vim
from datetime import datetime, timedelta
import pytz
from django.core.management.base import BaseCommand, CommandParser
from cloudform.inventories.models import Inventory, InventoryList, PriceDetail


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('-y', '--year', type=int, help='2024')
        parser.add_argument('-m', '--month', type=int, help='7')
        parser.add_argument('-n', '--host', type=str, help='hostname')

    def handle(self, *args, **options):
        year = options['year']
        month = options['month']
        host = options['host']

        # Get start time and end time
        start, end = self.get_time_start_end(year, month)

        # Get total, firs and last inventory
        inv_qs = Inventory.objects.filter(name=host).filter(create_date__range=(start, end)).order_by('create_date')
        print(f"Total inv = {inv_qs.count()}")
        print(f"first inv = id:{inv_qs[0].id}, date:{inv_qs[0].create_date}")
        print(f"last inv = id:{inv_qs[len(inv_qs) - 1].id}, date:{inv_qs[len(inv_qs) - 1].create_date}")

        # Get total price_detail
        total_prd = 0
        for inv in inv_qs:
            total_prd += inv.price_detail.all().count()
        print(f"total prd = {total_prd}")

        # Get first and last price_detail
        qs_tuple = (
            PriceDetail.objects.filter(inventory=inv_qs[0]),
            PriceDetail.objects.filter(inventory=inv_qs[len(inv_qs) - 1])
        )
        for idx, qs in enumerate(qs_tuple):
            if idx == 0:
                position = "first"
            else:
                position = "last"
            print(f"{position} prd")
            for prd in qs:
                print(f"id:{prd.id}, date:{prd.inventory.create_date}")

    def get_time_start_end(self, year, month):
        utc = pytz.utc
        start_time = utc.localize(datetime(year, month, 1, 0, 0, 0))
        if month == 12:  # December case
            end_time = utc.localize(
                datetime(year + 1, 1, 1, 0, 0, 0)) - timedelta(seconds=1)
        else:
            end_time = utc.localize(
                datetime(year, month + 1, 1, 0, 0, 0)) - timedelta(seconds=1)
        return start_time, end_time
