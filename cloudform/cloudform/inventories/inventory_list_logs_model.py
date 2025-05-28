import logging
from django.db.models import Q
from django.db import models, transaction
from django.contrib.auth import get_user_model
from django_extensions.db.models import TimeStampedModel
from cloudform.inventories.models import InventoryList
from cloudform.inventories.enums import InventoryListLogsType

User = get_user_model()
logger = logging.getLogger(__name__)


# Create your models here.
class InventoryListLogs(TimeStampedModel):
    source_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    inventory_list_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    before = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    after = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    type = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    modified_by = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    @transaction.atomic
    def create_inventory_logs(self, source, before, after, user, type, inventory_list_id=None):
        logger.info("create_inventory_logs")
        logger.info(f"before -> {before}")
        logger.info(f"after -> {after}")
        logger.info(f"type -> {type}")
        inventory_list = self.__find_inventory(type, before)
        if inventory_list_id:
            inventory_list = inventory_list.filter(id=inventory_list_id)
        source_id = None
        if source:
            source_id = source.id
        if inventory_list:
            for inventory in inventory_list:
                InventoryListLogs.objects.create(
                    source_id=source_id,
                    type=type,
                    before=before,
                    after=after,
                    modified_by=user.username,
                    inventory_list_id=inventory.id
                )
                logger.info(f"inventory id -> {inventory.id}")
                logger.info(f"inventory.update_inventory_list -> {after}")
                inventory.update_inventory_list(name=after, type=type)
        else:
            InventoryListLogs.objects.create(
                source_id=source_id,
                type=type,
                before=before,
                after=after,
                modified_by=user.username,
            )
            logger.info("not found inventory id")
            logger.info(f"inventory.update_inventory_list -> {after}")

    def __find_inventory(self, type, before):
        inventory_list = None
        if type == InventoryListLogsType.APPLICATION.value:
            inventory_list = InventoryList.objects.filter(application=before)
        elif type == InventoryListLogsType.PROJECT.value:
            inventory_list = InventoryList.objects.filter(project=before)
        elif type == InventoryListLogsType.JOB_CDOE.value:
            inventory_list = InventoryList.objects.filter(job_code=before)
        elif type == InventoryListLogsType.NAME.value:
            inventory_list = InventoryList.objects.filter(name=before)
        elif type == InventoryListLogsType.DATA_CENTER.value:
            inventory_list = InventoryList.objects.filter(data_center_ref__id=before)
        elif type == InventoryListLogsType.RESOURCE_TYPE.value:
            inventory_list = InventoryList.objects.filter(resource_type=before)
        return inventory_list

    class Meta:
        verbose_name = "Audit Log Inventory List"
        verbose_name_plural = "Audit Log Inventory List"
