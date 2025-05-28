# Create your views here.
import logging

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from cloudform.pricing.models import PriceSetting
from cloudform.pricing.serializers import CalculatePriceSerializer

logger = logging.getLogger(__name__)


class PriceSettingViewSet(GenericViewSet):
    permission_classes = ()

    @action(detail=False, methods=("get",), permission_classes=())
    def calculate(self, request, **kwargs):
        logger.info(f'#---Start function: PriceSettingViewSet.calculate---#')

        serializer = CalculatePriceSerializer(data=request.query_params)
        logger.info(f'serializer <= {str(serializer)}')

        serializer.is_valid(raise_exception=True)

        item = serializer.validated_data
        logger.info(f'item <= {str(item)}')

        PriceSetting.update_latest_price_setting()
        price = PriceSetting.calculate_all(item)
        price_list = PriceSetting.calculate_all_per_item(item)

        logger.info(f'#---End function: PriceSettingViewSet.calculate---#')
        return Response(data={"price": price, "price_detail": price_list})
