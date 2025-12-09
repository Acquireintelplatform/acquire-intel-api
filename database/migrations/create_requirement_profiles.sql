CREATE TABLE IF NOT EXISTS operator_requirement_profiles (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

    min_sqft INTEGER,
    max_sqft INTEGER,
    preferred_locations TEXT[],
    excluded_locations TEXT[],
    format_type TEXT,
    use_class TEXT,
    frontage_min INTEGER,
    power_supply TEXT,
    extraction_required BOOLEAN,
    alcohol_license BOOLEAN,
    notes TEXT,
    extracted_raw_text TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
