### Start project in local environment

```bash
docker compose -f docker-compose-local.yml --env-file=.env.local up
```

### Start project in local but connect with UAT/PROD environment

```bash
docker compose -f docker-compose-dev.yml --env-file=.env.dev up
```

### Debuging commands

```bash
# Get VM info from vCenter
./manage.py inventory_ts get vminfo -n TBKC-DAPPS-05

# Get VM power state
./manage.py inventory_ts get vmpower -n TBKC-DAPPS-05,TBKC-RPA-RUN

# List Inventory since specific day to now
./manage.py inventory_ts list inventory -n TBKC-DAPPS-05 --since 2024-07-08

# List Elasticsearch document from start_date to end_date
./manage.py els_ts list -n TBKC-DAPPS-05 -dc "PTTDIGITAL Cloud - ThaiOil" -sd 2024-07-08 -ed 2024-08-08
```

### Troubleshooting commands

```bash
# Fixed incorrect past billing from wrong power_state
./manage.py fix_power_state -f fix_power_state_example.yaml

# Used api
curl -X POST -H "Content-Type: application/json" -u admin:admin -d '{"year": "2024", "month": "6", "datacenter": "PTTDIGITAL Cloud - ThaiOil", "app_list": ["TBKC-RPA-RUN", "TBKC-RPA-CTRL", "TBKC-DVIM-WEB", "TBKC-DVIM-ORADB", "TBKC-DVIM-OCR", "TBKC-DVIM-BCC", "TBKC-DTOPBOT-APP", "TBKC-DSQLDB-05", "TBKC-DSP-WF2", "TBKC-DSP-SH1", "TBKC-DSP-OOS", "TBKC-DSP-MWF", "TBKC-DSP-MDB", "TBKC-DSP-DB2", "TBKC-DSP-DB1", "TBKC-DSP-BWF", "TBKC-DSP-BOS", "TBKC-DSP-BDB", "TBKC-DSP-AP1", "TBKC-DORADB-05", "TBKC-DHIS-DB", "TBKC-DGOOGLE-SH", "TBKC-DAPPS-05"]}' http://localhost:8000/api/fix_power_state/

curl -X POST -H "Content-Type: application/json" -u admin:admin -d '{"year": "2024", "month": "6", "datacenter": "PTTDIGITAL Cloud - ThaiOil", "app_list": ["TBKC-RPA-RUN", "TBKC-RPA-CTRL"]}' http://localhost:8000/api/fix_power_state/
```
