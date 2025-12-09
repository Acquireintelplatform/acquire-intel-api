DROP TABLE IF EXISTS operator_requirement_profiles;

CREATE TABLE operator_requirement_profiles (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER REFERENCES operators(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT,
  file_path TEXT,

  -- Raw extracted text
  raw_text TEXT,

  -- Parsed structured JSON
  parsed_data JSONB,

  -- Auto timestamp
  created_at TIMESTAMP DEFAULT NOW()
);
