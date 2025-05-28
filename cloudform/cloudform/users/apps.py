from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'cloudform.users'
    verbose_name = "User management"

    def ready(self):
        import cloudform.users.signals  # noqa: F401