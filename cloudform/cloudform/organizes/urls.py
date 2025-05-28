from django.urls import path

from cloudform.organizes.views import OrganizeView

urlpatterns = [
    path(
        "organizes/",
        OrganizeView.as_view(),
    ),
]
