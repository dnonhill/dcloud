import ldap
from django.conf import settings

_AUTH_LDAP_SETTINGS_ATTRS = (
    "AUTH_LDAP_SERVER_URI",
    "AUTH_LDAP_BIND_DN",
    "AUTH_LDAP_BIND_PASSWORD",
    "AUTH_LDAP_USER_SEARCH",
)

if not hasattr(settings, "AUTH_LDAP_ENABLED") or settings.AUTH_LDAP_ENABLED is True:
    for attr in _AUTH_LDAP_SETTINGS_ATTRS:
        assert hasattr(
            settings, attr
        ), f"{attr} must be set in settings module for LDAP configuration"

_auth_attr_map = None
if hasattr(settings, "AUTH_LDAP_USER_ATTR_MAP"):
    if isinstance(settings.AUTH_LDAP_USER_ATTR_MAP, dict):
        _auth_attr_map = {v: k for k, v in settings.AUTH_LDAP_USER_ATTR_MAP.items()}


def search(user, ldap_settings):
    connect = ldap.initialize(ldap_settings.server_uri)
    connect.set_option(ldap.OPT_REFERRALS, 0)
    connect.simple_bind_s(ldap_settings.bind_dn, ldap_settings.bind_password)
    approver_attr_list = list(ldap_settings.user_attr_map.values())

    result = connect.search_s(
        ldap_settings.user_search_base_dn,
        ldap.SCOPE_SUBTREE,
        ldap_settings.approver_search_filter_str % {"user": user},
        approver_attr_list,
    )

    result = process_result(result)
    return result

def search_reviewer(user, ldap_settings):
    connect = ldap.initialize(ldap_settings.server_uri)
    connect.set_option(ldap.OPT_REFERRALS, 0)
    connect.simple_bind_s(ldap_settings.bind_dn, ldap_settings.bind_password)
    reviewer_attr_list = list(ldap_settings.user_attr_map.values())

    result = connect.search_s(
        ldap_settings.user_search_base_dn,
        ldap.SCOPE_SUBTREE,
        ldap_settings.reviewer_search_filter_str % {"user": user},
        reviewer_attr_list,
    )

    result = process_result(result)
    return result


def process_result(result):
    return [
        (user_dn, attributes) for user_dn, attributes in result if user_dn is not None
    ]


def map_attributes(attrs):
    if _auth_attr_map is None:
        return attrs
    else:
        return dict(
            [
                (
                    (_auth_attr_map[k], value_or_array(v))
                    if k in _auth_attr_map
                    else (k, value_or_array(v))
                )
                for k, v in attrs.items()
            ]
        )


def value_or_array(val):
    if hasattr(val, "__len__") and len(val) < 2:
        return val[0]
    return val
