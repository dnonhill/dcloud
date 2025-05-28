from django.contrib import admin
from .models import FeatureToggle
# Register your models here.
@admin.register(FeatureToggle)
class FeatureToggleAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'code',
        'enable',
    )
