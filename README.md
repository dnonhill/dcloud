# ptt-cloudform


## **Develop without docker compose**

setup python virtualenv
```bash
brew install pyenv

pyenv install 3.8.4

brew install pyenv pyenv-virtualenv

pyenv virtualenv 3.8.4 cloudform
```

### setup postgres
``` bash
docker run \
-d \
--name postgres \
-p 5432:5432 \
-v `pwd`/data/postgres:/var/lib/postgresql/data \
-e POSTGRES_DB=cloudform \
-e POSTGRES_PASSWORD=password \
postgres:11.4
```

Run backend

``` bash
cd dcloud/cloudform
```
```bash
pyenv local cloudform
```
install dependency
```bash
pip install -r requirements-dev.txt
```
run migrate
```bash
POSTGRES_HOST=localhost python manage.py migrate
```
load init data (user, price)
```bash
POSTGRES_HOST=localhost python manage.py loaddata initial_fixtures/*.yaml
```
start api
```bash
POSTGRES_HOST=localhost DEBUG_MODE=true python manage.py runserver
```

### **Run Frontend**

``` bash
cd cloudform/frontend
```
```bash
yarn start
```

---

## **🐳 Run frontend and backend with docker compose**
```bash
cd cloudform
```
```
docker-compose up
```
load data
```
docker exec -it dcloud_api bash
python manage.py loaddata initial_fixtures/*.yaml
```
create superuser
```bash
docker exec -it dcloud_api bash
python manage.py createsuperuser
```

run unit test api
```
docker exec -it dcloud_api bash
pytest
```
---


## **Worker**
#### dev env

``` bash
export API_URL="http://localhost:8000"
export CELERY_USERNAME="<superuser_username>"
export CELERY_PASSWORD="<superuser_password>"
export VCENTER_URL="https://vcenter.site2.opsta.in.th"
export VCENTER_USERNAME="margomusto@site2.opsta.in.th"
export VCENTER_PASSWORD="LU8mUj72ucI0xZTEf19f"
```
run redis container
``` bash
docker run -d -p 6379:6379 redis
```
```bash
cd dcloud/cloudform
```
```bash
POSTGRES_HOST=localhost python manage.py migrate # make sure take up to date
```
start schedulers
```bash
celery -A cloudform beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
```
start worker
```bash
celery -A cloudform worker --loglevel=INFO
```
monitor queue with flower
```bash
flower -A cloudform --port=5555
```
start kibana and elasticsearch
``` bash
docker run -d -p 9200:9200  -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.9.1

docker run -d --link <container_id>:elasticsearch -p 5601:5601 docker.elastic.co/kibana/kibana:7.9.2
```
---
### **🐳 Run Worker with docker compose**
start elasticsearch kibana and redis
```bash
 cd cloudform
 docker-compose -f docker-compose-billing up
```
start api
```bash
cd cloudform
docker-compose up
```


start schedulers
```bash
docker exec -it dcloud_api bash

export API_URL="http://localhost:8000"
export CELERY_USERNAME="<superuser_username>"
export CELERY_PASSWORD="<superuser_password>"

celery -A cloudform beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
```
start worker
```bash
docker exec -it dcloud_api bash

export API_URL="http://localhost:8000"
export CELERY_USERNAME="<superuser_username>"
export CELERY_PASSWORD="<superuser_password>"

celery -A cloudform worker --loglevel=INFO
```
---
### Other
command create migrations when update field model that should create migrations and run migrate db
```bash
python manage.py makemigrations
```
