from datetime import datetime

from django import forms
from django.contrib import admin
from django.utils.safestring import mark_safe
from django.utils.timezone import make_aware

from .models import PriceSetting, PriceSettingHistory

EffectAttributes = [
    ("cpu", "CPU"),
    ("memory", "Memory"),
    ("os_disk", "OS Disk"),
    ("additional_os_disk", "Additional OS Disk"),
    ("data_disk_1_size", "Data disk 1"),
    ("data_disk_2_size", "Data disk 2"),
    ("main_storage", "Disk quota (Openshift project)"),
]


class PriceSettingForm(forms.ModelForm):
    effect_attrs = forms.MultipleChoiceField(
        required=False, widget=forms.CheckboxSelectMultiple, choices=EffectAttributes,
    )

    class Meta:
        model = PriceSetting
        fields = (
            "description",
            "resource_type",
            "matching_attrs",
            "effect_attrs",
            "category",
            "display",
            "effective_date",
            "unit_price",
            "effective",
        )


@admin.register(PriceSetting)
class PriceSettingAdmin(admin.ModelAdmin):
    form = PriceSettingForm

    list_display = ("description", "resource_type", "unit_price", "effect_attrs", "category", "display", "effective",)
    list_filter = ("category", "resource_type",)

    readonly_fields = ('price_setting_history',)

    def price_setting_history(self, instance):
        history = PriceSettingHistory.objects.filter(description=instance.description).order_by('-effective_date')
        data = ''
        data += '<div style="width: 50%; height:120px; border:1px solid #ccc; overflow:auto; padding: 5px;">'
        for his in history:
            data += f'<a href="/api/admin/pricing/pricesettinghistory/{his.id}/change/">Effective Date: {his.effective_date.strftime("%Y-%m-%d %H:%M")} - Price: {his.unit_price}</a><br>'
        data += '</div>'
        return mark_safe(data)

    price_setting_history.short_description = "Unit price history"

    def save_model(self, request, obj, form, change):
        PriceSettingHistory.objects.create(
            description=obj.description,
            resource_type=obj.resource_type,
            matching_attrs=obj.matching_attrs,
            effect_attrs=obj.effect_attrs,
            unit_price=obj.unit_price,
            category=obj.category,
            display=obj.display,
            effective_date=obj.effective_date,
            created_by=request.user
        )

        old_price_setting = PriceSetting.objects.get(pk=obj.id)
        obj.unit_price = old_price_setting.unit_price
        obj.effective_date = old_price_setting.effective_date
        obj.user = request.user

        super().save_model(request, obj, form, change)


class PriceSettingHistoryForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(PriceSettingHistoryForm, self).__init__(*args, **kwargs)

        if kwargs.get('instance', None):
            current_time = make_aware(datetime.now())
            effective_date = kwargs.get('instance').effective_date
            if effective_date < current_time:
                self.fields['description'].disabled = True
                self.fields['resource_type'].disabled = True
                self.fields['matching_attrs'].disabled = True
                self.fields['effect_attrs'].disabled = True
                self.fields['category'].disabled = True
                self.fields['display'].disabled = True
                self.fields['effective_date'].disabled = True
                self.fields['unit_price'].disabled = True

    class Meta:
        model = PriceSettingHistory
        fields = (
            "description",
            "resource_type",
            "matching_attrs",
            "effect_attrs",
            "category",
            "display",
            "effective_date",
            "unit_price",
        )


@admin.register(PriceSettingHistory)
class PriceSettingHistoryAdmin(admin.ModelAdmin):
    form = PriceSettingHistoryForm

    list_display = ("description", "resource_type", "unit_price", "effective_date", "created_by")
    list_filter = ("category", "resource_type",)

    def change_view(self, request, object_id=None, form_url='', extra_context=None):
        template_response = super().change_view(request, object_id, form_url, extra_context)

        current_time = make_aware(datetime.now())
        price_setting_history = PriceSettingHistory.objects.get(pk=object_id)
        if price_setting_history.effective_date < current_time:
            template_response.content = template_response.rendered_content.replace(
                '<div class="submit-row">',
                '<div class="submit-row" style="display: none">')

        return template_response
