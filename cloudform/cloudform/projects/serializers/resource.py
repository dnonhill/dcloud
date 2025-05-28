from rest_framework.serializers import ModelSerializer, ListSerializer

from cloudform.projects.models import Resource
from cloudform.projects.serializers import (
    MinimalApplicationSerializer,
    MinimalProjectSerializer,
)
from .datacenter import DataCenterSerializer


class ResourceSerializer(ModelSerializer):
    data_center = DataCenterSerializer(read_only=True)

    class Meta:
        model = Resource
        fields = "__all__"

    def to_representation(self, instance):
        if not isinstance(self.parent, ListSerializer):
            self.fields["application"] = MinimalApplicationSerializer(read_only=True)
            self.fields["project"] = MinimalProjectSerializer(
                source="application.project", read_only=True
            )

        return super(ResourceSerializer, self).to_representation(instance)
