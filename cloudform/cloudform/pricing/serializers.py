from rest_framework.serializers import ModelSerializer

from cloudform.tickets.models import TicketItem


class CalculatePriceSerializer(ModelSerializer):
    class Meta:
        fields = ("resource_type", "specification")
        model = TicketItem
