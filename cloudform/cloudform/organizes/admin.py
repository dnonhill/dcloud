from django.contrib import admin

from cloudform.organizes.models import Organize


@admin.register(Organize)
class OrganizeAdmin(admin.ModelAdmin):
    list_display = (
        'tenant_name',
        'address',
    )
