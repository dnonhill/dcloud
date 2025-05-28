from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin

from cloudform.projects.models import ServiceInventory
from cloudform.projects.serializers.service_inventory import ServiceInventorySerializer


class ServiceInventoryViewSet(ListModelMixin, GenericAPIView):
    permission_classes = ()
    queryset = ServiceInventory.objects.all_active()
    serializer_class = ServiceInventorySerializer

    def get(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {"results": response.data}
        return response
