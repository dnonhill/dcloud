import logging
import time
import decimal
import json
from django.core.management import BaseCommand
from django.db import transaction
from cloudform.tickets.models.ticket import TicketItem
from cloudform.pricing.models import PriceSetting
from cloudform.pricing.serializers import CalculatePriceSerializer

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Update price details"

    @transaction.atomic
    def update_price(self, ticket_item):
        item = {
            "resource_type": ticket_item.resource_type,
            "specification": ticket_item.specification,
        }
        serializer = CalculatePriceSerializer(data=item)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data

        PriceSetting.update_latest_price_setting()
        price = PriceSetting.calculate_all(item)
        price_detail = PriceSetting.calculate_all_per_item_for_migrate_update(item)

        logger.info(f"update ticket id {ticket_item.ticket.id}")
        logger.info(f"update ticket item id {ticket_item.id}")
        logger.info(f"resource_type {ticket_item.resource_type}")
        ticket_item.estimated_price = price
        ticket_item.price_detail = price_detail
        ticket_item.save()

    def handle(self, *args, **options):
        ticket_items = TicketItem.objects.all()
        for ticket_item in ticket_items:
            try:
                time.sleep(1)
                logger.info("STATR UPDATE PRICE")
                self.update_price(ticket_item)
                print("\n")
            except Exception as e:
                logger.error("ERROR UPDATE PRICE")
                logger.error(f"ticket id {ticket_item.ticket.id}")
                logger.error(f"ticket item id {ticket_item.id}")
                logger.info(f"resource_type {ticket_item.resource_type}")
                print(str(e))
                print("\n")
        logger.info("update price done!!")
