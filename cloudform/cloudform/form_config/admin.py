from django.contrib import admin

from .models import FormConfig


@admin.register(FormConfig)
class FormConfigAdmin(admin.ModelAdmin):
    fieldsets = (
        (
            "Page information",
            {"fields": ("page", "field",)}
        ),
        (
            "Value information",
            {"fields": ("sequence", "value", "display", "extra_fields",)}
        )
    )

    list_display = ("page", "field", "sequence", "value",)
    ordering = ("page", "field", "sequence",)
    list_filter = ("page", "field",)
