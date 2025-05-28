# Use an official Python runtime as a parent image
FROM python:3.8
LABEL maintainer="hello@wagtail.io"

# Set environment varibles
ENV PYTHONUNBUFFERED 1
ENV DJANGO_ENV dev

RUN apt update && \
    apt install -y libsasl2-dev libldap2-dev && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /code/requirements.txt
# RUN pip install --upgrade pip
# Install any needed packages specified in requirements.txt
RUN pip install -r /code/requirements.txt
RUN pip install gunicorn>=20.0.4

# Copy the current directory contents into the container at /code/
COPY . /code/
# Set the working directory to /code/
WORKDIR /code/

RUN python manage.py collectstatic --no-input && mkdir /code/media

RUN useradd -u 1001 -s /bin/bash wagtail && chown -R wagtail /code
USER wagtail

EXPOSE 8000
CMD exec gunicorn docs.wsgi:application --bind 0.0.0.0:8000 --workers 3
