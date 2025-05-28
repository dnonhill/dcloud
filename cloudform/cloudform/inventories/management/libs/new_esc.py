from django.conf import settings
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConflictError
from elasticsearch_dsl import Q, Search


class NewESC:

    def __init__(self, logger=None):
        self._client = Elasticsearch(f'{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}', timeout=60)
        self._logger = logger

    def set_logger(self, logger):
        self._logger = logger

    def list_doc(self, index, start_datetime_utc, end_datetime_utc, datacenter_name, app_name, resource_name):
        """
        List document for specific index that was created
        between start_datetime_utc and end_datetime_utc.

        Parameters
        ----------
        start_datetime_utc : datetime
            Example 2024-04-30 17:00:00+00:00
        end_datetime_utc : datetime
            Example 2024-05-31 16:59:59+00:00
        datacenter_name : str
            Datacenter full name (should be obtained from DataCenter.name)
        app_name : str
            Example 'TBKC-RPA-RUN'
        index_name : str
            Example 'price_details'

        Returns
        -------
        dict
        """
        if index == 'inventory':
            date_range = Q(
                "range",
                create_date={
                    "gte": start_datetime_utc.isoformat(),
                    "lte": end_datetime_utc.isoformat(),
                }
            )
            search_query = Q(
                "bool",
                filter=[date_range],
                must=[Q("term", data_center=datacenter_name),
                      Q("term", application_name=app_name),
                      Q("term", name=resource_name)]
            )
        elif index == 'price_details':
            date_range = Q(
                "range",
                inventory__create_date={
                    "gte": start_datetime_utc.isoformat(),
                    "lte": end_datetime_utc.isoformat(),
                }
            )
            search_query = Q(
                "bool",
                filter=[date_range],
                must=[Q("term", inventory__data_center=datacenter_name),
                      Q("term", inventory__application_name=app_name),
                      Q("term", inventory__name=resource_name)]
            )
        else:
            if self._logger:
                self._logger.error(f"Invalid index name: {index}")
                raise ValueError(f"Invalid index name: {index}")
            pass

        index = Search(using=self._client, index=index)
        search = index.query(search_query)
        response = search.execute()
        return response

    def delete_doc(self, index_name, start_datetime_utc, end_datetime_utc, datacenter_name, app_name, resource_name):
        """
        Delete document for specific index that was created
        between start_datetime_utc and end_datetime_utc.

        Parameters
        ----------
        start_datetime_utc : datetime
            Example 2024-04-30 17:00:00+00:00
        end_datetime_utc : datetime
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
        if index_name == 'inventory':
            date_range = Q(
                "range",
                create_date={
                    "gte": start_datetime_utc.isoformat(),
                    "lte": end_datetime_utc.isoformat(),
                }
            )
            search_query = Q(
                "bool",
                filter=[date_range],
                must=[Q("term", data_center=datacenter_name),
                      Q("term", application_name=app_name),
                      Q("term", name=resource_name)]
            )
        elif index_name == 'price_details':
            date_range = Q(
                "range",
                inventory__create_date={
                    "gte": start_datetime_utc.isoformat(),
                    "lte": end_datetime_utc.isoformat(),
                }
            )
            search_query = Q(
                "bool",
                filter=[date_range],
                must=[Q("term", inventory__data_center=datacenter_name),
                      Q("term", inventory__application_name=app_name),
                      Q("term", inventory__name=resource_name)]
            )
        else:
            if self._logger:
                self._logger.error(f"Invalid index name: {index_name}")
                raise ValueError(f"Invalid index name: {index_name}")
            pass

        index = Search(using=self._client, index=index_name)
        search = index.query(search_query)
        # print(search.to_dict())
        if self._logger:
            response = search.execute()
            total_doc_delete = response["hits"]["total"]["value"]
            self._logger.info(f"Between {start_datetime_utc.isoformat()} {end_datetime_utc.isoformat()}")
            self._logger.info(f"Total {index_name} docs delete: {total_doc_delete}")
        try:
            search.delete()
        except ConflictError:
            pass
