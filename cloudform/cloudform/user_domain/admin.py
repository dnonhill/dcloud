from django.contrib import admin
from django import forms

from .models import UserDomain


class UserDomainForm(forms.ModelForm):
    bind_password = forms.CharField(widget=forms.PasswordInput(render_value=True))

    class Meta:
        model = UserDomain
        fields = (
            "name",
            "display_name",
            "server_uri",
            "start_tls",
            "bind_dn",
            "bind_password",
            "user_search_base_dn",
            "user_search_filter_str",
            "group_search_base_dn",
            "group_map",
            "allow_change_ldap_password",
        )


class UserDomainAdmin(admin.ModelAdmin):
    list_display = ("display_name", "name", "server_uri")
    form = UserDomainForm


admin.site.register(UserDomain, UserDomainAdmin)
