from rest_framework import serializers

from cloudform.projects.models import ServiceInventory


class ServiceInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceInventory
        fields = "__all__"
