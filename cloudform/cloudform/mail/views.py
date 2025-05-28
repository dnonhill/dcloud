import datetime
from typing import List

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import HttpRequest
from rest_framework.response import Response

from cloudform import awx
from cloudform.tasks.models import Assignment
from .models import MailMessage, MailTemplate
from .services import send_bulk_messages
from .settings import SENDER
from .signals import render, get_assignment_context


@api_view(["POST"])
@permission_classes([])
def alert_overdue_ticket(request: HttpRequest) -> Response:
    error_res = _validate_secret_header(request)
    if error_res:
        return error_res
    overdue_assignments = _check_overdue_assignments()
    mail_messages = _perform_overdue_alerts(overdue_assignments)
    affected_rows = _stamp_overdue_alerts(overdue_assignments)
    if len(mail_messages) > 0 and affected_rows > 0:
        return Response(status=status.HTTP_202_ACCEPTED)
    return Response(status=status.HTTP_204_NO_CONTENT)


def _perform_overdue_alerts(overdue_assignments: List[Assignment]) -> List[MailMessage]:
    subjects = []
    recipients = []
    template_contexts = []
    contents = []

    templates = MailTemplate.objects.filter(signal_name="overdue")

    for assignment in overdue_assignments:
        context = get_assignment_context(assignment)
        for template in templates:
            subjects.append(render(template.subject, context))
            recipients.append(render(template.recipient, context))
            contents.append(render(template.content, context))
            template_contexts.append(
                None
            )  # no need to store context since we already rendered content

    msgs = send_bulk_messages(
        sender=SENDER,
        subjects=subjects,
        recipients=recipients,
        contents=contents,
        template_contexts=template_contexts,
    )
    return msgs


def _stamp_overdue_alerts(overdue_assignments: List[Assignment]) -> int:
    overdue_assignment_ids = [assignment.id for assignment in overdue_assignments]
    affected_assignments = Assignment.objects.filter(id__in=overdue_assignment_ids)
    affected_rows = affected_assignments.update(overdue_alerted_at=timezone.now())
    return affected_rows


def _validate_secret_header(request: HttpRequest) -> Response:
    try:
        secret = request.headers.get(awx.HOOK_SECRET_HTTP_HEADER)
        awx.validate_awx_secret(secret)
    except Exception as e:
        if isinstance(e, awx.UnauthorizedSecretToken):
            return Response(data={"message": str(e)}, status=403)
        if isinstance(e, awx.InvalidSecretToken):
            return Response(data={"message": str(e)}, status=401)
    return None


def _check_overdue_assignments() -> List[Assignment]:
    overdue_qos_hours = getattr(settings, "ALERT_OVERDUE_QOS_HRS", 24)
    overdue_repeat_interval_hrs = getattr(
        settings, "ALERT_OVERDUE_REPEAT_INTERVAL_HRS", 24
    )

    alerted_at = timezone.now()
    overdued_at = alerted_at - datetime.timedelta(hours=overdue_qos_hours)
    realerted_at = alerted_at - datetime.timedelta(hours=overdue_repeat_interval_hrs)

    initial_alerts = Assignment.objects.filter(
        closed_at__isnull=True,
        created_at__lte=overdued_at,
        overdue_alerted_at__isnull=True,
    )
    repeat_alerts = Assignment.objects.filter(
        closed_at__isnull=True, overdue_alerted_at__lte=realerted_at
    )

    all_alerts = initial_alerts | repeat_alerts
    overdue_assignments = all_alerts.all()
    return overdue_assignments
