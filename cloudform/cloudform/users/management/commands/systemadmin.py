from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import Group, Permission


class Command(BaseCommand):
    help = "manage system admin group"

    def add_arguments(self, parser):
        parser.add_argument("command", type=str)

    def handle(self, *args, **options):
        command = options.get("command")
        if command == "init":
            self.cmd_init()
        else:
            CommandError("available command is [init]")

    def cmd_init(self):
        operations = ["view", "add", "change", "delete"]
        models = [
            "datacenter",
            "serviceinventory",
            "approver",
            "localuser",
            "remoteuser",
            "pricesetting",
            "formconfig",
            "mailtemplate",
            "tasktemplate",
        ]

        group, _ = Group.objects.get_or_create(id=5000, name="systemadmin")
        permissions = Permission.objects.filter(
            codename__in=[
                f"{operation}_{model}" for model in models for operation in operations
            ]
        )
        print(f"Add permission to group {group}")
        for permission in permissions:
            print(f"+ {permission}")
            group.permissions.add(permission)

        group.save()
        print(f"done.")
