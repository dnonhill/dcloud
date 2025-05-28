import logging

import ldap
from django_auth_ldap.backend import LDAPBackend, LDAPSettings
from django_auth_ldap.config import LDAPSearch, LDAPGroupQuery

from cloudform.user_domain.models import UserDomain
from cloudform.users.auth_ldap import MappingGroupOfNamesType


class CustomLDAPBackend(LDAPBackend):
    _domain = "pttdigital"  # set default domain to pttdigital for dcloud admin
    logger = logging.getLogger(__name__)

    @property
    def settings(self):
        if self._settings is None:
            self._settings = LDAPModelSetting(self._domain)

        return self._settings

    def authenticate(self, request, username=None, password=None, **kwargs):
        if hasattr(request, "data"):
            self._domain = request.data.get("domain")

        if not self._domain:
            return

        return super().authenticate(request, username, password, **kwargs)

    def get_or_build_user(self, username, ldap_user):
        domain = self._domain
        model = self.get_user_model()

        if self.settings.USER_QUERY_FIELD:
            query_field = self.settings.USER_QUERY_FIELD
            query_value = ldap_user.attrs[self.settings.USER_ATTR_MAP[query_field]][0]
            lookup = query_field
        else:
            query_field = model.USERNAME_FIELD
            query_value = username.lower()
            lookup = "{}__iexact".format(query_field)

        try:
            user = model.objects.get(**{lookup: query_value, "domain": domain})
        except model.DoesNotExist:
            user = model(**{query_field: query_value, "domain": domain})
            built = True
        else:
            built = False

        return user, built


def uppercase_dict(d):
    return {k.upper(): v for k, v in d.items()}


class LDAPModelSetting(LDAPSettings):
    logger = logging.getLogger(__name__)
    extra_settings = [
        "id",
        "name",
        "display_name",
        "user_search_base_dn",
        "user_search_filter_str",
        "group_search_base_dn",
        "group_search_filter_str",
        "group_map",
        "default_group",
        "flags_by_group",
        "approver_search_filter_str",
        "reviewer_search_filter_str",
    ]

    def __init__(self, domain_name, defaults=None):
        defaults = {} if defaults is None else defaults

        defaults = dict(self.defaults, **defaults)
        self.logger.debug(f"domain_name={domain_name}")
        try:
            ldap_settings = UserDomain.objects.get(name=domain_name)
        except UserDomain.DoesNotExist:
            return

        self.logger.debug(f"ldap_settings={ldap_settings}")

        for name, default in defaults.items():
            value = getattr(ldap_settings, name.lower(), default)
            setattr(self, name, value)
            self.logger.debug(f"SETTING {name} = {value} || {default}")

        self.CONNECTION_OPTIONS.update({ldap.OPT_REFERRALS: 0})  # noqa: F405

        attr_list = list(self.USER_ATTR_MAP.values())

        self.USER_SEARCH = LDAPSearch(
            ldap_settings.user_search_base_dn,
            ldap.SCOPE_SUBTREE,  # pylint: disable=no-member
            ldap_settings.user_search_filter_str,
            attr_list,
        )

        self.GROUP_SEARCH = LDAPSearch(
            ldap_settings.group_search_base_dn,
            ldap.SCOPE_SUBTREE,  # pylint: disable=no-member
            ldap_settings.group_search_filter_str,
        )

        self.GROUP_TYPE = MappingGroupOfNamesType(group_map=ldap_settings.group_map)

        if ldap_settings.flags_by_group:
            self.USER_FLAGS_BY_GROUP = {
                flag_name: LDAPGroupQuery(ldap_group_dn)
                for flag_name, ldap_group_dn in ldap_settings.flags_by_group.items()
            }
