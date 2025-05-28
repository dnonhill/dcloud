import functools
import logging

from django.contrib.sites.models import Site
from django.dispatch import receiver
from django.forms.models import model_to_dict
from django.template import Context, Template

from cloudform.tasks.models import Assignment, ticket_assigned, ticket_completed
from cloudform.tickets.models import Approvement, Ticket
from cloudform.tickets.models import (
    ticket_submitted,
    ticket_approved,
    ticket_rejected,
    ticket_next_level_approved,
    approver_approved,
)
from cloudform.users.models import (
    LocalUser,
    local_user_created,
    local_user_reset_password,
)
from .helpers import (
    approvement_approver,
    approvement_ticket,
    ticket_no,
    ticket_url,
    approvement_url,
    assignment_url,
    requestor_full_name,
    requestor_email,
    approvement_reason,
    approver_full_name,
    user_full_name,
    assignment_assignee,
    assignment_assigner,
    assignment_ticket,
    review_reviewer,
    review_ticket,
    review_url,
    review_note,
    reviewer_full_name,
    approvement_by_ticket,
)
from .models import MailTemplate
from .services import send_message as service_send_message
from .settings import SENDER
from cloudform.reviews.models import (
    Review,
    reviewer_ticket_reviewed,
    reviewer_ticket_rejected,
    reviewer_ticket_commented,
    requestor_feedback_applied,
    requestor_waitting_review,
)

from cloudform.inventories.models import (
    InventoryList,
    inventory_notfound_or_error,
)

logger = logging.getLogger(__name__)


