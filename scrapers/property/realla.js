// scrapers/property/realla.js
import axios from "axios";
import * as cheerio from "cheerio";

import {
  logScrape,
  createScrapeJob,
  finishScrapeJob
} from "../helpers/scrapeLogger.js";

import { savePropertyRecord } from "../helpers/propertyHelper.js";

export default async function scrapeRealla() {
  const jobId = await createScrapeJob("realla");

  try {
    await logScrape(jobId, "Starting Realla scraper...", "info");

    const url =
      "https://realla.co.uk/to-rent/retail/england?sort%5Bcreated_at%5D=desc";

    await logScrape(jobId, `Fetching Realla URL: ${url}`, "info");

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 20000
    });

    const $ = cheerio.load(data);

    const cards = $(".search-result-card");

    await logScrape(
      jobId,
      `Found ${cards.length} property cards on Realla`,
      "info"
    );

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      const title = $(card).find(".search-result-card__title").text().trim();
      const price = $(card)
        .find(".search-result-card__price")
        .text()
        .trim();
      const address = $(card)
        .find(".search-result-card__address")
        .text()
        .trim();

      await savePropertyRecord({
        portal: "Realla",
        title,
        price,
        address,
        raw_html: $.html(card)
      });

      await logScrape(
        jobId,
        `Saved property: ${title.substring(0, 40)}...`,
        "info"
      );
    }

    await finishScrapeJob(jobId, "success");
  } catch (err) {
    await logScrape(jobId, `ERROR: ${err.message}`, "error");
    await finishScrapeJob(jobId, "failed");
  }
}
