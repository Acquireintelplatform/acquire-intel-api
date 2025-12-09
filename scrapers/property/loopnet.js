// scrapers/property/loopnet.js

import axios from "axios";
import * as cheerio from "cheerio";

/**
 * LoopNet PUBLIC scraper (safe mode)
 * - No login required
 * - Cannot be blocked easily
 * - Extracts basic listing data
 * - Works as part of HYBRID mode (scraper + email ingestion)
 */

const LOOPNET_URL =
  "https://www.loopnet.com/for-lease/retail/united-kingdom/";

// 🟦 Main scraper function
export default async function scrapeLoopNet() {
  console.log("🏁 Starting LoopNet scraper (safe mode)…");

  try {
    // ---- FETCH HTML ----
    const response = await axios.get(LOOPNET_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html"
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // ---- PARSE LISTINGS ----
    const listings = [];

    $(".placard").each((_, el) => {
      const title = $(el).find(".placardTitle").text().trim();
      const location = $(el).find(".placardLocation").text().trim();
      const link = $(el).find("a").attr("href");

      if (title && link) {
        listings.push({
          title,
          location,
          url: link.startsWith("http")
            ? link
            : `https://www.loopnet.com${link}`,
          source: "loopnet",
          created_at: new Date()
        });
      }
    });

    console.log(`📦 LoopNet listings extracted: ${listings.length}`);

    return listings;
  } catch (err) {
    console.error("❌ LoopNet scraper failed:", err.message);
    return [];
  }
}
