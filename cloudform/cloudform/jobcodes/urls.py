from django.urls import path
from .views import JobCodeView

urlpatterns = [
    path(
        "job-code/<str:job_code>",
        JobCodeView.as_view(),
    ),
]
