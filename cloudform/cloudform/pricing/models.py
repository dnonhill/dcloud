from datetime import datetime
from typing import Dict
import logging

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres import fields as psql_fields
from django.core.exceptions import ValidationError
from django.utils.timezone import make_aware
import jmespath

from cloudform.projects.models.resource import RESOURCE_TYPE_VM, RESOURCE_TYPE_OPENSHIFT
from cloudform.categorys.models import Category

logger = logging.getLogger(__name__)

RESOURCE_CHOICES = [
    (RESOURCE_TYPE_VM, "Virtual machine"),
    (RESOURCE_TYPE_OPENSHIFT, "Openshift project"),
]

ALWAYS = "ALWAYS"
PER_USE = "PER_USE"
EFFECTIVE_CHOICES = [
    (ALWAYS, "always"),
    (PER_USE, "per use"),
]


class PriceSetting(models.Model):
    description = models.CharField(
        max_length=255, help_text="Let the team know what is this price for."
    )
    resource_type = models.CharField(max_length=255, choices=RESOURCE_CHOICES)

    matching_attrs = psql_fields.JSONField(
        verbose_name="Matching attributes",
        help_text=(
            "Pairs of attribute & value matching here will enable this price string."
            + " Fill 'null' will apply to all resources."
        ),
        null=True,
        blank=True,
    )
    effect_attrs = psql_fields.ArrayField(
        base_field=models.CharField(max_length=255),
        size=5,
        verbose_name="Effect attributes",
        help_text=(
            "Value of attributes will be quantity of pricing. "
            + "Leave blank will apply quantity as '1'."
        ),
        blank=True,
    )
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=4, help_text="Unit price in hourly basis."
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.DO_NOTHING,
        null=True
    )

    display = models.CharField(max_length=255, null=True)

    effective_date = models.DateTimeField(
        blank=False,
        null=False,
        help_text="เวลาที่แสดงเป็น UTC timezone",
    )

    effective = models.CharField(
        max_length=255,
        choices=EFFECTIVE_CHOICES,
        default=ALWAYS,
    )

    def __str__(self):
        return self.description

    def clean(self):
        current_date = make_aware(datetime.now())

        if self.effective_date < current_date:
            raise ValidationError({
                'effective_date': 'Oops! Passed date is not allowed. We only accept the future date'
            })

    def is_match(self, item: Dict[str, any]):
        if self.resource_type != item["resource_type"]:
            return False

        if not self.matching_attrs:
            return True

        spec = item["specification"]

        def _match_with_spec(key):
            value = self.matching_attrs[key]
            spec_value = jmespath.search(key, spec)
            return spec_value is not None and (
                value is None
                or (isinstance(value, list) and spec_value in value)
                or spec_value == value
            )

        return all((_match_with_spec(key) for key in self.matching_attrs))

    def get_effect_amount(self, spec: Dict[str, any]):
        if not self.effect_attrs:
            return 1

        if isinstance(self.effect_attrs, str):
            unit = jmespath.search(self.effect_attrs, spec)
            if not isinstance(unit, int):
                logger.warning(f"Instance of {self.effect_attr} is not number")

            return unit if isinstance(unit, int) else 0

        elif isinstance(self.effect_attrs, (list, tuple)):
            total_unit = 0
            for attr_name in self.effect_attrs:
                unit = jmespath.search(attr_name, spec)
                if isinstance(unit, int):
                    total_unit += unit
                else:
                    logger.warning(f"Instance of {attr_name} is not number")
            return total_unit
        else:
            logger.warning(f"not support {type(self.effect_attrs)} in {self.effect_attrs} - {self.description}")
            return 0

    def get_effect_amount_by_item(self, spec: Dict[str, any]):
        if not self.effect_attrs:
            return 1

        if isinstance(self.effect_attrs, str):
            unit = jmespath.search(self.effect_attrs, spec)
            if not isinstance(unit, int):
                logger.warning(f"Instance of {self.effect_attr} is not number")
            return unit if isinstance(unit, int) else 0

        elif isinstance(self.effect_attrs, (list, tuple)):
            total_unit = 0
            for attr_name in self.effect_attrs:
                unit = jmespath.search(attr_name, spec)
                if isinstance(unit, int):
                    total_unit += unit
                else:
                    logger.warning(f"Instance of {attr_name} is not number")
            return total_unit
        else:
            logger.warning(f"not support {type(self.effect_attrs)} in {self.effect_attrs} - {self.description}")
            return 0

    def calculate(self, item: Dict[str, any], power_state=None):
        if power_state == "POWERED_OFF" and self.effective == PER_USE:
            return 0
        if not self.is_match(item) or item.get("action") == "delete":
            return 0

        spec = item["specification"]

        result = self.get_effect_amount(spec) * self.unit_price
        return result

    def calculate_per_item(self, item: Dict[str, any], power_state=None):
        if power_state == "POWERED_OFF" and self.effective == PER_USE:
            return 0, 0
        if not self.is_match(item) or item.get("action") == "delete":
            return 0, 0

        spec = item["specification"]
        unit = self.get_effect_amount_by_item(spec)
        return unit * self.unit_price, unit

    @staticmethod
    def calculate_all(item: Dict[str, any]):
        logger.info(f'#---Start function: PriceSetting.calculate_all---#')

        rules = PriceSetting.objects.filter(
            resource_type=item.get("resource_type", None)
        )
        logger.info(f'rules <= {str(rules)}')

        result = sum([rule.calculate(item) for rule in rules])
        logger.info(f'PriceSetting.calculate_all return <= {str(result)}')
        logger.info(f'#---End function: PriceSetting.calculate_all---#')
        return result

    @staticmethod
    def calculate_all_with_power_state(item: Dict[str, any], power_state):
        rules = PriceSetting.objects.filter(
            resource_type=item.get("resource_type", None)
        )
        return sum([rule.calculate(item, power_state) for rule in rules])

    @staticmethod
    def calculate_all_per_item(item: Dict[str, any]):
        rules = PriceSetting.objects.filter(
            resource_type=item.get("resource_type", None)
        )
        res_list = []
        for rule in rules:
            price, unit = rule.calculate_per_item(item)
            if unit and price:
                temp = next((category for category in res_list if category["name"] == rule.category.__str__()), None)
                if isinstance(temp, dict):
                    temp['total']+=price
                    temp['items'].append({
                        'price': price,
                        'unit': unit,
                        'display': rule.display,
                    })
                else:
                    res = {
                        'name': rule.category.__str__(),
                        'total': price,
                        'items': [
                            {
                                'price': price,
                                'unit': unit,
                                'display': rule.display,
                            }
                        ]
                    }
                    res_list.append(res)
        return res_list

    @staticmethod
    def calculate_all_per_item_for_migrate_update(item: Dict[str, any]):
        rules = PriceSetting.objects.filter(
            resource_type=item.get("resource_type", None)
        )
        res_list = []
        for rule in rules:
            price, unit = rule.calculate_per_item(item)
            if unit and price:
                temp = next((category for category in res_list if category["name"] == rule.category.__str__()), None)
                if isinstance(temp, dict):
                    temp['total']+= float(price)
                    temp['items'].append({
                        'price': float(price),
                        'unit': unit,
                        'display': rule.display,
                    })
                else:
                    res = {
                        'name': rule.category.__str__(),
                        'total': float(price),
                        'items': [
                            {
                                'price': float(price),
                                'unit': unit,
                                'display': rule.display,
                            }
                        ]
                    }
                    res_list.append(res)
        return res_list

    @staticmethod
    def update_latest_price_setting():
        price_settings = PriceSetting.objects.all()

        for price_setting in price_settings:
            current_date = make_aware(datetime.now())
            price_setting_history = PriceSettingHistory.objects.filter(
                description=price_setting.description,
                effective_date__lt=current_date
            ).order_by('-effective_date').first()

            if price_setting_history:
                price_setting.unit_price = price_setting_history.unit_price
                price_setting.effective_date = price_setting_history.effective_date
                price_setting.save()


    @staticmethod
    def calculate_all_per_item_in_same(item: Dict[str, any], power_state):
        rules = PriceSetting.objects.filter(
            resource_type=item.get("resource_type", None)
        )
        res_list = []
        for rule in rules:
            price, unit = rule.calculate_per_item(item, power_state)
            if unit and price:
                res_list.append({
                    "price": price,
                    "name": rule.display,
                    "unit": unit,
                    "category": rule.category.__str__(),
                })
        return res_list


class PriceSettingHistory(models.Model):
    description = models.CharField(max_length=255, null=True, blank=True)
    resource_type = models.CharField(max_length=255, choices=RESOURCE_CHOICES, null=True, blank=True)
    matching_attrs = psql_fields.JSONField(null=True, blank=True)
    effect_attrs = psql_fields.ArrayField(
        base_field=models.CharField(max_length=255),
        size=5,
        null=True,
        blank=True
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    display = models.CharField(max_length=255, null=True)
    effective_date = models.DateTimeField(
        blank=False,
        null=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        editable=False
    )
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f'{self.description} {self.effective_date} {self.unit_price}'

    def clean(self):
        current_date = make_aware(datetime.now())

        if self.effective_date < current_date:
            raise ValidationError({
                'effective_date': 'Oops! Passed date is not allowed. We only accept the future date'
            })
