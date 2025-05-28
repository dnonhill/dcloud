import logging

from django.dispatch import receiver

from .models import Assignment, ticket_completed, ticket_assigned

logger = logging.getLogger(__name__)


@receiver(ticket_assigned, sender=Assignment)
def log_ticket_assigned(sender, instance: Assignment, **kwargs):
    assigner = instance.assigner
    assigner_name = assigner.get_full_name() if assigner is not None else "None"

    assignee = instance.assignee
    assignee_name = assignee.get_full_name() if assignee is not None else "None"
    logger.info(
        f"TICKET_ASSIGNED {instance.ticket.ticket_no} to {assignee_name} by {assigner_name}"
    )


@receiver(ticket_completed, sender=Assignment)
def log_ticket_completed(sender, instance: Assignment, **kwargs):
    assignee = instance.assignee
    assignee_name = assignee.get_full_name() if assignee is not None else "None"
    logger.info(
        f"TICKET_COMPLETED {instance.ticket.ticket_no} by {assignee_name}"
    )
