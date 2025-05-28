###
#
# DEPLOYMENT:
# 1/2: set environment variable DJANGO_SETTING_MODULE=cloudform.settings.ldap_pttdigital
# for start ldap authentication app for pttdigital
# 2/2: insert/update data in table user_domain_userdomain set endpoint to https://{server}/
#
# another ldap server should use config based from .ldap_default
# and override specific setting e.g. AUTH_LDAP_BIND_DN, AUTH_LDAP_BIND_PASSWORD
# and start as separated server/service


from .ldap_default import *  # noqa: F403

AUTH_LDAP_SERVER_URI = "ldap://ldap.pttdigital.corp:389"

AUTH_LDAP_BIND_DN = "cn=svccloudweb,ou=PTT Digital Appl Accounts,dc=pttdigital,dc=corp"
AUTH_LDAP_BIND_PASSWORD = ""

AUTH_LDAP_USER_SEARCH = LDAPSearch(  # noqa: F405
    "DC=pttdigital,DC=corp",
    ldap.SCOPE_SUBTREE,  # noqa: F405
    "(sAMAccountName=%(user)s)",
)

AUTH_LDAP_GROUP_SEARCH = LDAPSearch(  # noqa: F405
    "OU=PTT Digital Security Groups,DC=pttdigital,DC=corp",
    ldap.SCOPE_SUBTREE,  # noqa: F405
    "(objectClass=group)",
)


# DEBUG = True
# LOGGING = {
#     "version": 1,
#     "disable_existing_loggers": False,
#     "handlers": {"console": {"class": "logging.StreamHandler"}},
#     "loggers": {"django_auth_ldap": {"level": "DEBUG", "handlers": ["console"]}},
# }
