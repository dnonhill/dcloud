from django.urls import path

from cloudform.user_domain.views import UserDomainSearchView, UserDomainViewSet

urlpatterns = [
    path("userdomain/search/", UserDomainSearchView.as_view()),
    path("userdomain/", UserDomainViewSet.as_view({"get": "list"})),
]
