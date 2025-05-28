FROM bitnami/nginx:1.16.1

USER root
RUN apt update && \
  apt -y install gettext-base && \
  apt clean && \
  rm -rf /var/lib/apt/lists/*

COPY docker-entrypoint.sh /usr/local/bin/
RUN ln -s /usr/local/bin/docker-entrypoint.sh

USER 1001
COPY nginx.conf.template /opt/bitnami/nginx/conf/server_blocks/

ENTRYPOINT [ "docker-entrypoint.sh" ]

CMD ["/run.sh"]