def warn_exception(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            func(*args, **kwargs)
        except Exception as err:
            logger.warning(f"{err}")

    return wrapper


def send_message(template, context):
    service_send_message(
        render(template.subject, context),
        SENDER,
        recipient=render(template.recipient, context),
        content=render(template.content, context),
    )


def render(content, context):
    template = Template(content)
    return template.render(Context(context))


def get_approvement_context(instance: Approvement):
    ticket = approvement_ticket(instance)
    approver = approvement_approver(instance)
    next_approver = None
    if instance.get_next_level():
        next_approver = approvement_approver(instance.get_next_level())
    next_approver_full_name = ""
    if next_approver:
        next_approver_full_name = approver_full_name(next_approver)
    print(next_approver_full_name)
    return {
        "approvement_url": approvement_url(instance),
        "ticket_no": ticket_no(ticket),
        "ticket_url": ticket_url(ticket),
        "approver_full_name": approver_full_name(approver),
        "next_approver_full_name": next_approver_full_name,
        "requestor_full_name": requestor_full_name(ticket),
        "approver_email": approver.email,
        "requestor_email": requestor_email(ticket),
        "approvement_reason": approvement_reason(instance),
        "approver": approver,
        "requestor": ticket.created_by,
    }

def get_review_context(instance: Review):
    ticket = review_ticket(instance)
    reviewer = review_reviewer(instance)
    email = ''
    reviewer_full_name_get = ''
    if reviewer:
        email = reviewer.email
        reviewer_full_name_get = reviewer_full_name(reviewer)
    res = {
        "review_url": review_url(instance),
        "ticket_no": ticket_no(ticket),
        "ticket_url": ticket_url(ticket),
        "reviewer_full_name": reviewer_full_name_get,
        "requestor_full_name": requestor_full_name(ticket),
        "reviewer_email": email,
        "requestor_email": requestor_email(ticket),
        "review_note": review_note(instance),
        "reviewer": reviewer,
        "requestor": ticket.created_by,
        "approver_full_name": "",
        "approver_email": "",
    }
    result = set_approvement_context_in_other_contect(ticket, res)

    return result


def set_approvement_context_in_other_contect(ticket: Ticket, res: dict):
    approves = approvement_by_ticket(ticket)
    if len(approves):
        approver_first_level = approves.filter(approver_level=1).first()
        if approver_first_level:
            res['approver_full_name'] = approver_full_name(approver_first_level.approver.user)
            res['approver_email'] = approver_first_level.approver.user.email
            res['approvement_url'] = approvement_url(approver_first_level)
    return res

def get_local_user_context(instance: LocalUser):
    site = Site.objects.get_current()
    token = instance.generate_password_token()
    user_email = instance.username

    return {
        "domain": site.domain,
        "user": model_to_dict(instance, fields=("first_name", "last_name")),
        "user_email": user_email,
        "token": token,
        "activate_url": f"{site.domain}/login/activate-account?token={token}&email={user_email}",
        "reset_password_url": f"{site.domain}/login/reset-password?token={token}&email={user_email}",
    }


def get_assignment_context(instance: Assignment):
    ticket = assignment_ticket(instance)
    assignee = assignment_assignee(instance)
    assigner = assignment_assigner(instance)

    return {
        "ticket_no": ticket_no(ticket),
        "ticket_url": ticket_url(ticket),
        "assignee_full_name": user_full_name(assignee),
        "assigner_full_name": user_full_name(assigner),
        "assignment_url": assignment_url(instance),
        "requestor_full_name": requestor_full_name(ticket),
        "assignee_email": assignee.email,
        "assigner_email": assigner.email,
        "requestor_email": requestor_email(ticket),
        "assignee": assignee,
        "assigner": assigner,
        "requestor": ticket.created_by,
    }

def get_inventory_list_context(instance: InventoryList):
    return {
        "inventory_name": instance.name,
    }

@receiver(inventory_notfound_or_error, sender=InventoryList)
@warn_exception
def inventory_notfound_or_error(sender, instance: InventoryList, **kwargs):
    context = get_inventory_list_context(instance)
    templates = MailTemplate.objects.filter(signal_name="inventory_notfound_or_error")
    for template in templates:
        send_message(template, context)

@receiver(reviewer_ticket_reviewed, sender=Review)
@warn_exception
def reviewer_ticket_reviewed(sender, instance: Review, **kwargs):
    context = get_review_context(instance)
    templates = MailTemplate.objects.filter(signal_name="reviewer_ticket_reviewed")
    for template in templates:
        send_message(template, context)

@receiver(reviewer_ticket_rejected, sender=Review)
@warn_exception
def reviewer_ticket_rejected(sender, instance: Review, **kwargs):
    context = get_review_context(instance)
    templates = MailTemplate.objects.filter(signal_name="reviewer_ticket_rejected")
    for template in templates:
        send_message(template, context)

@receiver(reviewer_ticket_commented, sender=Review)
@warn_exception
def reviewer_ticket_commented(sender, instance: Review, **kwargs):
    context = get_review_context(instance)
    templates = MailTemplate.objects.filter(signal_name="reviewer_ticket_commented")
    for template in templates:
        send_message(template, context)

@receiver(requestor_feedback_applied, sender=Review)
@warn_exception
def requestor_feedback_applied(sender, instance: Review, **kwargs):
    context = get_review_context(instance)
    templates = MailTemplate.objects.filter(signal_name="requestor_feedback_applied")
    for template in templates:
        send_message(template, context)

@receiver(requestor_waitting_review, sender=Review)
@warn_exception
def requestor_waitting_review(sender, instance: Review, **kwargs):
    context = get_review_context(instance)
    templates = MailTemplate.objects.filter(signal_name="requestor_waitting_review")
    for template in templates:
        send_message(template, context)

@receiver(ticket_submitted, sender=Approvement)
@warn_exception
def ticket_submitted(sender, instance: Approvement, **kwargs):
    context = get_approvement_context(instance)
    templates = MailTemplate.objects.filter(signal_name="ticket_submitted")
    for template in templates:
        send_message(template, context)


@receiver(ticket_approved, sender=Approvement)
@warn_exception
def ticket_approved(sender, instance: Approvement, **kwargs):
    context = get_approvement_context(instance)
    templates = MailTemplate.objects.filter(signal_name="ticket_approved")
    for template in templates:
        send_message(template, context)

@receiver(approver_approved, sender=Approvement)
@warn_exception
def approver_approved(sender, instance: Approvement, **kwargs):
    context = get_approvement_context(instance)
    templates = MailTemplate.objects.filter(signal_name="approver_approved")
    for template in templates:
        send_message(template, context)

@receiver(ticket_next_level_approved, sender=Approvement)
@warn_exception
def ticket_next_level_approved(sender, instance: Approvement, **kwargs):
    instance = instance.get_next_level()
    context = get_approvement_context(instance)
    templates = MailTemplate.objects.filter(signal_name="ticket_next_level_approved")
    for template in templates:
        send_message(template, context)


@receiver(ticket_rejected, sender=Approvement)
@warn_exception
def ticket_rejected(sender, instance: Approvement, **kwargs):
    context = get_approvement_context(instance)
    templates = MailTemplate.objects.filter(signal_name="ticket_rejected")
    for template in templates:
        send_message(template, context)


@receiver(ticket_assigned, sender=Assignment)
@warn_exception
def ticket_assigned(sender, instance: Assignment, **kwargs):
    context = get_assignment_context(instance)
    templates = MailTemplate.objects.filter(signal_name="ticket_assigned")
    for template in templates:
        send_message(template, context)


@receiver(ticket_completed, sender=Assignment)
@warn_exception
def ticket_completed(sender, instance: Assignment, **kwargs):
    context = get_assignment_context(instance)
    templates = MailTemplate.objects.filter(signal_name="ticket_completed")
    for template in templates:
        send_message(template, context)


@receiver(local_user_created, sender=LocalUser)
@warn_exception
def mail_activate_account(sender, instance: LocalUser, **kwargs):
    context = get_local_user_context(instance)
    templates = MailTemplate.objects.filter(signal_name="mail_activate_account")
    for template in templates:
        send_message(template, context)


@receiver(local_user_reset_password, sender=LocalUser)
@warn_exception
def mail_reset_password(sender, instance: LocalUser, **kwargs):
    context = get_local_user_context(instance)
    templates = MailTemplate.objects.filter(signal_name="mail_reset_password")
    for template in templates:
        send_message(template, context)


# staled (logic > 24 Hrs) @2019-11-07 review change from 24hrs to 4hrs
