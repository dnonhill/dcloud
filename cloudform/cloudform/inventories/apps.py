from django.apps import AppConfig


class InventoriesConfig(AppConfig):
    name = 'cloudform.inventories'

    def ready(self):
        import cloudform.inventories.signals # noqa: F401
