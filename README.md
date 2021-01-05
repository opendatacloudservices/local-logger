# local-logger
node-js logger module

## create database

```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message JSON,
  transaction_duration NUMERIC,
  transaction_success BOOLEAN,
  stack TEXT[],
  full_stack TEXT[],
  token TEXT,
  token_parent TEXT,
  express_route TEXT,
  express_method TEXT,
  express_query JSON,
  express_origin TEXT,
  env TEXT
);
```

## clean database

```sql
TRUNCATE logs RESTART IDENTITY;
VACUUM FULL ANALYZE logs;
```
