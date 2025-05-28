from django.db import models

from zouth.audit.models import AuditModel


class ServiceInventory(AuditModel):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255)

    class Meta:
        verbose_name = "service inventory"
        verbose_name_plural = "service inventories"

    def __str__(self):
        return f"{self.name} - {self.description}"
