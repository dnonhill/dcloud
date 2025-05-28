from hamcrest import assert_that, is_, has_length, has_item

from .graph import is_result_status, headline_cut, job_output_graph


def test_headline_cut():
    # normal case
    s = "ok: xxx"
    assert_that(headline_cut(s), is_("ok"))

    s = "changed: xxx"
    assert_that(headline_cut(s), is_("changed"))

    # bracket case
    s = "[DEPRECATION WARNING]: xxxx"
    assert_that(headline_cut(s), is_("DEPRECATION WARNING"))

    # not headline content
    s = '     "field": "value"'
    assert_that(headline_cut(s), is_(""))


def test_is_result_status():
    assert_that(is_result_status("ok"), is_(True))
    assert_that(is_result_status("changed"), is_(True))
    assert_that(is_result_status("ignoring"), is_(False))
    assert_that(is_result_status("DEPRECATION WARNING"), is_(False))


def test_job_output_graph_for_create_vm():
    job_output = CREATE_VM_STDOUT
    graph = job_output_graph(job_output)

    # multiple result check
    assert_that(graph["plays"][0]["tasks"][1]["results"], has_length(18))
    # single result check
    assert_that(graph["plays"][0]["tasks"][2]["results"], has_length(1))
    # recap check
    assert_that(graph["plays"][0]["recap"]["host"], is_("localhost"))
    assert_that(graph["plays"][0]["recap"]["ok"], is_(68))
    assert_that(graph["plays"][0]["recap"]["changed"], is_(9))
    # check content
    assert_that(
        graph["plays"][0]["tasks"][-2]["results"][0]["content"][
            "cfme_phpipam_ip_description_list"
        ],
        has_item("cfme - test-dcloud-01 - eth0"),
    )


def test_job_output_graph_for_retire_vm():
    job_output = RETIRE_VM_STDOUT
    graph = job_output_graph(job_output)

    # multiple result check
    assert_that(graph["plays"][0]["tasks"][0]["results"], has_length(3))
    # single result_check
    assert_that(graph["plays"][0]["tasks"][1]["results"], has_length(1))
    # recap check
    assert_that(graph["plays"][0]["recap"]["host"], is_("localhost"))
    assert_that(graph["plays"][0]["recap"]["ok"], is_(17))
    assert_that(graph["plays"][0]["recap"]["changed"], is_(3))
    # check content
    assert_that(
        graph["plays"][0]["tasks"][-1]["results"][0]["content"]["_result"]["meta"][
            "message"
        ],
        is_("Address deleted"),
    )


