import logging
import requests
from django.conf import settings
from .graph import job_output_graph

logger = logging.getLogger(__name__)

def _awx_url(*args, **kwargs):
    url = f"{settings.AWX_API_URL}/"
    for arg in args:
        url += f"{str(arg)}/"
    if "query_string" in kwargs:
        query_string = kwargs.get("query_string", "")
        url = f"{url}?{query_string}"
    return url


def launch_job(job_template_id, extra_vars=None):
    logger.info(f'#---Start function: awx.launch_job---#')
    url = _awx_url("job_templates", job_template_id, "launch")
    headers = _awx_headers()

    json = {"extra_vars": {}}
    if extra_vars:
        json["extra_vars"].update(extra_vars)

    logger.info(f'url: {url}')
    logger.info(f'headers: {headers}')
    logger.info(f'payload: {json}')

    response = requests.post(url, headers=headers, json=json)
    if response.status_code == 201:
        return response.json()["job"]

    logger.info(f'#---End function: awx.launch_job---#')
    return None


def job_stdout(job_id):
    url = _awx_url("jobs", job_id, "stdout", query_string="format=txt")
    headers = _awx_headers()

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        stdoutput = response.text
        output_graph = job_output_graph(stdoutput)
        return output_graph

    return None

def get_job_status(job_id):
    url = _awx_url("jobs", job_id)
    headers = _awx_headers()

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()

    return None


def _awx_headers():
    return {
        "Authorization": f"Bearer {settings.AWX_API_KEY}",
        "Content-Type": "application/json"
    }
