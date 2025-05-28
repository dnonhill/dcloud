from django import forms
from django.conf.urls import url
from django.contrib import admin
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html
from ckeditor.widgets import CKEditorWidget

from cloudform.mail.models import MailTemplate
from cloudform.mail.signals import (
    render,
    get_approvement_context,
    get_assignment_context,
    get_local_user_context,
    get_review_context,
    get_inventory_list_context,
)
from cloudform.tasks.models import Assignment
from cloudform.tickets.models import Ticket, Approvement
from cloudform.users.models import LocalUser
from cloudform.reviews.models import Review
from cloudform.inventories.models import InventoryList


class MailTemplateAdminForm(forms.ModelForm):
    content = forms.CharField(widget=CKEditorWidget(config_name="minimal"), initial="<html><body></body></html>")

    class Meta:
        model = MailTemplate
        fields = ("template_name", "signal_name", "recipient", "subject", "content")


@admin.register(MailTemplate)
class MailTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "template_name",
        "signal_name",
        "recipient",
        "subject",
        "mail_template_action",
    )

    form = MailTemplateAdminForm

    def get_context(self, signal_name):
        if signal_name in ["ticket_submitted",
                           "ticket_approved",
                           "ticket_rejected",
                           "ticket_next_level_approved",
                           "approver_approved",
                           ]:
            instance = Approvement.objects.last()
            return get_approvement_context(instance)
        elif signal_name in ["ticket_assigned", "ticket_completed", "overdue"]:
            instance = Assignment.objects.last()
            return get_assignment_context(instance)
        elif signal_name in [
                             "reviewer_ticket_reviewed",
                             "reviewer_ticket_rejected",
                             "reviewer_ticket_commented",
                             "requestor_feedback_applied",
                             "requestor_waitting_review",
                             ]:
            instance = Review.objects.last()
            return get_review_context(instance)
        elif signal_name in ["inventory_notfound_or_error"]:
            instance = InventoryList.objects.last()
            return get_inventory_list_context(instance)
        elif signal_name in ["mail_activate_account", "mail_reset_password"]:
            instance = LocalUser(
                username="someone@another.com",
                first_name="Rinoa",
                last_name="Heartilly",
            )
            return get_local_user_context(instance)

        return {"ticket": Ticket.objects.last()}

    def process_render(self, request, id, *args, **kwargs):
        template = self.get_object(request, id)
        context = self.get_context(template.signal_name)
        recipient = render(template.recipient, context)
        subject = render(template.subject, context)
        content = render(template.content, context)
        return HttpResponse(
            f"""
            <strong>Recipient:</strong> {recipient}
            <br/>
            <br/>
            <strong>Subject:</strong> {subject}
            <br/>
            <br/>
            <strong>Content: </strong>
            <br/>
            {content}
            """
        )

    def mail_template_action(self, obj):
        return format_html(
            '<a class="button" href="{}">Test</a>',
            reverse("admin:mail-template-render", args=[obj.pk]),
        )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            url(
                r"^(?P<id>.+)/test_render/$",
                self.admin_site.admin_view(self.process_render),
                name="mail-template-render",
            )
        ]
        return custom_urls + urls
