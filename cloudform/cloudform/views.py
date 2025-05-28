from django.conf import settings
from django.contrib.sites.models import Site
from django.shortcuts import render
from django.views import View


class ClientConfig(View):
    def _is_secure(self, request):
        if hasattr(settings, "DCLOUD_FORCE_SECURE_REQUEST"):
            if settings.DCLOUD_FORCE_SECURE_REQUEST:
                return True
        return request.is_secure()

    def get(self, request):
        config = {
            "DEBUG": str(settings.CLIENT_DEBUG).lower(),
            "API_HOST": (self.api_host(request)),
            "WS_HOST": (self.ws_host(request)),
            "DOCS_URL": (self.docs_url(request)),
        }
        return render(
            request, "config.js.j2", {"config": config}, "application/javascript"
        )

    def ws_host(self, request):
        site = Site.objects.get_current()
        ws_url = f"{self._format_wsurl(request, site.domain)}/ws/"
        return ws_url

    def api_host(self, request):
        site = Site.objects.get_current()
        api_host = f"{self._format_httpurl(request, site.domain)}/api/"
        return api_host

    def docs_url(self, request):
        site = Site.objects.get_current()
        fallback_domain = f"{site.domain}/docs"
        docs_url = getattr(settings, "DOCS_URL", None) or self._format_httpurl(
            request, fallback_domain
        )
        return docs_url

    def _format_httpurl(self, request, domain):
        protocol = "https://" if self._is_secure(request) else "http://"
        http_url = f"{protocol}{domain}"
        return http_url

    def _format_wsurl(self, request, domain):
        ws_host_prefix = "wss://" if self._is_secure(request) else "ws://"
        ws_host = f"{ws_host_prefix}{domain}"
        return ws_host
