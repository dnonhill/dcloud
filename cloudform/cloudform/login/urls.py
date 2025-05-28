from django.conf import settings
from django.conf.urls import url
from django.contrib.auth.views import LogoutView
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import SessionTokenObtainPairView

urlpatterns = [
    path("token/", SessionTokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    url(
        r"^logout/$",
        LogoutView.as_view(),
        {"next_page": settings.LOGOUT_REDIRECT_URL},
        name="logout",
    ),
]
