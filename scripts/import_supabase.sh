#!/usr/bin/env bash
# Script to apply the SQL schema to a Supabase Postgres database using psql.
# Fill the variables below with your Supabase DB connection info OR export them as env vars.

# WARNING: Do NOT commit real credentials.
# You can find the connection string in Supabase Dashboard -> Settings -> Database -> Connection string

DB_HOST="<DB_HOST>"         # e.g. db.<project_ref>.supabase.co
DB_PORT=5432
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="<DB_PASSWORD>"
SQL_FILE="./db/supabase_setup.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

echo "Applying schema from $SQL_FILE to $DB_HOST..."
psql --host="$DB_HOST" --port=$DB_PORT --username="$DB_USER" --dbname="$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo "Schema applied successfully."
else
  echo "Error applying schema. Check the output above." >&2
fi

# Unset password
unset PGPASSWORD
