import json
from typing import List

from cloudform.mail.models import MailMessage


def _template_context_string(template_context):
    if template_context and not isinstance(template_context, dict):
        raise TypeError("template_context should be dict type")
    template_context_str = json.dumps(template_context) if template_context else None
    return template_context_str


def send_message(
    subject, sender, recipient, content=None, template_name=None, template_context=None
):
    msg = MailMessage.objects.create(
        subject=subject,
        sender=sender,
        recipient=recipient,
        content=content,
        template_name=template_name,
        template_context=_template_context_string(template_context),
    )
    return msg


def send_bulk_messages(
    sender: str,
    subjects: List[str],
    recipients: List[str],
    contents: List[str],
    template_name=None,
    template_contexts=None,
):
    msgs = [
        MailMessage(
            subject=subject,
            sender=sender,
            recipient=recipient,
            template_name=template_name,
            template_context=_template_context_string(template_context),
            content=content,
        )
        for subject, recipient, template_context, content in zip(
            subjects, recipients, template_contexts, contents
        )
    ]
    MailMessage.objects.bulk_create(msgs)
    return msgs
