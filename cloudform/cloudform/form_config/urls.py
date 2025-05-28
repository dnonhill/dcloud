from django.urls import path

from .view import FormConfigView


urlpatterns = [
    path("form-config/<page>/", FormConfigView.as_view()),
    path("form-config/<page>/<field>/", FormConfigView.as_view()),
]
