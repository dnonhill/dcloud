from django.contrib import admin
from cloudform.tags.models import Tag

# Register your models here.
@admin.register(Tag)
class TagsAdmin(admin.ModelAdmin):
    list_display = (
        'name',
    )
    list_filter = [
        'name',
    ]
