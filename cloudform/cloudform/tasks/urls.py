from rest_framework.routers import DefaultRouter
from django.urls import include, path

from cloudform.tasks.views import (
    TaskViewSet,
    AssignmentsViewSet,
    TaskGroupViewSet,
    AssignmentByTicketView,
)
from cloudform.tasks.views.assignments import NoteAssignment, NoteByTicketAssignment


main_router = DefaultRouter()
main_router.register("tasks", TaskViewSet)
main_router.register("assignments", AssignmentsViewSet, basename="assignments")
main_router.register("task-groups", TaskGroupViewSet, basename="task-groups")
main_router.register("tasks", TaskViewSet, basename="tasks")

assignment_nested_router = DefaultRouter()
assignment_nested_router.register("task-groups", TaskGroupViewSet)

urlpatterns = [
    path("", include(main_router.urls)),
    path("tickets/<int:ticket_id>/assignment/", AssignmentByTicketView.as_view()),
    path("notes/<int:assignment_id>/assignment/", NoteAssignment.as_view()),
    path("notes/<int:ticket_id>/ticket/", NoteByTicketAssignment.as_view()),
    path("assignments/<int:assignment_id>/", include(assignment_nested_router.urls)),
]
