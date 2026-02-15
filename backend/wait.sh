#!/bin/sh

# Use environment variables or defaults
DB_HOST="${DB_HOST:-smart-trash-db}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."

# wait until DB is ready (max 30 attempts = 60 seconds)
attempts=0
max_attempts=30

while ! nc -z $DB_HOST $DB_PORT; do
  attempts=$((attempts + 1))
  if [ $attempts -ge $max_attempts ]; then
    echo "Failed to connect to database after $max_attempts attempts"
    exit 1
  fi
  sleep 2
done

echo "Postgres is up, starting NestJS..."
exec npm run start:prod