CREATE_VM_STDOUT = r"""
Identity added: /tmp/awx_29_lvk3cvsf/artifacts/29/ssh_key_data (/tmp/awx_29_lvk3cvsf/artifacts/29/ssh_key_data)

Vault password:

PLAY [localhost] ***************************************************************
 [WARNING]: While constructing a mapping from
/tmp/awx_152_dz6jl73e/project/openshift/group_vars/all.yml, line 5, column 1,
found a duplicate dict key (mqserviceid). Using last defined value only.

 [WARNING]: While constructing a mapping from
/tmp/awx_152_dz6jl73e/project/openshift/group_vars/all.yml, line 5, column 1,
found a duplicate dict key (oc_storage). Using last defined value only.

 [WARNING]: While constructing a mapping from
/tmp/awx_152_dz6jl73e/project/openshift/group_vars/all.yml, line 5, column 1,
found a duplicate dict key (oc_project_name). Using last defined value only.

TASK [Check oc_cluster] ********************************************************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Debug initial vars] ***************************
ok: [localhost] => (item=vcenter_cluster) => {
    "ansible_loop_var": "item",
    "item": "vcenter_cluster",
    "vcenter_cluster": "NetApp-HCI-Cluster"
}
ok: [localhost] => (item=vcenter_folder) => {
    "ansible_loop_var": "item",
    "item": "vcenter_folder",
    "vcenter_folder": "Virtual Machines Staging"
}
ok: [localhost] => (item=user_tenant) => {
    "ansible_loop_var": "item",
    "item": "user_tenant",
    "user_tenant": "PTT/PTTDIGITAL"
}
ok: [localhost] => (item=new_project) => {
    "ansible_loop_var": "item",
    "item": "new_project",
    "new_project": ""
}
ok: [localhost] => (item=project) => {
    "ansible_loop_var": "item",
    "item": "project",
    "project": "test-dcloud"
}
ok: [localhost] => (item=vm_template_type) => {
    "ansible_loop_var": "item",
    "item": "vm_template_type",
    "vm_template_type": "linux"
}
ok: [localhost] => (item=vm_template) => {
    "ansible_loop_var": "item",
    "item": "vm_template",
    "vm_template": "Centos7"
}
ok: [localhost] => (item=vm_name) => {
    "ansible_loop_var": "item",
    "item": "vm_name",
    "vm_name": "test-dcloud-01"
}
ok: [localhost] => (item=cfme_environment) => {
    "ansible_loop_var": "item",
    "cfme_environment": "ST",
    "item": "cfme_environment"
}
ok: [localhost] => (item=cfme_site) => {
    "ansible_loop_var": "item",
    "cfme_site": "HQ",
    "item": "cfme_site"
}
ok: [localhost] => (item=cfme_vm_network_option1) => {
    "ansible_loop_var": "item",
    "cfme_vm_network_option1": "pds_staging_app_3833_10.224.4.x_24",
    "item": "cfme_vm_network_option1"
}
ok: [localhost] => (item=cfme_vm_network_option2) => {
    "ansible_loop_var": "item",
    "cfme_vm_network_option2": "-",
    "item": "cfme_vm_network_option2"
}
ok: [localhost] => (item=cfme_vm_network_option3) => {
    "ansible_loop_var": "item",
    "cfme_vm_network_option3": "-",
    "item": "cfme_vm_network_option3"
}
ok: [localhost] => (item=cfme_vm_disk_gb_option1) => {
    "ansible_loop_var": "item",
    "cfme_vm_disk_gb_option1": 50,
    "item": "cfme_vm_disk_gb_option1"
}
ok: [localhost] => (item=cfme_vm_disk_gb_option2) => {
    "ansible_loop_var": "item",
    "cfme_vm_disk_gb_option2": 0,
    "item": "cfme_vm_disk_gb_option2"
}
ok: [localhost] => (item=cfme_vm_disk_gb_option3) => {
    "ansible_loop_var": "item",
    "cfme_vm_disk_gb_option3": 0,
    "item": "cfme_vm_disk_gb_option3"
}
ok: [localhost] => (item=cfme_vm_network_type) => {
    "ansible_loop_var": "item",
    "cfme_vm_network_type": "static",
    "item": "cfme_vm_network_type"
}
ok: [localhost] => (item=manageiq) => {
    "ansible_loop_var": "item",
    "item": "manageiq",
    "manageiq": "VARIABLE IS NOT DEFINED!"
}

TASK [opsta.cfme_provision_vms : Register fact for VM find by datacenter and folder] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM find by datacenter] ******
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM folder] ******************
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "_gather_vm_folder": "NetApp-HCI-Datacenter-HQ/vm/Virtual Machines Staging"
}

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "_vm_folder": "/Virtual Machines Staging"
}

TASK [opsta.cfme_provision_vms : Gathering facts from VM for existed vm name checking] ***
fatal: [localhost]: FAILED! => {"changed": false, "msg": "Unable to gather facts for non-existing VM test-dcloud-01"}
...ignoring

TASK [opsta.cfme_provision_vms : fail] *****************************************
[DEPRECATION WARNING]: Using tests as filters is deprecated. Instead of using
`result|succeeded` use `result is succeeded`. This feature will be removed in
version 2.9. Deprecation warnings can be disabled by setting
deprecation_warnings=False in ansible.cfg.
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM find by datacenter and folder] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM find by datacenter] ******
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM folder] ******************
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "_gather_vm_folder": "NetApp-HCI-Datacenter-HQ/vm/Virtual Machines Staging"
}

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "_vm_folder": "/Virtual Machines Staging"
}

TASK [opsta.cfme_provision_vms : Register fact for datastore (non-PRD)] ********
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for datastore (PRD)] ************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for specific datastore] *********
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for datastore (non-PRD)] ********
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for datastore (PRD)] ************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for specific datastore] *********
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "vm_datastore": "ST_HQ_BRONZE_P4_01"
}

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 1)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 1.1)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 1.2)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 2)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 2.1)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 2.2)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 3)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 1)] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 1.1)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 1.2)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 2)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 2.1)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 2.2)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for list of disks (scenario 3)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "disk_lists": [
        {
            "datastore": "ST_HQ_BRONZE_P4_01",
            "size_gb": "50",
            "type": "thin"
        }
    ]
}

TASK [opsta.cfme_provision_vms : Register a fact for list of networks] *********
ok: [localhost] => (item=pds_staging_app_3833_10.224.4.x_24)
skipping: [localhost] => (item=-)
skipping: [localhost] => (item=-)

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "cfme_vm_network_name_list": [
        "pds_staging_app_3833_10.224.4.x_24"
    ]
}

TASK [opsta.cfme_provision_vms : Acquire list of domain names (DNS) by network] ***
changed: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact for dns servers (Linux)] ******
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "cfme_vm_dns_server_list": [
        "10.222.4.13",
        "10.222.4.14",
        "10.121.160.32"
    ]
}

TASK [opsta.cfme_provision_vms : Acquire list of network(s) (Static)] **********
changed: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for network list (Static)] ******
ok: [localhost]

TASK [opsta.cfme_provision_vms : Add start_connected] **************************
ok: [localhost] => (item={u'netmask': u'255.255.255.0', u'name': u'pds_staging_app_3833_10.224.4.x_24', u'device_type': u'vmxnet3', u'ip': u'10.224.4.48', u'type': u'static', u'gateway': u'10.224.4.1'})

TASK [opsta.cfme_provision_vms : set_fact] *************************************
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "cfme_vm_network_list": [
        {
            "device_type": "vmxnet3",
            "gateway": "10.224.4.1",
            "ip": "10.224.4.48",
            "name": "pds_staging_app_3833_10.224.4.x_24",
            "netmask": "255.255.255.0",
            "start_connected": true,
            "type": "static"
        }
    ]
}

TASK [opsta.cfme_provision_vms : Acquire list of network(s) (DHCP)] ************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for network list (DHCP)] ********
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Add start_connected] **************************
skipping: [localhost] => (item={u'netmask': u'255.255.255.0', 'start_connected': True, u'name': u'pds_staging_app_3833_10.224.4.x_24', u'device_type': u'vmxnet3', u'ip': u'10.224.4.48', u'type': u'static', u'gateway': u'10.224.4.1'})

TASK [opsta.cfme_provision_vms : set_fact] *************************************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for creating vm customization value (non-AD)] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for creating vm customization value (AD)] ***
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Create Virtual Machines from Centos7 template] ***
[DEPRECATION WARNING]: Using tests as filters is deprecated. Instead of using
`result|success` use `result is success`. This feature will be removed in
version 2.9. Deprecation warnings can be disabled by setting
deprecation_warnings=False in ansible.cfg.
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "cfme_vm_network_list": [
        {
            "device_type": "vmxnet3",
            "gateway": "10.224.4.1",
            "ip": "10.224.4.48",
            "name": "pds_staging_app_3833_10.224.4.x_24",
            "netmask": "255.255.255.0",
            "start_connected": true,
            "type": "static"
        }
    ]
}

TASK [opsta.cfme_provision_vms : Power on VM] **********************************
changed: [localhost]

TASK [opsta.cfme_provision_vms : Gathering facts from VM] **********************
[DEPRECATION WARNING]: Using tests as filters is deprecated. Instead of using
`result|success` use `result is success`. This feature will be removed in
version 2.9. Deprecation warnings can be disabled by setting
deprecation_warnings=False in ansible.cfg.
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "new_vm": {
        "attempts": 1,
        "changed": false,
        "failed": false,
        "instance": {
            "annotation": "-- notes --",
            "current_snapshot": null,
            "customvalues": {},
            "guest_consolidation_needed": false,
            "guest_question": null,
            "guest_tools_status": "guestToolsNotRunning",
            "guest_tools_version": "10279",
            "hw_cluster": "NetApp-HCI-Cluster",
            "hw_cores_per_socket": 1,
            "hw_datastores": [
                "NetApp-HCI-Datastore-02"
            ],
            "hw_esxi_host": "10.224.0.33",
            "hw_eth0": {
                "addresstype": "assigned",
                "ipaddresses": null,
                "label": "Network adapter 1",
                "macaddress": "00:50:56:bb:8c:14",
                "macaddress_dash": "00-50-56-bb-8c-14",
                "portgroup_key": "dvportgroup-3613",
                "portgroup_portkey": "817",
                "summary": "DVSwitch: 50 3b 3d 47 32 4a e5 20-6b bc 96 71 02 13 2d a9"
            },
            "hw_files": [
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.vmx",
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.nvram",
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.vmsd",
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.vmdk"
            ],
            "hw_folder": "/NetApp-HCI-Datacenter-HQ/vm/Virtual Machines Staging",
            "hw_guest_full_name": null,
            "hw_guest_ha_state": false,
            "hw_guest_id": null,
            "hw_interfaces": [
                "eth0"
            ],
            "hw_is_template": false,
            "hw_memtotal_mb": 1024,
            "hw_name": "test-dcloud-01",
            "hw_power_status": "poweredOn",
            "hw_processor_count": 1,
            "hw_product_uuid": "423b9208-a21a-0652-3a1a-363a82223691",
            "hw_version": "vmx-13",
            "instance_uuid": "503bb15b-fca6-c3b7-3afa-f47690b08a52",
            "ipv4": null,
            "ipv6": null,
            "module_hw": true,
            "snapshots": [],
            "vnc": {}
        }
    }
}

TASK [opsta.cfme_provision_vms : Register a fact for vm hw_product_uuid] *******
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "new_vm_uuid": "423b9208-a21a-0652-3a1a-363a82223691"
}

TASK [opsta.cfme_provision_vms : Register a fact with split and lower characters] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact with join characters] *********
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact for parsed project] ***********
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact for pasred new project] *******
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "parsed_project": "test-dcloud"
}

TASK [opsta.cfme_provision_vms : Register a fact for project name & value] *****
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "project_name": [
        "TEST-DCLOUD"
    ]
}

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "project_value": "test-dcloud"
}

TASK [opsta.cfme_provision_vms : Register a fact for add new tag in category] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "resource_tag_create": {
        "description": "TEST-DCLOUD",
        "name": "test-dcloud"
    }
}

TASK [opsta.cfme_provision_vms : Register a fact for location authorized path] ***
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact for Ansible host] *************
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact for Ansible user] *************
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register a fact for Ansible port] *************
ok: [localhost]

TASK [opsta.cfme_provision_vms : Wait for SSH available connection to host] ****
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "_check_ssh_result": {
        "attempts": 1,
        "changed": false,
        "elapsed": 127,
        "failed": false,
        "match_groupdict": {},
        "match_groups": [],
        "path": null,
        "port": 22,
        "search_regex": "OpenSSH",
        "state": "started"
    }
}

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "ansible_host": "10.224.4.48"
}

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "ansible_user": "root"
}

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "ansible_port": 22
}

TASK [opsta.cfme_provision_vms : Check authorized_keys file was exists] ********
[DEPRECATION WARNING]: Using tests as filters is deprecated. Instead of using
`result|succeeded` use `result is succeeded`. This feature will be removed in
version 2.9. Deprecation warnings can be disabled by setting
deprecation_warnings=False in ansible.cfg.
changed: [localhost -> 10.224.4.48]

TASK [opsta.cfme_provision_vms : Retrieve distro information] ******************
changed: [localhost -> 10.224.4.48]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "check_distro": {
        "changed": true,
        "failed": false,
        "rc": 0,
        "stderr": "Shared connection to 10.224.4.48 closed.\\r\\n",
        "stderr_lines": [
            "Shared connection to 10.224.4.48 closed."
        ],
        "stdout": "NAME=\\"CentOS Linux\\"\\r\\nVERSION=\\"7 (Core)\\"\\r\\nID=\\"centos\\"\\r\\nID_LIKE=\\"rhel fedora\\"\\r\\nVERSION_ID=\\"7\\"\\r\\nPRETTY_NAME=\\"CentOS Linux 7 (Core)\\"\\r\\nANSI_COLOR=\\"0;31\\"\\r\\nCPE_NAME=\\"cpe:/o:centos:centos:7\\"\\r\\nHOME_URL=\\"https://www.centos.org/\\"\\r\\nBUG_REPORT_URL=\\"https://bugs.centos.org/\\"\\r\\n\\r\\nCENTOS_MANTISBT_PROJECT=\\"CentOS-7\\"\\r\\nCENTOS_MANTISBT_PROJECT_VERSION=\\"7\\"\\r\\nREDHAT_SUPPORT_PRODUCT=\\"centos\\"\\r\\nREDHAT_SUPPORT_PRODUCT_VERSION=\\"7\\"\\r\\n\\r\\n",
        "stdout_lines": [
            "NAME=\\"CentOS Linux\\"",
            "VERSION=\\"7 (Core)\\"",
            "ID=\\"centos\\"",
            "ID_LIKE=\\"rhel fedora\\"",
            "VERSION_ID=\\"7\\"",
            "PRETTY_NAME=\\"CentOS Linux 7 (Core)\\"",
            "ANSI_COLOR=\\"0;31\\"",
            "CPE_NAME=\\"cpe:/o:centos:centos:7\\"",
            "HOME_URL=\\"https://www.centos.org/\\"",
            "BUG_REPORT_URL=\\"https://bugs.centos.org/\\"",
            "",
            "CENTOS_MANTISBT_PROJECT=\\"CentOS-7\\"",
            "CENTOS_MANTISBT_PROJECT_VERSION=\\"7\\"",
            "REDHAT_SUPPORT_PRODUCT=\\"centos\\"",
            "REDHAT_SUPPORT_PRODUCT_VERSION=\\"7\\"",
            ""
        ]
    }
}

TASK [opsta.cfme_provision_vms : Register a fact for RHEL, CentOS, SUSE (root user)] ***
ok: [localhost] => (item=NAME="CentOS Linux"\r
VERSION="7 (Core)"\r
ID="centos"\r
ID_LIKE="rhel fedora"\r
VERSION_ID="7"\r
PRETTY_NAME="CentOS Linux 7 (Core)"\r
ANSI_COLOR="0;31"\r
CPE_NAME="cpe:/o:centos:centos:7"\r
HOME_URL="https://www.centos.org/"\r
BUG_REPORT_URL="https://bugs.centos.org/"\r
\r
CENTOS_MANTISBT_PROJECT="CentOS-7"\r
CENTOS_MANTISBT_PROJECT_VERSION="7"\r
REDHAT_SUPPORT_PRODUCT="centos"\r
REDHAT_SUPPORT_PRODUCT_VERSION="7"\r
\r
)

TASK [opsta.cfme_provision_vms : Assign default password] **********************
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Assign default password] **********************
ok: [localhost]

TASK [opsta.cfme_provision_vms : Change VM password (root user)] ***************
changed: [localhost -> 10.224.4.48]

TASK [opsta.cfme_provision_vms : Change VM password (non-root user)] ***********
skipping: [localhost]

TASK [opsta.cfme_provision_vms : Delete public key on server] ******************
changed: [localhost -> 10.224.4.48]

TASK [opsta.cfme_provision_vms : Gathering facts from exists early VM] *********
ok: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM notes] *******************
ok: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "vm_notes_overrides": "note => -- notes --\\nhw_project_uuid => 423b9208-a21a-0652-3a1a-363a82223691\\ntenant/group => PTT/PTTDIGITAL\\nproject => TEST-DCLOUD\\n"
}

TASK [opsta.cfme_provision_vms : Edit VM note in VMware vCenter] ***************
changed: [localhost]

TASK [opsta.cfme_provision_vms : Register fact for VM notes (fallback)] ********
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "vm_notes_base": "VARIABLE IS NOT DEFINED!"
}

TASK [opsta.cfme_provision_vms : Edit VM note in VMware vCenter (fallback)] ****
skipping: [localhost]

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "_output_fallback": {
        "changed": false,
        "skip_reason": "Conditional result was False",
        "skipped": true
    }
}

TASK [opsta.cfme_provision_vms : Register fact for list of ip addresses] *******
ok: [localhost] => (item={u'netmask': u'255.255.255.0', 'start_connected': True, u'name': u'pds_staging_app_3833_10.224.4.x_24', u'device_type': u'vmxnet3', u'ip': u'10.224.4.48', u'type': u'static', u'gateway': u'10.224.4.1'})

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "cfme_phpipam_ip_addresses_list": [
        "10.224.4.48"
    ]
}

TASK [opsta.cfme_provision_vms : Register fact for phpipam description] ********
ok: [localhost] => (item=eth0)

TASK [opsta.cfme_provision_vms : debug] ****************************************
ok: [localhost] => {
    "cfme_phpipam_ip_description_list": [
        "cfme - test-dcloud-01 - eth0"
    ]
}

TASK [opsta.cfme_provision_vms : Update IP addresses description of phpipam] ***
changed: [localhost] => (item=[u'10.224.4.48', u'cfme - test-dcloud-01 - eth0'])

PLAY RECAP *********************************************************************
localhost                  : ok=68   changed=9    unreachable=0    failed=0    skipped=33   rescued=0    ignored=1


"""

