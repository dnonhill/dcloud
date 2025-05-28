from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response

from cloudform.tasks.models import Assignment, TaskGroup
from cloudform.tasks.serializers import (
    TaskGroupSerializer,
    TaskGroupBriefSerializer,
    TaskSerializer,
)
from cloudform.users.models import Group
from cloudform.users.permissions import IsOperator


class TaskGroupPermission(IsAuthenticated):
    READONLY_GROUPS = [Group.CLOUD_ADMIN, Group.OPERATOR]
    READ_ALL_GROUPS = [Group.CLOUD_ADMIN]

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            current_groups = self.extract_user_groups(request)
            can_ops_tem = any(
                (group for group in current_groups if group in self.READONLY_GROUPS)
            )
            return can_ops_tem

        return IsOperator().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            current_groups = self.extract_user_groups(request)
            can_read_all = any(
                (group for group in current_groups if group in self.READ_ALL_GROUPS)
            )
            return can_read_all or self.is_assignee(request, obj)

        return self.is_assignee(request, obj)

    @staticmethod
    def extract_user_groups(request):
        current_user = request.user
        current_groups = current_user.groups.values_list("name", flat=True)
        return current_groups

    @staticmethod
    def is_assignee(request, obj):
        return (
            Assignment.objects.filter(ticket__items=obj.ticket_item.id)
            .filter(assignee=request.user.id)
            .exists()
        )


class TaskGroupViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (TaskGroupPermission,)
    queryset = TaskGroup.objects
    serializer_class = TaskGroupSerializer

    def get_queryset(self):
        queryset = TaskGroup.objects
        if "assignment_id" in self.kwargs:
            assignment_id = self.kwargs["assignment_id"]
            queryset = queryset.filter(ticket_item__ticket__assignments=assignment_id)

        return queryset

    def list(self, request, *args, **kwargs):
        self.serializer_class = TaskGroupBriefSerializer
        return super().list(request, *args, **kwargs)

    @action(detail=True, url_path="mark-complete", methods=["post"])
    def mark_complete(self, request, pk=None):
        obj = self.get_object()
        obj.mark_complete(request.data.get("result", {}))

        return Response(status=status.HTTP_200_OK)

    @action(detail=True, url_path="collect-results", methods=["get"])
    def collect_results(self, request, pk=None):
        obj = self.get_object()
        results = obj.collect_results()
        return Response(
            status=status.HTTP_200_OK, data={"results": results}
        )

    @action(detail=True, url_path="tasks", methods=["get", "post"])
    def tasks(self, request, pk=None):
        self.serializer_class = TaskSerializer

        if request.method == "GET":
            obj = self.get_object()
            tasks = obj.tasks.order_by("sequence").all()
            serializer = self.get_serializer(tasks, many=True)

            return Response(data=serializer.data)

        elif request.method == "POST":
            data = {"task_group": pk, **request.data}
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(data=serializer.data, status=status.HTTP_201_CREATED)
