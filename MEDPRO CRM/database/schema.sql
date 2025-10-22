CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_base_url TEXT,
  webhook_secret TEXT,
  api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id),
  carrier_policy_id TEXT,
  plan_name TEXT,
  current_status TEXT,
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE policy_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  source TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
