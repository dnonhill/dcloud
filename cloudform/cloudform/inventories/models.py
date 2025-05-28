import logging
import json
from django.conf import settings
from django.utils import timezone
from django.db import models, transaction
from django.contrib.postgres.fields import (
    ArrayField,
    JSONField,
)
from django.core.serializers.json import DjangoJSONEncoder
from django.forms import ValidationError
from django.core.signals import Signal

from django_celery_beat.models import CrontabSchedule, PeriodicTask

from cloudform.projects.models.resource import RESOURCE_TYPE_VM, RESOURCE_TYPE_OPENSHIFT
from cloudform.form_config.serializer import FormFieldOSSerializer
from cloudform.inventories import tasks
from cloudform.inventories.transforms import Inventorytransform
from cloudform.inventories.error_checks import InventoryErrorCheck
from cloudform.projects.models.data_center import DataCenter
from cloudform.inventories.enums import InventoryListLogsType
from cloudform.tags.models import Tag
import datetime
from django.contrib.postgres.fields import ArrayField

logger = logging.getLogger(__name__)

RESOURCE_CHOICES = [
    (RESOURCE_TYPE_VM, "Virtual machine"),
    (RESOURCE_TYPE_OPENSHIFT, "Openshift project"),
]

inventory_notfound_or_error = Signal(providing_args=["instance"])
# Create your models here.
class Inventory(models.Model):
    project_name = models.CharField(max_length=255)
    data_center = models.CharField(max_length=255)
    application_name = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    job_code = models.CharField(max_length=255)
    total_price = models.DecimalField(decimal_places=6, max_digits=19, null=True)
    power_state = models.CharField(max_length=255, null=True)
    resource_type = models.CharField(max_length=30, choices=RESOURCE_CHOICES, null=True)
    power_state_point = models.IntegerField(null=True)
    tags = ArrayField(models.CharField(max_length=200), blank=True, null=True)
    create_date = models.DateTimeField(default=datetime.datetime.now())

    @transaction.atomic
    def create_inventory(inventory_list, price_detail, power_state):
        power_state_point_off = -1
        power_state_point_on = 1
        power_state_point = power_state_point_off
        if power_state == "POWERED_ON":
            power_state_point = power_state_point_on
        tags = [tag.name for tag in inventory_list.tags.all()]
        inventory = Inventory.objects.create(
            project_name=inventory_list.project,
            name=inventory_list.name,
            job_code=inventory_list.job_code,
            data_center=inventory_list.data_center_ref.name,
            application_name=inventory_list.application,
            total_price=price_detail["price"],
            power_state=power_state,
            resource_type=inventory_list.resource_type,
            power_state_point=power_state_point,
            create_date=datetime.datetime.now(),
            tags=tags
        )
        PriceDetail.create_price_detail(inventory, price_detail["price_detail"])
        return inventory

    @transaction.atomic
    def create_inventory_with_time(inventory_list, price_detail, power_state, create_time):
        power_state_point_off = -1
        power_state_point_on = 1
        power_state_point = power_state_point_off
        if power_state == "POWERED_ON":
            power_state_point = power_state_point_on
        tags = [tag.name for tag in inventory_list.tags.all()]
        inventory = Inventory.objects.create(
            project_name=inventory_list.project,
            name=inventory_list.name,
            job_code=inventory_list.job_code,
            data_center=inventory_list.data_center_ref.name,
            application_name=inventory_list.application,
            total_price=price_detail["price"],
            power_state=power_state,
            resource_type=inventory_list.resource_type,
            power_state_point=power_state_point,
            create_date=create_time,
            tags=tags
        )
        PriceDetail.create_price_detail(inventory, price_detail["price_detail"])
        return inventory

class PriceDetail(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    unit = models.IntegerField()
    price = models.DecimalField(decimal_places=6, max_digits=19, null=True)
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.DO_NOTHING,
        related_name='price_detail'
    )

    @transaction.atomic
    def create_price_detail(inventory: Inventory, price_detail):
        for item in price_detail:
            PriceDetail.objects.create(
                inventory=inventory,
                name=item["name"],
                price=item["price"],
                unit=item["unit"],
                category=item["category"],
            )


