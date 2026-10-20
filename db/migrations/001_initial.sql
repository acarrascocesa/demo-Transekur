CREATE TABLE vehicles (
  id uuid PRIMARY KEY,
  brand text NOT NULL,
  model text NOT NULL,
  color text NOT NULL,
  plate text NOT NULL UNIQUE
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (username = lower(username)),
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('DISPATCHER', 'DRIVER')),
  vehicle_id uuid REFERENCES vehicles(id)
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE services (
  id uuid PRIMARY KEY,
  client_name text NOT NULL,
  phone text NOT NULL,
  pickup text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  driver_id uuid NOT NULL REFERENCES users(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  public_token text NOT NULL UNIQUE,
  seed_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX services_driver_day_idx ON services(driver_id, scheduled_at);
CREATE INDEX services_day_idx ON services(scheduled_at);

CREATE TABLE notices (
  id uuid PRIMARY KEY,
  service_id uuid NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE login_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
CREATE INDEX login_attempts_expiry_idx ON login_attempts(expires_at);
