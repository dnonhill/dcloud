from django.test import TestCase
from ..models import PriceDetail, Inventory


# class TestPriceDetail(TestCase):
#     def test_it_should_create_price_detail(self):
#         inventory = Inventory.objects.create(
#             project_name="test_project",
#             name="vm-3101",
#             job_code="1234567890",
#             data_center="test_dc",
#             application_name="app-test",
#             total_price=12020.00,
#             power_state="POWER_ON",
#         )

#         price_detail = [
#             {
#                 "name": "vCPU",
#                 "price": 1.83,
#                 "unit": 1,
#                 "category": "Hardware",
#             }
#         ]

#         PriceDetail.create_price_detail(inventory, price_detail)
#         result = PriceDetail.objects.filter(inventory=inventory)

#         self.assertEqual(result[0].name, price_detail[0]["name"])
#         self.assertLessEqual(result[0].price, price_detail[0]["price"])
#         self.assertEqual(result[0].unit, price_detail[0]["unit"])
#         self.assertEqual(result[0].category, price_detail[0]["category"])
