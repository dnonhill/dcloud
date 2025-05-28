from django.urls import include, path
from rest_framework.routers import DefaultRouter

from cloudform.invoices.views import InvoiceViewSet

router = DefaultRouter()

urlpatterns = [
    path("", include(router.urls)),
    path("invoices/", InvoiceViewSet.as_view()),
]
