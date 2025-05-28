from django.db import models


class Organize(models.Model):
    tenant_name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
