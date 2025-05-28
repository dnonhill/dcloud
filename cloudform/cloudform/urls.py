"""service URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

from cloudform.views import ClientConfig
from cloudform.projects.views import ResourceViewSet


admin.site.site_header = "DCloud Administration"
admin.site.site_title = "DCloud Admin Portal"
admin.site.index_title = "Welcome to DCloud Admin Portal"


urlpatterns = (
    [
        path("api/", include("cloudform.projects.urls")),
        path("api/", include("cloudform.tickets.urls")),
        path("api/", include("cloudform.tasks.urls")),
        path("api/", include("cloudform.user_domain.urls")),
        path("api/", include("cloudform.login.urls")),
        path("api/", include("cloudform.users.urls")),
        path("api/", include("cloudform.pricing.urls")),
        path("api/", include("cloudform.mail.urls")),
        path("api/", include("cloudform.form_config.urls")),
        path("api/admin/", admin.site.urls),
        path(
            "api/applications/<int:application_id>/resources/",
            ResourceViewSet.as_view({"get": "list"}),
        ),
        path("api/", include("cloudform.health.urls")),
        path("api/", include("cloudform.reviews.urls")),
        path("api/", include("cloudform.inventories.urls")),
        path("api/", include("cloudform.jobcodes.urls")),
        path("api/", include("cloudform.organizes.urls")),
        path("api/", include("cloudform.invoices.urls")),
        path("api/", include("cloudform.organizes.urls")),
    ]
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    + (
        [
            path("config.js", ClientConfig.as_view()),
            re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
        ]
    )
)
