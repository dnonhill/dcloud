from django_filters.rest_framework import FilterSet, filters
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.viewsets import ModelViewSet

from cloudform.projects.models import AppRelation
from cloudform.projects.serializers.app_relation import AppRelationSerializer


class AppRelationFilter(FilterSet):
    class Meta:
        model = AppRelation
        fields = {
            "resource_id": ["exact"],
            "relation": ["in"],
            "service_inventory__name": ["exact", "icontains"],
            "service_inventory": ["exact"],
        }

    resource_status = filters.CharFilter(field_name="resource__active_flag", method="filter_status")

    def filter_status(self, queryset, name, value):
        if value == "active":
            return queryset.filter(resource__active_flag=True)
        elif value == "inactive":
            return queryset.filter(resource__active_flag=False)

        return queryset


class AppRelationViewSet(ModelViewSet):
    serializer_class = AppRelationSerializer
    queryset = AppRelation.objects.all_active().select_related(
        "resource", "resource__application", "service_inventory"
    )
    pagination_class = LimitOffsetPagination
    filterset_class = AppRelationFilter
