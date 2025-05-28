from django.core.exceptions import ValidationError
from django.db import models

from zouth.audit.models import AuditModel
from .project import Project, ProjectChildMixin


def validate_only_active(value):
    if not value.active_flag:
        raise ValidationError(f"Project {value.name} is not active.")


class Application(ProjectChildMixin, AuditModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="applications",
        validators=(validate_only_active,),
    )
    name = models.CharField(max_length=255)
    description = models.TextField(max_length=255)
    supporter_name = models.CharField(max_length=255)
    supporter_email = models.CharField(max_length=255)
    supporter_department = models.CharField(max_length=255, blank=True, default="")
    supporter_organization = models.CharField(max_length=255)
    system_diagram = models.FileField(blank=True)

    @property
    def can_delete(self):
        return not (
            self.resources.filter(active_flag=True).exists()
            or self.tickets.filter(status__in=("created", "approved", "assigned"))
        )

    def delete(self, using=None, keep_parents=False):
        if self.can_delete:
            super().delete(using, keep_parents)

    def __str__(self):
        return self.name
