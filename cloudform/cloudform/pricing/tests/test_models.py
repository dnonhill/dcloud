from django.test import TestCase
from django.utils import timezone
from hamcrest import assert_that, equal_to, close_to

from cloudform.pricing.models import PriceSetting
from cloudform.categorys.models import Category


class PriceSettingTest(TestCase):
    item = {
        "action": "create",
        "resource_type": "vm",
        "specification": {
            "cpu": 2,
            "memory": 4,
            "storage_tier": "platinum",
            "protection_level": "p1",
            "os_dist": 50,
            "database": {"engine": "mssql", "datasize": 500},
            "add_on_service": [{"name":"Log Analyst Service",  "value": "log_analyst_service"}]
        },
    }

    def test_is_should_create_pricing_model(self):
        description = 'vm-test'
        resource_type = 'vm-none-test'
        matching_attrs = {'vCPU': None}
        effect_attrs = ['test-disk']
        unit_price = 10.00
        category = Category.objects.create(
            name='name'
        )
        display = 'cpu'
        effective_date = timezone.now()

        pricing_setting = PriceSetting.objects.create(
            description=description,
            resource_type=resource_type,
            matching_attrs=matching_attrs,
            effect_attrs=effect_attrs,
            unit_price=unit_price,
            category=category,
            display=display,
            effective_date=effective_date
        )

        self.assertEqual(pricing_setting.description, description)
        self.assertEqual(pricing_setting.resource_type, resource_type)
        self.assertEqual(pricing_setting.matching_attrs, matching_attrs)
        self.assertEqual(pricing_setting.effect_attrs, effect_attrs)
        self.assertEqual(pricing_setting.unit_price, unit_price)
        self.assertEqual(pricing_setting.category, category)
        self.assertEqual(pricing_setting.display, display)
        self.assertEqual(pricing_setting.effective_date, effective_date)

    def test_match_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vcpu",
            resource_type="vm",
            matching_attrs={"cpu": None},
            effect_attrs=("cpu",),
            unit_price=17.4120,
        )

        assert_that(price_setting.is_match(self.item), equal_to(True))

    def test_match_nested_attribute(self):
        price_setting = PriceSetting(
            description="rate_database_mssql",
            resource_type="vm",
            matching_attrs={"database.engine": "mssql"},
            effect_attrs=None,
            unit_price=8.90,
        )

        assert_that(price_setting.is_match(self.item), equal_to(True))

    def test_match_list_attribute(self):
        price_setting = PriceSetting(
            description="log_analyst_service",
            resource_type="vm",
            matching_attrs={"add_on_service": "log_analyst_service"},
            effect_attrs=None,
            unit_price=8.90,
        )

        assert_that(price_setting.is_match(self.item), equal_to(True))

    def test_not_match_list_attribute(self):
        price_setting = PriceSetting(
            description="log_analyst_service",
            resource_type="vm",
            matching_attrs={"add_on_service": "log_analyst_service_v1"},
            effect_attrs=None,
            unit_price=8.90,
        )

        assert_that(price_setting.is_match(self.item), equal_to(False))

    def test_not_match_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_gpu",
            resource_type="vm",
            matching_attrs={"gpu": None},
            effect_attrs=("gpu",),
            unit_price=10,
        )

        assert_that(price_setting.is_match(self.item), equal_to(False))

    def test_match_all(self):
        price_setting = PriceSetting(
            description="rate_vm_antivirus",
            resource_type="vm",
            matching_attrs=None,
            effect_attrs=None,
            unit_price=10,
        )

        assert_that(price_setting.is_match(self.item), equal_to(True))

    def test_match_specific_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vmdk_platinum_p1",
            resource_type="vm",
            matching_attrs={"storage_tier": "platinum", "protection_level": "p1"},
            effect_attrs=("os_dist", "data_disk_1_size", "data_disk_2_size"),
            unit_price=0.6242,
        )

        assert_that(price_setting.is_match(self.item), equal_to(True))

    def test_match_in_list_of_attribute_value(self):
        price_setting = PriceSetting(
            description="rate_vm_vcpu_DR_prem",
            resource_type="vm",
            matching_attrs={"protection_level": ["p1", "p2"]},
            effect_attrs=("cpu",),
            unit_price=5.2236,
        )

        assert_that(price_setting.is_match(self.item), equal_to(True))

    def test_not_match_specific_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vmdk_platinum_p2",
            resource_type="vm",
            matching_attrs={"storage_tier": "platinum", "protection_level": "p2"},
            effect_attrs=("os_dist", "data_disk_1_size", "data_disk_2_size"),
            unit_price=0.5941,
        )

        assert_that(price_setting.is_match(self.item), equal_to(0))

    def test_calculate_match_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vmdk_platinum_p1",
            resource_type="vm",
            matching_attrs={"storage_tier": "platinum", "protection_level": "p1"},
            effect_attrs=("os_dist", "data_disk_1_size", "data_disk_2_size"),
            unit_price=0.6242,
        )

        assert_that(price_setting.calculate(self.item), close_to(31.21, 1e-8))

    def test_calculate_match_nested_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vmdk_platinum_p1",
            resource_type="vm",
            matching_attrs={"database.engine": "mssql"},
            effect_attrs="database.datasize",
            unit_price=10,
        )

        assert_that(price_setting.calculate(self.item), close_to(5000, 1e-8))

    def test_calculate_match_specific_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vcpu",
            resource_type="vm",
            matching_attrs={"cpu": None},
            effect_attrs=("cpu",),
            unit_price=17.4120,
        )

        assert_that(price_setting.calculate(self.item), equal_to(34.8240))

    def test_calculate_not_match_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_gpu",
            resource_type="vm",
            matching_attrs={"gpu": None},
            effect_attrs=("gpu",),
            unit_price=10,
        )

        assert_that(price_setting.calculate(self.item), equal_to(0))

    def test_calculate_all_per_item_match_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vmdk_platinum_p1",
            resource_type="vm",
            matching_attrs={"storage_tier": "platinum", "protection_level": "p1"},
            effect_attrs=("os_dist", "data_disk_1_size", "data_disk_2_size"),
            unit_price=0.6242,
        )

        result, _ = price_setting.calculate_per_item(self.item)

        self.assertEqual(result, 31.209999999999997)

    def test_calculate_all_per_item_match_nested_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vmdk_platinum_p1",
            resource_type="vm",
            matching_attrs={"database.engine": "mssql"},
            effect_attrs="database.datasize",
            unit_price=10,
        )

        result, _ = price_setting.calculate_per_item(self.item)

        self.assertEqual(result, 5000)

    def test_calculate_all_per_item_match_specific_attribute(self):
        price_setting = PriceSetting(
            description="rate_vm_vcpu",
            resource_type="vm",
            matching_attrs={"cpu": None},
            effect_attrs=("cpu",),
            unit_price=17.4120,
        )

        result, _ = price_setting.calculate_per_item(self.item)

        self.assertEqual(result, 34.824)

    def test_calculate_all_per_item_not_match(self):
        price_setting = PriceSetting(
            description="rate_vm_gpu",
            resource_type="vm",
            matching_attrs={"gpu": None},
            effect_attrs=("gpu",),
            unit_price=10,
        )

        result, _ = price_setting.calculate_per_item(self.item)

        self.assertEqual(result, 0)
