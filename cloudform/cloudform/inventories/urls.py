from django.urls import path, include
from .views import (
   InventoryViewSet,
   InventorySearchViews,
   InventoryUserViews,
   # fix_power_state,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("inventory/search", InventorySearchViews, basename="search")

urlpatterns = [
   path("", include(router.urls)),
   path("inventory/", InventoryViewSet.as_view()),
   path("inventory/option/", InventoryUserViews.as_view()),
   # path("fix_power_state/", fix_power_state),
]
