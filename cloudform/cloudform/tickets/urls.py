from rest_framework.routers import DefaultRouter
from django.urls import include, path

from cloudform.tickets.views import (
    TicketViewSet,
    ApproverApprovementViewSet,
    DataCenterListView,
    ApproversByDataCenter,
)
from cloudform.tickets.views.ticketitem import TicketItemViewSet

router = DefaultRouter()
router.register("tickets", TicketViewSet, basename="ticket")
router.register(
    "approvements", ApproverApprovementViewSet, basename="approver-approvement"
)

application_router = DefaultRouter()
application_router.register("tickets", TicketViewSet, basename="ticket")

resource_router = DefaultRouter()
resource_router.register("ticketitems", TicketItemViewSet, basename="ticketitem")

urlpatterns = [
    path("", include(router.urls)),
    path("applications/<int:application_id>/", include(application_router.urls)),
    path("data-centers/", DataCenterListView.as_view()),
    path("data-centers/<int:data_center>/approvers/", ApproversByDataCenter.as_view()),
    path("resources/<int:resource_id>/", include(resource_router.urls)),
]
