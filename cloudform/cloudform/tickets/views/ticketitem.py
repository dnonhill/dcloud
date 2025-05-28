from rest_framework import permissions
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.viewsets import ModelViewSet

from cloudform.projects.models import Project
from cloudform.tickets.models import TicketItem
from cloudform.tickets.serializers.ticket import BriefTicketItemSerializer
from cloudform.users.models import is_user_in_op_team
from cloudform.users.permissions import IsOperationTeamCanReadOnly
from cloudform.reviews.models import IsReviewerCanReadOnly, is_user_in_reviewer_team


def query_project(request):
    kwargs = request.resolver_match.kwargs
    data = request.data
    project_id = kwargs.get("project_id") or data.get("project")
    application_id = kwargs.get("application_id") or data.get("application")
    ticket_id = kwargs.get("ticket_id") or data.get("ticket")
    resource_id = kwargs.get("resource_id") or data.get("resource")

    if project_id:
        return Project.objects.filter(id=project_id)
    elif application_id:
        return Project.objects.filter(applications=application_id)
    elif ticket_id:
        return Project.objects.filter(applications__tickets=ticket_id)
    elif resource_id:
        return Project.objects.filter(applications__resources=resource_id)
    else:
        return Project.objects.none()


class IsProjectMember(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        super().has_permission(request, view)
        if request.method in permissions.SAFE_METHODS:
            return True

        return query_project(request).filter(members=request.user).exists()

    def has_object_permission(self, request, view, obj):
        current_user = request.user
        return obj.ticket.application.project.has_member(current_user)


class TicketItemViewSet(ModelViewSet):

    permission_classes = (IsOperationTeamCanReadOnly | IsProjectMember | IsReviewerCanReadOnly,)
    serializer_class = BriefTicketItemSerializer
    queryset = TicketItem.objects

    ordering_fields = ["created_at"]
    order = ["created_at"]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        query = self.queryset

        if not self._is_all_query():
            query = query.filter(
                ticket__application__project__members=self.request.user
            )
        if "resource_id" in self.kwargs:
            query = query.filter(resource=self.kwargs["resource_id"])

        return query

    def _is_all_query(self):
        current_user = self.request.user
        query_params = self.request.query_params
        return (is_user_in_op_team(current_user) or is_user_in_reviewer_team(current_user)) and (
            "all" in query_params if self.action == "list" else True
        )
