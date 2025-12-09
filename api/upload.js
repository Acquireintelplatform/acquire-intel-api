import express from 'express';
import pool from '../db.js';

const router = express.Router();

// placeholder route
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Upload route operational' });
});

export default router;
