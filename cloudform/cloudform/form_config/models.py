from django.contrib.postgres.fields import JSONField
from django.db import models


class FormConfig(models.Model):
    page = models.CharField(max_length=255)
    field = models.CharField(max_length=255)

    sequence = models.IntegerField()

    value = models.CharField(max_length=255, help_text="Actual value that will be used in script or calculation.")
    display = models.CharField(max_length=255, help_text="Display value that will appear to user.")
    extra_fields = JSONField(default=dict, blank=True, help_text="Side effect when user select this value.")

    class Meta:
        indexes = [
            models.Index(fields=("page",), name="form_config_page_index"),
            models.Index(fields=("page", "field",), name="form_config_page_field_index")
        ]

    def __str__(self):
        return f"${self.page}:${self.field} - ${self.value}"
