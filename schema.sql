-- ================================================
-- ACQUIRE COMMERCIAL INTELLIGENCE ENGINE
-- FULL POSTGRESQL SCHEMA
-- ================================================


-- ================================================
-- TABLE: portals
-- ================================================
CREATE TABLE IF NOT EXISTS portals (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    base_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: properties
-- ================================================
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,

    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    town TEXT NOT NULL,
    postcode TEXT NOT NULL,

    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    use_class TEXT,
    size_sqft INTEGER,
    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: property_units
-- ================================================
CREATE TABLE IF NOT EXISTS property_units (
    id SERIAL PRIMARY KEY,

    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    unit_name TEXT,
    floor TEXT,
    size_sqft INTEGER,
    use_class TEXT,
    description TEXT,

    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: property_portal_listings
-- ================================================
CREATE TABLE IF NOT EXISTS property_portal_listings (
    id SERIAL PRIMARY KEY,

    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,

    listing_url TEXT NOT NULL,
    external_id TEXT,
    price TEXT,
    tenure TEXT,
    availability TEXT,
    size_text TEXT,

    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: operators
-- (Retail / F&B / Leisure brands)
-- ================================================
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,

    operator_name TEXT UNIQUE NOT NULL,
    sector TEXT,                     -- restaurant, coffee, gym, retail, etc.
    website TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: operator_requirements
-- (Space requirements for each operator)
-- ================================================
CREATE TABLE IF NOT EXISTS operator_requirements (
    id SERIAL PRIMARY KEY,

    operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

    min_size_sqft INTEGER,
    max_size_sqft INTEGER,

    preferred_use_classes TEXT,      -- E, Sui Generis, etc.
    preferred_locations TEXT,        -- free text location list
    frontage_min DOUBLE PRECISION,
    extraction_required BOOLEAN,
    power_requirement_kw INTEGER,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: operator_locations
-- (Existing stores / targeted expansion areas)
-- ================================================
CREATE TABLE IF NOT EXISTS operator_locations (
    id SERIAL PRIMARY KEY,

    operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    type TEXT,       -- 'existing', 'target', 'closed'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: distress_events
-- (Companies House, Gazette, BSR)
-- ================================================
CREATE TABLE IF NOT EXISTS distress_events (
    id SERIAL PRIMARY KEY,

    company_name TEXT NOT NULL,
    company_number TEXT,
    event_type TEXT NOT NULL,        -- liquidation, winding up, compulsory strike off
    event_date DATE NOT NULL,

    source TEXT NOT NULL,            -- Gazette, BSR, CH API
    url TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: agents_landlords
-- (CRM for agents, landlords, contacts)
-- ================================================
CREATE TABLE IF NOT EXISTS agents_landlords (
    id SERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    type TEXT,          -- agent, landlord, surveyor

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: alerts
-- (User alerts: new sites, matches, distress events)
-- ================================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,

    alert_type TEXT NOT NULL,          -- 'new_property', 'operator_match', 'distress'
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
    distress_id INTEGER REFERENCES distress_events(id) ON DELETE SET NULL,

    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: scrape_jobs
-- (Each scrape operation run by cron)
-- ================================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id SERIAL PRIMARY KEY,

    portal_id INTEGER REFERENCES portals(id) ON DELETE SET NULL,
    job_type TEXT NOT NULL,            -- 'property', 'distress'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT,                        -- success, partial, failed

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================
-- TABLE: scrape_logs
-- (Individual log entries for scrape jobs)
-- ================================================
CREATE TABLE IF NOT EXISTS scrape_logs (
    id SERIAL PRIMARY KEY,

    job_id INTEGER NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,

    message TEXT NOT NULL,
    level TEXT DEFAULT 'info',          -- info, warn, error
    logged_at TIMESTAMPTZ DEFAULT NOW()
);
