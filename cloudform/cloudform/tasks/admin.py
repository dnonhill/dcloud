from django.contrib import admin
from .models import TaskTemplate, Task

from django.contrib.admin.filters import SimpleListFilter


class ScriptFilterSpec(SimpleListFilter):
    title = u"task type"
    parameter_name = "empty_script_name"

    def lookups(self, request, model_admin):
        return (
            ("False", "Script Task"),
            ("True", "Manual Task"),
        )

    def queryset(self, request, queryset):
        if self.value() == "True":
            return queryset.filter(script_name="")
        elif self.value() == "False":
            return queryset.exclude(script_name="")


class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "action",
        "resource_type",
        "task_sequence",
    )
    ordering = ("resource_type", "action", "task_sequence")
    exclude = ("created_by", "updated_by")
    list_filter = (ScriptFilterSpec, "resource_type")


admin.site.register(TaskTemplate, TaskTemplateAdmin)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("description", "task_template", "task_type")
