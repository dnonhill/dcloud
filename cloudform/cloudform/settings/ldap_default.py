from .defaults import *  # noqa: F403

DEBUG = False

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "rest_framework",
    "corsheaders",
    "cloudform.login",
    "cloudform.users",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    )
}

SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=600)}  # noqa: F405

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "corsheaders.middleware.CorsMiddleware",
]

ROOT_URLCONF = "cloudform.login.urls"

AUTHENTICATION_BACKENDS = (
    "cloudform.users.custom_ldap.MultipleLDAPBackend.CustomLDAPBackend",
    "django.contrib.auth.backends.ModelBackend",
)

# LDAP
AUTH_LDAP_START_TLS = False
AUTH_LDAP_CONNECTION_OPTIONS = {ldap.OPT_REFERRALS: 0}  # noqa: F405

AUTH_LDAP_USER_ATTR_MAP = {
    "first_name": "givenName",
    "last_name": "sn",
    "email": "mail",
    "profile__email": "mail",
    "profile__mobile": "mobile",
    "profile__telephone": "telephone",
    "profile__department": "department",
    "profile__organization": "o",
    "profile__company": "company",
}

AUTH_LDAP_GROUP_TYPE = MappingGroupOfNamesType(  # noqa: F405
    group_map={
        "G-PDS CloudAdmins": "cloudadmin",
        "G-PDS InfraWebRequest CloudAdmin": "cloudadmin",
        "G-PDS CloudWebRequest Admins": "operator",
        "G-PDS InfraWebRequest Operator": "operator",
        "G-PDS CloudWebRequest Users": "requestor",
        "G-PDS InfraWebRequest Requester": "requestor",
    }
)
