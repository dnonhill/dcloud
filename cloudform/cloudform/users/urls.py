from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuthenticatorView,
    UsersByGroupView,
    UserViewSet,
    LocalUserViewSet,
    ProfileEditViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
router.register("external-users", LocalUserViewSet, basename="externalUsers")

users_router = DefaultRouter()
users_router.register("profile", ProfileEditViewSet, basename="profile-edit")

urlpatterns = [
    path("groups/<str:group_name>/users/", UsersByGroupView.as_view()),
    path("auth/token/", AuthenticatorView.as_view()),
    path("", include(router.urls)),
    path("users/", include(users_router.urls)),
]