RETIRE_VM_STDOUT = r"""

PLAY [localhost] ***************************************************************

TASK [opsta.cfme_retirement_vms : Debug init vars] *****************************
ok: [localhost] => (item=vcenter_username) => {
    "ansible_loop_var": "item",
    "item": "vcenter_username",
    "vcenter_username": "hciadmin@vsphere.local"
}
ok: [localhost] => (item=vcenter_password) => {
    "ansible_loop_var": "item",
    "item": "vcenter_password",
    "vcenter_password": "NetApp123!"
}
ok: [localhost] => (item=manageiq) => {
    "ansible_loop_var": "item",
    "item": "manageiq",
    "manageiq": "VARIABLE IS NOT DEFINED!"
}

TASK [opsta.cfme_retirement_vms : Register fact for VM find by datacenter and folder] ***
ok: [localhost]

TASK [opsta.cfme_retirement_vms : Register fact for VM find by datacenter] *****
skipping: [localhost]

TASK [opsta.cfme_retirement_vms : Register fact for VM folder] *****************
ok: [localhost]

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "_gather_vm_folder": "NetApp-HCI-Datacenter-HQ/vm/Virtual Machines Staging"
}

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "_vm_folder": "/Virtual Machines Staging"
}

TASK [opsta.cfme_retirement_vms : Gathering facts from VM] *********************
ok: [localhost]

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "vm_facts": {
        "changed": false,
        "failed": false,
        "instance": {
            "annotation": "note => -- notes --\\nhw_project_uuid => 423b9208-a21a-0652-3a1a-363a82223691\\ntenant/group => PTT/PTTDIGITAL\\nproject => TEST-DCLOUD\\n",
            "current_snapshot": null,
            "customvalues": {},
            "guest_consolidation_needed": false,
            "guest_question": null,
            "guest_tools_status": "guestToolsRunning",
            "guest_tools_version": "10279",
            "hw_cluster": "NetApp-HCI-Cluster",
            "hw_cores_per_socket": 1,
            "hw_datastores": [
                "NetApp-HCI-Datastore-02"
            ],
            "hw_esxi_host": "10.224.0.33",
            "hw_eth0": {
                "addresstype": "assigned",
                "ipaddresses": [
                    "10.224.4.48",
                    "fe80::250:56ff:febb:8c14"
                ],
                "label": "Network adapter 1",
                "macaddress": "00:50:56:bb:8c:14",
                "macaddress_dash": "00-50-56-bb-8c-14",
                "portgroup_key": "dvportgroup-3613",
                "portgroup_portkey": "817",
                "summary": "DVSwitch: 50 3b 3d 47 32 4a e5 20-6b bc 96 71 02 13 2d a9"
            },
            "hw_files": [
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.vmx",
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.nvram",
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.vmsd",
                "[NetApp-HCI-Datastore-02] test-dcloud-01/test-dcloud-01.vmdk"
            ],
            "hw_folder": "/NetApp-HCI-Datacenter-HQ/vm/Virtual Machines Staging",
            "hw_guest_full_name": "CentOS 7 (64-bit)",
            "hw_guest_ha_state": true,
            "hw_guest_id": "centos7_64Guest",
            "hw_interfaces": [
                "eth0"
            ],
            "hw_is_template": false,
            "hw_memtotal_mb": 1024,
            "hw_name": "test-dcloud-01",
            "hw_power_status": "poweredOn",
            "hw_processor_count": 1,
            "hw_product_uuid": "423b9208-a21a-0652-3a1a-363a82223691",
            "hw_version": "vmx-13",
            "instance_uuid": "503bb15b-fca6-c3b7-3afa-f47690b08a52",
            "ipv4": "10.224.4.48",
            "ipv6": null,
            "module_hw": true,
            "snapshots": [],
            "vnc": {}
        }
    }
}

TASK [opsta.cfme_retirement_vms : Register a fact for vm hw_product_uuid] ******
ok: [localhost]

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "vm_facts_uuid": "423b9208-a21a-0652-3a1a-363a82223691"
}

TASK [opsta.cfme_retirement_vms : Register a fact for eth0] ********************
ok: [localhost] => (item=10.224.4.48)
ok: [localhost] => (item=fe80::250:56ff:febb:8c14)

TASK [opsta.cfme_retirement_vms : Register a fact for eth1] ********************
skipping: [localhost]

TASK [opsta.cfme_retirement_vms : Register a fact for eth2] ********************
skipping: [localhost]

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "ips_list": [
        "10.224.4.48",
        "fe80::250:56ff:febb:8c14"
    ]
}

TASK [opsta.cfme_retirement_vms : Poweroff on VM] ******************************
changed: [localhost]

TASK [opsta.cfme_retirement_vms : Delete Virtual Machines] *********************
changed: [localhost]

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "vm_del": "test-dcloud-01"
}

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "ips_list": [
        "10.224.4.48",
        "fe80::250:56ff:febb:8c14"
    ]
}

TASK [opsta.cfme_retirement_vms : Release ips] *********************************
changed: [localhost]

TASK [opsta.cfme_retirement_vms : debug] ***************************************
ok: [localhost] => {
    "_result": {
        "changed": true,
        "failed": false,
        "meta": {
            "code": 200,
            "message": "Address deleted",
            "success": true,
            "time": 0.009
        }
    }
}

PLAY RECAP *********************************************************************
localhost                  : ok=17   changed=3    unreachable=0    failed=0    skipped=3    rescued=0    ignored=0


"""
