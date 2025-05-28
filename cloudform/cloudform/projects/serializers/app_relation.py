from rest_framework import serializers
from rest_framework.serializers import ListSerializer

from cloudform.projects.models import AppRelation
from cloudform.projects.serializers import (
    MinimalApplicationSerializer,
    MinimalProjectSerializer,
)
from zouth.audit.serializers import AuditModelSerializer


class AppRelationSerializer(AuditModelSerializer):
    resource_name = serializers.CharField(source="resource.name", read_only=True)
    resource_active_flag = serializers.BooleanField(source="resource.active_flag", read_only=True)

    application = serializers.IntegerField(
        source="resource.application.pk", read_only=True
    )
    application_name = serializers.CharField(
        source="resource.application.name", read_only=True
    )
    service_inventory_name = serializers.CharField(
        source="service_inventory.name", read_only=True
    )
    service_inventory_description = serializers.CharField(
        source="service_inventory.description", read_only=True
    )

    def to_representation(self, instance):
        self.fields.pop("created_by", None)
        self.fields.pop("updated_by", None)
        self.fields.pop("created_at", None)
        self.fields.pop("updated_at", None)
        self.fields.pop("active_flag", None)

        if not isinstance(self.parent, ListSerializer):
            self.fields["application"] = MinimalApplicationSerializer(
                source="resource.application", read_only=True
            )
            self.fields["project"] = MinimalProjectSerializer(
                source="resource.application.project", read_only=True
            )

        return super().to_representation(instance)

    class Meta:
        model = AppRelation
        fields = "__all__"
