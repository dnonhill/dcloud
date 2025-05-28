import logging
import json
import time
from django.core.management import CommandError, BaseCommand
from cloudform.tickets.models.approvement import Approvement
from django.db import transaction
from cloudform.tickets.models import TicketItem
from cloudform.form_config.models import FormConfig
from cloudform.pricing.serializers import CalculatePriceSerializer
from cloudform.pricing.models import PriceSetting
from cloudform.projects.models import Resource



logger = logging.getLogger(__name__)

# load data form-config-add-on-service.yaml
# load data category
# load data pring

class Command(BaseCommand):
    help = "Update service add on"

    def handle(self, *args, **options):
        resource_type = 'vm'
        form_configs = FormConfig.objects.filter(field='add_on_service')
        logger.info('pre check...')
        if not len(form_configs):
            logger.error('not fount add on service\n')
            return
        add_on_service = []
        for add_on in form_configs:
            add_on_service.append({
                'display': add_on.display,
                'value': add_on.value,
            })
        logger.info('\nfinding all ticket items resource type vm...')
        ticket_items = TicketItem.objects.filter(resource_type=resource_type)
        for ticket_item in ticket_items:
            try:
                new_specification = {
                    **ticket_item.specification,
                    "add_on_service": add_on_service
                }
                item = {
                    "resource_type": ticket_item.resource_type,
                    "specification": new_specification,
                }

                serializer = CalculatePriceSerializer(data=item)
                serializer.is_valid(raise_exception=True)
                items = serializer.validated_data
                PriceSetting.update_latest_price_setting()
                price_detail = PriceSetting.calculate_all_per_item_for_migrate_update(item)
                self.update_ticket_items_and_resource(ticket_item, new_specification, price_detail, add_on_service)
                time.sleep(0.5)
                print('\n')
            except Exception as e:
                logger.error(f'can not update ticket item id {ticket_item.id}')
                logger.error(str(e))
        logger.info('migrate done!!!!')

    @transaction.atomic
    def update_ticket_items_and_resource(self, ticket_items, new_specification, price_detail, add_on_service):
        ticket_items.specification = new_specification
        ticket_items.price_detail = price_detail
        if ticket_items.resource:
           resource = Resource.objects.get(id=ticket_items.resource_id)
           resource.details = {
               **resource.details,
                "add_on_service": add_on_service
           }
           logger.info(f'update resource id {resource.id}')
           resource.save()
        logger.info(f'update ticket_items id {ticket_items.id}')
        ticket_items.save()
        logger.info('update done')
