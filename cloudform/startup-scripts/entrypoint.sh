#!/bin/bash

# /bin/rm -rf /code/static/*
# /usr/local/bin/python manage.py collectstatic --no-input
# /usr/local/bin/python manage.py migrate
$HOME/.local/bin/uvicorn --workers 2 --limit-concurrency 1024 --host 0.0.0.0 --port ${LISTEN_PORT:-8000} --proxy-headers cloudform.asgi:application
