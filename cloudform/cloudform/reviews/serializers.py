from rest_framework import serializers
from cloudform.reviews.models import Reviewer, Review
from cloudform.projects.models import Application, Project
from cloudform.tickets.models import Ticket
from cloudform.users.serializers import UserSerializer
from cloudform.tickets.serializers.ticket import TicketItemSerializer, DataCenterSerializer
from zouth.audit.serializers import AuditModelSerializer


class ReviewerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Reviewer
        fields = '__all__'

class ReviewBriefSerializer(serializers.ModelSerializer):
    reviewerId = serializers.IntegerField(read_only=True, source="reviewer.id")
    reviewer = UserSerializer(read_only=True, source="reviewer.user")
    ticket_no = serializers.CharField(source="ticket.ticket_no", read_only=True)
    application_name = serializers.CharField(
        source="ticket.application.name", read_only=True
    )
    project_name = serializers.CharField(
        source="ticket.application.project.name", read_only=True
    )

    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ("reviewer", "ticket")

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
         
class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(source="reviewer.user", read_only=True)
    ticket = TicketSerializer(read_only=True)
    ticket_timestamp = serializers.DateTimeField(write_only=True)

class ReviewDetailSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(source="reviewer.user", read_only=True)
    ticket = TicketSerializer(read_only=True)
    ticket_timestamp = serializers.DateTimeField(write_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "reviewer",
            "ticket",
            "is_reviewed",
            "is_reject",
            "note",
            "requested_at",
            "reviewed_at",
            "ticket_timestamp",
        ]

class ReviewRejectSerializer(serializers.Serializer):
    ticket_timestamp = serializers.DateTimeField(write_only=True)
    note = serializers.CharField()
    
class ReviewCommentSerializer(serializers.Serializer):
    ticket_timestamp = serializers.DateTimeField(write_only=True)
    note = serializers.CharField()
