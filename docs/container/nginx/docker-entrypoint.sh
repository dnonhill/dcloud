#!/bin/bash
set -e

if [[ -z "${DOCS_HOST}" ]]; then
    export DOCS_HOST='docs'
fi
if [[ -z "${DOCS_PORT}" ]]; then
    export DOCS_PORT='8000'
fi

envsubst '${PREFIX_PATH},${DOCS_HOST},${DOCS_PORT}' < /opt/bitnami/nginx/conf/server_blocks/nginx.conf.template > /opt/bitnami/nginx/conf/server_blocks/nginx.conf

set -o errexit
set -o nounset
set -o pipefail
#set -o xtrace
# shellcheck disable=SC1091

# Load libraries
. /libbitnami.sh
. /libnginx.sh

# Load NGINX environment variables
eval "$(nginx_env)"

print_welcome_page

if [[ "$*" = "/run.sh" ]]; then
    info "** Starting NGINX setup **"
    /setup.sh
    info "** NGINX setup finished! **"
fi

echo ""
exec "$@"

exec nginx "$@"
