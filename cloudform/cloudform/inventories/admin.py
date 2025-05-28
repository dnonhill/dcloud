import logging
from django.contrib import admin
from django import forms
from django.db import transaction
from cloudform.inventories.models import InventoryList, RESOURCE_CHOICES
from cloudform.inventories.inventory_list_logs_model import InventoryListLogs
from cloudform.form_config.models import FormConfig
from cloudform.inventories import tasks
from cloudform.projects.models.data_center import DataCenter
from cloudform.inventories.enums import InventoryListLogsType
from cloudform.inventories.inventory_list_logs_model import InventoryListLogs
from cloudform.tags.models import Tag
from cloudform.inventories.models import Inventory

logger = logging.getLogger(__name__)


class InventoryAdminAddForm(forms.ModelForm):
    resource_type = forms.ChoiceField(choices=RESOURCE_CHOICES)
    project = forms.CharField(min_length=5)
    application = forms.CharField(min_length=5)
    name = forms.CharField()
    secondary_name = forms.CharField(required=False)
    data_center_ref = forms.ModelChoiceField(
        queryset=DataCenter.objects.all(),
    )
    job_code = forms.CharField(min_length=10)
    os = forms.ModelChoiceField(
        required=False,
        queryset=FormConfig.objects.filter(field='os'),
    )
    storage_tier = forms.ModelChoiceField(
        required=False,
        queryset=FormConfig.objects.filter(field='storage_tier')
    )
    data_disk_1 = forms.IntegerField(required=False)
    data_disk_2 = forms.IntegerField(required=False)
    protection_level = forms.ModelChoiceField(
        required=False,
        queryset=FormConfig.objects.filter(field='protection_level')
    )
    tags = forms.ModelMultipleChoiceField(
        required=False,
        queryset=Tag.objects.all(),
        widget=forms.CheckboxSelectMultiple,
    )

    @transaction.atomic
    def clean(self):
        super().clean()
        if not self.cleaned_data.get('job_code'):
            logger.error('Invalid form data')
            raise forms.ValidationError(
                "Invalid form data",
                code="inventory_list_job_code_invalid",
            )
        vm = None
        logger.info(f'data: {self.cleaned_data}')
        if self.cleaned_data.get('resource_type') == 'vm':
            vm = tasks.get_vm_id(
                self.cleaned_data.get('name'),
                self.cleaned_data.get('data_center_ref')
            )
            if len(vm) == 0:
                logger.error('vm name not found')
                raise forms.ValidationError(
                    'vm name not found',
                    code="inventory_list_invalid",
                )
            vm = vm[0]
        inventoryList = InventoryList.create_inventory(
            self,
            cleaned_data=self.cleaned_data,
            vm=vm,
        )

        self.instance = inventoryList
        return self.cleaned_data

    class Meta:
        model = InventoryList
        exclude = (
            "project",
            "application",
            "name",
            "secondary_name",
            "resource_type",
            "data_center_ref",
            "job_code",
            "created_at",
            "updated_at",
            "active_flag",
            "deactivated_at",
            "details",
        )


class InventoryAdminChangeForm(forms.ModelForm):
    tags = forms.ModelMultipleChoiceField(
        queryset=Tag.objects.all(),
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )
    class Meta:
        model = InventoryList
        exclude = (
            "created_at",
            "updated_at"
        )


@admin.register(InventoryList)
class InventoryListAdmin(admin.ModelAdmin):
    list_display = (
        "project",
        "application",
        "name",
        "vm_id",
        "resource_type",
        "data_center_ref",
        "job_code",
        "recheck",
        "active_flag",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("vm_id", "number_of_checking", )
    fieldsets = ((None, {"fields": (
        "project",
        "application",
        "name",
        "vm_id",
        "number_of_checking",
        "secondary_name",
        "resource_type",
        "data_center_ref",
        "job_code",
        "active_flag",
        "deactivated_at",
        "details",
        "tags",
    )}),)
    add_fieldsets = ((None, {"fields": (
        "resource_type",
        "project",
        "application",
        "name",
        "secondary_name",
        "data_center_ref",
        "job_code",
        "os",
        "storage_tier",
        "data_disk_1",
        "data_disk_2",
        "protection_level",
        "tags",
    )}),)
    search_fields = (
        "project",
        "application",
        "name",
        "vm_id",
        "resource_type",
        "job_code",
    )

    list_filter = ('active_flag', 'recheck', 'resource_type',)

    form = InventoryAdminChangeForm
    add_form = InventoryAdminAddForm
    actions = ['stop_periodic_task', 'start_periodic_task']

    def save_model(self, request, obj, form, change):
        if change:
            inventory_list = InventoryList.objects.get(id=obj.id)
            list_change = []
            if inventory_list.application != obj.application:
                list_change.append({
                    "type": InventoryListLogsType.APPLICATION.value,
                    "before": inventory_list.application,
                    "after": obj.application
                })
            if inventory_list.project != obj.project:
                list_change.append({
                    "type": InventoryListLogsType.PROJECT.value,
                    "before": inventory_list.project,
                    "after": obj.project
                })
            if inventory_list.job_code != obj.job_code:
                list_change.append({
                    "type": InventoryListLogsType.JOB_CDOE.value,
                    "before": inventory_list.job_code,
                    "after": obj.job_code
                })
            if inventory_list.name != obj.name:
                list_change.append({
                    "type": InventoryListLogsType.NAME.value,
                    "before": inventory_list.name,
                    "after": obj.name
                })
            if inventory_list.data_center_ref != obj.data_center_ref:
                list_change.append({
                    "type": InventoryListLogsType.DATA_CENTER.value,
                    "before": inventory_list.data_center_ref.id,
                    "after": obj.data_center_ref.id
                })
            if inventory_list.resource_type != obj.resource_type:
                list_change.append({
                    "type": InventoryListLogsType.RESOURCE_TYPE.value,
                    "before": inventory_list.resource_type,
                    "after": obj.resource_type
                })
            inventory_logs = InventoryListLogs()
            for item in list_change:
                inventory_logs.create_inventory_logs(
                    None,
                    item["before"],
                    item["after"],
                    request.user,
                    item["type"],
                    inventory_list_id=obj.id
                )
        super(InventoryListAdmin, self).save_model(request, obj, form, change)

    def stop_periodic_task(self, request, queryset):
        InventoryList.stop_periodic_task(queryset)
    stop_periodic_task.short_description = "Stop Periodic Task"

    def start_periodic_task(self, request, queryset):
        InventoryList.start_periodic_task(queryset)
    start_periodic_task.short_description = "Start Periodic Task"

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        defaults = {}
        if obj is None:
            defaults["form"] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)


@admin.register(InventoryListLogs)
class InventoryListLogsAdmin(admin.ModelAdmin):
    list_display = (
        "source_id",
        "inventory_list_id",
        "before",
        "after",
        "type",
        "modified_by",
        "created",
        "modified",
    )
    readonly_fields = (
        "source_id",
        "inventory_list_id",
        "before",
        "after",
        "type",
        "modified_by",
        "created",
        "modified",
    )

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request, obj=None):
        return False


admin.site.register(Inventory)
