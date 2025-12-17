-- Drop trigger
DROP TRIGGER IF EXISTS update_leads_updated_at ON broccoli.leads;

-- Drop function
DROP FUNCTION IF EXISTS broccoli.update_updated_at_column();

-- Drop table
DROP TABLE IF EXISTS broccoli.leads;

-- Drop enums
DROP TYPE IF EXISTS broccoli.chat_channel;
DROP TYPE IF EXISTS broccoli.lead_status;

-- Drop schema
DROP SCHEMA IF EXISTS broccoli;
