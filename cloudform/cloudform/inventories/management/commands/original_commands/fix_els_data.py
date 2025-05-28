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
from django.db.models import Q
import datetime
import pytz
import random
import logging
import time

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Fix all data inventory"

    def handle(self, *args, **options):
        logger.info('start update data')
        self.fix_els_data()
        logger.info('done!!!!')

    def fix_els_data(self):
        inventoryLists = InventoryList.objects.all()
        for inventorylist in inventoryLists:
            inventory = Inventory.objects.filter(
                Q(name=inventorylist.name) &
                Q(create_date__year=2021) &
                Q(create_date__month__gt=5)
            )
            try:
                self._create_inventory_by_day(
                    month=6,
                    start_day=30,
                    end_day=30,
                    inventorylist=inventorylist,
                    inventory=inventory,
                )
                self._create_inventory_by_day(
                    month=7,
                    start_day=1,
                    end_day=31,
                    inventorylist=inventorylist,
                    check_end_day=True,
                    inventory=inventory
                )
            except Exception as a:
                logger.error(str(a))
                logger.error(f'fix_els_data -> Inventory list id {inventorylist.id}')
                logger.error(f'fix_els_data -> Inventory name {inventorylist.name}')

    @transaction.atomic
    def _create_inventory_by_day(self, month, start_day, end_day, inventorylist, inventory, check_end_day=False):
        for day in range(start_day, end_day + 1):
            for hour in range(0, 24):
                date = datetime.datetime(2021, month, day, hour, 0, 0, 0, pytz.UTC)
                inv = inventory.filter(
                    Q(name=inventorylist.name) &
                    Q(create_date__year=2021) &
                    Q(create_date__month=month) &
                    Q(create_date__day=day) &
                    Q(create_date__hour=hour)
                ).first()
                if inv:
                    logger.warn(f'_create_inventory_by_day -> inv Inventory id {inv.id}')
                    logger.warn(f'_create_inventory_by_day -> inv Inventory name {inv.name}')
                    logger.warn(f'_create_inventory_by_day -> skip this data time {date}')
                    logger.warn('\n\n')
                    continue

                if day == end_day and hour >= 17 and check_end_day:
                    logger.warn(f'_create_inventory_by_day -> Inventory id {inv.id}')
                    logger.warn(f'_create_inventory_by_day -> skip this hour {hour}')
                    logger.warn('\n\n')
                    continue
                inventoryLasted = Inventory.objects.filter(name=inventorylist.name).last()
                priceDetailLasted = PriceDetail.objects.filter(inventory=inventoryLasted)
                logger.info(f'_create_inventory_by_day -> Inventory list id {inventorylist.id}')
                logger.info(f'_create_inventory_by_day -> Inventory id {inventoryLasted.id}')
                logger.info(f'_create_inventory_by_day -> Inventory name {inventorylist.name}')
                logger.info(f'_create_inventory_by_day-> migrate date time {date}')
                self.create_inventory(inventoryLasted, date, priceDetailLasted)
                logger.info('\n\n')

    @transaction.atomic
    def create_inventory(self, inventoryLasted, date, priceDetailLasted):
        inventory = Inventory.objects.create(
            project_name=inventoryLasted.project_name,
            name=inventoryLasted.name,
            job_code=inventoryLasted.job_code,
            data_center=inventoryLasted.data_center,
            application_name=inventoryLasted.application_name,
            total_price=inventoryLasted.total_price,
            power_state=inventoryLasted.power_state,
            resource_type=inventoryLasted.resource_type,
            power_state_point=inventoryLasted.power_state_point,
            create_date=date,
        )
        for priceDetail in priceDetailLasted:
            PriceDetail.objects.create(
                inventory=inventory,
                name=priceDetail.name,
                price=priceDetail.price,
                unit=priceDetail.unit,
                category=priceDetail.category,
            )
