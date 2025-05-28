from cloudform.tests.factory import make_group, make_user
from cloudform.tests.fixtures.base import Fixture


class UserGroupFixture(Fixture):
    def make(self, *args, **kwargs):
        make_default_groups()
        make_default_users()


def make_default_users():
    make_user("operator", email="pitsanu@thezouth.com", pk=1)
    make_user("nobody", email="pitsanu@thezouth.com", pk=999)
    make_user("cloud001", email="pitsanu@thezouth.com", groups=[1000], pk=1000)
    make_user("aprv001", email="pitsanu@thezouth.com", groups=[2000, 4000], pk=1001)
    make_user("admin001", email="pitsanu@thezouth.com", groups=[3000, 4000], pk=1002)
    make_user("req001", email="pitsanu@thezouth.com", groups=[4000], pk=1003)
    make_user("req002", email="pitsanu@thezouth.com", groups=[4000], pk=1004)
    make_user("cloud002", email="pitsanu@thezouth.com", groups=[1000, 4000], pk=2000)
    make_user("aprv002", email="pitsanu@thezouth.com", groups=[2000, 4000], pk=2001)
    make_user("admin002", email="pitsanu@thezouth.com", groups=[3000, 4000], pk=2002)
    make_user("reviewer001", email="pitsanu@thezouth.com", groups=[5000], pk=3001)


def make_default_groups():
    make_group("cloudadmin", pk=1000)
    make_group("approver", pk=2000)
    make_group("operator", pk=3000)
    make_group("requestor", pk=4000)
    make_group("reviewer", pk=5000)
