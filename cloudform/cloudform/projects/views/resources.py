from django_filters.rest_framework import FilterSet, filters
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.viewsets import ReadOnlyModelViewSet

from cloudform.projects.models import Resource
from cloudform.projects.serializers import ResourceSerializer
from cloudform.users.models import is_user_in_op_team
from cloudform.users.permissions import IsRequestor, IsCloudAdmin, IsOperator
from cloudform.reviews.models import IsReviewerCanReadOnly, is_user_in_reviewer_team


class ResourceFilter(FilterSet):
    class Meta:

        model = Resource
        fields = {
            "data_center": ["exact"],
            "job_code": ["exact", "startswith", "contains"],
            "resource_type": ["exact", "in"],
            "name": ["exact", "contains"],
        }

    status = filters.CharFilter(field_name="active_flag", method="filter_status")
    ip_address = filters.CharFilter(field_name="details", method="filter_ip_address")

    def filter_status(self, queryset, name, value):
        if value == "active":
            return queryset.filter(active_flag=True)
        elif value == "inactive":
            return queryset.filter(active_flag=False)

        return queryset

    def filter_ip_address(self, queryset, name, value):
        return queryset.filter(details__ip_address__icontains=value)


class ResourceViewSet(ReadOnlyModelViewSet):
    permission_classes = (IsRequestor | IsCloudAdmin | IsOperator | IsReviewerCanReadOnly,)
    queryset = Resource.objects.none()
    serializer_class = ResourceSerializer

    filterset_class = ResourceFilter
    ordering_fields = ["created_at"]
    ordering = ["created_at"]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        queryset = Resource.objects.prefetch_related("data_center")
        current_user = self.request.user

        if not (self._is_query_all() and (is_user_in_op_team(current_user) or is_user_in_reviewer_team(current_user))):
            queryset = queryset.filter(application__project__members=current_user)

        if "application_id" in self.kwargs:
            queryset = queryset.filter(application=self.kwargs["application_id"])

        return queryset

    def _is_query_all(self):
        return self.action != "list" or "all" in self.request.query_params
