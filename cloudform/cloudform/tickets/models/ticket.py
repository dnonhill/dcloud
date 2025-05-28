from django.contrib.postgres.fields import JSONField
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.forms.models import model_to_dict

from cloudform.pricing.models import PriceSetting
from cloudform.projects.models.application import Application
from cloudform.projects.models.data_center import DataCenter
from cloudform.projects.models.resource import Resource, RESOURCE_TYPE_OPENSHIFT
from zouth.audit.models import AuditModel


class ActiveTicketQuerySet(models.QuerySet):
    ACTIVE_STATUSES = ("created", "approved", "assigned", "commented",  "reviewed", "feedback_applied",)

    def active(self):
        return self.filter(status__in=ActiveTicketQuerySet.ACTIVE_STATUSES)


def validate_only_active(value):
    if not value.active_flag:
        raise ValidationError(f"Application {value.name} is not active.")


class Ticket(AuditModel):
    ticket_no = models.CharField(max_length=255, null=True)
    application = models.ForeignKey(
        Application,
        on_delete=models.PROTECT,
        related_name="tickets",
        validators=(validate_only_active,),
    )
    data_center = models.ForeignKey(
        DataCenter, on_delete=models.PROTECT, related_name="tickets", null=True
    )
    job_code = models.CharField(max_length=255, default="")
    note_from_operator = models.TextField(max_length=1000, null=True, blank=True)

    STATUS_CHOICES = [
        ("created", "Created"),  # waiting for approve
        ("commented", "Commented"), # Reviewer Commented
        ("feedback_applied", "Feedback Applied"),
        ("reviewed", "Reviewed"),
        ("approved", "Approved"),  # wait for review
        ("rejected", "Rejected"),
        ("assigned", "Assigned"),  # work in progress
        ("completed", "Completed"),
    ]
    ALLOWED_TO_MODIFY_STATUSES = ["created", "commented", "feedback_applied",]
    status = models.CharField(max_length=255, choices=STATUS_CHOICES, default="created")
    closed_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, null=True)

    objects = models.Manager()
    actives = ActiveTicketQuerySet.as_manager()

    def close(self, closed_by, note=None):
        self.status = "completed"
        self.closed_by = closed_by
        if note:
            self.note_from_operator = note

        self.save()

    @property
    def is_editable(self):
        return self.status in self.ALLOWED_TO_MODIFY_STATUSES

    @property
    def active_approvement(self):
        return self.approvements

    @property
    def active_reviewing(self):
        return self.reviews

    def __str__(self):
        return f"{self.ticket_no} - {self.status}"

    def get_absolute_url(self):
        return "/tickets/%i" % self.id


class TicketItem(models.Model):
    TICKET_ITEM_ACTION_CREATE = "create"
    TICKET_ITEM_ACTION_UPDATE = "update"
    TICKET_ITEM_ACTION_DELETE = "delete"
    TICKET_ITEM_ACTIONS = (
        TICKET_ITEM_ACTION_CREATE,
        TICKET_ITEM_ACTION_UPDATE,
        TICKET_ITEM_ACTION_DELETE,
    )
    ticket = models.ForeignKey(Ticket, related_name="items", on_delete=models.PROTECT)
    resource = models.ForeignKey(
        Resource, on_delete=models.SET_NULL, related_name="requests", null=True
    )
    resource_type = models.CharField(max_length=255)
    action = models.CharField(
        max_length=255, choices=zip(TICKET_ITEM_ACTIONS, TICKET_ITEM_ACTIONS)
    )
    specification = JSONField(default=dict)
    estimated_price = models.DecimalField(max_digits=19, decimal_places=6, null=True)
    price_detail = JSONField(default=list)

    def __init__(self, *args, **kwargs):
        PriceSetting.update_latest_price_setting()
        kwargs.update(estimated_price=PriceSetting.calculate_all(kwargs))
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"{self.action} {self.resource_type}"

    @property
    def variables(self):
        """
        Ticket item variables in dict format
        :return: Dict of ticket item variables
        """
        return {
            "resource_type": self.resource_type,
            "action": self.action,
            "ticket": self._variables_ticket(),
            "approver": self._variables_approver(),
            "requestor": self._variables_requestor(),
            "request": self._variables_request(),
            "resource": self._variables_resource(),
        }

    def _variables_resource(self):
        return model_to_dict(self.resource) if self.resource else {}

    def _variables_request(self):
        return {
            "specification": {
                **self.specification,
                **self._variables_openshift(),
                **self._variables_primary_member(),
            }
        }

    def _variables_ticket(self):
        return {
            "job_code": self.ticket.job_code,
            "data_center": self._variables_data_center(),
            "requestor": self._variables_requestor(),
            "project": self._variables_project(),
            "application": self._variables_application(),
        }

    def _variables_data_center(self):
        return (
            model_to_dict(self.ticket.data_center, fields=("name", "tenant"))
            if self.ticket.data_center
            else {}
        )

    def _variables_project(self):
        return model_to_dict(
            self.ticket.application.project,
            fields=("name", "expired_date", "go_live_date", "job_code"),
        )

    def _variables_application(self):
        return model_to_dict(
            self.ticket.application,
            fields=("name", "supporter_name", "supporter_email", "supporter_department"),
        )

    def _variables_approver(self):
        approvement = (
            self.ticket.approvements.filter(is_approved=True).first()
            if hasattr(self.ticket, "approvements")
            else None
        )
        if approvement is None:
            return {}
        user = approvement.approver.user
        return {"name": user.get_full_name()}

    def _variables_primary_member(self):
        members = self.specification.get("members", None)
        join_with = ","
        requestor = join_with.join(members) if members else None
        return {"requestor": self._userdomain(requestor)}

    def _variables_requestor(self):
        requestor = self.ticket.created_by
        if requestor:
            return {
                "full_name": requestor.get_full_name(),
                "name": requestor.get_full_name(),
                "email": requestor.email,
            }
        return {"full_name": "", "name": "", "email": ""}

    def _variables_openshift(self):
        if (
            self.action == TicketItem.TICKET_ITEM_ACTION_CREATE
            and self.resource_type == RESOURCE_TYPE_OPENSHIFT
        ):
            return {"mqserviceid": self.id + 1_000_000}
        return {}

    def _userdomain(self, account):
        return f"{account}" if account else ""
