from django.core.management import CommandError, BaseCommand
from cloudform.tickets.models.approvement import Approvement
from django.db import transaction


class Command(BaseCommand):
    help = "Reject all ticket in approvement"

    @transaction.atomic
    def reject_all(self):
        approvements = Approvement.objects.filter(is_approved=None)
        count_ticket = 0
        for approvement in approvements:
            count_ticket += 1
            approvement.reject('reject by system.')
        print(f'reject ({count_ticket}) ticket.')

    def handle(self, *args, **options):
        try:
            self.reject_all()
        except Exception as e:
            raise CommandError(f'can not reject ticket.: {e}')
