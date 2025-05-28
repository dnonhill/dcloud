from django.core.management import CommandError, BaseCommand
from cloudform.inventories.models import (
    Inventory,
    PriceDetail,
    InventoryList,
)
from cloudform.inventories.documents import (
    InventoryDocument,
    PriceDetailDocument,
)
from django.db import transaction
import datetime
import pytz
import random
import logging
import time
from cloudform.pricing.serializers import CalculatePriceSerializer
from cloudform.pricing.models import PriceSetting
from cloudform.inventories.transforms import Inventorytransform
import calendar

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fix all data direct elastic search'

    def fix_els_data(self):
        logger.info('start get all inventory list...')
        inventory_lists = InventoryList.objects.all()
        logger.info(f'number of inventory list is {len(inventory_lists)}')
        time.sleep(1)
        for inventory_list in inventory_lists:
            try:
                # one month
                self._create_inventory_by_day(
                    year=2021,
                    month=8,
                    start_day=1,
                    end_day=10,
                    inventory_list=inventory_list,
                    check_end_day=True,
                )
                # two month
                # if migrate more than one month
                # flag check_end_day is set equal True last called function _create_inventory_by_day
                # self._create_inventory_by_day(
                #     year=2021,
                #     month=8,
                #     start_day=1,
                #     end_day=31,
                #     inventory_list=inventory_list,
                # )
                # self._create_inventory_by_day(
                #     year=2021,
                #     month=9,
                #     start_day=1,
                #     end_day=10,
                #     inventory_list=inventory_list,
                #     check_end_day=True, ####
                # )
            except Exception as a:
                logger.error(str(a))
                logger.error(f'fix_els_data -> Inventory list id {inventory_list.id}')
                logger.error(f'fix_els_data -> Inventory name {inventory_list.name}')

    def handle(self, *args, **options):
        logger.info('start update data')
        self.fix_els_data()
        logger.info('done!!!!')

    @transaction.atomic
    def _create_inventory_by_day(self, year ,month, start_day, end_day, inventory_list, check_end_day=False):
        price_detail, power_state = self.price_calculate(inventory_list)
        for day in range(start_day, end_day + 1):
            if day == start_day:
                for hour in range(17, 24):
                    # first day of month ?
                    if day - 1 == 0:
                        # หาวันสุดท้ายของเดือนที่แล้ว ?
                        last_day_of_month = calendar.monthrange(year, month - 1)[1]
                        date = datetime.datetime(year, month - 1, last_day_of_month, hour, 0, 0, 0, pytz.UTC)
                        logger.info(f'_create_inventory_by_day -> Inventory list id {inventory_list.id}')
                        logger.info(f'_create_inventory_by_day -> Inventory name {inventory_list.name}')
                        logger.info(f'_create_inventory_by_day -> migrate date time {date}')
                        self._create_elastic_data(inventory_list, date, price_detail, power_state)
                        print('\n')
                        continue
                    date = datetime.datetime(year, month, day - 1, hour, 0, 0, 0, pytz.UTC)
                    self._create_elastic_data(inventory_list, date, price_detail, power_state)
                    print('\n')
                for hour in range(0, 24):
                    if day == end_day and hour >= 17 and check_end_day:
                        logger.warn(f'_create_inventory_by_day -> Inventory id {inventory_list.id}')
                        logger.warn(f'_create_inventory_by_day -> skip this hour {hour}')
                        print('\n\n')
                        continue
                    date = datetime.datetime(year, month, day, hour, 0, 0, 0, pytz.UTC)
                    logger.info(f'_create_inventory_by_day -> Inventory list id {inventory_list.id}')
                    logger.info(f'_create_inventory_by_day -> Inventory name {inventory_list.name}')
                    logger.info(f'_create_inventory_by_day -> migrate date time {date}')
                    self._create_elastic_data(inventory_list, date, price_detail, power_state)
                    print('\n')
                continue
            for hour in range(0, 24):
                if day == end_day and hour >= 17 and check_end_day:
                    logger.warn(f'_create_inventory_by_day -> Inventory id {inventory_list.id}')
                    logger.warn(f'_create_inventory_by_day -> skip this hour {hour}')
                    print('\n\n')
                    continue
                date = datetime.datetime(year, month, day, hour, 0, 0, 0, pytz.UTC)
                logger.info(f'_create_inventory_by_day -> Inventory list id {inventory_list.id}')
                logger.info(f'_create_inventory_by_day -> Inventory name {inventory_list.name}')
                logger.info(f'_create_inventory_by_day -> migrate date time {date}')
                self._create_elastic_data(inventory_list, date, price_detail, power_state)
                print('\n')

    @transaction.atomic
    def _create_elastic_data(self, inventory_list, date, price_detail, power_state):
        power_state_point_off = -1
        power_state_point_on = 1
        power_state_point = power_state_point_off
        if power_state == "POWERED_ON":
            power_state_point = power_state_point_on

        inventory = Inventory()
        inventory.project_name=inventory_list.project
        inventory.name=inventory_list.name
        inventory.job_code=inventory_list.job_code
        inventory.data_center=inventory_list.data_center_ref.name
        inventory.application_name=inventory_list.application
        inventory.total_price=price_detail["price"]
        inventory.power_state=inventory_list.details["power_state"]
        inventory.resource_type=inventory_list.resource_type
        inventory.power_state_point=power_state_point
        inventory.create_date=date

        InventoryDocument().update(inventory)
        for item in price_detail["price_detail"]:
            price_detail = PriceDetail()
            price_detail.price=item["price"]
            price_detail.name=item["name"]
            price_detail.category=item["category"]
            price_detail.inventory=inventory
            PriceDetailDocument().update(price_detail)

    def price_calculate(self, inventory_list):
        resource_detail = {}
        specification = inventory_list.details
        power_state = None

        if inventory_list.resource_type == "vm":
            specification = Inventorytransform.transform(specification, resource_detail)
            power_state = specification.get("power_state")
        elif inventory_list.resource_type == "container-cluster":
            specification = Inventorytransform.transform_openshift(specification, resource_detail)
            power_state = "POWERED_ON"

        item = {
            "resource_type": inventory_list.resource_type,
            "specification": specification,
        }

        serializer = CalculatePriceSerializer(data=item)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data
        PriceSetting.update_latest_price_setting()
        price_detail = PriceSetting.calculate_all_per_item_in_same(items, power_state)
        price = PriceSetting.calculate_all_with_power_state(items, power_state)

        return {
            "price": price,
            "price_detail": price_detail
        }, power_state
