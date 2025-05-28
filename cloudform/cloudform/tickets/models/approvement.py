from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.signals import Signal
from django.db import models, transaction
from django.utils import timezone

from .approver import Approver
from .ticket import Ticket
from cloudform.projects.models.data_center import DataCenter

ticket_submitted = Signal(providing_args=["instance"])
ticket_approved = Signal(providing_args=["instance"])
ticket_rejected = Signal(providing_args=["instance"])
ticket_next_level_approved = Signal(providing_args=["instance"])
approver_approved = Signal(providing_args=["instance"])


class Approvement(models.Model):
    approver = models.ForeignKey(
        Approver, related_name="approvements", on_delete=models.PROTECT
    )
    ticket = models.ForeignKey(
        Ticket, related_name="approvements", on_delete=models.PROTECT
    )
    reason = models.TextField(null=True)
    is_approved = models.NullBooleanField()
    requested_at = models.DateTimeField(auto_now_add=True, editable=False)
    approved_at = models.DateTimeField(editable=False, null=True)
    approver_level = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=1
    )

    APPROVED = "approved"
    REJECTED = "rejected"

    class Meta:
        get_latest_by = ["requested_at"]

    
    def before_level_is_approve(self):
        if self.approver_level == 1:
            return True
        before = Approvement.objects.filter(ticket=self.ticket).filter(approver_level=self.approver_level-1).first()
        return before.is_approved is True
    
    def get_next_level(self):
        next_level = Approvement.objects.filter(ticket=self.ticket).filter(approver_level=self.approver_level+1).first()
        return next_level
        
    
    @classmethod
    def list_by_approver(cls, approver: Approver):
        return cls.objects.filter(approver=approver)

    @classmethod
    def list_by_ticket(cls, ticket: Ticket):
        return cls.objects.filter(ticket=ticket)

    @classmethod
    def delete_by_ticket(cls, ticket: Ticket):
        current = cls.list_by_ticket(ticket)
        if not len(current):
            return
        current.delete()

    @classmethod
    def create_for_ticket(cls, ticket: Ticket, approver: Approver, data_center: DataCenter):
        level = approver.data_center_levels.get(data_center=data_center)
        new_approvement = cls(ticket=ticket, approver=approver, approver_level=level.level)
        new_approvement.save(suppress=True)

        return new_approvement
    
    @classmethod
    def update_for_ticket(cls, ticket: Ticket):
        current_approvement = cls.list_by_ticket(ticket).first()
        if current_approvement and current_approvement.is_approved is not None:
            raise ValidationError(
                "Cannot update approvement for approved/rejected request."
            )

        current_approvement.requested_at = timezone.now()
        current_approvement.save(update=True)

    @transaction.atomic
    def approve(self, suppress=False):
        if self.is_approved is not None:
            raise ValidationError(
                "Cannot approve approvement for approved/rejected request."
            )

        self.is_approved = True
        self.approved_at = timezone.now()
        is_final_approve = False
        if self.before_level_is_approve() and not self.get_next_level():
            self.ticket.status = self.APPROVED
            is_final_approve = True
        self.ticket.save()

        self.save()

        if not suppress:
            if is_final_approve:
                ticket_approved.send_robust(sender=self.__class__, instance=self)
            else:
                approver_approved.send_robust(sender=self.__class__, instance=self)
                ticket_next_level_approved.send_robust(sender=self.__class__, instance=self)

    @transaction.atomic
    def reject(self, reason: str, suppress=False):
        if self.is_approved is not None:
            raise ValidationError(
                "Cannot reject approvement for approved/rejected request."
            )

        if not reason:
            raise ValidationError("Cannot reject without reason.")

        self.is_approved = False
        self.reason = reason
        self.approved_at = timezone.now()

        self.ticket.status = self.REJECTED
        self.ticket.save()

        self.save()

        if not suppress:
            ticket_rejected.send_robust(sender=self.__class__, instance=self)

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None, suppress=False, update=False
    ):
        submitted = self.pk is None
        super().save(force_insert, force_update, using, update_fields)

    def __str__(self):
        return f"approver: {self.approver}, approved: {self.is_approved}, approved_at: {self.approved_at}"

    def get_absolute_url(self):
        return "/approvements/%i" % self.id
