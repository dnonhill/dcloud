from rest_framework import serializers
from rest_framework.fields import DateTimeField

from cloudform.projects.models import Application, Project
from cloudform.tickets.models import Approvement, Ticket
from cloudform.users.serializers import UserSerializer
from zouth.audit.serializers import AuditModelSerializer
from .ticket import TicketItemSerializer, DataCenterSerializer


class ApprovementBriefSerializer(serializers.ModelSerializer):
    approverId = serializers.IntegerField(read_only=True, source="approver.id")
    approver = UserSerializer(read_only=True, source="approver.user")
    ticket_no = serializers.CharField(source="ticket.ticket_no", read_only=True)
    ticket_status = serializers.CharField(source="ticket.status", read_only=True)
    application_name = serializers.CharField(
        source="ticket.application.name", read_only=True
    )
    project_name = serializers.CharField(
        source="ticket.application.project.name", read_only=True
    )

    class Meta:
        model = Approvement
        fields = "__all__"
        read_only_fields = ("approver", "ticket")


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        exclude = ("created_at", "created_by", "updated_at", "updated_by")


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Project
        exclude = ("created_at", "created_by", "updated_at", "updated_by", "members")


class TicketSerializer(AuditModelSerializer):
    class Meta:
        model = Ticket
        fields = "__all__"

    items = TicketItemSerializer(many=True, read_only=True)
    application = ApplicationSerializer(read_only=True)
    project = ProjectSerializer(source="application.project", read_only=True)
    data_center = DataCenterSerializer(read_only=True)


class ApprovementDetailSerializer(serializers.ModelSerializer):
    approver = UserSerializer(source="approver.user", read_only=True)
    ticket = TicketSerializer(read_only=True)
    ticket_timestamp = DateTimeField(write_only=True)

    class Meta:
        model = Approvement
        fields = [
            "id",
            "approver",
            "ticket",
            "is_approved",
            "reason",
            "requested_at",
            "approved_at",
            "ticket_timestamp",
        ]


class ApprovementRejectSerializer(serializers.Serializer):
    ticket_timestamp = DateTimeField(write_only=True)
    reason = serializers.CharField(max_length=255)
