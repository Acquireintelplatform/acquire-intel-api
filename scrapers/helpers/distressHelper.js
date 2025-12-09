// ===============================================
// Acquire Intel — Distress Scraper Helper
// Shared logic for ALL distress scrapers
// ===============================================

import pool from "../../utils/db.js";

/**
 * Safely inserts or updates a distress event.
 * Prevents duplicates using (company_name + event_type + event_date).
 */
export async function upsertDistressEvent({
  company_name,
  company_number = null,
  event_type,
  event_date,
  source,
  url = null,
  notes = null
}) {
  // Normalise company name (case-insensitive compare)
  const nameNormalized = company_name.trim().toLowerCase();

  // Check for existing event
  const existing = await pool.query(
    `
    SELECT id 
    FROM distress_events
    WHERE LOWER(company_name) = LOWER($1)
      AND event_type = $2
      AND event_date = $3
      AND source = $4
    LIMIT 1;
    `,
    [nameNormalized, event_type, event_date, source]
  );

  if (existing.rows.length > 0) {
    // Update existing distress event
    const id = existing.rows[0].id;

    await pool.query(
      `
      UPDATE distress_events
      SET
        company_name = $1,
        company_number = $2,
        event_type = $3,
        event_date = $4,
        source = $5,
        url = $6,
        notes = $7,
        updated_at = NOW()
      WHERE id = $8;
      `,
      [
        company_name,
        company_number,
        event_type,
        event_date,
        source,
        url,
        notes,
        id
      ]
    );

    return { event_id: id, updated: true };
  }

  // Insert new distress event
  const insert = await pool.query(
    `
    INSERT INTO distress_events (
      company_name,
      company_number,
      event_type,
      event_date,
      source,
      url,
      notes
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id;
    `,
    [
      company_name,
      company_number,
      event_type,
      event_date,
      source,
      url,
      notes
    ]
  );

  return { event_id: insert.rows[0].id, created: true };
}
