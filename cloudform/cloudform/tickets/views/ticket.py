from django.db.models import Q
from django_filters.rest_framework import FilterSet, filters
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, APIException, NotFound
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from cloudform.projects.models import Application
from cloudform.tickets.models import Ticket
from cloudform.tickets.models.ticket import ActiveTicketQuerySet
from cloudform.tickets.serializers import TicketSerializer, ApprovementBriefSerializer
from cloudform.users.models import is_user_in_op_team
from cloudform.users.permissions import IsOperationTeamCanReadOnly, IsCloudAdmin
from cloudform.reviews.serializers import ReviewBriefSerializer
from cloudform.reviews.models import IsReviewerCanReadOnly, is_user_in_reviewer_team


class IsProjectMember(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        super().has_permission(request, view)
        if request.method in permissions.SAFE_METHODS:
            return True

        current_user = request.user
        application_id = request.resolver_match.kwargs.get(
            "application_id"
        ) or request.data.get("application")
        selected_app = Application.objects.filter(pk=application_id)

        return (
            application_id is not None
            and selected_app.filter(project__members=current_user).exists()
        )

    def has_object_permission(self, request, view, obj):
        current_user = request.user
        return obj.application.project.has_member(current_user)


class TicketFilter(FilterSet):
    status = filters.CharFilter("status", method="filter_status")
    fullname = filters.CharFilter("created_by", method="filter_fullname")
    operator_name = filters.CharFilter("ticket__assignments", method="filter_operator_name")
    ACTIVE_STATUSES = ("created", "approved", "assigned", "commented",)

    def filter_status(self, queryset, name, value):
        if value == "active":
            return ActiveTicketQuerySet.active(queryset)
        elif value == "all":
            return queryset
        else:
            return queryset.filter(status=value)

    def filter_fullname(self, queryset, name, value):
        return queryset.filter(
            Q(created_by__first_name__icontains=value)
            | Q(created_by__last_name__icontains=value)
        )

    def filter_operator_name(self, queryset, name, value):
        return queryset.filter(
            Q(assignments__assignee__first_name__icontains=value)
            | Q(assignments__assignee__last_name__icontains=value)
        )

    class Meta:
        model = Ticket
        fields = {
            "ticket_no": ["exact", "startswith", "contains"],
        }


class StatusNotAllowed(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "bad_request"

    def __init__(self, action_name: str, current_status: str, expected_status: str):
        self.detail = f"Cannot {action_name} the {current_status} ticket. Expect ticket to be {expected_status}"


class TicketViewSet(ModelViewSet):
    """
    #### REQUESTS

    - [/api/applications/?application_id={application_id}](/api/requests/) <br/>
        **[GET]: list active** requests under [application](/api/application/)
            of current user which id={application} <br/>
        ** *intentionally deny to list all requests without specify application ** <br/>
        **[POST]: create** request (prefer to create via [POST]:
            /api/applications/{application_id}/requests/](/api/applications/1/requests/)) <br/>

    - [/api/requests/{pk}/](/api/requests/1/) <br/>
        **[GET]: show details** of request which id={pk} <br/>
        **[PUT]: update** request (prefer to update via
            [PUT]: /api/projects/{project_id}/requests/{pk}/](/api/projects/1/requests/1/))
    """

    permission_classes = (IsOperationTeamCanReadOnly | IsReviewerCanReadOnly | IsProjectMember,)
    serializer_class = TicketSerializer
    queryset = Ticket.objects

    filterset_class = TicketFilter
    ordering_fields = ["created_at"]
    order = ["created_at"]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        query = Ticket.objects.select_related(
            "application", "application__project", "created_by", "updated_by"
        ).prefetch_related("data_center")
        if not self._is_all_query():
            query = query.filter(application__project__members=self.request.user)
        if "application_id" in self.kwargs:
            query = query.filter(application=self.kwargs["application_id"])
        return query

    def _is_all_query(self):
        current_user = self.request.user
        query_params = self.request.query_params
        return (is_user_in_op_team(current_user) or is_user_in_reviewer_team(current_user)) and (
            "all" in query_params if self.action == "list" else True
        )

    def update(self, request, *args, **kwargs):
        ticket = self.get_object()
        if not ticket.is_editable:
            raise MethodNotAllowed(
                detail="Approved ticket is not editable.", method="PUT"
            )

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["GET"])
    def approvement(self, request, pk=None):
        ticket = Ticket.objects.get(pk=pk)
        approvement = ticket.active_approvement.order_by('-approver_level')
        if approvement is None:
            raise NotFound()

        serializer = ApprovementBriefSerializer(approvement, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["GET"])
    def reviewing(self, request, pk=None):
        ticket = Ticket.objects.get(pk=pk)
        reviewing = ticket.active_reviewing.order_by('-requested_at')
        if reviewing is None:
            raise NotFound()

        serializer = ReviewBriefSerializer(reviewing, many=True)
        return Response(serializer.data)

    @action(methods=["POST"], detail=True, permission_classes=(IsCloudAdmin,))
    def close(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status != "approved":
            raise StatusNotAllowed("close", ticket.status, "approved")

        ticket.close(request.user, request.data.get("note_from_operator"))
        serializer = self.get_serializer(ticket)
        return Response(data=serializer.data)
