-- ==============================================================================
-- UNIVERSITY EXAMINATION AND ACADEMIC MANAGEMENT SYSTEM (UEAMS)
-- MIGRATION: ENUM HARDENING & INTEGRITY ALIGNMENT
-- ==============================================================================
-- Ensures marks_status contains 'locked' to support examination office grade locking.

DO $$ BEGIN
    ALTER TYPE marks_status ADD VALUE IF NOT EXISTS 'locked';
EXCEPTION WHEN duplicate_object THEN null; END $$;
