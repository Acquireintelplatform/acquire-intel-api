// server/api/operatorCsvUpload.js
const express = require('express');
const router = express.Router();
const db = require('../db.js');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { parse } = require('csv-parse/sync');

// POST /api/operator-csv/requirements  (multipart/form-data, field: file)
router.post('/requirements', upload.single('file'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'CSV file required (field: file)' });
  }

  let rows;
  try {
    rows = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid CSV format' });
  }

  // Expected headers:
  // operator_name,sector,website,notes,min_size_sqft,max_size_sqft,preferred_use_classes,preferred_locations,frontage_min,extraction_required,power_requirement_kw,req_notes

  const summary = { rows: rows.length, createdOperators: 0, upsertedOperators: 0, createdRequirements: 0, errors: [] };

  try {
    await db.query('BEGIN');

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const operator_name = (r.operator_name || '').trim();
      if (!operator_name) {
        summary.errors.push({ row: i + 1, error: 'operator_name missing' });
        continue;
      }

      const sector = r.sector || null;
      const website = r.website || null;
      const notes = r.notes || null;

      const op = await db.query(
        `INSERT INTO operators (operator_name, sector, website, notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4, NOW(), NOW())
         ON CONFLICT (operator_name) DO UPDATE
           SET sector = COALESCE(EXCLUDED.sector, operators.sector),
               website = COALESCE(EXCLUDED.website, operators.website),
               notes = COALESCE(EXCLUDED.notes, operators.notes),
               updated_at = NOW()
         RETURNING id, (xmax = 0) AS inserted;`,
        [operator_name, sector, website, notes]
      );
      const operator_id = op.rows[0].id;
      if (op.rows[0].inserted) summary.createdOperators++; else summary.upsertedOperators++;

      const min_size_sqft = r.min_size_sqft ? parseInt(r.min_size_sqft) : null;
      const max_size_sqft = r.max_size_sqft ? parseInt(r.max_size_sqft) : null;
      const preferred_use_classes = r.preferred_use_classes || null;
      const preferred_locations = r.preferred_locations || null;
      const frontage_min = r.frontage_min ? Number(r.frontage_min) : null;
      const extraction_required =
        r.extraction_required == null ? null : String(r.extraction_required).toLowerCase().trim() === 'true';
      const power_requirement_kw = r.power_requirement_kw ? parseInt(r.power_requirement_kw) : null;
      const req_notes = r.req_notes || null;

      await db.query(
        `INSERT INTO operator_requirements
         (operator_id, min_size_sqft, max_size_sqft, preferred_use_classes, preferred_locations,
          frontage_min, extraction_required, power_requirement_kw, notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW());`,
        [
          operator_id,
          min_size_sqft,
          max_size_sqft,
          preferred_use_classes,
          preferred_locations,
          frontage_min,
          extraction_required,
          power_requirement_kw,
          req_notes
        ]
      );

      summary.createdRequirements++;
    }

    await db.query('COMMIT');
    res.json(summary);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('CSV ingest failed:', err);
    res.status(500).json({ error: 'CSV ingest failed', details: String(err.message || err) });
  }
});

module.exports = router;
