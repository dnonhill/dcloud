from django.db.models import Max
from rest_framework import serializers

from cloudform.tasks.models import Task, TASK_TYPE_MANUAL
from zouth.audit.serializers import AuditModelSerializer


class TaskSerializer(AuditModelSerializer):
    task_type = serializers.CharField(default=TASK_TYPE_MANUAL)
    sequence = serializers.IntegerField(read_only=True)
    job_url = serializers.CharField(read_only=True)

    def create(self, validated_data):
        task_group = validated_data.get("task_group")
        values = Task.objects.filter(task_group=task_group).aggregate(Max("sequence"))
        validated_data["sequence"] = values["sequence__max"] + 1

        return super().create(validated_data)

    class Meta:
        model = Task
        exclude = ["task_template"]
