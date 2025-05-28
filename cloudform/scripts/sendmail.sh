#!/bin/bash
SCRIPTDIR=$(dirname $0)
MANAGESCRIPT="${SCRIPTDIR}/../manage.py"

[[ $SENDMAIL_DAEMON =~ [yY]es|[tT]rue|YES|TRUE ]] && SENDMAIL_DAEMON_ARG="--daemon" || SENDMAIL_DAEMON_ARG=""

python ${MANAGESCRIPT} sendmail ${SENDMAIL_DAEMON_ARG} \
  --interval=${SENDMAIL_INTERVAL:-1} \
  --worker=${SENDMAIL_WORKERS:-1}
