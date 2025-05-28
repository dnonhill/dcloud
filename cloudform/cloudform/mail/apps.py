from django.apps import AppConfig


class MailConfig(AppConfig):
    name = "cloudform.mail"
    app_label = "mail"

    def ready(self):
        import cloudform.mail.signals  # noqa: F401
