-- Migration: Add medical_analyses table and update recommendations table
-- Date: 2025-12-11

-- 1. Create medical_analyses table
CREATE TABLE IF NOT EXISTS medical_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    complexity_score INTEGER,
    complexity_reason TEXT,
    key_findings JSONB,
    red_flags JSONB,
    timeline JSONB,
    questions_for_doctor JSONB,
    full_response JSONB
);

-- 2. Update recommendations table
ALTER TABLE recommendations 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS note TEXT;
