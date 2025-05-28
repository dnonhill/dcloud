import json
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import GenericViewSet
from rest_framework import status
from rest_framework.decorators import api_view
from .serializers import InventorySerializer, InventorySerializerRequest, InventorySearchSerializers, InventoryListSerializer
from cloudform.projects.models.resource import Resource
from .models import Inventory, PriceDetail, InventoryList
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Q
from elasticsearch_dsl import Search, MultiSearch
from cloudform.pricing.serializers import CalculatePriceSerializer
from cloudform.pricing.models import PriceSetting
from cloudform.inventories.transforms import Inventorytransform
from cloudform.pricing.models import PriceSetting
from django.conf import settings
from cloudform.users.permissions import IsCloudAdmin, IsOperator
from rest_framework.permissions import IsAuthenticated
from cloudform.tags.models import Tag

from datetime import datetime
import pytz
from cloudform.projects.models.data_center import DataCenter
from cloudform.inventories.management.libs.datetime import to_utc
# from cloudform.inventories.management.libs.elasticsearch import create_doc_from_inventory, delete_doc
from cloudform.inventories.management.libs.inventory import get_inventorylist_price_and_power_state, list_inventory_created_between
from cloudform.inventories.management.libs.yaml import read_yaml_param


client = Elasticsearch(f'{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}')
inventoryIndex = Search(using=client, index="inventory")
logger = logging.getLogger(__name__)


# Create your views here.
class InventoryViewSet(APIView):
    permission_classes = ()

    def post(self, request):
        logger.info('CREARE INVENTORY')
        req = InventorySerializerRequest(data=request.data)
        if req.is_valid():
            logger.info(f'InventorySerializerRequest: {req.data}')
            inventory_id = req.data["inventory_id"]
            logger.info(f'inventory_id: {inventory_id}')
            inventory_list = InventoryList.objects.filter(id=inventory_id).first()
            if inventory_list:
                inventory_list.checking_inventory(request.data.get("resource_detail"))
                price_detail, power_state = self.price_calculate(request, inventory_list)
                inventory = Inventory.create_inventory(inventory_list, price_detail, power_state)
                serializer = InventorySerializer(inventory, many=False)
                return Response(serializer.data)
            logger.error('inventory_list not found')
            return Response({"message": "inventory_list not found"}, status=status.HTTP_404_NOT_FOUND)
        logger.error(str(req.error))
        return Response(req.error)

    def price_calculate(self, request, inventory_list):
        resource_detail = request.data["resource_detail"]
        specification = inventory_list.details
        power_state = None

        if inventory_list.resource_type == "vm":
            specification = Inventorytransform.transform(specification, resource_detail)
            power_state = specification.get("power_state")
        elif inventory_list.resource_type == "container-cluster":
            specification = Inventorytransform.transform_openshift(specification, resource_detail)
            power_state = "POWERED_ON"

        inventory_list.update_detail(specification)

        item = {
            "resource_type": inventory_list.resource_type,
            "specification": specification,
        }

        serializer = CalculatePriceSerializer(data=item)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data
        PriceSetting.update_latest_price_setting()
        price_detail = PriceSetting.calculate_all_per_item_in_same(items, power_state)
        price = PriceSetting.calculate_all_with_power_state(items, power_state)

        return {
            "price": price,
            "price_detail": price_detail
        }, power_state


class InventoryUserViews(APIView):
    permission_classes = (IsAuthenticated & (IsOperator | IsCloudAdmin),)

    def get(self, request):
        inventory_list = InventoryList.objects.all()
        print(inventory_list)
        serializer = InventoryListSerializer(inventory_list, many=True)
        tags = [{'value': tag.name, 'label': tag.name} for tag in Tag.objects.all()]
        res = {
            "project": [],
            "application": [],
            "name": [],
            "data_center": [],
            "job_code": [],
            "tags": tags,
        }
        for item in serializer.data:
            self.set_inventory_list_name(res, "project", item["project"])
            self.set_inventory_list_name(res, "application", item["application"])
            self.set_inventory_list_name(res, "name", item["name"])
            self.set_inventory_list_name(res, "data_center", item["data_center_ref"]['name'])
            self.set_inventory_list_name(res, "job_code", item["job_code"])
        return Response(res)

    def set_value_and_label(self, value):
        return {
            'value': value,
            'label': value
        }

    def set_inventory_list_name(self, res, name, value):
        temp = next((item for item in res[name] if item["value"] == value), None)
        if not isinstance(temp, dict):
            res[name].append(self.set_value_and_label(value))