class InventoryList(models.Model):
    project = models.CharField(max_length=255, null=True)
    application = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    vm_id = models.CharField(max_length=255, null=True)
    secondary_name = models.CharField(max_length=255, null=True, blank=True)
    resource_type = models.CharField(max_length=30, choices=RESOURCE_CHOICES)
    data_center_ref = models.ForeignKey(
        DataCenter,
        related_name="inventory_list",
        on_delete=models.DO_NOTHING
    )
    job_code = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    active_flag = models.BooleanField(default=True)
    recheck = models.BooleanField(default=False)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    number_of_checking = models.IntegerField(default=0)
    tags = models.ManyToManyField(Tag, null=True, blank=True)
    details = JSONField(default=dict)

    @transaction.atomic
    def update_application_name(self, application):
        self.application = application
        self.save()

    @transaction.atomic
    def update_project_name(self, project):
        self.project = project
        self.save()

    @transaction.atomic
    def update_inventory_list(self, name, type):
        if type == InventoryListLogsType.APPLICATION.value:
            self.application = name
            self.save()
        elif type == InventoryListLogsType.PROJECT.value:
            self.project = name
            self.save()
        elif type == InventoryListLogsType.JOB_CDOE.value:
            self.job_code = name
            self.save()
        elif type == InventoryListLogsType.NAME.value:
            self.name = name
            self.save()
        elif type == InventoryListLogsType.DATA_CENTER.value:
            self.data_center_ref = DataCenter.objects.get(id=name)
            self.save()
        elif type == InventoryListLogsType.RESOURCE_TYPE.value:
            self.resource_type = name
            self.save()

    @transaction.atomic
    def create_billing_periodic_task(self, vm_name, inventory_id, resource_type):
        PeriodicTask.objects.create(
            crontab=InventoryList.get_billing_schedule(),
            name=vm_name,
            task="cloudform.inventories.tasks.update_inventory",
            kwargs=json.dumps(
                {
                    "vm_name": vm_name,
                    "inventory_id": inventory_id,
                    "resource_type": resource_type
                }
            )
        )

    def __str__(self):
        return f'{self.id}: {self.name}'

    @transaction.atomic
    def checking_inventory(self, resource_details):
        logger.info('#---Start function: checking_inventory---#')
        logger.info(f'resource_details: {resource_details}')
        is_error_or_not_found = InventoryErrorCheck\
                .is_not_found_or_request_detail_error(resource_details, self.resource_type)
        if is_error_or_not_found:
            logger.info('is_error_or_not_found')
            self.number_of_checking += 1
            self.recheck = True
            self.save()
            if self.number_of_checking > settings.NUMBER_OF_ERROR:
                inventory_notfound_or_error.send_robust(sender=self.__class__, instance=self)
        elif self.number_of_checking:
            logger.info('elif')
            self.number_of_checking = 0
            self.recheck = False
            self.save()
        logger.info('#---End function: checking_inventory---#')

    @transaction.atomic
    def create_inventory(self, cleaned_data, vm=None):
        vm_id = None
        details = {}
        if vm:
            vm_id = vm['vm']
        if cleaned_data.get('resource_type') == "vm":
            details = json.loads(tasks.get_vm_info(
                vm_id, "vm", data_center_ref=cleaned_data.get('data_center_ref')
            ))
            details = Inventorytransform.transform_vm_info_to_spec(details)
            if not details["protection_level"] or not details["storage_tier"]:
                if not cleaned_data.get("protection_level") or not cleaned_data.get("storage_tier"):
                    self.add_error('protection_level', 'Please select protection level')
                    self.add_error('storage_tier', 'Please select storage tier')
                    raise ValidationError(
                        f'protection_level or storage_tier in vcenter detail is null. Please select protection_level and storage_tier',
                        code='protection_level_storage_tier_invalid'
                    )
                details["protection_level"] = cleaned_data.get("protection_level").value
                details["storage_tier"] = cleaned_data.get("storage_tier").value
            if not details["os_type"]:
                if not cleaned_data.get('os'):
                    self.add_error('os', 'Please select os.')
                    raise ValidationError(
                        f'OS in vcenter detail is null Please select os',
                        code='protection_level_storage_tier_invalid'
                    )
                os = cleaned_data.get('os')
                os = FormFieldOSSerializer(os.extra_fields).data
                details["os_type"] = os["os_type"]
                details["distro"] = os["distro"]
                details["display_os"] = cleaned_data.get('os').display
                if not details["os_disk"]:
                    details["os_disk"] = os["os_disk"]
            if not details["data_disk_1_size"]:
                if cleaned_data.get("data_disk_1"):
                    details["data_disk_1_size"] = cleaned_data.get("data_disk_1")
            if not details["data_disk_2_size"]:
                if cleaned_data.get("data_disk_2"):
                    details["data_disk_2_size"] = cleaned_data.get("data_disk_2")

        elif cleaned_data.get('resource_type') == "container-cluster":
            details = json.loads(tasks.get_vm_info(
                cleaned_data.get('name'),
                "container-cluster",
                data_center_ref=cleaned_data.get('data_center_ref')
            ))
            details = Inventorytransform.transform_openshift_to_spec(details)
        data_center = cleaned_data.get('data_center_ref')
        inventoryList = InventoryList.objects.create(
            project = cleaned_data.get('project'),
            application = cleaned_data.get('application'),
            name = cleaned_data.get('name'),
            secondary_name = cleaned_data.get('secondary_name'),
            resource_type = cleaned_data.get('resource_type'),
            data_center_ref =  data_center,
            job_code = cleaned_data.get('job_code'),
            vm_id = vm_id,
            details = details,
        )
        inventoryList.tags.set(cleaned_data.get('tags'))

        vm_name = inventoryList.name
        if inventoryList.resource_type == "vm":
            vm_name = inventoryList.vm_id

        inventoryList.create_billing_periodic_task(
            vm_name=vm_name,
            inventory_id=inventoryList.id,
            resource_type=inventoryList.resource_type,
        )
        return inventoryList

    def get_billing_schedule():
        hourly_billing_schedule, _ = CrontabSchedule.objects.get_or_create(
            minute="0",
            hour="*",
            day_of_week="*",
            day_of_month="*",
            month_of_year="*"
        )
        return hourly_billing_schedule

    @transaction.atomic
    def update_detail(self, specification):
        self.details = specification
        self.save()

    @transaction.atomic
    def stop_periodic_task(queryset):
        queryset.update(active_flag=False, deactivated_at=timezone.now())
        for inventory_list in queryset:
            inventory_list.enabled_periodic_task(False)

    @transaction.atomic
    def stop_one_periodic_task(self):
        self.active_flag  = False
        self.deactivated_at=timezone.now()
        self.enabled_periodic_task(False)
        self.save()

    @transaction.atomic
    def start_periodic_task(queryset):
        queryset.update(active_flag=True, deactivated_at=None)
        for inventory_list in queryset:
            inventory_list.enabled_periodic_task(True)

    def enabled_periodic_task(self, flag):
        if self.resource_type == RESOURCE_TYPE_VM:
            task = PeriodicTask.objects.get(name=self.vm_id)
            task.enabled = flag
            task.save()
        elif self.resource_type == RESOURCE_TYPE_OPENSHIFT:
            task = PeriodicTask.objects.get(name=self.name)
            task.enabled = flag
            task.save()

