import requests
from django.http import HttpResponse

from django.shortcuts import get_object_or_404
from rest_framework import views, viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from cloudform.login.views import SessionTokenObtainPairView
from cloudform.users.models import User, Group, LocalUser
from cloudform.user_domain.models import UserDomain
from ..serializers import (
    UserListSerializer,
    UserDetailSerializer,
    PasswordResetSerializer,
    EditProfileSerializer, ChangePasswordSerializer)


class UsersByGroupView(views.APIView):
    """
    #### Get
    - [/groups/{group_name}/](/groups/approver/) <br/>
        ** [GET]: list** users in group
    """

    ALLOWED_GROUPS = (Group.OPERATOR,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, **kwargs):
        group_name = kwargs.get("group_name", "")
        if group_name not in self.ALLOWED_GROUPS:
            return Response(status=status.HTTP_404_NOT_FOUND)

        queryset = User.objects.filter(groups__name=group_name).all()
        if group_name == Group.OPERATOR:
            queryset = queryset.filter(is_active=True)
        serializer = UserListSerializer(queryset, many=True)
        return Response({"results": serializer.data})


class UserViewSet(viewsets.ViewSet):
    """
    #### Get
    - [/users/profile] <br />
      **[GET]:** Fetch my profile

    - [/users/{username}] <br />
      **[GET]:** Fetch profile of another person as given username
    """

    permission_classes = (IsAuthenticated,)

    def retrieve(self, request, pk=None):
        if not pk:
            return Response(status=status.HTTP_404_NOT_FOUND)

        queryset = (
            User.objects.filter(username=pk)
            .prefetch_related("groups")
            .select_related("approver", "reviewer")
        )

        user = get_object_or_404(queryset)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def profile(self, request):
        current_user = self.request.user
        serializer = UserDetailSerializer(current_user)

        return Response(serializer.data)


class AuthenticatorView(views.APIView):
    permission_classes = ()

    def post(self, request):
        if "domain" in request.data:
            domain = request.data["domain"]
            return self._authenticate_with_another_service(request, domain)
        else:
            return self._authenticate_with_current_db(request)

    def _authenticate_with_another_service(self, request, domain):
        url = self.get_token_url(domain)
        data = {
            "username": request.data["username"],
            "password": request.data["password"],
        }
        response = requests.post(url, json=data)

        return HttpResponse(
            response.content,
            content_type="application/json",
            status=response.status_code,
        )

    def _authenticate_with_current_db(self, request):
        view = SessionTokenObtainPairView()
        view.initial(request)
        view.request = request

        return view.post(request)

    def get_token_url(self, domain):
        domain = get_object_or_404(UserDomain, name=domain)
        token_url = f"{domain.endpoint}token/"
        return token_url


class LocalUserViewSet(viewsets.GenericViewSet):
    lookup_field = "username"
    lookup_value_regex = "[0-9A-z@.-]+"
    queryset = LocalUser.objects

    permission_classes = (permissions.AllowAny,)

    @action(detail=True, url_path="reset-password", methods=["post"])
    def reset_password(self, request, **kwargs):
        user = self.get_object()
        request_serializer = PasswordResetSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        request_serializer.update(
            instance=user, validated_data=request_serializer.validated_data
        )

        return Response(status=status.HTTP_200_OK)

    @action(detail=True, url_path="forget-password", methods=["post"])
    def forget_password(self, request, **kwargs):
        user = self.get_object()
        user.trigger_reset_password()

        return Response(status=status.HTTP_200_OK)


class ProfileEditViewSet(viewsets.GenericViewSet):
    class LocalUserPermission(permissions.BasePermission):
        def has_permission(self, request, view):
            current_user = request.user
            return current_user and current_user.is_local

    permission_classes = (LocalUserPermission,)

    @action(detail=False, url_path="edit", methods=["post"])
    def edit_profile(self, request, **kwargs):
        user = self._get_current_user()
        serializer = EditProfileSerializer(data=request.data)

        if serializer.is_valid():
            serializer.update(user, serializer.validated_data)
            return Response(status=status.HTTP_200_OK)

    @action(detail=False, url_path="change-password", methods=["post"])
    def change_password(self, request, **kwargs):
        user = self._get_current_user()
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            serializer.update(user, serializer.validated_data)
            return Response(status=status.HTTP_200_OK)

    def _get_current_user(self):
        return self.request.user
