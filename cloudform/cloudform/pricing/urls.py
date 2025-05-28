from django.urls import path, include
from rest_framework.routers import DefaultRouter

from cloudform.pricing.views import PriceSettingViewSet

router = DefaultRouter()
router.register("pricing", PriceSettingViewSet, basename="pricing")

urlpatterns = [
    path("", include(router.urls)),
]
