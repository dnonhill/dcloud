from datetime import datetime, timedelta
from itertools import chain
import logging
from logging.handlers import RotatingFileHandler
import pytz

from django.core.management.base import BaseCommand
from django.db.models import Q

# from cloudform.inventories.management.libs.elasticsearch import new_client, delete_pricedetail_doc, delete_inventory_doc, list_inventory_doc, list_pricedetail_doc
from cloudform.inventories.management.libs.new_esc import NewESC
from cloudform.inventories.management.libs.inventory import price_calculate_with_power_state
from cloudform.inventories.management.libs.sdk_performance_collector import CollectUptimeBetween
from cloudform.inventories.models import (
    Inventory,
    PriceDetail,
    InventoryList,
)


def setup_logger(host):
    logger = logging.getLogger(host)
    logger.setLevel(logging.DEBUG)

    # Create file handler
    file_handler = RotatingFileHandler(
        f'{host}.log', maxBytes=5 * 1024 * 1024, backupCount=2)
    file_handler.setLevel(logging.DEBUG)

    # Create a formatter and set it for the handler
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)

    # Remove any existing handlers to prevent duplicate logs
    if logger.hasHandlers():
        logger.handlers.clear()

    logger.addHandler(file_handler)
    return logger


class Command(BaseCommand):
    # ./manage.py fix -y 2024 -m 7 -p IT -ex "['pds-adfspx-p01']"

    # ./manage.py fix -y 2024 -m 6 -ns "['DCAP-AV-SRV', 'DCAP-Database', 'DCAP-FacilitySRV', 'DCAP-Filesvr1', 'DCAP-Server', 'DCAP-THDCAP01', 'DCAP-THDCAP02', 'DCAP-WSUS', 'ep-as-dev', 'ep-as-prd', 'ep-bw-dev', 'ep-bwp-prd', 'ep-bw-qas', 'ep-bw-sty', 'ep-dc-dev', 'ep-dc-qas', 'ep-di-prd', 'ep-dx-prd', 'ep-ec-app01', 'ep-ec-app02', 'ep-ec-app03', 'ep-ec-app04', 'ep-ec-dev', 'ep-ec-prd', 'ep-ec-qas', 'ep-ec-sty', 'ep-ep-dev', 'ep-ep-prd', 'ep-ep-qas', 'ep-gr-dev', 'ep-gr-prd', 'ep-gr-qas', 'ep-gr-sty', 'ep-hc-prd', 'ep-hc-sty', 'ep-md-dev', 'ep-md-prd', 'ep-md-qas', 'ep-pi-dev', 'ep-pi-prd', 'ep-pi-qas']"

    # ./manage.py fix -y 2024 -m 5 -ns "['DCAP-AV-SRV']"
    # ./manage.py fix -y 2024 -m 5 -ns "['DCAP-Database', 'DCAP-FacilitySRV']"

    def add_arguments(self, parser):
        parser.add_argument(
            '-st', '--start_time', type=str, help='start time in iso format (2024-06-01T00:00+00:00)')
        parser.add_argument(
            '-et', '--end_time', type=str, help='end time in iso format (2024-07-01T00:00+00:00)')
        parser.add_argument('-n', '--host', type=str, help='hostname')
        parser.add_argument('-ns', '--hosts', type=str,
                            help='list of hostname')
        parser.add_argument('-y', '--year', type=int, help='year')
        parser.add_argument('-m', '--month', type=int, help='month')
        parser.add_argument('-p', '--project', type=str, help='project')
        parser.add_argument('-ex', '--except', type=str, help='except')

    def handle(self, *args, **options):
        year = options['year']
        month = options['month']
        project = options['project']
        host = options['host']
        hosts = options['hosts']
        exclude_hosts = options['except']

        # Get start time and end time
        start, end = self.get_time_start_end(year, month)

        # Connect elasticsearch
        esc = NewESC()

        # Get hosts
        if host:
            invl_list = self.get_host(host)
        elif hosts:
            invl_list = self.get_hosts(eval(hosts))
        elif project:
            invl_list = self.get_hosts_from_project(
                project, eval(exclude_hosts))

        for invl in invl_list:
            host = invl.name
            app_name = invl.application
            dc = invl.data_center_ref.name

            self.logger = setup_logger(host)
            esc.set_logger(self.logger)

            self.logger.info(f'host = {host}')
            self.logger.info(f'app_name = {app_name}')
            self.logger.info(f'dc = {dc}')

            # Try go get uptime from vCenter first
            # If host is not found, skip to next host
            current = start
            try:
                uptime = self.get_uptime(host, current)
            except RuntimeError as e:
                self.logger.error(f'{e}')
                self.logger.error(f'host = {host}')
                self.logger.handlers.clear()
                continue

            # Delete documents
            esc.delete_doc('price_details', start, end, dc, app_name, host)
            esc.delete_doc('inventory', start, end, dc, app_name, host)

            # Delete rows
            self.delete_row_new(start, end, host)

            # # Loop delete rows in database
            # current = start
            # while current <= end:
            #     self.delete_row(host, current)
            #     # self.delete_document(esc, host, dc, app_name, current)
            #     self.logger.info('-----------------')
            #     current += timedelta(hours=1)

            # No remaining documents and row
            self.check_remaining(esc, host, dc, app_name, start, end)

            # Loop create
            current = start
            last_day = current.date()
            while current <= end:
                # Fetch uptime every day
                if current.date() != last_day:
                    uptime = self.get_uptime(host, current)
                    last_day = current.date()
                inv = self.re_create(current, uptime, invl)
                self.logger.info(f'Create Inventory = {inv.create_date}')
                self.logger.info('-----------------')
                current += timedelta(hours=1)

    def get_host(self, name):
        is_active, invl = self.is_active(name)
        if is_active is True:
            return [invl]

    def get_hosts(self, names):
        invl_list = []
        for name in names:
            is_active, invl = self.is_active(name)
            if is_active is True:
                invl_list.append(invl)
        return invl_list

    def get_hosts_from_project(self, project, exclude_hosts=None):
        if exclude_hosts:
            invl_qs = InventoryList.objects.filter(
                project=project).exclude(name__in=exclude_hosts)
        else:
            invl_qs = InventoryList.objects.filter(project=project)
        invl_list = []
        for invl in invl_qs:
            is_active = invl.active_flag
            # Host must be active
            if is_active is True:
                invl_list.append(invl)
        self.logger.info(f'Total hosts that will be fix = {len(invl_list)}')
        self.logger.info(f'Total exclude hosts = {len(exclude_hosts)}')
        for host in exclude_hosts:
            self.logger.info(f'Exclude host = {host}')
        for invl in invl_list:
            self.logger.info(f'Include host = {invl.name}')
        return invl_list

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

    def is_active(self, host):
        invl = InventoryList.objects.get(name=host)
        return (invl.active_flag, invl)

    def get_latest(self, host, time):
        """ดึงข้อมูล Inventory และ PriceDetail จากชั่วโมงที่แล้ว
        ถ้าไม่เจอให้ย้อนหลังเพิ่มทีละชั่วโมงจะกว่าจะครบ 24 ชั่วโมง"""
        current = time
        end = time - timedelta(hours=24)
        while current >= end:
            # กำหนด start hour และ end hour
            shr = time
            ehr = time + timedelta(hours=1) - timedelta(seconds=1)

            inv = Inventory.objects.filter(
                Q(name=host) & Q(create_date__range=(shr, ehr)))
            print(f'inv = {inv}')
            print(f'type(inv) = {type(inv)}')
            print(f'bool(inv) = {bool(inv)}')

            # ถ้าหา Inventory ไม่เจอให้ข้ามไปลูปถัดไป
            if inv:
                # ไม่ควรพบ Inventory มากกว่า 1 ใน 1 ชั่วโมง
                if len(inv) > 1:
                    self.logger.error(
                        f"Found more than one inventory in hour {inv}")
                    ValueError(f"Found more than one inventory in hour {inv}")

                # ต้องเจอ Inventory ก่อนถึงหา PriceDetail
                pri = PriceDetail.objects.filter(inventory=inv[0])

                # ถ้าเจอ PriceDetail แล้วให้จบการทำงานโดยการ return ทันที
                if pri is not None:
                    return (inv, pri)

            current -= timedelta(hours=1)
        self.logger.error(
            "Unable to retrieve latest Inventory and PriceDetail")
        ValueError("Unable to retrieve latest Inventory and PriceDetail")

    def get_uptime(self, host, time):
        """
        Get uptime per day

        Example
        If u want to retrive metric at 2024-09-01 start and end will be
        -------
        start = 2024-08-31T23:59:59+00:00
        end = 2024-09-01T23:59:59+00:00
        """
        start = time - timedelta(seconds=1)
        end = time + timedelta(days=1) - timedelta(seconds=1)

        # Retrive uptime metric
        col = CollectUptimeBetween(host, start, end)
        metr = col()

        self.logger.info(f'day = {time.date()}')
        self.logger.info(f'uptime = {metr}')

        return metr

    # def get_current(self, host, time, app_name, dc):
    #     """Get current inventory and price detail"""
    #     shr = time
    #     ehr = time + timedelta(hours=1) - timedelta(seconds=1)
    #     inv = Inventory.objects.filter(
    #         name=host, application_name=app_name, data_center=dc, create_date__range=(shr, ehr))
    #     if inv:
    #         if len(inv) == 1:
    #             pri = PriceDetail.objects.get(inventory=inv)
    #         else:
    #             raise ValueError(
    #                 f'Found more than one Inventory in hour => {inv}, {time}')
    #     else:
    #         self.logger.info(
    #             f'No Inventory and PriceDetail found in hour => {time}')
    #         return (None, None)
    #     return (inv, pri)

    def re_create(self, time, uptime, invl):
        state = 'POWERED_OFF'
        if uptime != []:
            uptime_date_str = uptime[0][0]
            uptime_date = datetime.fromisoformat(
                uptime_date_str.replace("Z", "+00:00")).date()
            current_date = time.date()
            if uptime_date == current_date:
                state = 'POWERED_ON'

        price_detail, power_state = price_calculate_with_power_state(
            invl, state)
        inv = Inventory.create_inventory_with_time(
            invl, price_detail, power_state, time)
        return inv

    def delete_row(self, host, time):
        """Delete Inventory PriceDetail row from database"""
        # Define start hour and end hour
        shr = time
        ehr = time + timedelta(hours=1) - timedelta(seconds=1)
        # Delete rows
        inv_qs = Inventory.objects.filter(
            name=host).filter(create_date__range=(shr, ehr))
        if inv_qs:
            for inv in inv_qs:
                pri_qs = PriceDetail.objects.filter(inventory=inv)
                self.logger.info(f"Delete PriceDetail {pri_qs}")
                pri_qs.delete()
                self.logger.info(f"Delete {inv}")
                inv.delete()

    def delete_row_new(self, start_datetime_utc, end_datetime_utc, host):
        """Delete Inventory PriceDetail row from database"""
        inv_qs = Inventory.objects.filter(name=host).filter(
            create_date__range=(start_datetime_utc, end_datetime_utc))

        # Delete PriceDetail
        total_prd = 0
        if inv_qs:
            for inv in inv_qs:
                total_prd += inv.price_detail.all().count()
        self.logger.info(f"Total Delete PriceDetail {total_prd}")
        if inv_qs:
            for inv in inv_qs:
                inv.price_detail.all().delete()

        # Delete Inventory
        self.logger.info(f"Total Delete Inventory {inv_qs.count()}")
        inv_qs.delete()

    # def delete_document(self, client, host, dc, app_name, time):
    #     """Delete inventory and price_details document from elasticsearch"""
    #     # Define start hour and end hour
    #     shr = time
    #     ehr = time + timedelta(hours=1) - timedelta(seconds=1)
    #     # Delete documents
    #     delete_pricedetail_doc(client, shr, ehr, dc, app_name, host, self.logger)
    #     delete_inventory_doc(client, shr, ehr, dc, app_name, host, self.logger)

    def check_remaining(self, client, host, dc, app_name, start, end):
        """Check remaining Row and Document """
        # Check remaining Inventory and PriceDetail rows
        inv_qs = Inventory.objects.filter(name=host).filter(
            create_date__range=(start, end))
        if inv_qs:
            pri_qs_list = []
            for inv in inv_qs:
                pri_qs = PriceDetail.objects.filter(inventory=inv)
                pri_qs_list.append(pri_qs)
                self.logger.error(f"Inventory = {inv.id}, {inv.create_date.isoformat()}")
                for pri in pri_qs:
                    self.logger.error(f"PriceDeatil = {pri.id}, {pri.name}")
            merged_qs = list(chain(*pri_qs_list))
            raise ValueError(f"Inventory remain {len(inv_qs)}, PriceDetail remain {len(merged_qs)}")

        # Check remaining inventory documents
        # resp = list_inventory_doc(client, start, end, dc, app_name, host)
        resp = client.list_doc("inventory", start, end, dc, app_name, host)
        doc_remain = resp["hits"]["total"]["value"]
        if doc_remain != 0:
            self.logger.error(f"inventory document remain {doc_remain}")
            raise ValueError(f"inventory document remain {doc_remain}")

        # Check remaining price_details documents
        # resp = list_pricedetail_doc(client, start, end, dc, app_name, host)
        resp = client.list_doc("price_details", start, end, dc, app_name, host)
        doc_remain = resp["hits"]["total"]["value"]
        if doc_remain != 0:
            self.logger.error(f"price_details document remain {doc_remain}")
            raise ValueError(f"price_details document remain {doc_remain}")
