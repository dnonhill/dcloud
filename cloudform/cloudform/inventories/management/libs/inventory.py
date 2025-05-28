import json
from cloudform.inventories.management.libs.datetime import start_date_time_utc, end_date_time_utc
from cloudform.inventories.management.libs.vcenter import get_vm_info
from cloudform.inventories.models import Inventory, InventoryList
from cloudform.inventories.transforms import Inventorytransform
from cloudform.pricing.models import PriceSetting
from cloudform.pricing.serializers import CalculatePriceSerializer
from cloudform.projects.models.data_center import DataCenter


class CommandInventory:

    def __init__(self, command, opt):
        # All supported options
        self.name = opt.get('app_name')
        self.start_date = opt.get('start_date')
        self.end_date = opt.get('end_date')
        self.count = opt.get('count')
        self.detail = opt.get('detail')
        self.datacenter = opt.get('datacenter')

        self.handler(command)

    def handler(self, command):
        if command == 'list':
            self.list()

        if command == 'create':
            # self.create()
            pass

    def list(self):
        if all([self.name, self.start_date, self.end_date]):
            queryset = self._list_since_until()
            print(f'{self.name} {queryset.count()}')
            # for item in queryset:
            #     print(item.__dict__)

        elif all([self.datacenter]):
            queryset = self._list_by_dc()
            print(f'count: {queryset.count()}')
            for item in queryset:
                print(item.name)

    def _list_since_until(self):
        return Inventory.objects.filter(
            name=self.name,
            create_date__gte=start_date_time_utc(self.start_date),
            create_date__lte=end_date_time_utc(self.end_date)
        ).only(
            'total_price',
            'power_state',
            'create_date'
        ).order_by(
            'create_date'
        )

    def _list_by_dc(self):
        dc = DataCenter.objects.get(name__icontains=self.datacenter)
        dc_name = dc.name
        return Inventory.objects.filter(data_center=dc_name).distinct('name').only('name')


def list_inventory_created_between(start_date_utc, end_date_utc, datacenter_name, app_name):
    return Inventory.objects.filter(name=app_name, data_center=datacenter_name, create_date__range=(start_date_utc, end_date_utc)).only('id', 'name', 'total_price', 'power_state')


def get_inventorylist_price_and_power_state(app_name):
    inventory_list = InventoryList.objects.get(name=app_name)
    price_detail, power_state = price_calculate(inventory_list)
    return (inventory_list, price_detail, power_state)


def price_calculate(inventory_list):
    specification = inventory_list.details
    power_state = None

    if inventory_list.resource_type == "vm":
        vm_info = get_vm_info(inventory_list)
        specification = Inventorytransform.transform(specification, json.loads(vm_info))
        power_state = specification.get("power_state")
    elif inventory_list.resource_type == "container-cluster":
        resource_detail = {}
        specification = Inventorytransform.transform_openshift(specification, resource_detail)
        power_state = "POWERED_ON"

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

    return ({"price": price, "price_detail": price_detail}, power_state)


def price_calculate_with_power_state(inventory_list, power_state):
    specification = inventory_list.details

    if inventory_list.resource_type == "vm":
        vm_info = get_vm_info(inventory_list)

        # fix power_state
        vm_info_dict = json.loads(vm_info)
        vm_info_dict["power_state"] = power_state

        specification = Inventorytransform.transform(specification, vm_info_dict)
        power_state = specification.get("power_state")
    elif inventory_list.resource_type == "container-cluster":
        resource_detail = {}
        specification = Inventorytransform.transform_openshift(specification, resource_detail)
        power_state = "POWERED_ON"

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

    return ({"price": price, "price_detail": price_detail}, power_state)


def get_inventorylist_by_app(app_name: str):
    # Query InventoryList by application name
    return InventoryList.objects.get(name=app_name)


def list_inventory_since(app_name, since_date):
    return Inventory.objects.filter(name=app_name, create_date__gte=since_date)
