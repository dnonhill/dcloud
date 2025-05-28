import json
import re

from django.db import models
from django.template import loader


class MailMessageManager(models.Manager):
    def pending(self):
        return self.filter(is_sent=False, is_error=False)


class MailMessage(models.Model):
    recipient = models.EmailField()
    sender = models.EmailField()
    subject = models.CharField(max_length=255, null=False)
    template_name = models.CharField(max_length=100, null=True)
    template_context = models.TextField(null=True)
    content = models.TextField(null=True)
    is_sent = models.BooleanField(default=False)
    is_error = models.BooleanField(default=False)
    error_msg = models.CharField(max_length=255, null=True)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    attempts = models.IntegerField(default=0, null=False)

    objects = MailMessageManager()

    @property
    def recipients(self):
        mail_strs = self.recipient.split(",")
        mails = list(map(lambda s: s.strip(), mail_strs))
        return mails

    def __str__(self):
        return f"Message ({self.from_} => {self.to})"

    class Meta:
        app_label = "mail"

    def render(self):
        if self.template_name is not None:
            return loader.render_to_string(
                self.template_name, self.get_template_context()
            )
        return self.content

    def get_template_context(self):
        if self.template_context is None:
            return {"content": self.content}

        loaded = json.loads(self.template_context)
        loaded["content"] = loaded.get("content", self.content)

        return loaded

    def is_html(self):
        return re.search("<html>", self.content, flags=re.IGNORECASE) is not None or (
            self.template_name is not None and self.template_name.endswith(".html")
        )


class MailTemplate(models.Model):
    template_name = models.CharField(max_length=100, unique=True)
    signal_name = models.CharField(max_length=255, null=False)
    recipient = models.CharField(max_length=255, null=False)
    subject = models.CharField(max_length=255, null=False)
    content = models.TextField()

    def __str__(self):
        return self.template_name
