from cloudform.tests.fixtures.usergroup import UserGroupFixture
from cloudform.tests.fixtures.primary import PrimaryFixture

__all__ = ["Fixtures"]


class Fixtures:
    usergroup = UserGroupFixture()
    primary = PrimaryFixture()
