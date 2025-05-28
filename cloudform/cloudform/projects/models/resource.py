from django.contrib.postgres.fields import JSONField
from django.db import models
from django.utils import timezone

from .application import Application
from .data_center import DataCenter


class Resource(models.Model):
    application = models.ForeignKey(
        Application, related_name="resources", on_delete=models.PROTECT
    )

    name = models.CharField(max_length=255)
    secondary_name = models.CharField(max_length=255, null=True)

    resource_type = models.CharField(max_length=30)
    data_center = models.ForeignKey(
        DataCenter, related_name="resources", on_delete=models.PROTECT, null=True
    )
    job_code = models.CharField(max_length=255, default="")

    # TODO These fields are resemble to AuditModel fields, except that
    #  it contains no auditor information (created_by, updated_by)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    active_flag = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True)

    details = JSONField(default=dict)

    def delete(self, using=None, keep_parents=False):
        if self.active_flag:
            self.active_flag = False
            self.deactivated_at = timezone.now()
            self.save()

    def __str__(self):
        return self.name


RESOURCE_TYPE_VM = "vm"
RESOURCE_TYPE_OPENSHIFT = "container-cluster"
RESOURCE_TYPE_sOTHER = "other"

# Resource type constants
# Exclude "other" because other is service request, not resource request.
RESOURCE_TYPES = [RESOURCE_TYPE_VM, RESOURCE_TYPE_OPENSHIFT]
