import json
from cloudform.inventories.documents import InventoryDocument, PriceDetailDocument
from cloudform.inventories.models import Inventory, PriceDetail
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConflictError
from elasticsearch_dsl import Q, Search
from django.conf import settings


def new_client():
    return Elasticsearch(f'{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}')


def list_inventory_doc(client, start_date_utc, end_date_utc, datacenter_name, app_name, resource_name):
    date_range = Q(
        "range",
        create_date={
            "gte": start_date_utc.isoformat(),
            "lte": end_date_utc.isoformat(),
        }
    )
    search_query = Q(
        "bool",
        filter=[date_range],
        must=[Q("term", data_center=datacenter_name),
              Q("term", application_name=app_name),
              Q("term", name=resource_name)]
    )

    index = Search(using=client, index='inventory')
    search = index.query(search_query)
    response = search.execute()
    return response


def list_pricedetail_doc(client, start_date_utc, end_date_utc, datacenter_name, app_name, resource_name):
    date_range = Q(
        "range",
        inventory__create_date={
            "gte": start_date_utc.isoformat(),
            "lte": end_date_utc.isoformat(),
        }
    )
    search_query = Q(
        "bool",
        filter=[date_range],
        must=[Q("term", inventory__data_center=datacenter_name),
              Q("term", inventory__application_name=app_name),
              Q("term", inventory__name=resource_name)]
    )

    index = Search(using=client, index='price_details')
    search = index.query(search_query)
    response = search.execute()
    return response


def delete_inventory_doc(client, start_date_utc, end_date_utc, datacenter_name, app_name, resource_name, logger=None):
    """
    Delete document for specific index that was created
    between start_date and end_date.

    Parameters
    ----------
    start_date_utc : datetime
        Example 2024-04-30 17:00:00+00:00
    end_date_utc : datetime
        Example 2024-05-31 16:59:59+00:00
    datacenter_name : str
        Datacenter full name (should be obtained from DataCenter.name)
    app_name : str
        Example 'TBKC-RPA-RUN'
    index_name : str
        Example 'price_details'

    Returns
    -------
    None
    """
    date_range = Q(
        "range",
        create_date={
            "gte": start_date_utc.isoformat(),
            "lte": end_date_utc.isoformat(),
        }
    )
    search_query = Q(
        "bool",
        filter=[date_range],
        must=[Q("term", data_center=datacenter_name),
              Q("term", application_name=app_name),
              Q("term", name=resource_name)]
    )

    index = Search(using=client, index="inventory")
    search = index.query(search_query)
    if logger:
        response = search.execute()
        total_doc_delete = response["hits"]["total"]["value"]
        logger.info(f"Between {start_date_utc.isoformat()} {end_date_utc.isoformat()}")
        logger.info(f"Total inventory docs delete: {total_doc_delete}")
    try:
        search.delete()
    except ConflictError:
        pass


def delete_pricedetail_doc(client, start_date_utc, end_date_utc, datacenter_name, app_name, resource_name, logger=None):
    """
    Delete document for specific index that was created
    between start_date and end_date.

    Parameters
    ----------
    start_date_utc : datetime
        Example 2024-04-30 17:00:00+00:00
    end_date_utc : datetime
        Example 2024-05-31 16:59:59+00:00
    datacenter_name : str
        Datacenter full name (should be obtained from DataCenter.name)
    app_name : str
        Example 'TBKC-RPA-RUN'
    index_name : str
        Example 'price_details'

    Returns
    -------
    None
    """
    date_range = Q(
        "range",
        inventory__create_date={
            "gte": start_date_utc.isoformat(),
            "lte": end_date_utc.isoformat(),
        }
    )
    search_query = Q(
        "bool",
        filter=[date_range],
        must=[Q("term", inventory__data_center=datacenter_name),
              Q("term", inventory__application_name=app_name),
              Q("term", inventory__name=resource_name)]
    )

    index = Search(using=client, index="price_details")
    search = index.query(search_query)
    if logger:
        response = search.execute()
        total_doc_delete = response["hits"]["total"]["value"]
        logger.info(f"Between {start_date_utc.isoformat()} {end_date_utc.isoformat()}")
        logger.info(f"Total price_details docs delete: {total_doc_delete}")
    try:
        search.delete()
    except ConflictError:
        pass


def create_doc_from_inventory(inventorylist, create_date, price_detail, power_state):
    """
    Use Elasticsearch DSL library to created document on index price_details and inventory.

    Parameters
    ----------
    inventorylist : InventoryList
        Instance of InventoryList that want to use to create indices on Elasticsearch
    create_date : datetime
        This will be create_date field on inventory index (This field specifies the hour the index was created)
        This should be synonymous with Inventory.create_date
    price_detail : dict
        This should be result from function
        PriceSetting.calculate_all_per_item_in_same()
    power_state : str
        This should be either 'POWER_ON' or 'POWER_OFF'
    """
    # Set power state point
    power_state_point = -1
    if power_state == 'POWERED_ON':
        power_state_point = 1

    inventory = Inventory(
        project_name=inventorylist.project,
        name=inventorylist.name,
        job_code=inventorylist.job_code,
        data_center=inventorylist.data_center_ref.name,
        application_name=inventorylist.application,
        total_price=price_detail['price'],
        power_state=inventorylist.details['power_state'],
        resource_type=inventorylist.resource_type,
        power_state_point=power_state_point,
        create_date=create_date,
        tags=[tag.name for tag in inventorylist.tags.all()]
    )
    InventoryDocument().update(inventory)

    for item in price_detail["price_detail"]:
        price_detail = PriceDetail(
            price=item["price"],
            name=item["name"],
            category=item["category"],
            inventory=inventory,
        )
        PriceDetailDocument().update(price_detail)
