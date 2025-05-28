import ldap3
from django import forms
from django.contrib import messages
from django.contrib.auth.forms import SetPasswordForm
from django.shortcuts import render
from django.views import View
from ldap3.core.exceptions import LDAPException, LDAPConstraintViolationResult
from django.utils.translation import gettext_lazy as _
from captcha.fields import CaptchaField

from cloudform.user_domain.models import UserDomain


class PasswordChangeForm(SetPasswordForm):
    """
    A form that lets a user change their password by entering their old
    password.
    """

    PASSWORD_HELP_TEXT = """
    <ol>
      <li>Not contain the user's account name or parts of the user's full name that exceed two consecutive characters.</li>
      <li>Be at least 8 characters in length.</li>
      <li>Password must different from last 3 passwords (PTT,PTTOR,PTTDIGITAL,PTTGRP) or last 12 passwords(GPSC users).</li>
      <li>Contain characters from 3 of the following 4 categories:
        <ul>
            <li>English uppercase characters (A through Z)</li>
            <li>English lowercase characters (a through z)</li>
            <li>Base 10 digits (0 through 9)</li>
            <li>Non-alphabetic characters (for example, !, $, #, %)</li>
        </ul>
      </li>
      <li>User cannot change the password more than 1 time in a day.</li>
    </ol>
    <br/>
    <b>
    If you change password on PTT DIGITAL domain, The new password will be updated to your PTTGRP(Email Account), PTT and PTTEP domain account too.
    </b>
    """

    error_messages = {
        **SetPasswordForm.error_messages,
        "password_incorrect": "Your old password was entered incorrectly. Please enter it again.",
    }
    username = forms.CharField(
        label="Username",
        strip=False,
        widget=forms.TextInput(attrs={"autofocus": True}),
    )
    old_password = forms.CharField(
        label="Old password", strip=False, widget=forms.PasswordInput(),
    )
    domain = forms.ModelChoiceField(
        queryset=UserDomain.objects.filter(allow_change_ldap_password=True),
        to_field_name="name",
    )
    new_password1 = forms.CharField(
        label=_("New password"),
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
        strip=False,
        help_text=PASSWORD_HELP_TEXT,
    )
    captcha = CaptchaField()

    field_order = [
        "domain",
        "username",
        "old_password",
        "new_password1",
        "new_password2",
    ]

    def clean_old_password(self):
        """
        Validate that the old_password field is correct.
        """
        old_password = self.cleaned_data["old_password"]
        # if not self.user.check_password(old_password):
        #     raise forms.ValidationError(
        #         self.error_messages['password_incorrect'],
        #         code='password_incorrect',
        #     )
        return old_password


def change_ad_password(username, old_password, new_password, settings):
    if not settings.allow_change_ldap_password:
        raise LDAPException("Feature CHANGE_LDAP_PASSWORD was disabled.")

    server = ldap3.Server(settings.server_uri)
    conn = ldap3.Connection(
        server,
        user=settings.bind_dn,
        password=settings.bind_password,
        auto_bind=True,
        raise_exceptions=True,
    )
    conn.start_tls()
    conn.search(
        search_base=settings.user_search_base_dn,
        search_scope=ldap3.SUBTREE,
        search_filter=settings.user_search_filter_str % {"user": username},
    )

    if not conn.entries:
        raise LDAPException("User not found")

    user_dn = conn.response[0]["dn"]
    result = ldap3.extend.microsoft.modifyPassword.ad_modify_password(
        conn, user_dn, new_password, old_password, controls=None
    )
    conn.unbind()
    return result


class ChangeLDAPPasswordView(View):
    FORWARDED_TO = "forwarded__"

    default = {
        "site_header": "PTT Digital Password Manager",
        "site_title": "PTT Digital - Change LDAP Password",
    }

    def get(self, request, *args, **kwargs):
        form = PasswordChangeForm("request.user")

        return render(
            request, "users/change_ldap_password.html", {**self.default, "form": form}
        )

    def post(self, request, *args, **kwargs):
        form = PasswordChangeForm(request.user, request.POST)

        domain = form.data["domain"]
        ldap_settings = UserDomain.objects.get(name=domain)

        if form.is_valid():
            try:
                change_ad_password(
                    form.data["username"],
                    form.data["old_password"],
                    form.data["new_password1"],
                    ldap_settings,
                )
                messages.success(request, "Your password was successfully updated!")

            except LDAPConstraintViolationResult:
                messages.error(
                    request,
                    "The password is refused by AD. "
                    "Either because the password policy (e.g. password is not complex enough), "
                    "either because the user has no rights to change it.",
                )

            except LDAPException as exc:
                messages.error(request, exc)
        else:
            messages.error(request, "Please correct the error below.")

        return render(
            request, "users/change_ldap_password.html", {**self.default, "form": form}
        )
