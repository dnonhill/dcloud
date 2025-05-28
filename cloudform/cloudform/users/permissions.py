from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from cloudform.reviews.models import Reviewer

from .models import Group


class CloudFormBasePermission(IsAuthenticated):
    group_name = ""

    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            raise PermissionDenied()

        current_user = request.user
        current_groups = current_user.groups.values_list("name", flat=True)
        return self.group_name in current_groups

    def has_object_permission(self, request, view, obj):
        return True


class IsCloudAdmin(CloudFormBasePermission):
    group_name = Group.CLOUD_ADMIN


class IsOperator(CloudFormBasePermission):
    group_name = Group.OPERATOR


class IsRequestor(CloudFormBasePermission):
    group_name = Group.REQUESTOR


class IsOperationTeamCanReadOnly(IsAuthenticated):
    ADMIN_GROUP = [Group.CLOUD_ADMIN, Group.OPERATOR]

    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            return False

        return request.method in SAFE_METHODS and self._is_op_team(request)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

    def _is_op_team(self, request):
        current_user = request.user
        current_groups = current_user.groups.values_list("name", flat=True)
        return any((group for group in current_groups if group in self.ADMIN_GROUP))
