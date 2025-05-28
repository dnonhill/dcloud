from django import forms
from django.contrib import admin
from django.contrib.auth.base_user import BaseUserManager
from django.core.exceptions import ValidationError

from .models import LocalUser, RemoteUser


class LocalUserAdminForm(forms.ModelForm):
    class Meta:
        model = LocalUser
        fields = (
            "email",
            "first_name",
            "last_name",
            "telephone",
            "mobile",
            "department",
            "organization",
            "company",
        )
        extra_kwargs = {"company": {"required": True}}

    def clean_email(self):
        email = self.cleaned_data["email"]
        email = BaseUserManager.normalize_email(email)

        if LocalUser.objects.filter(email=email).exists():
            raise ValidationError("Duplicate email address", code="invalid")

        return email


@admin.register(LocalUser)
class LocalUserAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {"fields": ("email",)}),
        (
            "Personal Info",
            {"fields": ("first_name", "last_name", "telephone", "mobile")},
        ),
        ("Organization", {"fields": ("department", "organization", "company")}),
    )

    form = LocalUserAdminForm

    list_display = ("email", "company", "is_active")
    ordering = ("company",)
    search_fields = ("email__istartswith",)
    actions = ("block_accounts", "unblock_accounts")

    def has_delete_permission(self, request, obj=None):
        return False

    def get_readonly_fields(self, request, obj=None):
        return ("email",) if obj else ()

    def block_accounts(self, request, queryset):
        row_update = queryset.update(is_active=False)
        if row_update == 1:
            message_bit = "One account was"
        else:
            message_bit = f"{row_update} accounts was"
        self.message_user(request, f"{message_bit} successfully blocked.")

    block_accounts.description = "Block accounts"

    def unblock_accounts(self, request, queryset):
        row_update = queryset.update(is_active=True)
        if row_update == 1:
            message_bit = "One account was"
        else:
            message_bit = f"{row_update} accounts was"
        self.message_user(request, f"{message_bit} successfully unblocked.")

    unblock_accounts.description = "Unblock accounts"


@admin.register(RemoteUser)
class RemoteUserAdmin(admin.ModelAdmin):
    list_display = ("username", "domain", "first_name", "last_name", "is_active", "is_staff")
    list_filter = ("domain",)
    ordering = ("domain", "username")

    search_fields = ("username__istartswith",)
    actions = ("block_accounts", "unblock_accounts", "promote_staff", "demote_staff")

    fieldsets = (
        ("User account", {"fields": ("username", "groups", "last_login")}),
        ("User Info", {"fields": ("first_name", "last_name", "email")}),
        ("Organization", {"fields": ("department", "organization", "company")}),
    )

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def block_accounts(self, request, queryset):
        row_update = queryset.update(is_active=False)
        message_bit = self._get_message_bit(row_update)
        self.message_user(request, f"{message_bit} successfully blocked.")

    block_accounts.short_description = "Block accounts"

    def unblock_accounts(self, request, queryset):
        row_update = queryset.update(is_active=True)
        message_bit = self._get_message_bit(row_update)
        self.message_user(request, f"{message_bit} successfully unblocked.")

    unblock_accounts.short_description = "Unblock accounts"

    def promote_staff(self, request, queryset):
        row_update = queryset.update(is_staff=True)
        message_bit = self._get_message_bit(row_update)
        self.message_user(request, f"{message_bit} successfully promote as staff.")

    promote_staff.short_description = "Promote as admin"

    def demote_staff(self, request, queryset):
        row_update = queryset.update(is_staff=False)
        message_bit = self._get_message_bit(row_update)
        self.message_user(request, f"{message_bit} successfully demote as staff.")

    demote_staff.short_description = "Demote from admin"

    @staticmethod
    def _get_message_bit(count):
        if count == 1:
            return "One account was"
        return f"{count} accounts was"