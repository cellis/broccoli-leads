-- Add processing_error column to track leads that couldn't be fully processed
ALTER TABLE broccoli.leads
ADD COLUMN processing_error TEXT;

-- Add index for filtering leads with processing errors
CREATE INDEX idx_leads_processing_error ON broccoli.leads(processing_error)
WHERE processing_error IS NOT NULL;
