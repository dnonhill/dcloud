from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase


class ResourceViewSetTestCase(AuthorizedUserRequiredTestCase):
    fixtures = ["groups", "users", "projects", "applications"]
