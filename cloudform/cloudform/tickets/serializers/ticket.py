from django.db import transaction
from rest_framework import serializers

from cloudform.users.serializers import UserSerializer
from zouth.audit.serializers import AuditModelSerializer
from cloudform.projects.serializers import (
    MinimalProjectSerializer,
    ResourceSerializer,
    MinimalApplicationSerializer,
)
from cloudform.projects.models import DataCenter
from cloudform.tickets.models import (
    Ticket,
    TicketItem,
    Approvement,
    Approver,
)

from cloudform.reviews.models import Review
from cloudform.projects.serializers.datacenter import DataCenterSerializer
from cloudform.tickets.serializers.assignment import AssignmentSerializer


class BriefTicketItemSerializer(serializers.ModelSerializer):
    ticket_no = serializers.CharField(source="ticket.ticket_no")
    ticket_created_at = serializers.DateTimeField(source="ticket.created_at")
    ticket_created_by = serializers.CharField(source="ticket.created_by.get_full_name")

    class Meta:
        model = TicketItem
        fields = (
            "id",
            "action",
            "resource_type",
            "ticket",
            "ticket_no",
            "ticket_created_by",
            "ticket_created_at",
        )


class TicketItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = TicketItem
        fields = [
            "id",
            "action",
            "resource_type",
            "specification",
            "resource",
            "estimated_price",
            "price_detail",
        ]

    def to_representation(self, instance):
        self.fields["resource"] = ResourceSerializer(read_only=True)
        return super().to_representation(instance)


class TicketSerializer(AuditModelSerializer):
    class Meta:
        model = Ticket
        fields = "__all__"
        read_only_fields = ("status", "ticket_no", "note_from_operator", "closed_by")
        extra_kwargs = {"job_code": {"min_length": 10, "required": True}}

    items = TicketItemSerializer(many=True, required=True)
    data_center = serializers.PrimaryKeyRelatedField(queryset=DataCenter.objects.all())
    approvers = serializers.PrimaryKeyRelatedField(
        write_only=True, queryset=Approver.objects.all(), many=True
    )

    project = MinimalProjectSerializer(read_only=True, source="application.project")
    closed_by = UserSerializer(read_only=True, allow_null=True)

    assignments = AssignmentSerializer(many=True, read_only=True)

    def to_representation(self, instance):
        self.fields["application"] = MinimalApplicationSerializer(read_only=True)
        self.fields["data_center"] = DataCenterSerializer(read_only=True)

        if isinstance(self.parent, serializers.ListSerializer):
            self.fields.pop("approvement", None)
            self.fields.pop("items", None)
            self.fields.pop("closed_by", None)

        return super().to_representation(instance)

    def create(self, validated_data):
        with transaction.atomic():
            items_data = validated_data.pop("items")
            approvers = validated_data.pop("approvers")
            data_center = validated_data.get("data_center", None)
            ticket = super().create(validated_data)
            ticket_items = [
                TicketItem(ticket=ticket, **item_data) for item_data in items_data
            ]
            TicketItem.objects.bulk_create(ticket_items)

            Approvement.delete_by_ticket(ticket)
            for approver in approvers:
                Approvement.create_for_ticket(ticket, approver, data_center)

            Review.create_for_ticket(ticket)

            return ticket

    def update(self, instance, validated_data):
        with transaction.atomic():
            validated_data.pop("application")

            items_data = validated_data.pop("items")
            approvers = validated_data.pop("approvers")
            data_center = validated_data.get("data_center", None)

            ticket = super().update(instance, validated_data)
            self._update_items(ticket, items_data)

            Approvement.delete_by_ticket(ticket)
            for approver in approvers:
                Approvement.create_for_ticket(ticket, approver, data_center)

            Review.create_for_ticket(ticket)

            return ticket

    def _update_items(self, ticket, new_items):
        self._remove_unsent_items(ticket, new_items)
        self._upsert_new_items(ticket, new_items)

    def _remove_unsent_items(self, ticket, new_items):
        keep_item_ids = [item["id"] for item in new_items if "id" in item]

        existing_items = ticket.items.all()
        to_removes = [item for item in existing_items if item.id not in keep_item_ids]

        for remove_item in to_removes:
            remove_item.delete()

    def _upsert_new_items(self, ticket, new_items):
        existing_items = ticket.items.all()
        current_item_ids = [item.id for item in existing_items]

        for item in new_items:
            item_id = item.get("id", None)
            if item_id is not None and item_id not in current_item_ids:
                continue

            ticket.items.update_or_create(defaults=item, pk=item_id)
