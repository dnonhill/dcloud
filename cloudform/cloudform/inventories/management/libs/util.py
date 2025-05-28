from elasticsearch import Elasticsearch


class Util:
    def __init__(self, url=None):
        if url:
            self.es = Elasticsearch(url)
        else:
            self.es = Elasticsearch('http://localhost:9200/')

    def get_inventory_by_create_date(self, host, date_str):
        print({
            "query": {
                "bool": {
                    "filter": [{"create_date": date_str}],
                    "must": [
                        {
                            "term": {
                                "name": host
                            }
                        }
                    ]
                }
            }
        })
        return self.es.search(
            index="inventory",
            body={
                "query": {
                    "bool": {
                        "filter": [{"create_date": date_str}],
                        "must": [
                            {
                                "term": {
                                    "name": host
                                }
                            }
                        ]
                    }
                }
            }
        )

    def get_pricedetail_by_create_date(self, host, date_str):
        return self.es.search(
            index="price_details",
            body={
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "range": {
                                    "inventory.create_date": date_str
                                }
                            }
                        ],
                        "must": [
                            {
                                "term": {
                                    "inventory.name": host
                                }
                            }
                        ]
                    }
                }
            }
        )

    def update_by_id(self, index, id, body):
        return self.es.update(index=index, id=id, body=body)

    def get_by_id(self, index, id):
        return self.es.get(index=index, id=id)

    def delete_all_docs(self, index):
        self.es.delete_by_query(index=index, body={
            "query": {
                "match_all": {}
            }
        })

    def create(self, index, body):
        return self.es.index(index=index, body=body)

    def get_pricedetail(self, host, datetime):
        return self.get_pricedetail_by_hour(
            host, datetime.year, datetime.month, datetime.day, datetime.hour)

    def get_inventory(self, host, datetime):
        return self.get_inventory_by_hour(
            host, datetime.year, datetime.month, datetime.day, datetime.hour)

    def get_pricedetail_by_hour(self, host, year, month, day, hour):
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
                                "term": {"inventory.name": host}
                            },
                        ]
                    }
                }
            }
        )

    def get_inventory_by_hour(self, host, year, month, day, hour):
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
                                "term": {"name": host}
                            },
                        ]
                    }
                }
            }
        )
