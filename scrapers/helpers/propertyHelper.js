// scrapers/helpers/propertyHelper.js
import pool from "../../server/db.js";
import { logScrape } from "./scrapeLogger.js";

export async function savePropertyRecord({
  portal,
  title,
  price,
  address,
  raw_html
}) {
  try {
    await pool.query(
      `
      INSERT INTO property_portal_listings
      (portal, title, price, address, raw_html)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [portal, title, price, address, raw_html]
    );

    return true;
  } catch (err) {
    console.error("❌ ERROR saving property record:", err.message);
    return false;
  }
}
