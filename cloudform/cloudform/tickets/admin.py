from django import forms
from django.contrib import admin, auth
from django.contrib.admin.widgets import FilteredSelectMultiple

from cloudform.projects.models import DataCenter, DataCenterLevel
from cloudform.user_domain.models import UserDomain

from . import userdomain
from .models import Approver, NonPTTApprove
from cloudform.users.models import User


AvailableResource = [
    ("vm", "Virtual Machine"),
    ("container-cluster", "Openshift Project"),
    ("other", "Other"),
]

class DataCenterForm(forms.ModelForm):
    password = forms.CharField(required=False, widget=forms.PasswordInput(render_value=True,), help_text="This field use for Billing only" )
    available_resources = forms.MultipleChoiceField(
        required=False, widget=forms.CheckboxSelectMultiple, choices=AvailableResource,
    )

@admin.register(DataCenter)
class DataCenterAdmin(admin.ModelAdmin):
    list_display = ("name",)
    form = DataCenterForm


@admin.register(DataCenterLevel)
class DataCenterLevelAdmin(admin.ModelAdmin):
    list_display = ("data_center", "level")
    list_filter = ("level",)


class ApproverAdminAddForm(forms.ModelForm):
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

        result = userdomain.search(domain.name, email)
        if result is None or len(result) < 1:
            raise forms.ValidationError(
                "Invalid email for approver (the email in the domain cannot be found)",
                code="approver_invalid",
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
            if Approver.objects.filter(user=user).exists():
                raise forms.ValidationError(
                    "Approver already exists.", code="approver_create_failed"
                )
        else:
            try:
                user = User.objects.create_user(
                    username, domain=domain.name, **user_data
                )
                self.instance.user = user
            except RuntimeError as e:
                raise forms.ValidationError(e.message, code="approver_create_failed")

        return self.cleaned_data

    class Meta:
        model = Approver
        exclude = ("user", "data_center_levels")


class ApproverAdminChangeForm(forms.ModelForm):
    data_center_levels = forms.ModelMultipleChoiceField(
        queryset=DataCenterLevel.objects.all(),
        required=False,
        widget=FilteredSelectMultiple(
            verbose_name='Data Center Level',
            is_stacked=False
        )
    )

    def is_allocated_in_the_same_data_center(self, data_center_levels):
        allocated_data_center_ids = []

        for data_center_level in data_center_levels:
            data_center_id = data_center_level.data_center.id

            if data_center_id in allocated_data_center_ids:
                return True

            allocated_data_center_ids.append(data_center_id)

        return False

    def clean_data_center_levels(self):
        data_center_levels = self.cleaned_data.get('data_center_levels')

        if self.is_allocated_in_the_same_data_center(data_center_levels):
            raise forms.ValidationError('Sorry, this user can not be in the same data center (1 User / 1 Data center)')

        return data_center_levels

    class Meta:
        model = Approver
        fields = ("data_center_levels",)
        labels = {"data_center_levels": "Data Center Levels"}


@admin.register(Approver)
class ApproverAdmin(admin.ModelAdmin):
    list_display = ("username", "responsible_for")
    list_filter = ("data_center_levels",)
    fieldsets = ((None, {"fields": ("user", "data_center_levels")}),)
    add_fieldsets = ((None, {"fields": ("domain", "email")}),)
    readonly_fields = ("user",)
    add_form = ApproverAdminAddForm
    form = ApproverAdminChangeForm
    filter_horizontal = ("data_center_levels",)

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
        queryset = super().get_queryset(request).filter(user__is_local=False)
        queryset = queryset.select_related("user").prefetch_related("data_center_levels")
        return queryset

    def username(self, obj):
        return obj.user.username

    username.description = "Approver name"

    def responsible_for(self, obj):
        return ", ".join([str(data_center) for data_center in obj.data_center_levels.all()])

    responsible_for.description = "Data centers"

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return False

        return not obj.approvements.exists()

class NonPTTApproverAdminAddForm(forms.ModelForm):
    username = forms.ModelChoiceField(
        queryset=User.objects.filter(is_local=True), to_field_name="username"
    )
    def clean(self):
        super().clean()

        username = self.cleaned_data.get("username")

        if username is None:
            return self.cleaned_data

        User = auth.get_user_model()
        user = User.objects.filter(username=username).first()
        if user:
            if NonPTTApprove.objects.filter(user=user).exists():
                raise forms.ValidationError(
                    "Approver already exists.", code="approver_create_failed"
                )
            else:
                self.instance.user = user
        else:
            try:
                self.instance.user = user
            except RuntimeError as e:
                raise forms.ValidationError(e.message, code="approver_create_failed")

        return self.cleaned_data

    class Meta:
        model = Approver
        exclude = ("data_center_levels",)

@admin.register(NonPTTApprove)
class NonPTTApprover(admin.ModelAdmin):
    list_display = ("username", "responsible_for")
    list_filter = ("data_center_levels",)
    fieldsets = ((None, {"fields": ("user", "data_center_levels",)}),)
    add_fieldsets = ((None, {"fields": ("username",)}),)
    readonly_fields = ("user",)
    add_form = NonPTTApproverAdminAddForm
    form = ApproverAdminChangeForm

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
        queryset = super().get_queryset(request).filter(user__is_local=True)
        queryset = queryset.select_related("user").prefetch_related("data_center_levels")
        return queryset

    def username(self, obj):
        return obj.user.username

    username.description = "Approver name"

    def responsible_for(self, obj):
        return ", ".join([str(data_center) for data_center in obj.data_center_levels.all()])

    responsible_for.description = "Data centers"

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return False

        return not obj.approvements.exists()
