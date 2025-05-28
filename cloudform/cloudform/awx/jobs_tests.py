from hamcrest import assert_that, is_, has_length

from .jobs import launch_job, job_stdout
from unittest.mock import Mock, patch


@patch("cloudform.awx.jobs.settings")
@patch("cloudform.awx.jobs.requests")
def test_launch_job(mock_requests, mock_settings):
    mock_settings.configure_mock(
        AWX_API_URL="http://awx.example.com/api/v2", AWX_API_KEY="abcdefghijklmnop"
    )
    mock_response = Mock(**{"status_code": 201, "json.return_value": {"job": 123}})
    mock_requests.post.return_value = mock_response

    acknowledge_id = launch_job("10", extra_vars={"vm_name": "test-dcloud-001"})

    mock_requests.post.assert_called_once_with(
        f"http://awx.example.com/api/v2/job_templates/10/launch/",
        headers={"Authorization": "Bearer abcdefghijklmnop"},
        json={"extra_vars": {"vm_name": "test-dcloud-001"}},
    )
    assert_that(acknowledge_id, is_(123))


@patch("cloudform.awx.jobs.settings")
@patch("cloudform.awx.jobs.requests")
def test_job_output(mock_request, mock_settings):
    mock_settings.configure_mock(
        AWX_API_URL="http://awx.example.com/api/v2", AWX_API_KEY="abcdefghijklmnop"
    )
    mock_response = Mock(**{"status_code": 200, "text": STDOUT})
    mock_request.get.return_value = mock_response

    output = job_stdout("43")

    mock_request.get.assert_called_once_with(
        f"http://awx.example.com/api/v2/jobs/43/stdout/?format=txt",
        headers={"Authorization": "Bearer abcdefghijklmnop"},
    )

    assert_that(output["plays"], has_length(1))
    assert_that(output["plays"][0]["tasks"], has_length(1))
    assert_that(output["plays"][0]["recap"]["ok"], is_(68))


STDOUT = """
Identity added: /tmp/awx_43__vaeenc1/artifacts/43/ssh_key_data (/tmp/awx_43__vaeenc1/artifacts/43/ssh_key_data)
ansible-playbook 2.8.4
  config file = /etc/ansible/ansible.cfg
  configured module search path = [u'/var/lib/awxx/.ansible/plugins/modules', u'/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/lib/python2.7/site-packages/ansible
  executable location = /usr/bin/ansible-playbook
  python version = 2.7.5 (default, Jun 20 2019, 20:27:34) [GCC 4.8.5 20150623 (Red Hat 4.8.5-36)]
Using /etc/ansible/ansible.cfg as config file
setting up inventory plugins
host_list declined parsing /tmp/awx_43__vaeenc1/tmp_yw2td36 as it did not pass it's verify_file() method
Set default localhost to localhost
Parsed /tmp/awx_43__vaeenc1/tmp_yw2td36 inventory source with script plugin
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/pre_provision.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-vmware.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_facts.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-vmware.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-datastore.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-auto_disks.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-static_disks.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-pre_network.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-static_networks.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-dhcp_networks.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-customization.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/create_vms.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/manage_tags.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/parse_tag.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/add_tag.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/change_password_linux.yml
statically imported: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/update_description.yml
Loading callback plugin awx_display of type stdout, v2.0 from /var/lib/awxx/venv/awxx/lib/python3.6/site-packages/ansible_runner/callbacks/awx_display.py

PLAYBOOK: provision-vm_from_template.yml ***************************************
Positional arguments: vmware/provision-vm_from_template.yml
remote_user: root
become_method: sudo
inventory: (u'/tmp/awx_43__vaeenc1/tmp_yw2td36',)
forks: 5
tags: (u'all',)
extra_vars: (u'@/tmp/awx_43__vaeenc1/env/extravars',)
verbosity: 4
connection: smart
timeout: 10
1 plays in vmware/provision-vm_from_template.yml

PLAY [localhost] ***************************************************************
META: ran handlers

TASK [opsta.cfme_provision_vms : Register fact for VM find by datacenter and folder] ***
task path: /tmp/awx_43__vaeenc1/project/vmware/roles/opsta.cfme_provision_vms/tasks/setup_fact-vmware.yml:3
ok: [localhost] => {
    "ansible_facts": {
        "_gather_vm_folder": "NetApp-HCI-Datacenter-HQ/vm/Virtual Machines Staging"
    },
    "changed": false
}

PLAY RECAP *********************************************************************
localhost                  : ok=68   changed=9    unreachable=0    failed=0    skipped=33   rescued=0    ignored=1
"""
