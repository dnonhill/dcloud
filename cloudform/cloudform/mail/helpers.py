from django.contrib.sites.models import Site

from cloudform.tasks.models import Assignment
from cloudform.tickets.models import Ticket, Approvement, Approver
from cloudform.users.models import User
from cloudform.reviews.models import Review, Reviewer


def get_domain_url():
    site = Site.objects.get_current()
    domain = site.domain
    return domain


def approvement_approver(instance):
    return instance.approver.user


def approvement_ticket(instance):
    return instance.ticket

def review_reviewer(instance):
    if instance.reviewer:
        return instance.reviewer.user
    return None

def review_ticket(instance):
    return instance.ticket


def ticket_no(ticket: Ticket):
    return ticket.ticket_no

def approvement_by_ticket(ticket: Ticket):
    return Approvement.objects.filter(ticket=ticket)


def ticket_url(ticket: Ticket):
    site = Site.objects.get_current()
    path = ticket.get_absolute_url()
    return f"http://{site.domain}{path}"


def approvement_url(instance: Approvement):
    site = Site.objects.get_current()
    path = instance.get_absolute_url()
    return f"http://{site.domain}{path}"

def review_url(instance: Review):
    site = Site.objects.get_current()
    path = instance.get_absolute_url()
    return f"http://{site.domain}{path}"


def assignment_url(instance: Assignment):
    site = Site.objects.get_current()
    path = instance.get_absolute_url()
    return f"http://{site.domain}{path}"


def requestor_full_name(ticket: Ticket):
    return ticket.created_by.get_full_name()


def requestor_email(ticket):
    return ticket.created_by.email


def approvement_reason(approvement: Approvement):
    return approvement.reason

def review_note(review: Review):
    return review.note


def approver_full_name(approver: Approver):
    return user_full_name(approver)

def reviewer_full_name(reviewer: Reviewer):
    return user_full_name(reviewer)


def user_full_name(user: User):
    return user.get_full_name()


def assignment_assignee(instance: Assignment):
    return instance.assignee


def assignment_assigner(instance: Assignment):
    return instance.assigner


def assignment_ticket(instance: Assignment):
    return instance.ticket


def assigner_email(instance: Assignment):
    return instance.assigner.email


def assignee_email(instance: Assignment):
    return instance.assignee.email
