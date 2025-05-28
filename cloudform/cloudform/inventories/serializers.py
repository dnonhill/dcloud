from rest_framework import serializers
from cloudform.inventories.models import Inventory, InventoryList
from cloudform.projects.models.data_center import DataCenter


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = [
            "project_name",
            "data_center",
            "application_name",
            "name",
            "job_code",
        ]

class DataCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataCenter
        fields = [
            "name",
        ]

class InventoryListSerializer(serializers.ModelSerializer):
    data_center_ref = DataCenterSerializer(many=False)
    class Meta:
        model = InventoryList
        fields = [
            "data_center_ref",
            "project",
            "application",
            "name",
            "job_code",
        ]

class InventorySerializerRequest(serializers.Serializer):
    inventory_id = serializers.IntegerField()
    resource_detail = serializers.JSONField()

class InventorySearchSerializers(serializers.Serializer):
    search = serializers.CharField(required=False)
    project = serializers.CharField(required=False)
    data_center = serializers.CharField(required=False)
    application = serializers.CharField(required=False)
    resource = serializers.CharField(required=False)
    job_code = serializers.CharField(required=False)
    tags = serializers.ListField(required=False)
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
