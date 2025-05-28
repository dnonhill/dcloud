from rest_framework import views, permissions, status

from .models import FormConfig
from .serializer import FormConfigSetSerializer


class FormConfigView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, **kwargs):
        """
        Return list of configs as given page+field in sub url
        result is grouped by page and field
        """
        page = kwargs.get("page", None)
        field = kwargs.get("field", None)

        queryset = FormConfig.objects.filter(page=page)
        if field is not None:
            queryset = queryset.filter(field=field)

        return views.Response(
            status=status.HTTP_200_OK,
            data=FormConfigSetSerializer(queryset.all()).data
        )
