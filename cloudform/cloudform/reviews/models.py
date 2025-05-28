from django.core.exceptions import ValidationError
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.utils import timezone

from cloudform.projects.models.data_center import DataCenter
from cloudform.tickets.models import Ticket
from django.db.models import Q
from cloudform.tickets.models.approvement import Approvement
from django.core.signals import Signal


User = get_user_model()
reviewer_ticket_reviewed = Signal(providing_args=["instance"])
reviewer_ticket_rejected = Signal(providing_args=["instance"])
reviewer_ticket_commented = Signal(providing_args=["instance"])
requestor_feedback_applied = Signal(providing_args=["instance"])
requestor_waitting_review = Signal(providing_args=["instance"])

def is_user_in_reviewer_team(user) -> bool:
    return Reviewer.objects.filter(user=user).exists()

class IsReviewerCanReadOnly(IsAuthenticated):
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            return False

        return request.method in SAFE_METHODS and self._is_review_team(request)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

    def _is_review_team(self, request):
        current_user = request.user
        return Reviewer.objects.filter(user=current_user).exists()

class Reviewer(models.Model):
    user = models.OneToOneField(
        User,
        related_name="reviewer",
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.user.username


class Review(models.Model):
    reviewer = models.ForeignKey(
        Reviewer,
        related_name="reviews",
        null=True,
        blank=True,
        on_delete=models.PROTECT
    )
    ticket = models.ForeignKey(
        Ticket,
        related_name="reviews",
        on_delete=models.PROTECT
    )
    note = models.TextField(null=True)
    is_reviewed = models.BooleanField(default=False)
    is_reject = models.BooleanField(null=True, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True, editable=False)
    reviewed_at = models.DateTimeField(editable=False, null=True)

    COMMENTED = "commented"
    FEEDBACK_APPLIED = "feedback_applied"
    REVIEWED = "reviewed"
    REJECTED = "rejected"


    class Meta:
        get_latest_by = ["requested_at"]

    @classmethod
    def create_for_ticket(cls, ticket: Ticket):
        feedback_applied = False
        if ticket.status == 'commented':
            ticket.status = cls.FEEDBACK_APPLIED
            feedback_applied = True
            ticket.save()
        currnet_review = cls.objects.filter(Q(ticket=ticket) & Q(reviewed_at=None))
        if not len(currnet_review):
            new_reviewer = cls(
                ticket=ticket,
                is_reviewed=False,
            )
            new_reviewer.save(suppress=True, feedback_applied=feedback_applied)

            return new_reviewer
        currnet_review.requested_at = timezone.now()
        return currnet_review

    @transaction.atomic
    def approve(self, reviewer: Reviewer, suppress=False):
        if self.is_reviewed is not False:
            raise ValidationError(
                "Cannot approve reviewe for approved/rejected request."
            )

        self.reviewer = reviewer
        self.is_reviewed = True
        self.reviewed_at = timezone.now()

        self.ticket.status = self.REVIEWED
        self.ticket.save()
        Approvement.update_for_ticket(self.ticket)

        self.save()

        if not suppress:
            reviewer_ticket_reviewed.send_robust(sender=self.__class__, instance=self)

    @transaction.atomic
    def reject(self, reviewer: Reviewer, note: str, suppress=False):
        if self.is_reviewed is not False and self.is_reject is not True:
            raise ValidationError(
                "Cannot reject review for approved/rejected request."
            )

        if not note:
            raise ValidationError("Cannot reject without note.")

        self.reviewer = reviewer
        self.is_reject = True
        self.note = note
        self.reviewed_at = timezone.now()

        self.ticket.status = self.REJECTED
        self.ticket.save()

        self.save()

        if not suppress:
            reviewer_ticket_rejected.send_robust(sender=self.__class__, instance=self)

    @transaction.atomic
    def commented(self, reviewer: Reviewer, note: str, suppress=False):
        if self.is_reviewed is True or self.is_reject is True:
            raise ValidationError(
                "Cannot commented review for approved/rejected request."
            )
        if not note:
            raise ValidationError("Cannot comment without note.")

        self.reviewer = reviewer
        self.note = note
        self.reviewed_at = timezone.now()

        self.ticket.status = self.COMMENTED
        self.ticket.save()

        self.save()

        if not suppress:
            reviewer_ticket_commented.send_robust(sender=self.__class__, instance=self)

    @transaction.atomic
    def roll_back_status(self):
        self.is_reviewed = False
        self.reviewed_at = None
        self.reviewer_id = None
        self.ticket.status = "created"
        self.ticket.save()
        self.save()

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None, suppress=False, feedback_applied=False,
    ):
        submitted = self.pk is None
        super().save(force_insert, force_update, using, update_fields)

        if submitted:
            if suppress:
                if feedback_applied:
                    requestor_feedback_applied.send_robust(sender=self.__class__, instance=self)
                else:
                    requestor_waitting_review.send_robust(sender=self.__class__, instance=self)

    def get_absolute_url(self):
        return "/reviews/%i" % self.id


class ReviewProxy(Review):
    class Meta:
        proxy = True
        verbose_name = "Roll back reviewed"
        verbose_name_plural = "Roll back reviewed"

    class RemoteReviewProxyManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(Q(ticket__status="reviewed") & Q(is_reviewed=True))

    objects = RemoteReviewProxyManager()
