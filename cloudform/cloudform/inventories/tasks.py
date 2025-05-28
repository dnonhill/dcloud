from __future__ import absolute_import, unicode_literals

import json
import logging
import os
import requests

from celery import shared_task
from requests.exceptions import (
    HTTPError,
    ConnectionError,
    ConnectTimeout,
    RequestException,
)
from cloudform.projects.models.data_center import DataCenter
from cloudform.inventories.v_center import VCenterManagement

logger = logging.getLogger(__name__)


@shared_task
def update_inventory(vm_name, inventory_id, resource_type):
    logger.info('#---Start function: update_inventory---#')
    vm_info = get_vm_info(vm_name, resource_type, inventory_id)
    access_token = get_cloudform_api_token(
        os.environ.get("CELERY_USERNAME"),
        # os.environ.get("CELERY_PASSWORD")
        'FcW3W8EhvECG'
    ).json()["access"]
    logger.info(f'access_token: {access_token}')
    update_inventory_resource(access_token, vm_info, inventory_id)
    logger.info('#---End function: update_inventory---#')

def get_vm_info(vm_name, resource_type, inventory_id=None, data_center_ref=None):
    vm_info = {}
    try:
        if inventory_id:
            data_center = DataCenter.objects.get(inventory_list__id=inventory_id)
        if data_center_ref:
            data_center = DataCenter.objects.get(id=data_center_ref.id)

        logger.info(f'DataCenter INVEVTORY {data_center}')
        if resource_type == "vm":
            url = "{}/api/vcenter/vm/{}".format(
                    data_center.endpoint_vm,
                    vm_name
            )
            v_center = VCenterManagement()
            vm_info = v_center.v_center_service(
                data_center,
                url
            )
            logger.info('GET VM DETAIL')
            logger.info(f'HTTP REQUEST GET {url} {vm_info.status_code}')
            #debug
            print(vm_info.__dict__)
            return vm_info.text
        elif resource_type == "container-cluster":
            url = "{}/api/v1/namespaces/{}/resourcequotas".format(
                    data_center.endpoint_openshif,
                    vm_name
            )
            vm_info = requests.get(
                url=url,
                verify=False,
                headers={
                    "Authorization": "Bearer {}".format(
                        data_center.token
                    )
                }
            )
            logger.info('GET OPENSHIFT DETAIL')
            logger.info(f'HTTP REQUEST GET {url} {vm_info.status_code}')
            return vm_info.text
    except HTTPError as e:
        logger.error('\n=====HTTPError=====\n')
        logger.error(str(e))
        logger.error('\n===================\n')
        return vm_info
    except ConnectTimeout as e:
        logger.error('\n=====ConnectTimeout=====\n')
        logger.error(str(e))
        logger.error('\n===================\n')
        return vm_info
    except ConnectionError as e:
        logger.error('\n=====ConnectionError=====\n')
        logger.error(str(e))
        logger.error('\n===================\n')
        return vm_info
    except RequestException as e:
        logger.error('\n=====RequestException=====\n')
        logger.error(str(e))
        logger.error('\n===================\n')
        return vm_info
    except Exception as e:
        logger.error('\n=====Other Exception=====\n')
        logger.error(str(e))
        logger.error('\n===================\n')
        return vm_info
    return vm_info

def get_vm_id(vm_name, data_center):
    v_center = VCenterManagement()
    url = "{}/api/vcenter/vm/?names={}".format(
                data_center.endpoint_vm,
                vm_name,
            )
    vm_info = v_center.v_center_service(
        data_center,
        url
    )
    logger.info('\n===== PRINT VM ID FROM VCENTER =====\n')
    logger.info(url)
    logger.info(vm_info.json())
    logger.info('\n===== ENDPRINT =====\n')
    return vm_info.json()


def update_inventory_resource(access_token, vm_info, inventory_id):
    logger.info('#---Start function: update_inventory_resource---#')
    url = "{}/api/inventory/".format(os.environ.get("API_URL"))
    logger.info(f'url: {url}')
    payload = {
        "inventory_id": inventory_id,
        "resource_detail": vm_info
    }
    logger.info(f'payload: {payload}')
    headers = {
        "Authorization": "Bearer {}".format(access_token),
        "Content-Type": "application/json"
    }
    logger.info(f'headers: {headers}')
    response = requests.request(
        "POST",
        url,
        headers=headers,
        data=json.dumps(payload)
    )
    logger.info(f'HTTP REQUEST POST {url} {response.status_code}')
    logger.info(response.text.encode("utf8"))
    logger.info('#---End function: update_inventory_resource---#')


def get_cloudform_api_token(username, password):
    url = "{}/api/token/".format(os.environ.get("API_URL"))
    payload = {
        "username": username,
        "password": password
    }
    headers = {"Content-Type": "application/json"}
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    if response.status_code != 200:
        logger.error('LOGIN ERROR')
    logger.info(f'POST {url} {response.status_code}')
    return response
