from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth import get_user_model
from django.db import models

from cloudform.projects.models.data_center import DataCenterLevel


User = get_user_model()


class Approver(models.Model):
    user = models.OneToOneField(User, related_name="approver", on_delete=models.CASCADE)
    data_center_levels = models.ManyToManyField(
        DataCenterLevel,
        verbose_name="data_center_levels",
        blank=True,
        related_name="approver_set",
        related_query_name="approver",
    )

    def __str__(self):
        return self.user.username

    class PTTApproverManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset()

    objects = PTTApproverManager()

class NonPTTApprove(Approver):
    class Meta:
        proxy = True
        verbose_name = "Non-PTT Approver"

    class NonPTTApproverManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset()

        @staticmethod
        def normalize_email(email):
            return BaseUserManager.normalize_email(email)

    objects = NonPTTApproverManager()
