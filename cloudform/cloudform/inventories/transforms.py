import json
from django.core.exceptions import ValidationError
from cloudform.pricing.models import PriceSetting
from cloudform.inventories.fixture import Fixture


class Inventorytransform:
    def transform(resource_detail, vm_detail):
        if isinstance(vm_detail, str):
            vm_detail = json.loads(vm_detail)
        if vm_detail.get("type"):
            return resource_detail

        resource_detail["cpu"] = vm_detail["cpu"]["count"]
        resource_detail["memory"] = int(vm_detail["memory"]["size_MiB"] / 1024)
        resource_detail["memory_mb"] = vm_detail["memory"]["size_MiB"]
        resource_detail["power_state"] = vm_detail["power_state"]

        disks = vm_detail["disks"]
        disk_key_list = []
        for k in iter(disks):
            disk_key_list.append(k)
        for key in disk_key_list:
            if disks[key]["label"] == "Hard disk 1":
                resource_detail["os_disk"] = int(disks[key]["capacity"] / (1024 ** 3))
            elif disks[key]["label"] == "Hard disk 2":
                resource_detail["data_disk_1_size"] = int(disks[key]["capacity"] / (1024 ** 3))
            elif disks[key]["label"] == "Hard disk 3":
                resource_detail["data_disk_2_size"] = int(disks[key]["capacity"] / (1024 ** 3))
            else:
                resource_detail["data_disk_2_size"] = int(disks[key]["capacity"] / (1024 ** 3))

        return resource_detail

    def transform_openshift(resource_detail, openshift_detail):
        if isinstance(openshift_detail, str):
            openshift_detail = json.loads(openshift_detail)
        if openshift_detail.get("items"):
            item = openshift_detail["items"][0]["spec"]["hard"]
            resource_detail["cpu"] = int(item["limits.cpu"])
            resource_detail["memory"] = int(item["limits.memory"].split("Gi")[0])
            resource_detail["main_storage"] = int(item["requests.storage"].split("Gi")[0])
            return resource_detail
        return resource_detail

    def transform_price_detail(resource_detail):
        price_detail = []
        categories = []
        for resource in resource_detail:
            category = resource["category"]["buckets"][0]["key"]
            temp_price_detail = next((item for item in price_detail if item["name"] == resource["key"]), None)
            if not isinstance(temp_price_detail, dict):
                price_detail.append({
                    "name": resource["key"],
                    "value": resource["total_price"]["value"],
                    "category": category,
                })
            temp_category = next((item_category for item_category in categories if item_category["name"] == category), None)
            if isinstance(temp_category, dict):
                temp_category["value"] += resource["total_price"]["value"]
            else:
                res = {
                    "name": category,
                    "value": resource["total_price"]["value"]
                }
                categories.append(res)
        price_details = sorted(price_detail, key=lambda k: k['category'])
        categories = sorted(categories, key=lambda k: k['name'])
        return {
            "price_details": price_details,
            "categories": categories
        }

    def transform_inventory_price(resource_detail):
        price_detail = []
        estimated_price = 0
        for resource in resource_detail:
            category = resource["category"]["buckets"][0]["key"]
            temp = next((item for item in price_detail if item["name"] == category), None)
            estimated_price += resource["total_price"]["value"]
            if isinstance(temp, dict):
                temp['total'] += resource["total_price"]["value"]
                temp['items'].append({
                    'hour': resource["doc_count"],
                    'price': resource["total_price"]["value"],
                    'display': resource["key"],
                })
            else:
                res = {
                    'name': category,
                    'total': resource["total_price"]["value"],
                    'items': [
                        {
                            'hour': resource["doc_count"],
                            'price': resource["total_price"]["value"],
                            'display': resource["key"],
                        }
                    ]
                }
                price_detail.append(res)
        return price_detail, estimated_price

    def transform_heapmap(resource_detail):
        heapmap = []
        for resource in resource_detail:
            hour = resource["key_as_string"]
            for heapmap_item in resource["resource"]["buckets"]:
                temp = next((item for item in heapmap if item["name"] == heapmap_item["key"]), None)
                if isinstance(temp, dict):
                    temp["result"].append({
                        'hour': hour,
                        'index': 1,
                        'value': heapmap_item["power_state_point"]["value"],
                    })
                else:
                    res = {
                        'name': heapmap_item["key"],
                        'result': [{
                            'hour': hour,
                            'index': 1,
                            'value': heapmap_item["power_state_point"]["value"],
                        }]
                    }
                    heapmap.append(res)
        return heapmap

    def transform_all_price_per_day(resource_detail):
        all_price_per_day = []
        for resource in resource_detail:
            date = resource["key_as_string"]
            total_price = resource['total_price']['value']
            all_price_per_day.append({
                'date': date,
                'price': total_price,
            })
        return all_price_per_day

    def transform_vm_info_to_spec(vm_info):
        memory = int(vm_info["memory"]["size_MiB"] / 1024)
        cpu = int(vm_info["cpu"]["count"])
        memory_mb = int(vm_info["memory"]["size_MiB"])
        os = Fixture.os(vm_info["guest_OS"])

        disks = vm_info["disks"]
        disk_key_list = []
        for k in iter(disks):
            disk_key_list.append(k)

        os_disk = disks[disk_key_list[0]]
        vmdk_file = os_disk["backing"]["vmdk_file"]
        protection_storage = Inventorytransform.get_protection_level_and_storage_tire(vmdk_file)

        if not os:
            os = {
                "display_os": "Other Operating System",
                "os_type": None,
                "distro": None,
            }

        resource_detail = {
            "memory_mb": memory_mb,
            "cpu": cpu,
            "memory": memory,
            "os_disk": 0,
            "data_disk_1_size": 0,
            "data_disk_2_size": 0,
            **os,
            **protection_storage,
        }

        for key in disk_key_list:
            if disks[key]["label"] == "Hard disk 1":
                resource_detail["os_disk"] = int(disks[key]["capacity"] / (1024 ** 3))
            elif disks[key]["label"] == "Hard disk 2":
                resource_detail["data_disk_1_size"] = int(disks[key]["capacity"] / (1024 ** 3))
            elif disks[key]["label"] == "Hard disk 3":
                resource_detail["data_disk_2_size"] = int(disks[key]["capacity"] / (1024 ** 3))
            else:
                resource_detail["data_disk_2_size"] = int(disks[key]["capacity"] / (1024 ** 3))

        return resource_detail

    def transform_openshift_to_spec(open_shift_info):
            resource_detail = {
                "cpu": 0,
                "memory": 0,
                "main_storage": 0,
            }
            item = open_shift_info["items"][0]["spec"]["hard"]
            resource_detail["cpu"] = int(item["limits.cpu"])
            resource_detail["memory"] = int(item["limits.memory"].split("Gi")[0])
            resource_detail["main_storage"] = int(item["requests.storage"].split("Gi")[0])
            temp = item.keys()
            temp = temp - ["limits.cpu",  "requests.storage", "limits.memory"]
            protection_storage = {
                "protection_level": "p4",
                "storage_tier": "silver",
            }
            return {
                **resource_detail,
                **protection_storage
            }

    def get_protection_level_and_storage_tire(name):
        name = name.lower()
        protection_levels = ["p0", "p1", "p2", "p3", "p4", "p5"]
        storage_tiers = ["bronze", "silver", "gold", "platinum"]
        protection_level = ""
        storage_tier = ""
        for index, value in enumerate(storage_tiers):
            if name.find(value) != -1:
                storage_tier = f"{index + 1}_{value}"
                continue

        for index, value in enumerate(protection_levels):
            if name.find(value) != -1:
                protection_level = value
                continue

        return {
            "protection_level": protection_level,
            "storage_tier": storage_tier,
        }
