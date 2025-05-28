# flake8: noqa
from .defaults import *  # noqa: F401 F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "cloudform",
        "USER": "postgres",
        "PASSWORD": "password",
        "HOST": os.environ.get("POSTGRES_HOST", "postgres"),
        "PORT": "5432",
    }
}

SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(hours=6)}

# ldap
AUTH_LDAP_SERVER_URI = "ldap://localhost:389"

AUTH_LDAP_START_TLS = True

AUTH_LDAP_BIND_DN = "uid=admin,ou=system"

AUTH_LDAP_BIND_PASSWORD = "secret"

AUTH_LDAP_USER_SEARCH = LDAPSearch(
    "ou=Users, dc=example, dc=com",
    ldap.SCOPE_SUBTREE,  # pylint: disable=no-member
    "(mail=%(user)s)",
    ["memberOf", "mail", "givenName", "sn", "cn"],
)

AUTH_LDAP_GROUP_SEARCH = LDAPSearch(
    "ou=Groups,dc=example,dc=com",
    ldap.SCOPE_SUBTREE,  # pylint: disable=no-member
    "(objectClass=groupOfNames)",
)

# This will not change member of group AUTH_LDAP_MIRROR_GROUPS_EXCEPT in django app
AUTH_LDAP_MIRROR_GROUPS_EXCEPT = ("approver",)

AUTH_LDAP_GROUP_TYPE = MappingGroupOfNamesType(
    group_map={"approver": "approver", "owner": "requestor", "reviewer": "reviewer",}
)

AUTH_LDAP_USER_ATTR_MAP = {
    "first_name": "givenName",
    "last_name": "sn",
    "email": "mail",
    # "profile__company", "company",
    # "profile__department", "department",
    # "profile__mobile", "mobile",
    # "profile__telephone", "telephone",
    # "profile__organization", "o",
}

AUTHENTICATION_BACKENDS = (
    # "django_auth_ldap.backend.LDAPBackend",
    "django.contrib.auth.backends.ModelBackend",
)

AUTHENTICATION_SERVER = {
    "external": "http://localhost:8000/api/token/",
    "ptt": "http://localhost:8000/api/token/",
    "pttdigital": "http://localhost:8000/api/token/",
    "pttgrp": "http://localhost:8000/api/token/",
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    # "loggers": {"django.db.backends": {"level": "DEBUG", "handlers": ["console"]}},
}
