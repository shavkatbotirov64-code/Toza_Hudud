#!/bin/sh
set -e

# Set defaults
export PORT=${PORT:-80}
export BACKEND_URL=${BACKEND_URL:-http://localhost:3002}

echo "=== Environment Variables ==="
echo "PORT: $PORT"
echo "BACKEND_URL: $BACKEND_URL"
echo ""

# Substitute environment variables in nginx config
envsubst '$PORT $BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "=== Nginx Configuration ==="
cat /etc/nginx/conf.d/default.conf
echo ""

# Start nginx
exec nginx -g "daemon off;"
