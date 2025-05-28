from rest_framework.serializers import ModelSerializer

from cloudform.projects.models import DataCenter


class DataCenterSerializer(ModelSerializer):
    class Meta:
        model = DataCenter
        fields = ["id", "name", "default_job_code", "available_resources"]
