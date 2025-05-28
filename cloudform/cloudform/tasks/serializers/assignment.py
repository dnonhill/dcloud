from rest_framework import serializers

from cloudform.projects.serializers import MinimalApplicationSerializer, MinimalProjectSerializer
from cloudform.tasks.models import Assignment
from cloudform.tickets.models import Ticket
from cloudform.tickets.serializers import TicketSerializer
from cloudform.users.serializers import UserSerializer
from zouth.audit.serializers import AuditModelSerializer


class MinimalTicketSerializer(serializers.ModelSerializer):
    application = MinimalApplicationSerializer(read_only=True)
    project = MinimalProjectSerializer(source="application.project")

    class Meta:
        model = Ticket
        fields = ["id", "ticket_no", "application", "project"]


class AssignmentBriefSerializer(AuditModelSerializer):
    ticket = TicketSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    assigner = UserSerializer(read_only=True)
    created_by = None
    updated_by = None

    def __init__(self, *args, **kwargs):
        self.minimal = kwargs.pop("minimal", None)
        super().__init__(*args, **kwargs)

    class Meta:
        model = Assignment
        exclude = ["created_by", "updated_by", "note"]

    def to_representation(self, instance):
        if isinstance(self.parent, serializers.ListSerializer) or self.minimal:
            self.fields["ticket"] = MinimalTicketSerializer(read_only=True)

        return super().to_representation(instance)

class AssignmentBriefNoteSerializer(AuditModelSerializer):
    ticket = TicketSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    created_by = None
    updated_by = None

    def __init__(self, *args, **kwargs):
        self.minimal = kwargs.pop("minimal", None)
        super().__init__(*args, **kwargs)

    class Meta:
        model = Assignment
        exclude = ["created_by", "updated_by", "closed_at", "overdue_alerted_at",]

    def to_representation(self, instance):
        if isinstance(self.parent, serializers.ListSerializer) or self.minimal:
            self.fields["ticket"] = MinimalTicketSerializer(read_only=True)

        return super().to_representation(instance)


class AssignmentCreateSerializer(AuditModelSerializer):
    assigner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Assignment
        fields = ["id", "ticket", "assignee", "assigner", "note"]


class ReassignSerializer(serializers.ModelSerializer):
    assigner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Assignment
        fields = ["assignee", "assigner", "note"]

    def update(self, instance, validated_data):
        assigner = validated_data["assigner"]
        assignee = validated_data["assignee"]
        note = validated_data["note"]

        instance.reassign(assigner, assignee, note)
