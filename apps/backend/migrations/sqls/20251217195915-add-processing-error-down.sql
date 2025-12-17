-- Remove processing_error column
DROP INDEX IF EXISTS broccoli.idx_leads_processing_error;
ALTER TABLE broccoli.leads DROP COLUMN IF EXISTS processing_error;
