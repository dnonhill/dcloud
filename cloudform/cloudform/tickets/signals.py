import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from zouth.sequence.models import Sequence
from .models import (
    Ticket,
    Approvement,
    ticket_submitted,
    ticket_approved,
    ticket_rejected,
    ticket_next_level_approved,
    approver_approved,
)


@receiver(post_save, sender=Ticket)
def generate_request_no(sender, instance, created, raw, **kwargs):
    if not created or raw:
        return

    name = "Request_request_no"
    prefix = instance.created_at.strftime("%Y")
    running = Sequence.next(name, prefix)
    instance.ticket_no = f"{prefix}{running:06}"
    instance.save()


logger = logging.getLogger(__name__)


@receiver(ticket_submitted, sender=Approvement)
def log_ticket_submitted(sender, instance: Approvement, **kwargs):
    user = instance.ticket.created_by
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"TICKET_CREATED {instance.ticket.ticket_no} by {username}")

@receiver(ticket_approved, sender=Approvement)
def log_ticket_approved(sender, instance: Approvement, **kwargs):
    user = instance.approver.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"TICKET_APPROVED {instance.ticket.ticket_no} by {username}")

@receiver(ticket_next_level_approved, sender=Approvement)
def log_ticket_next_level_approved(sender, instance: Approvement, **kwargs):
    approve_next = instance.get_next_level()
    user = approve_next.approver.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"TICKET_HAVE_NEXT_LEVLE_APPROVE {instance.ticket.ticket_no} by {username}")

@receiver(approver_approved, sender=Approvement)
def log_approver_approved(sender, instance: Approvement, **kwargs):
    user = instance.approver.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"APPROVER APPROVED TICKET NO: {instance.ticket.ticket_no} by {username}")


@receiver(ticket_rejected, sender=Approvement)
def log_ticket_rejected(sender, instance: Approvement, **kwargs):
    user = instance.approver.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"TICKET_REJECTED {instance.ticket.ticket_no} by {username}")
