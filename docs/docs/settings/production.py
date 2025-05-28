from .base import *

DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY")

ALLOWED_HOSTS = ['dcloud-uat.pttdigital.com', 'dcloud.pttdigital.com']

try:
    from .local import *
except ImportError:
    pass
