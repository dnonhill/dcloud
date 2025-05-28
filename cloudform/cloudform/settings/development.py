import os
from .defaults import *  # noqa F401 F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "cloudform",
        "USER": "postgres",
        "PASSWORD": "password",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.mailgun.org"
EMAIL_PORT = "587"
EMAIL_HOST_USER = "postmaster@sandboxfe608d863ef34ad2b6816f3755ce2ebe.mailgun.org"


assert (
    "EMAIL_HOST_PASSWORD" in os.environ
), "EMAIL_HOST_PASSWORD variable environment is required"

EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")


SENMAIL_SENDER = ""
