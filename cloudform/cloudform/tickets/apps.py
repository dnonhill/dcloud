from django.apps import AppConfig


class RequestsConfig(AppConfig):
    name = "cloudform.tickets"
    verbose_name = "Request and Approvement"

    def ready(self):
        import cloudform.tickets.signals  # noqa: F401
