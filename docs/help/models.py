from django.db import models

from wagtail.core.models import Page
from wagtail.core.fields import StreamField
from wagtail.admin.edit_handlers import FieldPanel, StreamFieldPanel
from wagtail.core import blocks
from wagtail.images.blocks import ImageChooserBlock


class HelpPage(Page):
    code = models.CharField(
        null=True,
        blank=True,
        max_length=255,
        help_text="The code to search to which page that D-cloud system refers"
    )
    body = StreamField([
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock(classname='full title')),
        ('image', ImageChooserBlock()),
    ])

    content_panels = Page.content_panels + [
        FieldPanel('code'),
        StreamFieldPanel('body'),
    ]

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)

        menus = Page.objects.filter(show_in_menus=True).all()
        context['menus'] = menus

        return context

    parent_page_types = ['home.HomePage', 'HelpPage']
    subpage_types = ['HelpPage']
