from django.db import models
from django.contrib.postgres import fields as psql_fields
from fernet_fields import EncryptedCharField


def default_group_map():
    return {
        "G-PDS InfraWebRequest SysAdmin": "systemadmin",
        "G-PDS InfraWebRequest CloudAdmin": "cloudadmin",
        "G-PDS InfraWebRequest Operator": "operator",
        "G-PDS InfraWebRequest Requester": "requestor",
    }


def default_mirror_groups_except():
    return ["approver", "reviewer",]


def default_user_attr_map():
    return {
        "username": "sAMAccountName",
        "first_name": "givenName",
        "last_name": "sn",
        "email": "mail",
        "mobile": "mobile",
        "telephone": "telephone",
        "department": "department",
        "organization": "o",
        "company": "company",
    }


def default_flags_by_group():
    return {
        "is_staff": "CN=G-PDS InfraWebRequest SysAdmin,OU=Web Request form,OU=Other Accounts,DC=pttdigital,DC=corp"
    }


class UserDomain(models.Model):
    name = models.CharField(max_length=255)
    endpoint = models.URLField()

    display_name = models.CharField(max_length=255, blank=True)
    server_uri = models.CharField(max_length=255)
    start_tls = models.BooleanField()

    bind_dn = models.CharField(max_length=255)
    bind_password = EncryptedCharField(max_length=255, blank=True)

    user_search_base_dn = models.CharField(max_length=255)
    user_search_filter_str = models.CharField(
        max_length=255, verbose_name="User search filter"
    )

    allow_change_ldap_password = models.BooleanField()

    group_search_base_dn = models.CharField(
        max_length=255, default="DC=pttdigital,DC=corp"
    )

    group_map = psql_fields.JSONField(default=default_group_map)

    # below is not allow to change in admin ui

    group_search_filter_str = models.CharField(
        max_length=255,
        verbose_name="Group search filter",
        default="(objectClass=group)",
    )

    default_group = models.CharField(max_length=255, default="unknown")

    mirror_groups_except = psql_fields.ArrayField(
        base_field=models.CharField(max_length=255),
        default=default_mirror_groups_except,
    )

    user_attr_map = psql_fields.JSONField(default=default_user_attr_map)

    flags_by_group = psql_fields.JSONField(default=default_flags_by_group)

    approver_search_filter_str = models.CharField(
        max_length=255, default="(mail=%(user)s)"
    )
    
    reviewer_search_filter_str = models.CharField(
        max_length=255, default="(mail=%(user)s)"
    )

    def __str__(self):
        return self.display_name
