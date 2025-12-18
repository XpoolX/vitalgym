-- Migration to add isQuickRoutine and shareToken to Routines table
-- Run this SQL against your database to add the new columns

ALTER TABLE Routines 
ADD COLUMN isQuickRoutine BOOLEAN DEFAULT FALSE,
ADD COLUMN shareToken VARCHAR(255) UNIQUE;

-- Create index on shareToken for faster lookups
CREATE INDEX idx_routines_shareToken ON Routines(shareToken);