# VM
# +--------------+--------------+------+-----+---------+----------------+
# | Field        | Type         | Null | Key | Default | Extra          |
# +--------------+--------------+------+-----+---------+----------------+
# | id           | int(11)      | NO   | PRI | NULL    | auto_increment |
# | serviceId    | bigint(20)   | YES  |     | 0       |                |
# | vmName       | varchar(255) | NO   | MUL | NULL    |                |
# | vm_hw_uuid   | varchar(255) | YES  | UNI | N/A     |                |
# | vmMoRef      | varchar(255) | YES  |     | N/A     |                |
# | vmFolder     | varchar(255) | YES  |     | N/A     |                |
# | naturalKey   | varchar(255) | YES  |     | N/A     |                |
# | tenantName   | varchar(255) | NO   |     | NULL    |                |
# | projectName  | varchar(255) | YES  |     | N/A     |                |
# | businessUnit | varchar(255) | YES  |     | N/A     |                |
# | department   | varchar(255) | YES  |     | N/A     |                |
# | jobCode      | varchar(255) | YES  |     | N/A     |                |
# | approver     | varchar(255) | YES  |     | N/A     |                |
# | owner        | varchar(255) | YES  |     | N/A     |                |
# | creator      | varchar(255) | YES  |     | N/A     |                |
# | createdTime  | datetime     | YES  |     | NULL    |                |
# | deletedTime  | datetime     | YES  |     | NULL    |                |
# | contractName | varchar(255) | YES  |     | N/A     |                |
# | isLatest     | tinyint(1)   | NO   |     | NULL    |                |
# +--------------+--------------+------+-----+---------+----------------+


