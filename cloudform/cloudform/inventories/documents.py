from django_elasticsearch_dsl import Document, Date
from elasticsearch_dsl import analyzer, tokenizer
from django_elasticsearch_dsl.registries import registry

from django_elasticsearch_dsl.fields import TextField, DateField, ObjectField, KeywordField, FloatField, IntegerField, NestedField
from .models import Inventory, PriceDetail


keyword_name = analyzer(
    'keyword_name',
    tokenizer="keyword",
)

@registry.register_document
class InventoryDocument(Document):
    project_name = KeywordField()
    data_center = KeywordField()
    application_name = KeywordField()
    name = KeywordField()
    job_code = KeywordField()
    power_state = KeywordField()
    total_price = FloatField()
    resource_type = KeywordField()
    power_state_point = IntegerField()
    create_date = DateField()
    tags = KeywordField(multi=True)
    price_detail = ObjectField(
        properties={
            "unit": IntegerField(),
            "name": KeywordField(),
            "category": KeywordField(),
            "price": FloatField(),
            'pk': IntegerField(),
        }
    )

    def prepare_tags(self, instance):
        return [kw for kw in instance.tags]

    class Index:
        name = 'inventory'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }
    class Django:
        model = Inventory
        related_models = [PriceDetail]

    def get_queryset(self):
        """Not  ndatory but to improve performance we can select related in one sql request"""
        return super(InventoryDocument, self).get_queryset()

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, PriceDetail):
            return related_instance.inventory

@registry.register_document
class PriceDetailDocument(Document):
    unit = IntegerField()
    name = KeywordField()
    category = KeywordField()
    price = FloatField()
    inventory = ObjectField(
        properties={
            "project_name": KeywordField(),
            "data_center": KeywordField(),
            "application_name": KeywordField(),
            "name": KeywordField(),
            "job_code": KeywordField(),
            "create_date": DateField(),
            "resource_type": KeywordField(),
            "power_state": KeywordField(),
            "tags": KeywordField(multi=True)
        }
    )
    def prepare_inventory(self, instance):
        return {
            "project_name": instance.inventory.project_name,
            "data_center": instance.inventory.data_center,
            "application_name": instance.inventory.application_name,
            "name": instance.inventory.name,
            "job_code": instance.inventory.job_code,
            "create_date": instance.inventory.create_date,
            "resource_type": instance.inventory.resource_type,
            "power_state": instance.inventory.power_state,
            "tags": [kw for kw in instance.inventory.tags]
        }

    class Index:
        name = 'price_details'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }
    class Django:
        model = PriceDetail
        related_models = [Inventory]

    def get_queryset(self):
        """Not mandatory but to improve performance we can select related in one sql request"""
        return super(PriceDetailDocument, self).get_queryset()

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, Inventory):
            return related_instance.price_detail.all()
