from django.db import models
from cloudform.projects.models import Resource
from cloudform.projects.models.service_inventory import ServiceInventory
from zouth.audit.models import AuditModel


class AppRelation(AuditModel):
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True)
    service_inventory = models.ForeignKey(
        ServiceInventory, on_delete=models.SET_NULL, null=True
    )
    relation = models.CharField(max_length=255)  # inbound, outbound
    description = models.CharField(max_length=255)