class InventorySearchViews(GenericViewSet):
    permission_classes = ()
    MAX_TREMS = 1999999999

    def get_params_must_price_detail(self, req):
        get_when_is_must = []
        if "project" in req.data.keys():
            project_name = Q("term", inventory__project_name=req.data["project"])
            get_when_is_must.append(project_name)
        if "data_center" in req.data.keys():
            data_center = Q("term", inventory__data_center=req.data["data_center"])
            get_when_is_must.append(data_center)
        if "application" in req.data.keys():
            application_name = Q("term", inventory__application_name=req.data["application"])
            get_when_is_must.append(application_name)
        if "resource" in req.data.keys():
            vm_name = Q("term", inventory__name=req.data["resource"])
            get_when_is_must.append(vm_name)
        if "job_code" in req.data.keys():
            job_code = Q("term", inventory__job_code=req.data["job_code"])
            get_when_is_must.append(job_code)
        if "tags" in req.data.keys():
            get_when_is_must.append(Q("terms", inventory__tags=req.data["tags"]))
        return get_when_is_must

    def get_params_must_inventory(self, req):
        get_when_is_must = []
        if "project" in req.data.keys():
            project_name = Q("term", project_name=req.data["project"])
            get_when_is_must.append(project_name)
        if "data_center" in req.data.keys():
            data_center = Q("term", data_center=req.data["data_center"])
            get_when_is_must.append(data_center)
        if "application" in req.data.keys():
            application_name = Q("term", application_name=req.data["application"])
            get_when_is_must.append(application_name)
        if "resource" in req.data.keys():
            vm_name = Q("term", name=req.data["resource"])
            get_when_is_must.append(vm_name)
        if "job_code" in req.data.keys():
            job_code = Q("term", job_code=req.data["job_code"])
            get_when_is_must.append(job_code)
        if "tags" in req.data.keys():
            get_when_is_must.append(Q("terms", tags=req.data["tags"]))
        return get_when_is_must

    def get_resourece(self, req):
        resource = InventoryList.objects.filter()
        if "project" in req.data.keys():
            resource = resource.filter(project=req.data["project"])
        if "data_center" in req.data.keys():
            resource = resource.filter(data_center_ref__name=req.data["data_center"])
        if "application" in req.data.keys():
            resource = resource.filter(application=req.data["application"])
        if "resource" in req.data.keys():
            resource = resource.filter(name=req.data["resource"])
        if "job_code" in req.data.keys():
            resource = resource.filter(job_code=req.data["job_code"])
        return resource

    @action(detail=False, methods=("post",), permission_classes=(IsAuthenticated & (IsOperator | IsCloudAdmin),))
    def inventory(self, request, **kwargs):
        inventoryIndex = Search(using=client, index="inventory").extra(size=0)
        term_field = "name"
        if request.query_params.get("term"):
            term_field = request.query_params.get("term")

        req = InventorySearchSerializers(data=request.data)
        req.is_valid(raise_exception=True)

        date_range = Q(
            "range",
            create_date={
                "gte": req.data["start_date"],
                "lte": req.data["end_date"],
            }
        )
        search_query = Q(
            "bool",
            filter=[date_range],
            must=self.get_params_must_inventory(req),
        )
        print(search_query)

        search = inventoryIndex.query(search_query)
        search.aggs.bucket("price_vm", "terms", field=term_field, size=self.MAX_TREMS)\
            .metric("total_price", "sum", field="total_price")

        print(search.to_dict())
        response = search.execute().to_dict()["aggregations"]["price_vm"]["buckets"]
        return Response(response)

    @action(detail=False, methods=("post",), permission_classes=(IsAuthenticated & (IsOperator | IsCloudAdmin),))
    def power_state(self, request, **kwargs):
        inventoryIndex = Search(using=client, index="inventory").extra(size=0)
        term_field = "name"
        if request.query_params.get("term"):
            term_field = request.query_params.get("term")

        req = InventorySearchSerializers(data=request.data)
        req.is_valid(raise_exception=True)

        date_range = Q(
            "range",
            create_date={
                "gte": req.data["start_date"],
                "lte": req.data["end_date"],
            }
        )

        search_query = Q(
            "bool",
            filter=[date_range],
            must=self.get_params_must_inventory(req),
        )

        search = inventoryIndex.query(search_query)
        search.aggs.bucket("power_state", "date_histogram", field="create_date", calendar_interval="1d")\
            .metric("resource", "terms", field="name", size=self.MAX_TREMS)
        search.aggs["power_state"]["resource"].metric('power_state_point', "sum", field="power_state_point")
        response = search.execute()
        response = search.execute().to_dict()["aggregations"]["power_state"]["buckets"]
        res = Inventorytransform.transform_heapmap(response)
        newlist = sorted(res, key=lambda s: str(s["name"]).lower(), reverse=True)
        return Response(newlist)

    @action(detail=False, methods=("post",), permission_classes=(IsAuthenticated & (IsOperator | IsCloudAdmin),))
    def all_price_per_day(self, request, **kwargs):
        inventoryIndex = Search(using=client, index="inventory").extra(size=0)
        req = InventorySearchSerializers(data=request.data)
        req.is_valid(raise_exception=True)

        date_range = Q(
            "range",
            create_date={
                "gte": req.data["start_date"],
                "lte": req.data["end_date"],
            }
        )

        search_query = Q(
            "bool",
            filter=[date_range],
            must=self.get_params_must_inventory(req),
        )

        search = inventoryIndex.query(search_query)
        search.aggs.bucket("all_price_per_day", "date_histogram", field="create_date", calendar_interval="1d")\
            .metric("total_price", "sum", field="total_price")
        response = search.execute()
        response = search.execute().to_dict()["aggregations"]["all_price_per_day"]["buckets"]
        return Response(Inventorytransform.transform_all_price_per_day(response))

    @action(detail=False, methods=("post",), permission_classes=(IsAuthenticated & (IsOperator | IsCloudAdmin),))
    def price_detail(self, request, **kwargs):
        term_field = "name"
        if request.query_params.get("term"):
            term_field = request.query_params.get("term")
        req = InventorySearchSerializers(data=request.data)
        req.is_valid(raise_exception=True)

        date_range = self.price_detail_index_date_range(req)
        search_query = Q(
            "bool",
            filter=[date_range],
            must=self.get_params_must_price_detail(req),
        )
        response = self.search_price_detail(search_query, term_field)
        price_details = Inventorytransform.transform_price_detail(response)
        return Response(price_details)

    def search_price_detail(self, search_query, term_field):
        priceDetailIndex = Search(using=client, index="price_details").extra(size=0)
        search = priceDetailIndex.query(search_query)
        search.aggs.bucket("price_vm", "terms", field=term_field, size=self.MAX_TREMS)\
            .metric("total_price", "sum", field="price")
        search.aggs["price_vm"].metric('category', "terms", field="category", size=self.MAX_TREMS)
        return search.execute().to_dict()["aggregations"]["price_vm"]["buckets"]

    def price_detail_index_date_range(self, req):
        return Q(
            "range",
            inventory__create_date={
                "gte": req.data.get("start_date"),
                "lte": req.data.get("end_date"),
            }
        )

    @action(detail=False, methods=("post",), permission_classes=(IsAuthenticated & (IsOperator | IsCloudAdmin),))
    def resource_details(self, request, **kwargs):
        req = InventorySearchSerializers(data=request.data)
        req.is_valid(raise_exception=True)

        response = self.get_resourece(req)
        if len(response):
            res = []
            date_range = self.price_detail_index_date_range(req)
            for item in response:
                must = self.get_params_must_price_detail(req)
                must.append(Q("term", inventory__name=item.name))
                search_query = Q(
                    "bool",
                    filter=[date_range],
                    must=must,
                )
                els_price_detail = self.search_price_detail(search_query, "name")
                if len(els_price_detail):
                    price_detail, estimated_price = Inventorytransform.transform_inventory_price(els_price_detail)
                    res.append({
                        "action": "GET_INVENTORY_LIST",
                        "resource_type": item.resource_type,
                        "specification": {
                            "name": item.name,
                        },
                        "estimated_price": estimated_price,
                        "price_detail": price_detail,
                        "application": item.application,
                        "job_code": item.job_code,
                    })
            newlist = sorted(res, key=lambda s: str(s["specification"]["name"]).lower(), reverse=True)
            return Response(newlist)
        return Response([])


