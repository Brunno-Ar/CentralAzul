-- Add portalId column to BusinessUnit table
ALTER TABLE BusinessUnit ADD COLUMN portalId VARCHAR(191) NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_BusinessUnit_portalId ON BusinessUnit(portalId);