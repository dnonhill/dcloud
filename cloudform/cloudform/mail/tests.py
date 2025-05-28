import textwrap
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from hamcrest import (
    instance_of,
    assert_that,
    is_,
    is_not,
    equal_to,
    equal_to_ignoring_whitespace,
    is_in,
    contains_inanyorder,
)

from cloudform.mail.models import MailMessage
from cloudform.mail.services import send_message


class MailMessageTest(TestCase):
    sender = "from@example.com"
    subject = "Mail Example"
    content = "Message Content"

    def test_recipients_property(self):
        self.recipient = "xxx@xxx.com, yyy@yyy.com"

        msg = self.create_mail_message()

        assert_that(msg.recipients, contains_inanyorder("xxx@xxx.com", "yyy@yyy.com"))

    def create_mail_message(self):
        return MailMessage.objects.create(
            subject=self.subject,
            sender=self.sender,
            recipient=self.recipient,
            content=self.content,
        )


class SendMessageTest(TestCase):
    sender = "from@example.com"
    recipient = "to@example.com"
    subject = "Mail Example"
    content = "Message Content"
    template_name = "test_mail/test_message.html"
    template_context = {"a": 123, "b": 456}

    def test_send_message_with_only_message(self):

        message = send_message(
            self.subject, self.sender, self.recipient, content=self.content
        )

        assert_that(message, is_not(None))
        assert_that(message.sender, is_(self.sender))
        assert_that(message.recipient, is_(self.recipient))
        assert_that(message.subject, equal_to(self.subject))
        assert_that(message.content, is_(self.content))
        assert_that(message.render(), equal_to(self.content))

    def test_store_message_with_template_without_context(self):
        message = send_message(
            self.subject,
            self.sender,
            self.recipient,
            content=self.content,
            template_name=self.template_name,
        )

        assert_that(message.template_name, is_(self.template_name))

    def test_render_message_with_template_without_context(self):
        message = send_message(
            self.subject,
            self.sender,
            self.recipient,
            content=self.content,
            template_name=self.template_name,
        )

        rendered = message.render()
        expected = textwrap.dedent(
            f"""
        <html>
        <body>
        {self.content}
        </body>
        </html>
        """
        )

        assert_that(rendered, equal_to_ignoring_whitespace(expected))

    def test_store_message_with_template_with_context(self):
        self.template_name = "test_mail/test_message_context.html"

        message = send_message(
            self.subject,
            self.sender,
            self.recipient,
            content=self.content,
            template_name=self.template_name,
            template_context=self.template_context,
        )

        stored = """{"a": 123, "b": 456}"""
        context = {"a": 123, "b": 456, "content": "Message Content"}

        assert_that(message.template_context, instance_of(str))
        assert_that(message.template_context, is_(stored))

        assert_that(message.get_template_context(), equal_to(context))

    def test_render_message_with_template_and_template_context(self):
        self.template_name = "test_mail/test_message_context.html"

        message = send_message(
            self.subject,
            self.sender,
            self.recipient,
            content=self.content,
            template_name=self.template_name,
            template_context=self.template_context,
        )

        rendered = message.render()
        expected = textwrap.dedent(
            f"""
        <html>
        <body>
        Message Content with a = 123 and b = 456
        </body>
        </html>
        """
        )

        assert_that(rendered, equal_to_ignoring_whitespace(expected))


class SendMailTest(TestCase):
    subject = "Mail Example"
    sender = "from@example.com"
    recipient = "to@example.com"
    content = "Message Content"
    pending_msg = None

    def setUp(self):
        self.pending_msg = send_message(
            self.subject, self.sender, self.recipient, content=self.content
        )

    def test_send_mail_success_console(self):
        out = self.sendmail_call()
        logs = out.getvalue().splitlines()

        assert_that(f"Attempt sending message {self.pending_msg.id}", is_in(logs))

        assert_that(f"Message {self.pending_msg.id} can be sent", is_in(logs))

    def sendmail_call(self):
        out = StringIO()
        call_command("sendmail", stdout=out)
        return out

    def test_send_mail_success_status(self):
        self.sendmail_call()

        self.pending_msg = MailMessage.objects.get(pk=self.pending_msg.pk)

        assert_that(self.pending_msg.is_sent, is_(True))

    @patch("cloudform.mail.management.commands.sendmail.send_mail")
    def test_send_mail_failure_console(self, mock_send_mail):
        mock_send_mail.side_effect = RuntimeError

        out = self.sendmail_call()
        logs = out.getvalue().splitlines()

        assert_that(f"Message {self.pending_msg.id} cannot be sent <class 'RuntimeError'>", is_in(logs))

    @patch("cloudform.mail.management.commands.sendmail.send_mail")
    def test_send_mail_failure_status(self, mock_send_mail):
        mock_send_mail.side_effect = RuntimeError

        self.sendmail_call()

        self.pending_msg = MailMessage.objects.get(pk=self.pending_msg.pk)

        assert_that(self.pending_msg.is_sent, is_(False))