# @api_view(['POST'])
# def fix_power_state(request):
#     data = request.data
#     year = data['year']
#     month = data['month']
#     datacenter = data['datacenter']
#     app_list = data['app_list']

#     # print(datacenter)
#     # print(app_list)

#     # Get current datetime in BKK timezone
#     # and convert it to UTC
#     bkk_tz = pytz.timezone('Asia/Bangkok')
#     bkk_current = datetime.now(bkk_tz)
#     bkk_datetime = f'{year}-{int(month):02d}-{bkk_current.day:02d}'

#     # Get start and end date
#     start_date = f'{bkk_datetime} 00:00:00'
#     end_date = f'{bkk_datetime} 23:59:59'

#     # print(start_date)
#     # print(end_date)

#     # Get Datacenter full name
#     datacenter = DataCenter.objects.get(name__icontains=datacenter)
#     datacenter_name = datacenter.name

#     #
#     # Delete documents
#     #
#     for app in app_list:
#         # Delete documents in price_detils index.
#         delete_doc(to_utc(start_date), to_utc(end_date), datacenter_name, app, 'price_details')

#         # Delete documents in inventory index.
#         delete_doc(to_utc(start_date), to_utc(end_date), datacenter_name, app, 'inventory')

#         print(f'Remove documents for {app}')

#     #
#     # Create documents
#     #
#     for app in app_list:
#         # Calculate the price
#         inventorylist, price_detail, power_state = get_inventorylist_price_and_power_state(app)

#         # List of inventory that occur each hour
#         inventory_queryset = list_inventory_created_between(
#             to_utc(start_date),
#             to_utc(end_date),
#             datacenter_name,
#             app,
#         )

#         # Create documents for each hour
#         for inventory in inventory_queryset:
#             create_doc_from_inventory(inventorylist, inventory.create_date, price_detail, power_state)

#         print(f'Create documents for {app}')

#     return Response(status=201)
