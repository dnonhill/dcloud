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
from elasticsearch_dsl import Search
from elasticsearch_dsl import Q
from elasticsearch import Elasticsearch
from django.conf import settings

logger = logging.getLogger(__name__)
client = Elasticsearch(f'{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}')


class Command(BaseCommand):
    help = 'delete elastic search data'
    def handle(self, *args, **options):
        self._delete_range('2021-08-01', '2021-08-10')

    def _delete_inventory_index(self, _start_date, _end_date):
        inventory_index = Search(using=client, index="inventory")
        date_range = Q(
            "range",
            create_date={
                "gte" : _start_date,
                "lte" : _end_date,
            }
        )
        search_query = Q(
            "bool",
            filter=[date_range],
        )

        search = inventory_index.query(search_query)
        return search.delete()

    def _delete_price_details_index(self, _start_date, _end_date):
        price_details_index = Search(using=client, index="price_details")
        date_range = Q(
            "range",
            inventory__create_date={
                "gte" : _start_date,
                "lte" : _end_date,
            }
        )
        search_query = Q(
            "bool",
            filter=[date_range],
        )

        search = price_details_index.query(search_query)
        return search.delete()

    def _delete_range(self, start_date, end_date):
        logger.info(f'delete data from date {start_date} to date {end_date}')
        _start_date = self._get_date_start_date_range(start_date)
        _end_date = self._get_date_end_date_range(end_date)
        inventory_index_delelet_res = self._delete_inventory_index(_start_date, _end_date)
        logger.info('inventory_index_delelet_res')
        logger.info(inventory_index_delelet_res)
        price_detail_delete_response = self._delete_price_details_index(_start_date, _end_date)
        logger.info('price_detail_delete_response')
        logger.info(price_detail_delete_response)
        logger.info('delete inventory_index and price_detail index success!!!')

    def _get_date(self, date_str):
        date = date_str.split('-')
        year = int(date[0])
        month = int(date[1])
        day = int(date[2])
        return year, month, day

    def _get_date_end_date_range(self, end_date):
        year, month, day = self._get_date(end_date)
        return datetime.datetime(year, month, day, 16, 0, 0, 0, pytz.UTC)

    def _get_date_start_date_range(self, start_date):
        year, month, day = self._get_date(start_date)
        if day - 1 == 0:
            last_day_of_month = calendar.monthrange(year, month - 1)[1]
            return datetime.datetime(year, month - 1, last_day_of_month, 17, 0, 0, 0, pytz.UTC)
        return datetime.datetime(year, month, day - 1, 17, 0, 0, 0, pytz.UTC)
