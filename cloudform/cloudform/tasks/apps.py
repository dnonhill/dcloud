from django.apps import AppConfig


class TasksConfig(AppConfig):
    name = "cloudform.tasks"

    def ready(self):
        import cloudform.tasks.signals  # noqa: F401
