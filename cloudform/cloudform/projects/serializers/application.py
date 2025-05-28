from rest_framework import serializers

from cloudform.projects.models import Application
from zouth.audit.serializers import AuditModelSerializer

from .project import MinimalProjectSerializer


class ApplicationSerializer(AuditModelSerializer):
    can_delete = serializers.BooleanField(read_only=True)

    class Meta:
        model = Application
        fields = "__all__"

    def to_representation(self, instance):
        self.fields["project"] = MinimalProjectSerializer(read_only=True)

        if isinstance(self.parent, serializers.ListSerializer):
            self.fields.pop("created_at", None)
            self.fields.pop("created_by", None)
            self.fields.pop("updated_at", None)
            self.fields.pop("updated_by", None)

            self.fields.pop("can_delete", None)

        return super().to_representation(instance)


class MinimalApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ("id", "name", "system_diagram")
