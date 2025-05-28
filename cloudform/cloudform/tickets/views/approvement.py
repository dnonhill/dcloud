from datetime import datetime

from django_filters import FilterSet, filters
from rest_framework import status, permissions, exceptions
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from cloudform.tickets.models import Approver, Approvement
from cloudform.tickets.serializers import (
    ApprovementDetailSerializer,
    ApprovementRejectSerializer,
    ApprovementBriefSerializer,
)
from zouth.exceptions import Conflict


class IsApprover(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            return False

        current_user = request.user
        return Approver.objects.filter(user=current_user).exists()


class ApprovementFilter(FilterSet):
    status = filters.CharFilter("status", method="filter_status")

    def filter_status(self, queryset, name, value):
        if value == "pending":
            return queryset.filter(is_approved=None)
        elif value == "approved":
            return queryset.filter(is_approved=True)
        elif value == "rejected":
            return queryset.filter(is_approved=False)
        return queryset

    class Meta:
        model = Approvement
        fields = {"ticket__ticket_no": ["exact", "contains", "startswith"]}


class ApproverApprovementViewSet(ReadOnlyModelViewSet):
    """
    #### APPROVEMENT

    - [/api/approvements/?is_approved=[True, False, None]](/api/approvements/) <br/>
        **[GET]: list** [approvement](/api/approvements/) of current user (approver)

    - [/api/approvements/{pk}/](/api/approvements/1/) <br/>
        **[GET]: show detail** [approvement](/api/approvements/) of approvement <br/>
        **[PUT]: update** [approvement](/api/approvements/) by approve or reject the [request](/api/requests/) <br/>
    """

    permission_classes = (IsApprover,)
    serializer_class = ApprovementDetailSerializer

    filterset_fields = {"ticket__ticket_no": ["exact", "contains", "startswith"]}
    ordering_fields = ["requested_at", "approved_at"]
    ordering = ["requested_at"]
    pagination_class = LimitOffsetPagination

    def filter_owner(self, queryset):
        has_level_1 = queryset.filter(approver_level=1)
        exclude_level_1 = queryset.exclude(approver_level=1)
        list_id = []
        for item in exclude_level_1:
            if item.before_level_is_approve():
                list_id.append(item.id)
        before_leve_has_approve  = exclude_level_1.filter(id__in=list_id)
        queryset = has_level_1 | before_leve_has_approve
        return queryset
    
    def get_queryset(self):
        queryset = Approvement.list_by_approver(self.current_approver)

        if "pending" in self.request.query_params:
            queryset = queryset.filter(is_approved=None).filter(ticket__status='reviewed')
            queryset = self.filter_owner(queryset)
        elif "approved" in self.request.query_params:
            queryset = queryset.filter(is_approved=True)
        elif "rejected" in self.request.query_params:
            queryset = queryset.filter(is_approved=False)
        elif  "all" in self.request.query_params:
            queryset = queryset.exclude(ticket__status='created').exclude(ticket__status='commented').exclude(ticket__status='feedback_applied')
            queryset = self.filter_owner(queryset)

        queryset = queryset.select_related(
            "approver",
            "ticket",
            "ticket__created_by",
            "ticket__updated_by",
            "ticket__application",
            "ticket__application__project",
        )

        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                "ticket__items", "ticket__items__resource"
            )

        return queryset

    def get_serializer(self, *args, **kwargs):
        if self.action == "list":
            return ApprovementBriefSerializer(*args, **kwargs)
        return super().get_serializer(*args, **kwargs)

    @action(detail=True, methods=["PUT"])
    def approve(self, request, pk=None):
        obj = self.get_object()
        if obj.is_approved is not None or obj.ticket.status != "reviewed":
            raise exceptions.ValidationError(
                "Cannot approve the approved request.", code="roong"
            )
        self.validate_ticket_timestamp(obj, request.data)

        obj.approve()
        serializer = self.get_serializer(obj, many=False)
        return Response(serializer.data)

    @action(detail=True, methods=["PUT"])
    def reject(self, request, pk=None):
        obj = self.get_object()
        if obj.is_approved is not None:
            raise exceptions.ValidationError("Cannot reject the approved request.")
        self.validate_ticket_timestamp(obj, request.data)

        request_serializer = ApprovementRejectSerializer(data=request.data)
        if request_serializer.is_valid():
            obj.reject(request_serializer.data["reason"])
            response_serializer = self.get_serializer(obj, many=False)
            return Response(response_serializer.data)
        else:
            return Response(
                request_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    @staticmethod
    def validate_ticket_timestamp(obj, data, raise_exception=True):
        if "ticket_timestamp" in data:
            iso_datetime = data["ticket_timestamp"].replace("Z", "+00:00")
            ticket_timestamp = datetime.fromisoformat(iso_datetime)
            if ticket_timestamp == obj.ticket.updated_at:
                return

        error = Conflict("Ticket was updated while you are review.")
        if raise_exception:
            raise error
        else:
            return error

    @property
    def current_approver(self):
        current_user = self.request.user
        return Approver.objects.filter(user=current_user).first()
