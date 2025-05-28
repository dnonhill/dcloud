import logging

from django_auth_ldap.config import NestedGroupOfNamesType


class MappingGroupOfNamesType(NestedGroupOfNamesType):
    def __init__(
        self,
        name_attr="cn",
        group_map=None,
        allow_implicit_mapping=False,
        default_group_name="unknown",
    ):
        super().__init__(name_attr)
        self.group_map = group_map
        self.allow_implicit_mapping = allow_implicit_mapping
        self.default_group_name = default_group_name
        self.logger = logging.getLogger(__name__)

    def group_name_from_info(self, group_info):
        try:
            ldap_group_name = group_info[1][self.name_attr][0]
            self.logger.debug(f"ldap_group_name = {ldap_group_name}")
            default_name = (
                ldap_group_name
                if self.allow_implicit_mapping
                else self.default_group_name
            )
            name = self.group_map.get(ldap_group_name, default_name)
        except (KeyError, IndexError):
            self.logger.warning(KeyError, IndexError)
            name = "no_group_info"

        return name
