import functools

from django.shortcuts import redirect
from django.db import models
from django.db.models import Q

from wagtail.core.models import Page
from wagtail.core.fields import RichTextField
from wagtail.admin.edit_handlers import RichTextFieldPanel, FieldPanel
from help.models import HelpPage


class HomePage(Page):
    head = models.TextField(null=True, blank=True)
    body = RichTextField()

    content_panels = Page.content_panels + [
        FieldPanel('head'),
        RichTextFieldPanel("body"),
    ]

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)

        menus = Page.objects.filter(show_in_menus=True).all()
        context["menus"] = menus

        return context

    def serve(self, request, *args, **kwargs):
        page = None
        code = request.GET.get("code")
        if code:
            page = (
                HelpPage.objects.filter(code_filter_conditions(code))
                .order_by("-code")
                .first()
            )
        if page:
            return redirect(page.get_url())
        return super().serve(request, *args, **kwargs)


def code_filter_conditions(code):
    parts = code.split(".")
    qs = [Q(code__iexact=".".join(parts[: i + 1])) for i in range(len(parts))]
    conditions = functools.reduce(lambda a, b: a | b, qs)
    return conditions
