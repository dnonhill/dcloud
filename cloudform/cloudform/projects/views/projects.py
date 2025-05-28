from django_filters import filters
from django_filters.rest_framework import FilterSet
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from cloudform.projects.models import Project
from cloudform.projects.serializers import ProjectSerializer, TransferProjectOwnerSerializer
from cloudform.users.models import is_user_in_op_team, Group
from cloudform.users.permissions import IsOperationTeamCanReadOnly, IsRequestor, IsCloudAdmin
from cloudform.reviews.models import IsReviewerCanReadOnly, is_user_in_reviewer_team
from cloudform.inventories.enums import InventoryListLogsType
from cloudform.inventories.inventory_list_logs_model import InventoryListLogs


class ProjectMembersPermission(IsRequestor):
    def has_object_permission(self, request, view, obj):
        current_user = request.user
        is_project_member = obj.has_member(current_user)
        return is_project_member


class ProjectOwnerPermission(BasePermission):
    base_permission = (IsRequestor | IsCloudAdmin)()

    def has_permission(self, request, view):
        return self.base_permission.has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        current_user = request.user
        if obj.owner == current_user:
            return True

        return current_user.groups.filter(name=Group.CLOUD_ADMIN).exists()


class ProjectFilter(FilterSet):
    class Meta:
        model = Project
        fields = {
            "job_code": ["exact", "contains", "startswith"],
            "name": ["exact", "icontains", "startswith"],
            "owner__first_name": ["exact", "contains", "icontains"],
            "expired_date": ["lte", "gt"],
        }

    status = filters.CharFilter(field_name="active_flag", method="filter_status")

    def filter_status(self, queryset, name, value):
        if value == "active":
            return queryset.filter(active_flag=True)
        elif value == "inactive":
            return queryset.filter(active_flag=False)

        return queryset


class ProjectViewSet(ModelViewSet):
    """
    #### PROJECTS

    - [/api/projects/](/api/projects/) <br/>
        **[GET]: list active** projects of current user.
        **[GET]: list all** projects for admin or cloud admin when call with ?all.
        **[POST]: create** a project.

    - [/api/projects/{pk}/](/api/projects/1/) <br/>
        **[GET]: show details** of project which id={pk}
    - [/api/projects/{pk}/transfer-owner/)(/api/projects/1/transfer-owner/) <br />
        **[POST]: transfer project owner right to other.
    """

    permission_classes = (IsOperationTeamCanReadOnly | IsReviewerCanReadOnly | ProjectMembersPermission,)
    queryset = Project.objects.none()
    serializer_class = ProjectSerializer

    filterset_class = ProjectFilter
    ordering_fields = ["created_at", "name"]
    ordering = ["created_at"]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        queryset = Project.objects
        current_user = self.request.user

        if not (self._is_query_all() and (is_user_in_op_team(current_user) or is_user_in_reviewer_team(current_user))):
                    queryset = queryset.filter(members=current_user)
        return queryset

    def update(self, request, *args, **kwargs):
        project_name_before = self.get_object().name
        project_name_after = request.data.get('name')
        inventory_list_logs = InventoryListLogs()
        inventory_list_logs.create_inventory_logs(
            self.get_object(),
            project_name_before,
            project_name_after,
            request.user,
            InventoryListLogsType.PROJECT.value
        )
        return super().update(request, *args, **kwargs)

    def _is_query_all(self):
        return self.action != "list" or "all" in self.request.query_params

    @action(
        url_path="transfer-owner",
        detail=True,
        methods=["post"],
        permission_classes=(ProjectOwnerPermission,),
    )
    def transfer_owner(self, request, pk=None):
        project = self.get_object()

        request_serializer = TransferProjectOwnerSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        request_serializer.update(project, request_serializer.validated_data)

        response_serializer = self.get_serializer(instance=project)
        return Response(data=response_serializer.data)
