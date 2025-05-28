from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


User = get_user_model()


class AuthorizedUserRequiredTestCase(APITestCase):
    def _login_as(self, username):
        user = User.objects.get(username=username)
        self.client.force_login(user=user)
        return user
