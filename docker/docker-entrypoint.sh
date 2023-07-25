#!/bin/bash
node /app/backend/index.js &
NODE_ENV=development node /app/workers/index.js &
{ cd /app/workers/ && NODE_ENV=development yarn run inngest-cli dev -u http://0.0.0.0:3355/background-workers; } &
{ FLASK_ENV=production FLASK_APP=wsgi.py cd document-processor && gunicorn --workers 4 --bind 0.0.0.0:8888 wsgi:api; } &
wait -n
exit $?

yarn run inngest-cli dev -u http://127.0.0.1:3355/background-workers