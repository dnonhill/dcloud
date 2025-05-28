from django.apps import AppConfig


class CloudformConfig(AppConfig):
    name = "cloudform.projects"

    def ready(self):
        import cloudform.projects.signals  # noqa: F401
