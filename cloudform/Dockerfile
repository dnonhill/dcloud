FROM node:12

RUN groupadd -g 1001 -r nodejs && useradd -u 1001 -s /bin/bash -m -r -g nodejs nodejs && mkdir /code && chown -R nodejs: /code
USER nodejs

COPY --chown=nodejs ./frontend/package-lock.json ./frontend/package.json /code/

WORKDIR /code
RUN ls -lah /home/nodejs && npm ci

COPY --chown=nodejs ./frontend/ /code/

RUN npm run build


FROM python:3.8

COPY oracleclient/instantclient-basiclite-linux.x64-19.9.0.0.0dbru.zip /opt/


RUN apt-get update \
	&& apt-get install -y libsasl2-dev libldap2-dev libaio1 unzip libz-dev libjpeg-dev libfreetype6-dev python3-dev screen iproute2 2ping nmap iputils-ping \
	&& unzip /opt/instantclient-basiclite-linux.x64-19.9.0.0.0dbru.zip -d /opt/ \
	&& echo "/opt/instantclient_19_9" >> /etc/ld.so.conf.d/oracle.conf \
	&& ldconfig \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update
RUN apt install -y fonts-thai-tlwg-ttf

RUN groupadd -g 1001 -r django && useradd -u 1001 -s /bin/bash -m -r -g django django && mkdir -p /code/media && chown -R django: /code
USER django

# RUN pip install --upgrade "pip<24.1" setuptools wheel

# RUN pip install --upgrade pip setuptools wheel

COPY --chown=django requirements*.txt /code/

WORKDIR /code

RUN pip install --upgrade setuptools

RUN pip install --user -r requirements.txt

COPY --chown=django . /code
COPY --from=0 --chown=django /code/build /code/frontend/build

ENV AUTH_LDAP_ENABLED=true \
	AUTH_LDAP_SERVER_URI=ldap://localhost:10389 \
	AUTH_LDAP_START_TLS=false \
	AUTH_LDAP_BIND_DN=uid=admin,ou=system \
	AUTH_LDAP_BIND_PASSWORD=secret \
	AUTH_LDAP_USER_SEARCH_BASE_DN=ou=system \
	AUTH_LDAP_USER_SEARCH_FILTER_STR=(mail=%(user)s) \
	AUTH_LDAP_GROUP_SEARCH_BASE_DN=ou=Grops,dc=example,dc=com \
	AUTH_LDAP_GROUP_SEARCH_FILTER_STR=(objectClass=groupOfNames) \
	AUTH_LDAP_GROUP_MAP='{"approver": "approver", "owner": "requestor", "reviewer": "reviewer"}' \
	DCLOUD_DOMAIN='ptt' \
	DCLOUD_FORCE_SECURE_REQUEST=false \
	EMAIL_ENABLED=true \
	EMAIL_BACKEND=dummy \
	EMAIL_HOST=localhost \
	EMAIL_PORT=25 \
	EMAIL_HOST_USER="" \
	EMAIL_HOST_PASSWORD="" \
	REDIS_ENABLED=true \
	REDIS_HOSTS="localhost:6379" \
	PATH="${PATH}:/usr/local/bin:/home/django/.local/bin"

#RUN /usr/local/bin/python manage.py collectstatic --noinput

ENTRYPOINT ["/code/startup-scripts/entrypoint.sh"]
