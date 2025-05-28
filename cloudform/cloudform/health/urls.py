from django.urls import path

from cloudform.health.views import HealthCheck

urlpatterns = [
    path("health/", HealthCheck.as_view()),
]
