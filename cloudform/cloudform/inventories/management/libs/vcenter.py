from cloudform.inventories.models import InventoryList
from cloudform.inventories.v_center import VCenterManagement


def get_vm_info(inventory_list: InventoryList) -> str:
    """
    Cut version of cloudform/inventories/tasks/get_vm_info

    Support only resource_type == 'vm'
    """
    data_center = inventory_list.data_center_ref
    resource_type = inventory_list.resource_type
    if resource_type == 'vm':
        url = f'{data_center.endpoint_vm}/api/vcenter/vm/{inventory_list.vm_id}'
        vcent_mgmt = VCenterManagement()
        response = vcent_mgmt.v_center_service(data_center, url)
        return response.text
