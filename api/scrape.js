// api/scrape.js

const express = require('express');
const router = express.Router();
const db = require('../db.js');

// Placeholder scraper endpoint
router.get('/run', async (req, res) => {
  try {
    res.json({ success: true, message: 'Scraper engine placeholder active' });
  } catch (err) {
    console.error('GET /scrape/run error:', err);
    res.status(500).json({ error: 'Scraper failed' });
  }
});

module.exports = router;
