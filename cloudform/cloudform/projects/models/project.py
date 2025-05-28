from django.contrib.auth import get_user_model
from django.db import models

from zouth.audit.models import AuditModel


class Project(AuditModel):
    job_code = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    expired_date = models.DateTimeField()
    go_live_date = models.DateTimeField(null=True)

    owner = models.ForeignKey(
        get_user_model(), on_delete=models.PROTECT, related_name="owned_projects"
    )
    members = models.ManyToManyField(get_user_model(), blank=True, related_name="projects")

    class Meta:
        indexes = [models.Index(fields=["name"])]

    def __str__(self):
        return self.name

    @classmethod
    def of_members(cls, user):
        return cls.objects.filter(members=user)

    def has_member(self, user) -> bool:
        return self.members.filter(pk=user.pk).exists()

    def transfer_owner(self, new_owner):
        current_owner = self.owner
        self.owner = new_owner
        self.save()

        self.members.remove(current_owner)
        self.members.add(new_owner)

    @property
    def can_delete(self):
        return self.active_flag and not self.applications.filter(active_flag=True).exists()

    def delete(self, using=None, keep_parents=False):
        if self.can_delete:
            super().delete(using, keep_parents)


class ProjectChildMixin:
    @classmethod
    def list_by_project(cls, project, pk=None):
        if pk:
            return cls.objects.filter(pk=pk)
        return cls.objects.filter(project=project)

    @classmethod
    def list_by_user_project(cls, user, project, pk=None):
        return cls.list_by_project(project, pk).filter(project__members=user)
