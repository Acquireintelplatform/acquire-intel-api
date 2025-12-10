// server/routes/operatorCsvUpload.js
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');

const router = express.Router();

// in-memory upload; 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// expected headers (case-insensitive match)
const REQUIRED_HEADERS = [
  'name',
  'category',
  'minSqft',
  'maxSqft',
  'useClass',
  'preferredLocations',
  'notes',
];

router.post('/operatorCsvUpload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No file received (expected field "file")' });
    }

    const text = req.file.buffer.toString('utf8');

    // Parse with header row -> object per row
    let records;
    try {
      records = parse(text, {
        columns: header => header.map(h => String(h).trim()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      return res.status(400).json({ ok: false, message: 'CSV parse error', error: err.message });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ ok: false, message: 'CSV contains no data rows' });
    }

    // Validate headers (from first record keys)
    const headerKeys = Object.keys(records[0]);
    const normalized = headerKeys.map(h => h.replace(/\s+/g, ''));

    // map to case-insensitive comparison by stripping spaces
    const requiredMissing = REQUIRED_HEADERS.filter(reqKey => {
      const needle = reqKey.toLowerCase();
      return !normalized.some(h => h.toLowerCase() === needle);
    });

    if (requiredMissing.length > 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid CSV headers',
        required: REQUIRED_HEADERS,
        got: headerKeys,
        missing: requiredMissing,
      });
    }

    // Normalize rows (convert min/max to numbers, split locations)
    const cleaned = records.map((row, idx) => {
      const get = key =>
        row[key] ??
        row[key.replace(/\s+/g, '')] ?? // handle "minSqft" vs "min sqft"
        row[key.replace(/[A-Z]/g, m => ' ' + m.toLowerCase()).trim()] ?? // "minSqft" -> "min sqft"
        null;

      const min = Number(get('minSqft'));
      const max = Number(get('maxSqft'));

      return {
        line: idx + 2, // +2 accounts for header line being #1
        name: get('name') || '',
        category: get('category') || '',
        minSqft: Number.isFinite(min) ? min : null,
        maxSqft: Number.isFinite(max) ? max : null,
        useClass: get('useClass') || '',
        preferredLocations: (get('preferredLocations') || '')
          .split(/;|,/)
          .map(s => s.trim())
          .filter(Boolean),
        notes: get('notes') || '',
        _raw: row,
      };
    });

    // Identify row issues (missing required fields / bad numbers)
    const rowIssues = [];
    cleaned.forEach(r => {
      const missing = [];
      if (!r.name) missing.push('name');
      if (!r.category) missing.push('category');
      if (r.minSqft == null) missing.push('minSqft');
      if (r.maxSqft == null) missing.push('maxSqft');
      if (!r.useClass) missing.push('useClass');

      if (missing.length) {
        rowIssues.push({ line: r.line, missing });
      }
    });

    // Respond with a preview so the UI can show what will be imported
    return res.json({
      ok: true,
      rowsTotal: cleaned.length,
      rowsSample: cleaned.slice(0, 10), // first 10 for preview
      issues: rowIssues,
      headersDetected: headerKeys,
      note: 'Parsed server-side. Next step: save to DB.',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Upload error', error: err.message });
  }
});

module.exports = router;
