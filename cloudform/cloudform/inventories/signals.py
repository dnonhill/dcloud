import logging
from django.dispatch import receiver
from cloudform.inventories.models import (
    InventoryList,
    inventory_notfound_or_error
)

logger = logging.getLogger(__name__)


@receiver(inventory_notfound_or_error, sender=InventoryList)
def log_inventory_notfound_or_error(sender, instance: InventoryList, **kwargs):
    logger.info(f"INVENTORY_NOT_FOUND_OR_REQUEST_ERROR")
    logger.info(f"INVENTORY_RESOURCE {instance.resource_type}")
    logger.info(f"INVENTORY_NAME {instance.name}")
