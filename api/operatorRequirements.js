// api/operatorRequirements.js
const express = require('express');
const router = express.Router();
const db = require('../db.js');

// for CSV uploads
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Helper: only keep the keys we support in parsed_data
 */
function normalizeParsedData(body) {
  const allowed = [
    'min_size_sqft',
    'max_size_sqft',
    'preferred_use_classes',
    'preferred_locations',
    'frontage_min',
    'extraction_required',
    'power_requirement_kw',
    'notes'
  ];
  const out = {};
  for (const k of allowed) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      out[k] = body[k];
    }
  }
  return out;
}

/**
 * GET /api/operator-requirements
 * Read from JSONB and present a flat, friendly shape.
 */
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT
        orq.id,
        orq.operator_id,
        o.name AS operator_name,
        orq.file_path,
        (orq.parsed_data->>'min_size_sqft')::int               AS min_size_sqft,
        (orq.parsed_data->>'max_size_sqft')::int               AS max_size_sqft,
        (orq.parsed_data->>'preferred_use_classes')            AS preferred_use_classes,
        (orq.parsed_data->>'preferred_locations')              AS preferred_locations,
        (orq.parsed_data->>'frontage_min')::numeric            AS frontage_min,
        (orq.parsed_data->>'extraction_required')::boolean     AS extraction_required,
        (orq.parsed_data->>'power_requirement_kw')::int        AS power_requirement_kw,
        (orq.parsed_data->>'notes')                            AS notes,
        orq.uploaded_at
      FROM operator_requirements orq
      LEFT JOIN operators o ON o.id = orq.operator_id
      ORDER BY orq.uploaded_at DESC NULLS LAST, orq.id DESC;
    `;
    const r = await db.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error('GET /operator-requirements error:', err);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

/**
 * POST /api/operator-requirements
 * Accepts JSON body with operator_id (or operator_name) + requirement fields.
 * Stores the requirement in parsed_data JSONB.
 */
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    const {
      operator_id,
      operator_name, // optional: resolve to id
      min_size_sqft,
      max_size_sqft,
      preferred_use_classes,
      preferred_locations,
      frontage_min,
      extraction_required,
      power_requirement_kw,
      notes
    } = req.body || {};

    // Resolve operator id
    let opId = operator_id;
    if (!opId && operator_name) {
      const find = await client.query(
        'SELECT id FROM operators WHERE name = $1 LIMIT 1;',
        [operator_name]
      );
      if (find.rows.length) opId = find.rows[0].id;
    }
    if (!opId) {
      return res.status(400).json({ error: 'operator_id or operator_name required' });
    }

    const parsed = normalizeParsedData({
      min_size_sqft,
      max_size_sqft,
      preferred_use_classes,
      preferred_locations,
      frontage_min,
      extraction_required,
      power_requirement_kw,
      notes
    });

    const insert = await client.query(
      `INSERT INTO operator_requirements (operator_id, file_path, parsed_data, uploaded_at)
       VALUES ($1, NULL, $2::jsonb, NOW())
       RETURNING id;`,
      [opId, JSON.stringify(parsed)]
    );

    res.json({ ok: true, id: insert.rows[0].id });
  } catch (err) {
    console.error('POST /operator-requirements error:', err);
    res.status(500).json({ error: 'Failed to add requirement' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/operator-requirements/csv
 * Accepts a CSV file (field name: "file"), parses rows, resolves operator,
 * and inserts parsed_data JSONB for each row.
 */
router.post('/csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });

  let records;
  try {
    records = parse(req.file.buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid CSV' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let inserted = 0;
    const errors = [];

    for (const row of records) {
      // Resolve operator id
      let opId = row.operator_id ? parseInt(row.operator_id, 10) : null;
      if (!opId && row.operator_name) {
        const f = await client.query('SELECT id FROM operators WHERE name = $1 LIMIT 1;', [row.operator_name]);
        if (f.rows.length) opId = f.rows[0].id;
      }
      if (!opId) {
        errors.push({ row, error: 'operator not found / missing operator_id or operator_name' });
        continue;
      }

      // Coerce numeric/boolean strings
      const parsed = normalizeParsedData({
        min_size_sqft: row.min_size_sqft ? parseInt(row.min_size_sqft, 10) : undefined,
        max_size_sqft: row.max_size_sqft ? parseInt(row.max_size_sqft, 10) : undefined,
        preferred_use_classes: row.preferred_use_classes,
        preferred_locations: row.preferred_locations,
        frontage_min: row.frontage_min ? parseFloat(row.frontage_min) : undefined,
        extraction_required: (row.extraction_required ?? '').toString().toLowerCase() === 'true',
        power_requirement_kw: row.power_requirement_kw ? parseInt(row.power_requirement_kw, 10) : undefined,
        notes: row.notes
      });

      await client.query(
        `INSERT INTO operator_requirements (operator_id, file_path, parsed_data, uploaded_at)
         VALUES ($1, NULL, $2::jsonb, NOW())`,
        [opId, JSON.stringify(parsed)]
      );
      inserted++;
    }

    await client.query('COMMIT');
    res.json({ ok: true, inserted, errors });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /operator-requirements/csv error:', err);
    res.status(500).json({ error: 'CSV import failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
