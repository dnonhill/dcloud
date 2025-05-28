from django.test import TestCase
from cloudform.categorys.models import Category


class CategoryModelTest(TestCase):
    def test_it_should_create_model(self):
        name = 'name'
        category = Category.objects.create(
            name=name,
        )
        
        self.assertEqual(category.name, name)
        
    def test_it_set__str__return_name(self):
        name = 'name'
        category = Category.objects.create(
            name=name,
        )
        
        self.assertEqual(category.__str__(), name)
        