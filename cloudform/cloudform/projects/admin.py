from django.contrib import admin
from django import forms

from cloudform.projects.models import ServiceInventory


class ServiceInventoryForm(forms.ModelForm):
    current_user = None

    def clean(self):
        cleaned_data = super().clean()
        if not (self.instance and self.instance.pk):
            cleaned_data["created_by"] = self.current_user

        cleaned_data["updated_by"] = self.current_user

        return cleaned_data

    class Meta:
        model = ServiceInventory
        fields = ("name", "description")


@admin.register(ServiceInventory)
class ServiceInventoryAdmin(admin.ModelAdmin):
    form = ServiceInventoryForm
    list_display = ("name", "description", "active_flag")
    list_filter = ("active_flag",)

    def get_form(self, request, obj=None, change=False, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.current_user = request.user
        return form
