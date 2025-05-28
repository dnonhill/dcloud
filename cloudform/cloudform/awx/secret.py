from django.conf import settings

HOOK_SECRET_HTTP_HEADER = "X-DCLOUD-HOOK-SECRET".lower()


class UnauthorizedSecretToken(ValueError):
    pass


class InvalidSecretToken(ValueError):
    pass


def validate_awx_secret(challenge):
    awx_secret = getattr(settings, "AWX_API_HOOK_SECRET", None)
    if awx_secret and not challenge:
        raise UnauthorizedSecretToken("Unauthorized request")
    if awx_secret and awx_secret != challenge:
        raise InvalidSecretToken("Invalid Secret")
