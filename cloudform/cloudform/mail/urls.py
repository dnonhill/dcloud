from django.urls import path
from .views import alert_overdue_ticket

urlpatterns = [path("alerts/overdue-tickets/", alert_overdue_ticket)]
