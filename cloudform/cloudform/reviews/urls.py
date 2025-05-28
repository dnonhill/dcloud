from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ReviweViewSet


router = DefaultRouter()
router.register("reviews", ReviweViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
]