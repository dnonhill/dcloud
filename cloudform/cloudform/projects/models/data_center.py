from django.contrib.postgres import fields as psql_fields
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class DataCenterManager(models.Manager):
    use_in_migrations = True

    def get_by_natural_key(self, name):
        return self.get(name=name)


class DataCenter(models.Model):
    name = models.CharField(max_length=255)
    default_job_code = models.CharField(max_length=20, null=True, blank=True)
    tenant = models.CharField(max_length=50, blank=True, default="")
    available_resources = psql_fields.ArrayField(
        base_field=models.CharField(max_length=255),
        verbose_name="Available Resource",
        blank=True,
    )
    username = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="This field use for Billing only"
    )
    password = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="This field use for Billing only"
    )
    endpoint_vm = models.URLField(
        max_length=255,
        null=True,
        blank=True,
        help_text="This field use for Billing only"
    )
    endpoint_openshif = models.URLField(
        max_length=255,
        null=True,
        blank=True,
        help_text="This field use for Billing only"
    )
    token = models.TextField(
        null=True,
        blank=True,
        default=None,
        help_text="This field use for Billing only"
    )

    class Meta:
        verbose_name = "data center"
        verbose_name_plural = "data centers"
        ordering = ["name"]

    objects = DataCenterManager()

    def __str__(self):
        return self.name

    def natural_key(self):
        return (self.name,)


class DataCenterLevel(models.Model):
    data_center = models.ForeignKey(
        DataCenter,
        on_delete=models.CASCADE
    )
    level = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=1
    )

    class Meta:
        unique_together = ('data_center', 'level',)
        ordering = ["data_center",]

    def __str__(self):
        return f'{self.data_center.name} (Level: {str(self.level)})'
