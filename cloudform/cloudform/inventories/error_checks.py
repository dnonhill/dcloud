import logging
import json
from cloudform.projects.models.resource import RESOURCE_TYPE_VM, RESOURCE_TYPE_OPENSHIFT

logger = logging.getLogger(__name__)

class InventoryErrorCheck:
    def is_not_found_or_request_detail_error(response_detail, resource_type):
        logger.info('#---Start function: is_not_found_or_request_detail_error---#')
        if not response_detail:
            logger.info('1')
            return True
        if isinstance(response_detail, str):
            logger.info('2')
            response_detail = json.loads(response_detail)
        if resource_type == RESOURCE_TYPE_VM:
            if response_detail.get("type"):
                logger.info('3')
                return True
            elif not response_detail:
                logger.info('4')
                return True
        elif resource_type == RESOURCE_TYPE_OPENSHIFT:
            if not response_detail.get("items"):
                logger.info('5')
                return True
        logger.info('#---End function: is_not_found_or_request_detail_error---#')
        logger.info('6')
        return False
