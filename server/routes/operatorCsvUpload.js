// server/routes/operatorCsvUpload.js
const express = require('express');
const multer = require('multer');

const router = express.Router();

// keep uploads in memory; 5MB size cap is enough for typical CSVs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/operatorCsvUpload
 * Frontend sends FormData with key "file"
 * For now we just validate & echo some basics so the UI can move on.
 */
router.post('/operatorCsvUpload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file received (expected field "file")' });
    }

    const text = req.file.buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length === 0) {
      return res.status(400).json({ message: 'Empty CSV' });
    }

    const headers = lines[0].split(',').map(h => h.trim());

    // Stub success response so the UI can proceed
    return res.json({
      ok: true,
      rows: Math.max(0, lines.length - 1),
      headers,
      note: 'Parsed in memory (stub). Replace with real processing later.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Upload error', error: err.message });
  }
});

module.exports = router;
