from django import forms
from cloudform.user_domain.models import UserDomain
from django.contrib import admin, auth, messages
from cloudform.reviews.models import (
    Reviewer,
    ReviewProxy,
)
from cloudform.tickets.userdomain import *


class ReviewerAdminChangeForm(forms.ModelForm):
    class Meta:
        model = Reviewer
        fields = ('user',)


class ReviewerAdminAddForm(forms.ModelForm):
    domain = forms.ModelChoiceField(
        queryset=UserDomain.objects.exclude(display_name=""), to_field_name="name"
    )
    email = forms.CharField()

    def clean(self):
        super().clean()

        domain = self.cleaned_data.get("domain")
        email = self.cleaned_data.get("email")

        if domain is None:
            return self.cleaned_data

        result = search_reviewer(domain.name, email)
        if result is None or len(result) < 1:
            raise forms.ValidationError(
                "Invalid email for Reviewer (the email in the domain cannot be found)",
                code="reviewer_invalid",
            )
        # Use the first one in the case many result returned
        user = next(iter(result))
        attrs = {**user["attributes"]}

        user_data = {
            uattr: next(iter(attrs.get(mattr, [b""]))).decode("utf-8")
            for uattr, mattr in domain.user_attr_map.items()
        }

        username = user_data.pop("username")

        User = auth.get_user_model()
        user = User.objects.filter(domain=domain.name, username=username).first()
        if user:
            self.instance.user = user
            if Reviewer.objects.filter(user=user).exists():
                raise forms.ValidationError(
                    "reviewer already exists.", code="reviewer_create_failed"
                )
        else:
            try:
                user = User.objects.create_user(
                    username, domain=domain.name, **user_data
                )
                self.instance.user = user
            except RuntimeError as e:
                raise forms.ValidationError(e.message, code="reviewer_create_failed")

        return self.cleaned_data

    class Meta:
        model = Reviewer
        exclude = ("user",)


@admin.register(Reviewer)
class ReviewerAdmin(admin.ModelAdmin):
    list_display = ("username",)
    fieldsets = ((None, {"fields": ("user",)}),)
    add_fieldsets = ((None, {"fields": ("domain", "email")}),)
    readonly_fields = ("user",)
    add_form = ReviewerAdminAddForm
    form = ReviewerAdminChangeForm

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        defaults = {}
        if obj is None:
            defaults["form"] = self.add_form
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.select_related("user")
        return queryset

    def username(self, obj):
        return obj.user.username

    username.description = "Reviewer name"

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return False

        return not obj.reviews.exists()


@admin.register(ReviewProxy)
class RollbackReviewStatusAdmin(admin.ModelAdmin):
    change_form_template = "review_roll_back_change.html"
    list_display = (
        'get_ticket_no',
        'get_job_code',
        'get_data_center',
        'get_project',
        'get_application',
        'reviewer',
    )
    readonly_fields = (
        'reviewer',
        'ticket',
        'note',
        'is_reviewed',
        'is_reject',
    )

    def get_ticket_no(self, obj):
        return obj.ticket.ticket_no
    get_ticket_no.short_description = 'Ticket No'
    get_ticket_no.admin_order_field = 'ticket__ticket_no'

    def get_job_code(self, obj):
        return obj.ticket.job_code
    get_job_code.short_description = 'Job Code'
    get_job_code.admin_order_field = 'ticket__job_code'

    def get_data_center(self, obj):
        return obj.ticket.data_center.name
    get_data_center.short_description = 'Date Center'
    get_data_center.admin_order_field = 'ticket__data_center_name'

    def get_project(self, obj):
        return obj.ticket.application.project.name
    get_project.short_description = 'Project'
    get_project.admin_order_field = 'ticket__application__project_name'

    def get_application(self, obj):
        return obj.ticket.application.name
    get_application.short_description = 'Application'
    get_application.admin_order_field = 'ticket__application_name'


    def response_change(self, request, obj, post_url_continue=None):
        if "_roll-back-status" in request.POST:
            obj.roll_back_status()
            self.message_user(request, f"Ticket Id {obj.ticket.ticket_no} is roll back to status created", level=messages.SUCCESS)
            return self.response_post_save_add(request, obj)
        return super().response_change(request, obj)
