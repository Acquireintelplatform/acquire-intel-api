// scrapers/helpers/scrapeLogger.js

import pool from "../../server/db.js";

/**
 * Log a single message for a scraper job.
 */
export async function logScrape(jobId, message, level = "info") {
  try {
    await pool.query(
      `
      INSERT INTO scrape_logs (job_id, message, level)
      VALUES ($1, $2, $3)
      `,
      [jobId, message, level]
    );
  } catch (err) {
    console.error("❌ Failed to write scrape log:", err);
  }
}

/**
 * Create a new scraper job entry.
 */
export async function createScrapeJob(jobType = "full_run") {
  try {
    const result = await pool.query(
      `
      INSERT INTO scrape_jobs (job_type)
      VALUES ($1)
      RETURNING *
      `,
      [jobType]
    );

    return result.rows[0];
  } catch (err) {
    console.error("❌ Failed to create scrape job:", err);
    return null;
  }
}

/**
 * Mark scraper job as finished.
 */
export async function finishScrapeJob(jobId, status = "success") {
  try {
    await pool.query(
      `
      UPDATE scrape_jobs
      SET status = $1, finished_at = NOW(), updated_at = NOW()
      WHERE id = $2
      `,
      [status, jobId]
    );
  } catch (err) {
    console.error("❌ Failed to finish scrape job:", err);
  }
}
