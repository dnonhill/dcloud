from channels.auth import AuthMiddlewareStack
from channels.http import AsgiHandler
from channels.routing import ProtocolTypeRouter, URLRouter
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.decorators.csrf import csrf_exempt

from cloudform.users.views import ChangeLDAPPasswordView

urlpatterns = [
    path("admin/", admin.site.urls),
    path('captcha/', include('captcha.urls')),
    path("", csrf_exempt(ChangeLDAPPasswordView.as_view())),
]


application = ProtocolTypeRouter(
    {"http": AuthMiddlewareStack(URLRouter([re_path("", AsgiHandler)]))}
)
