from rest_framework import serializers

from cloudform.tasks.models import TaskGroup
from cloudform.projects.serializers import DataCenterSerializer
from cloudform.users.serializers import UserSerializer
from cloudform.tickets.serializers import TicketItemSerializer
from cloudform.tickets.models import Ticket


class MinimalTicketSerializer(serializers.ModelSerializer):
    data_center = DataCenterSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = ["ticket_no", "data_center", "job_code", "created_by"]


class TaskGroupSerializer(serializers.ModelSerializer):
    ticket_item = TicketItemSerializer(read_only=True)
    ticket = MinimalTicketSerializer(source="ticket_item.ticket", read_only=True)
    assignee = serializers.IntegerField(source="assignment.assignee.id")

    class Meta:
        model = TaskGroup
        fields = "__all__"


class MarkCompleteTaskGroupSerializer(serializers.Serializer):
    result = serializers.DictField()


class TaskGroupBriefSerializer(serializers.ModelSerializer):
    ticket_item = TicketItemSerializer(read_only=True)

    class Meta:
        model = TaskGroup
        fields = "__all__"
