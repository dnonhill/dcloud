from django_filters.rest_framework import FilterSet, filters
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from cloudform.projects.models import Project, Application
from cloudform.projects.serializers import ApplicationSerializer
from cloudform.users.models import is_user_in_op_team
from cloudform.users.permissions import IsRequestor, IsOperationTeamCanReadOnly
from cloudform.reviews.models import IsReviewerCanReadOnly, is_user_in_reviewer_team
from cloudform.inventories.inventory_list_logs_model import InventoryListLogs
from cloudform.inventories.enums import InventoryListLogsType


class IsProjectMember(IsRequestor):
    def has_permission(self, request, view):
        super().has_permission(request, view)
        if request.method in SAFE_METHODS:
            return True

        current_user = request.user
        project_id = request.resolver_match.kwargs.get(
            "project_id"
        ) or request.data.get("project")

        return (
            project_id is not None
            and Project.of_members(current_user).filter(pk=project_id).exists()
        )

    def has_object_permission(self, request, view, obj):
        current_user = request.user
        return obj.project.has_member(current_user)


class ApplicationFilter(FilterSet):
    class Meta:
        model = Application
        fields = {
            "name": ["exact", "icontains", "startswith"],
            "supporter_name": ["exact", "contains", "icontains"],
        }

    status = filters.CharFilter(field_name="active_flag", method="filter_status")

    def filter_status(self, queryset, name, value):
        if value == "active":
            return queryset.filter(active_flag=True)
        elif value == "inactive":
            return queryset.filter(active_flag=False)

        return queryset


class ApplicationViewSet(ModelViewSet):
    permission_classes = (IsOperationTeamCanReadOnly | IsReviewerCanReadOnly | IsProjectMember,)
    queryset = Application.objects.none()
    serializer_class = ApplicationSerializer

    filterset_class = ApplicationFilter
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        queryset = Application.objects.select_related("project")
        current_user = self.request.user

        if not (self._is_query_all() or (is_user_in_op_team(current_user) or is_user_in_reviewer_team(current_user))):
            queryset = queryset.filter(project__members=current_user)

        if "project_id" in self.kwargs:
            queryset = queryset.filter(project=self.kwargs["project_id"])
        return queryset

    def update(self, request, *args, **kwargs):
        application_name_before = self.get_object().name
        application_name_after = request.data.get('name')
        inventory_list_logs = InventoryListLogs()
        inventory_list_logs.create_inventory_logs(
            self.get_object(),
            application_name_before,
            application_name_after,
            request.user,
            InventoryListLogsType.APPLICATION.value
        )
        return super().update(request, *args, **kwargs)

    def _is_query_all(self):
        return self.action != "list" or "all" in self.request.query_params
