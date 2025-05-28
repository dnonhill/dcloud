from pprint import pprint
from django.core.management.base import BaseCommand
from elasticsearch import Elasticsearch
import calendar


class Command(BaseCommand):

    def handle(self, *args, **options):
        #
        # User input
        #
        app_list = [
            "pds-adfspx-p02",
            "pds-adfspx-p01",
            "pds-adfs-p02",
            "pds-adfs-p01",
        ]
        datacenter = "PTTDIGITAL Cloud - PTTDIGITAL"
        year = 2024
        fix_month = 6
        template_month = 7

        #
        # Replace throughout the month
        #
        es = Elastic()
        days_in_month = calendar.monthrange(year, fix_month)[1]
        for host in app_list:
            for day in range(1, days_in_month + 1):
                print(f"{year}-{fix_month}-{day}")
                for hour in range(24):
                    print(f"hour: {hour:02}")
                    es.remove_inventory_by_hour(host, datacenter, year, fix_month, day, hour)
                    es.remove_pricedetail_by_hour(host, datacenter, year, fix_month, day, hour)
                    es.copy_inventory(host, datacenter, year, template_month, fix_month, day, hour)
                    es.copy_pricedetail(host, datacenter, year, template_month, fix_month, day, hour)


class Elastic:
    def __init__(self):
        self.es = Elasticsearch()

    def get_pricedetail_by_id(self, id):
        return self.es.get(index="price_details", id=id)

    def delete_pricedetail(self, id):
        return self.es.delete(index="price_details", id=id)

    def get_pricedetail_by_hour(self, host, datacenter, year, month, day, hour):
        start = f"{year}-{month:02}-{day:02}T{hour:02}:00"
        end = f"{year}-{month:02}-{day:02}T{hour:02}:59"

        return self.es.search(
            index="price_details",
            body={
                "query": {
                    "bool": {
                        "filter": [{
                            "range": {
                                "inventory.create_date": {
                                    "gte": start,
                                    "lte": end
                                }
                            }
                        }],
                        "must": [
                            {
                                "term": {"inventory.data_center": datacenter}
                            },
                            {
                                "term": {"inventory.application_name": host}
                            },
                        ]
                    }
                }
            }
        )

    def remove_pricedetail_by_hour(self, host, datacenter, year, month, day, hour):
        resp = self.get_pricedetail_by_hour(host, datacenter, year, month, day, hour)

        # Do nothing, if no index found
        if resp["hits"]["total"]["value"] == 0:
            return

        hits = resp["hits"]["hits"]
        for doc in hits:
            name = doc["_source"]["name"]
            create_date = doc["_source"]["inventory"]["create_date"]
            print(f"Delete PRICE_DETAIL name => {name} create_at => {create_date}")
            self.delete_pricedetail(doc["_id"])

    def get_inventory_by_id(self, id):
        return self.es.get(index="inventory", id=id)

    def delete_inventory(self, id):
        return self.es.delete(index="inventory", id=id)

    def get_inventory_by_hour(self, host, datacenter, year, month, day, hour):
        start = f"{year}-{month:02}-{day:02}T{hour:02}:00"
        end = f"{year}-{month:02}-{day:02}T{hour:02}:59"

        return self.es.search(
            index="inventory",
            body={
                "query": {
                    "bool": {
                        "filter": [{
                            "range": {
                                "create_date": {
                                    "gte": start,
                                    "lte": end
                                }
                            }
                        }],
                        "must": [
                            {
                                "term": {"data_center": datacenter}
                            },
                            {
                                "term": {"application_name": host}
                            },
                        ]
                    }
                }
            }
        )

    def remove_inventory_duplicate(self, host, datacenter, year, month, day, hour):
        resp = self.get_inventory_by_hour(host, datacenter, year, month, day, hour)

        # Do nothing for no duplicate
        if resp["hits"]["total"]["value"] <= 1:
            return

        hits = resp["hits"]["hits"]
        for doc in hits:
            if doc["_source"]["price_detail"] == []:
                # Delete document by id
                self.delete_inventory(doc["_id"])

    def remove_inventory_by_hour(self, host, datacenter, year, month, day, hour):
        resp = self.get_inventory_by_hour(host, datacenter, year, month, day, hour)

        # Do nothing, if no index found
        if resp["hits"]["total"]["value"] == 0:
            return

        hits = resp["hits"]["hits"]
        for doc in hits:
            create_date = doc["_source"]["create_date"]
            print(f"Delete INVENTORY create_at => {create_date}")
            self.delete_inventory(doc["_id"])

    def copy_inventory(self, host, datacenter, year, template_month, fix_month, day, hour):
        resp = self.get_inventory_by_hour(host, datacenter, year, template_month, day, hour)

        try:
            template_inventory_id = resp["hits"]["hits"][0]["_id"]
        except IndexError:
            return

        template_inventory = self.get_inventory_by_id(template_inventory_id)
        copy_inventory = template_inventory["_source"].copy()

        # Replace create_date
        copy_inventory["create_date"] = f"{year}-{fix_month:02}-{day:02}T{hour:02}:22"

        # Create new inventory
        print(f'Create new INVENTORY from {template_inventory["_source"]["create_date"]}')
        self.es.index(index="inventory", body=copy_inventory)

    def copy_pricedetail(self, host, datacenter, year, template_month, fix_month, day, hour):
        resp = self.get_pricedetail_by_hour(host, datacenter, year, template_month, day, hour)

        try:
            hits = resp["hits"]["hits"]
        except IndexError:
            return

        for doc in hits:
            template = self.get_pricedetail_by_id(doc["_id"])
            copy = template["_source"].copy()

            # Replace create_date
            copy["inventory"]["create_date"] = f"{year}-{fix_month:02}-{day:02}T{hour:02}:22"

            # Create new price_detail
            print(f'Create new PRICE_DETAIL name => {copy["name"]}')
            self.es.index(index="price_details", body=copy)
