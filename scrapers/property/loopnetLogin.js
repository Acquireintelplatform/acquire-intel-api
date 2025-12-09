import axios from "axios";
import * as cheerio from "cheerio";
import db from "../../utils/db.js";
import loopnetLogin from "./loopnetLogin.js";

const SEARCH_URL =
  "https://www.loopnet.com/search/commercial-real-estate/uk/?t=retail&st=for%20lease";

async function scrapeLoopNet() {
  console.log("🏁 LoopNet: Starting scraper...");

  const client = await loopnetLogin();
  if (!client) {
    console.log("❌ LoopNet: Login failed — cannot scrape");
    return;
  }

  try {
    console.log("📡 LoopNet: Fetching listings page...");

    const response = await client.get(SEARCH_URL);
    const $ = cheerio.load(response.data);

    const listings = [];

    $(".placard-details").each((index, element) => {
      const title = $(element).find(".placardTitle").text().trim();
      const address = $(element).find(".placardLocation").text().trim();
      const url =
        "https://www.loopnet.com" +
        $(element).find("a.placardTitle").attr("href");

      const price = $(element)
        .find(".price-info")
        .text()
        .replace(/\s+/g, " ")
        .trim();

      const size = $(element)
        .find(".sqft-info")
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (title && address) {
        listings.push({
          title,
          address,
          url,
          price,
          size,
        });
      }
    });

    console.log(`📦 LoopNet: Found ${listings.length} listings`);

    // Insert into DATABASE
    for (const item of listings) {
      await db.query(
        `
        INSERT INTO properties (title, address, rent, size, source, url)
        VALUES ($1, $2, $3, $4, 'loopnet', $5)
        ON CONFLICT (url) DO NOTHING;
        `,
        [item.title, item.address, item.price, item.size, item.url]
      );
    }

    console.log("✅ LoopNet: Inserted listings into DB");
  } catch (err) {
    console.error("❌ LoopNet Scrape Error:", err.message);
  }
}

export default scrapeLoopNet;
