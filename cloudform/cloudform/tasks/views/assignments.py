from django_filters import filters, FilterSet
from django.db import transaction
from rest_framework import mixins, viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response

from cloudform.tasks.models import Assignment
from cloudform.tasks.serializers import (
    AssignmentBriefSerializer,
    AssignmentCreateSerializer,
    ReassignSerializer,
)
from cloudform.tasks.serializers.assignment import AssignmentBriefNoteSerializer
from cloudform.users.models import is_user_in_op_team
from cloudform.users.permissions import IsCloudAdmin, IsOperator


class AssignmentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "create":
            return IsCloudAdmin().has_permission(request, view)
        else:
            return is_user_in_op_team(request.user)

    def has_object_permission(self, request, view, obj):
        is_assignee = obj.assignee == request.user
        if is_assignee:
            return True
        if request.method in SAFE_METHODS:
            return IsCloudAdmin().has_permission(request, view)

        return False


class AssignmentFilter(FilterSet):
    status = filters.CharFilter("status", method="filter_active")

    def filter_active(self, queryset, name, value):
        if value == "active":
            return queryset.filter(active_flag=True)
        if value == "archived":
            return queryset.filter(active_flag=False)
        return queryset

    class Meta:
        model = Assignment
        fields = {"ticket__ticket_no": ["exact", "startswith"]}


class AssignmentsViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    #### ASSIGNMENT
    [/api/assignments/to-me](/api/assignments) <br/>
    """

    permission_classes = (AssignmentPermission,)
    serializer_class = AssignmentBriefSerializer

    filterset_class = AssignmentFilter
    ordering_fields = ["created_at"]
    ordering = ["created_at"]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        queryset = Assignment.objects.select_related(
            "ticket", "ticket__application", "ticket__application__project"
        )

        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                "ticket__created_by",
                "ticket__updated_by",
                "ticket__items",
                "ticket__data_center",
                "ticket__created_by",
                "ticket__updated_by",
            )

        if self.action == "list":
            current_user = self.request.user
            queryset = queryset.filter(assignee=current_user)

        return queryset

    def create(self, request, *args, **kwargs):
        self.serializer_class = AssignmentCreateSerializer

        with transaction.atomic():
            return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["POST"], permission_classes=(IsCloudAdmin,))
    def reassign(self, request, pk=None):
        request_serializer = ReassignSerializer(
            data=request.data, context={"request": request}
        )
        request_serializer.is_valid(raise_exception=True)

        assignment = self.get_object()
        if not assignment.active_flag:
            raise MethodNotAllowed(detail="Assignment is done.", method="POST")

        request_serializer.update(assignment, request_serializer.validated_data)

        response_serializer = self.get_serializer(assignment)
        return Response(status=status.HTTP_200_OK, data=response_serializer.data)

    @action(detail=True, methods=["POST"])
    def close(self, request, pk=None):
        assignment = self.get_object()
        note = request.data.get("note", None)
        assignment.close(note)

        return Response(status=status.HTTP_200_OK)


class AssignmentByTicketView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, **kwargs):
        ticket_id = request.resolver_match.kwargs.get("ticket_id")
        assignment = get_object_or_404(Assignment, ticket__id=ticket_id)
        serializer = AssignmentBriefSerializer(assignment, minimal=True)
        return Response(serializer.data)
    
class NoteAssignment(views.APIView):
    permission_classes = (IsAuthenticated & (IsOperator | IsCloudAdmin),)

    def get(self, request, **kwargs):
        assignment_id = request.resolver_match.kwargs.get("assignment_id")
        assignment = get_object_or_404(Assignment, id=assignment_id)
        serializer = AssignmentBriefNoteSerializer(assignment, minimal=True)
        return Response(serializer.data)
    
    
class NoteByTicketAssignment(views.APIView):
    permission_classes = (IsAuthenticated & (IsOperator | IsCloudAdmin),)

    def get(self, request, **kwargs):
        ticket_id = request.resolver_match.kwargs.get("ticket_id")
        assignment = get_object_or_404(Assignment, ticket__id=ticket_id)
        serializer = AssignmentBriefNoteSerializer(assignment, minimal=True)
        return Response(serializer.data)