# OpenShif
# +--------------+--------------+------+-----+---------+----------------+
# | Field        | Type         | Null | Key | Default | Extra          |
# +--------------+--------------+------+-----+---------+----------------+
# | id           | int(11)      | NO   | PRI | NULL    | auto_increment |
# | serviceId    | bigint(20)   | NO   | MUL | NULL    |                |
# | ocpProject   | varchar(255) | NO   |     | NULL    |                |
# | tenantName   | varchar(255) | NO   |     | NULL    |                |
# | projectName  | varchar(255) | YES  |     | NULL    |                |
# | businessUnit | varchar(255) | YES  |     | NULL    |                |
# | department   | varchar(255) | YES  |     | NULL    |                |
# | jobCode      | varchar(255) | YES  |     | NULL    |                |
# | approver     | varchar(255) | YES  |     | NULL    |                |
# | creator      | varchar(255) | YES  |     | NULL    |                |
# | limitCPU     | float        | YES  |     | NULL    |                |
# | limitMemory  | float        | YES  |     | NULL    |                |
# | limitStorage | float        | YES  |     | NULL    |                |
# | sizeSnapshot | float        | YES  |     | NULL    |                |
# | postartDate  | date         | YES  |     | NULL    |                |
# | poendDate    | date         | YES  |     | NULL    |                |
# | createdTime  | datetime     | YES  |     | NULL    |                |
# | deletedTime  | datetime     | YES  |     | NULL    |                |
# | rateCard     | varchar(255) | NO   | MUL | NULL    |                |
# | isLatest     | tinyint(1)   | NO   |     | NULL    |                |
# +--------------+--------------+------+-----+---------+----------------+


# +-----+---------------+--------------+--------------------------------------+---------+----------+----------------------+--------------+----------------------------------+--------------+------------+-----------------------------------------------+-------------------------------+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+---------------------+---------------------+-------------------+----------+
# | id  | serviceId     | vmName       | vm_hw_uuid                           | vmMoRef | vmFolder | naturalKey           | tenantName   | projectName                      | businessUnit | department | jobCode                                       | approver                      | owner                                                                                            | creator                                                                                          | createdTime         | deletedTime         | contractName      | isLatest |
# +-----+---------------+--------------+--------------------------------------+---------+----------+----------------------+--------------+----------------------------------+--------------+------------+-----------------------------------------------+-------------------------------+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+---------------------+---------------------+-------------------+----------+
# |   5 | 1000000000747 | testep001    | N/A                                  | N/A     | N/A      | N/A                  | PTTEP-Tenant | srv_pttep_cloud_service_phase_ii | IFM/O        | IFM        | 901482000326_SRV-PTTEP-Cloud Service Phase II | testepcfmeapprover@pttgrp.com | {owner: {userid: utestepcfmeuser@pttgrp.corp}, group: {description: uCF-PTTEP-Tenant-Approvers}} | {owner: {userid: utestepcfmeuser@pttgrp.corp}, group: {description: uCF-PTTEP-Tenant-Approvers}} | 2019-08-28 17:07:56 | 2019-09-18 15:04:25 | PTTEP-Contract-01 |        0 |
# | 651 |            19 | HQ-APMR-AP82 | 423b354c-a224-6fc3-7f69-9efb9a514c1e | vm-8301 | QAS      | vm-8301:10.224.1.200 | PTTEP-Tenant | SRV PTTEP Cloud Service Phase II | IFM/O        | IFM        | 901482000326_SRV-PTTEP-Cloud Service Phase II | IFM/O                         | IFM/O                                                                                            | IFM/O                                                                                            | 2020-08-21 20:14:29 | NULL                | PTTEP-Contract-01 |        1 |
# +-----+---------------+--------------+--------------------------------------+---------+----------+----------------------+--------------+----------------------------------+--------------+------------+-----------------------------------------------+-------------------------------+--------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------+---------------------+---------------------+-------------------+----------+

# +-----+-----------+-----------------+------------+-----------------+--------------+-----------------+---------+---------------+--------------------------+----------+-------------+--------------+--------------+-------------+------------+---------------------+---------------------+----------------+----------+
# | id  | serviceId | ocpProject      | tenantName | projectName     | businessUnit | department      | jobCode | approver      | creator                  | limitCPU | limitMemory | limitStorage | sizeSnapshot | postartDate | poendDate  | createdTime         | deletedTime         | rateCard       | isLatest |
# +-----+-----------+-----------------+------------+-----------------+--------------+-----------------+---------+---------------+--------------------------+----------+-------------+--------------+--------------+-------------+------------+---------------------+---------------------+----------------+----------+
# | 113 |  90000001 | test-billing-01 | PTT-Tenant | test-billing-01 | IT           | test_department | 0       | test_approver | dcloudtester@pttgrp.corp |        2 |           4 |           20 |            4 | 2020-08-07  | 2020-09-08 | 2020-08-25 13:19:51 | 2020-08-25 13:21:28 | global default |        0 |
# +-----+-----------+-----------------+------------+-----------------+--------------+-----------------+---------+---------------+--------------------------+----------+-------------+--------------+--------------+-------------+------------+---------------------+---------------------+----------------+----------+
