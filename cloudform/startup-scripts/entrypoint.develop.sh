#!/usr/bin/env sh

while ! nc -z dcloud_db 5432; do sleep 1; done

python3 manage.py migrate --settings=cloudform.settings.localhost
python3 manage.py runserver 0.0.0.0:8000 --settings=cloudform.settings.localhost