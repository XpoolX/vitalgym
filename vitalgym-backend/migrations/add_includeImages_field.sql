-- Migration to add includeImages to Routines table
-- Run this SQL against your database to add the new column

ALTER TABLE Routines 
ADD COLUMN includeImages BOOLEAN DEFAULT TRUE;

-- Update existing records to have includeImages = TRUE (backward compatibility)
UPDATE Routines SET includeImages = TRUE WHERE includeImages IS NULL;
