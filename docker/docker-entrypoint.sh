#!/bin/bash

# Migrate Postgres using and prisma client
cd /app/backend
DATABASE_CONNECTION_STRING=$DATABASE_CONNECTION_STRING npx prisma migrate deploy --schema=./prisma/schema.prisma
DATABASE_CONNECTION_STRING=$DATABASE_CONNECTION_STRING npx prisma generate --schema=./prisma/schema.prisma

# Start backend server & workers
node /app/backend/index.js &
NODE_ENV=development node /app/workers/index.js &

cd /app/workers/
NODE_ENV=development yarn run inngest-cli dev -u http://0.0.0.0:3355/background-workers &

cd /app/document-processor
FLASK_ENV=production FLASK_APP=wsgi.py gunicorn --timeout 300 --workers 4 --bind 0.0.0.0:8888 wsgi:api &
wait -n
exit $?