// scrapers/helpers/runScrapers.js
import { createScrapeJob, logScrape, finishScrapeJob } from "./scrapeLogger.js";
import scrapeRealla from "../property/realla.js";

export default async function runAllScrapers() {
  const jobId = await createScrapeJob("full_run");

  try {
    await logScrape(jobId, "Starting all scrapers...", "info");

    // RUN EACH SCRAPER HERE
    await scrapeRealla();

    await logScrape(jobId, "All scrapers finished.", "info");
    await finishScrapeJob(jobId, "success");
  } catch (err) {
    await logScrape(jobId, `Error: ${err.message}`, "error");
    await finishScrapeJob(jobId, "failed");
  }
}
