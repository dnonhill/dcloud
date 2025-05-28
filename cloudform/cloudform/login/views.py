import logging

from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from cloudform.users.serializers import UserDetailSerializer

logger = logging.getLogger(__name__)


class SessionTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["custom-role"] = "user"

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        current_user = self.user
        data["profile"] = UserDetailSerializer(current_user).data

        return data


class SessionTokenObtainPairView(TokenObtainPairView):
    serializer_class = SessionTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        view = super().post(request, args, kwargs)

        username = request.data["username"]
        password = request.data["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            logger.info(f"User {username} logged in.")

        return view
