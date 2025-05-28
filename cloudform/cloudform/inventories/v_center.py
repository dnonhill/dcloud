import logging
import requests, pickle
from os import path

logger = logging.getLogger(__name__)


class VCenterManagement:
    def v_center_service(self, data_center, url):
        vm_info = self.login(
            username=data_center.username,
            password=data_center.password,
            vcenter_url=data_center.endpoint_vm
        ).get(url=url)
        if vm_info.status_code in [401, 403]:
            logger.error(f'vm api return {vm_info.status_code}')
            vm_info = self.new_login(
                username=data_center.username,
                password=data_center.password,
                vcenter_url=data_center.endpoint_vm
            ).get(url=url)
        return vm_info

    def login(self, username, password, vcenter_url):
        logger.info('login function')
        session = requests.Session()
        if not username and not password and vcenter_url:
            username = os.environ.get("VCENTER_USERNAME"),
            password = os.environ.get("VCENTER_PASSWORD")
            vcenter_url = os.environ.get("VCENTER_URL")

        filename = f'/tmp/{username}'
        is_file_exit = path.exists(filename)
        if not is_file_exit:
            session = self.new_login(
                username,
                password,
                vcenter_url
            )
        else:
            logger.info('is has session')
            with open(filename, 'rb') as f:
                logger.info('load session')
                session.verify = False
                header = pickle.load(f)
                session.cookies.update(header)
        return session

    def new_login(self, username, password, vcenter_url):
        filename = f'/tmp/{username}'
        session = requests.Session()
        logger.info('is not never login')
        session.auth = (
            username,
            password
        )
        session.verify = False
        url = "{}/api/session".format(vcenter_url)
        resp = session.post(url)
        with open(filename, 'wb') as f:
            pickle.dump(resp.headers, f)
        session.headers.update(resp.headers)
        return session
