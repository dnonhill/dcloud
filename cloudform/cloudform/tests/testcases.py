from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from cloudform.tests import Fixtures


User = get_user_model()


class AuthorizedUserRequiredTestCase(APITestCase):
    def setUp(self):
        Fixtures.usergroup.make()

    def login_as(self, username):
        user = User.objects.get(username=username)
        self.client.force_login(user=user)
        return user
