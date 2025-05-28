from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser, Group as DjangoGroup
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.signals import Signal
from django.core.validators import EmailValidator
from django.db import models

local_user_created = Signal(providing_args=["instance"])
local_user_reset_password = Signal(providing_args=["instance"])


class User(AbstractUser):
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        "username",
        max_length=150,
        unique=False,
        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
        validators=[username_validator],
        error_messages={
            "unique": "A user with that username already exists in the domain.",
        },
    )
    domain = models.CharField(max_length=255, null=True)
    is_local = models.BooleanField(default=False)

    email = models.CharField(max_length=255, validators=[EmailValidator()])
    mobile = models.CharField(max_length=255, null=True, blank=True)
    telephone = models.CharField(max_length=255, null=True, blank=True)

    department = models.CharField(max_length=255, null=True, blank=True)
    organization = models.CharField(max_length=255, null=True, blank=True)
    company = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["username", "domain"], name="unique_username_domain"
            ),
        ]

    def belong_to(self, group: str) -> bool:
        return self.groups.filter(name=group).exists()


class Group:
    REQUESTOR = "requestor"
    CLOUD_ADMIN = "cloudadmin"
    OPERATOR = "operator"
    SYSTEM_ADMIN = "systemadmin"
    REVIEWER = "reviewer"

def is_user_in_op_team(user) -> bool:
    return user.groups.filter(name__in=[Group.CLOUD_ADMIN, Group.OPERATOR]).exists()

def is_user_in_group(user, group: str) -> bool:
    return user.groups.filter(name=group).exists()


class Operator(User):
    class OperatorManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(groups__name=Group.OPERATOR)

    objects = OperatorManager()

    class Meta:
        proxy = True


class CloudAdmin(User):
    class CloudAdminManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(groups__name=Group.CLOUD_ADMIN)

    objects = CloudAdminManager()

    class Meta:
        proxy = True


class Requestor(User):
    class RequestorManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(groups__name=Group.REQUESTOR)

    objects = RequestorManager()

    class Meta:
        proxy = True


class LocalUser(User):
    class Meta:
        proxy = True
        verbose_name = "Non-PTT User"

    class LocalUserManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_local=True)

        @staticmethod
        def normalize_email(email):
            return BaseUserManager.normalize_email(email)

    objects = LocalUserManager()

    def save(self, *args, **kwargs):
        if self.email:
            self.username = self.email

        self.is_local = True
        is_new_user = self.pk is None
        if is_new_user:
            self.set_unusable_password()
        super().save(*args, **kwargs)

        if is_new_user:
            requestor_group = DjangoGroup.objects.filter(name=Group.REQUESTOR).first()
            if requestor_group:
                self.groups.add(requestor_group)

            self.trigger_user_created()

    def generate_password_token(self) -> str:
        return default_token_generator.make_token(self)

    def check_password_token(self, token) -> bool:
        return default_token_generator.check_token(self, token)

    def trigger_reset_password(self):
        local_user_reset_password.send_robust(sender=self.__class__, instance=self)

    def trigger_user_created(self):
        local_user_created.send_robust(sender=self.__class__, instance=self)


class RemoteUser(User):
    class Meta:
        proxy = True
        verbose_name = "PTT User"

    class RemoteUserManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_local=False)

        @staticmethod
        def normalize_email(email):
            return BaseUserManager.normalize_email(email)

    objects = RemoteUserManager()
