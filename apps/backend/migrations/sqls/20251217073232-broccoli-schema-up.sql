-- Create broccoli schema
CREATE EXTENSION pgcrypto;
CREATE SCHEMA IF NOT EXISTS broccoli;

-- Create enum for lead status
CREATE TYPE broccoli.lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
  'archived'
);

-- Create enum for chat channel
CREATE TYPE broccoli.chat_channel AS ENUM (
  'sms',
  'email',
  'whatsapp',
  'phone',
  'web',
  'other'
);

-- Create leads table
CREATE TABLE broccoli.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  customer_number VARCHAR(50),
  customer_address TEXT,
  provider VARCHAR(100) NOT NULL,
  provider_lead_id VARCHAR(255),
  org_id UUID NOT NULL,
  status broccoli.lead_status NOT NULL DEFAULT 'new',
  lead_raw_data JSONB,
  chat_channel broccoli.chat_channel,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_leads_org_id ON broccoli.leads(org_id);
CREATE INDEX idx_leads_status ON broccoli.leads(status);
CREATE INDEX idx_leads_provider ON broccoli.leads(provider);
CREATE INDEX idx_leads_provider_lead_id ON broccoli.leads(provider_lead_id);
CREATE INDEX idx_leads_customer_number ON broccoli.leads(customer_number);
CREATE INDEX idx_leads_created_at ON broccoli.leads(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION broccoli.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to leads table
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON broccoli.leads
  FOR EACH ROW
  EXECUTE FUNCTION broccoli.update_updated_at_column();
