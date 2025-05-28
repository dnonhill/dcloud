import logging
from django.dispatch import receiver
from .models import (
    Review,
    reviewer_ticket_reviewed,
    reviewer_ticket_rejected,
    reviewer_ticket_commented,
    requestor_feedback_applied,
    requestor_waitting_review,
)

logger = logging.getLogger(__name__)
    

@receiver(reviewer_ticket_reviewed, sender=Review)
def log_reviewer_ticket_reviewed(sender, instance: Review, **kwargs):
    user = instance.reviewer.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"REVIEWER_REVIEWED_TICKET {instance.ticket.ticket_no} by {username}")


@receiver(reviewer_ticket_rejected, sender=Review)
def log_reviewer_ticket_rejected(sender, instance: Review, **kwargs):
    user = instance.reviewer.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"REVIEWER_REJECTED_TICKET {instance.ticket.ticket_no} by {username}")


@receiver(reviewer_ticket_commented, sender=Review)
def log_reviewer_ticket_commented(sender, instance: Review, **kwargs):
    user = instance.reviewer.user
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"REVIEWER_COMMENTED_TICKET {instance.ticket.ticket_no} by {username}")


@receiver(requestor_feedback_applied, sender=Review)
def log_reviewer_ticket_feedback_applied(sender, instance: Review, **kwargs):
    user = instance.ticket.created_by
    username = user.get_full_name() if user is not None else "None"
    logger.info(f"REQUESTOR_FEEDBACK_APPLIED_TICKET {instance.ticket.ticket_no} by {username}")
    

@receiver(requestor_waitting_review, sender=Review)
def log_reviewer_ticket__waitting_review(sender, instance: Review, **kwargs):
    logger.info(f"REQUESTOR_WAITTING_REVIEW_TICKET {instance.ticket.ticket_no} by reviewer")