from django.urls import include, path
from rest_framework.routers import DefaultRouter

from cloudform.projects.views import ApplicationViewSet, ProjectViewSet, ResourceViewSet
from cloudform.projects.views.app_relation import AppRelationViewSet
from cloudform.projects.views.service_inventories import ServiceInventoryViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet)
router.register("applications", ApplicationViewSet)
router.register("resources", ResourceViewSet)
router.register("app_relations", AppRelationViewSet)

project_router = DefaultRouter()
project_router.register(
    "applications", ApplicationViewSet, basename="nested-applications"
)

application_router = DefaultRouter()
application_router.register("resources", ResourceViewSet, basename="nested-resources")

urlpatterns = [
    path("", include(router.urls)),
    path("projects/<int:project_id>/", include(project_router.urls)),
    path("applications/<int:application_id>/", include(application_router.urls)),
    path("service_inventories/", ServiceInventoryViewSet.as_view()),
]
