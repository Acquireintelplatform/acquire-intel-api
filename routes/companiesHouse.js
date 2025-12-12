// routes/companiesHouse.js
const express = require("express");
const router = express.Router();
const fetchFn = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

/**
 * STEP 2: Late Filings filtered by your SIC codes.
 * - Reads CH_API_KEY from environment (Render → Environment).
 * - Searches CH, then fetches company profiles to read `sic_codes` + `accounts.overdue`.
 * - Returns ONLY companies whose SIC intersects your whitelist AND are overdue (late filings).
 *
 * NOTE: No DB used. Keep it lightweight. Be mindful of CH rate limits.
 */

const CH_BASE = "https://api.company-information.service.gov.uk";
const CH_API_KEY = process.env.CH_API_KEY || "";
if (!CH_API_KEY) {
  console.warn("[companiesHouse] Missing CH_API_KEY. Set it on Render Backend Environment.");
}

/** Your master SIC list (keep in sync with routes/distressSic.js). */
const SIC_CODES = new Set([
  // Restaurants/F&B
  "56101","56102","56103","56104","56105",
  "56301","56302","56303","56304",
  // Education/Childcare
  "85100","88910","88990",
  // Retail (47xxx block + extras)
  "47110","47190","47210","47220","47230","47240","47250","47260","47300",
  "47410","47420","47430","47440","47490","47510","47520","47530","47540",
  "47590","47610","47620","47630","47640","47650","47710","47721","47722",
  "47730","47741","47749","47750","47760","47770","47780","47789","47799",
  "47810","47820","47890","47910","47990",
  // Explicit adds
  "47112","10710","47240",
  // Sports/Leisure
  "93130","93110",
  // Film/Media
  "59140",
  // Finance (niche)
  "64191","64192",
  // Amusements/Entertainment
  "93210","93290",
]);

function authHeader() {
  const token = Buffer.from(`${CH_API_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function fetchJson(url) {
  const r = await fetchFn(url, { headers: authHeader() });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    const e = new Error(`CH ${r.status}: ${url} :: ${t.slice(0, 200)}`);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

/** Small helper to limit concurrency and be nice to CH API. */
async function mapSeries(items, fn) {
  const out = [];
  for (const it of items) out.push(await fn(it));
  return out;
}

/**
 * GET /api/companieshouse/late-filings?query=<text>&limit=20
 * - query: free text (optional; defaults to "retail" to keep results relevant)
 * - limit: 1..50 (how many search results to inspect)
 *
 * Returns:
 * { ok, count, data: [ { name, number, status, address, sic_codes[], accounts: { overdue, next_due }, created_at } ] }
 */
router.get("/late-filings", async (req, res) => {
  try {
    if (!CH_API_KEY) return res.status(500).json({ ok: false, error: "Missing CH_API_KEY env" });

    const q = String(req.query.query || "").trim() || "retail";
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)));

    // 1) Search companies
    const searchUrl = `${CH_BASE}/search/companies?q=${encodeURIComponent(q)}&items_per_page=${limit}`;
    const search = await fetchJson(searchUrl);
    const items = Array.isArray(search?.items) ? search.items : [];

    // 2) For each company, pull full profile to check SIC + accounts.overdue
    const limited = items.slice(0, limit);

    const results = await mapSeries(limited, async (it) => {
      const number = it?.company_number;
      if (!number) return null;

      try {
        const profile = await fetchJson(`${CH_BASE}/company/${number}`);
        const sic = Array.isArray(profile?.sic_codes) ? profile.sic_codes.map(String) : [];
        const hasSicMatch = sic.some(code => SIC_CODES.has(code));
        if (!hasSicMatch) return null;

        const accounts = profile?.accounts || {};
        // CH profile.accounts.overdue is a documented boolean when present
        const overdue = accounts?.overdue === true;

        if (!overdue) return null; // we only want late filings

        return {
          name: profile?.company_name || it?.title || "",
          number,
          status: profile?.company_status || it?.company_status || "",
          address: it?.address_snippet || "",
          sic_codes: sic,
          accounts: {
            overdue: !!overdue,
            next_due: accounts?.next_due || null,
            last_made_up_to: accounts?.last_made_up_to || null,
          },
          created_at: profile?.date_of_creation || it?.date_of_creation || null,
        };
      } catch (e) {
        // fail soft for a single company
        return null;
      }
    });

    const data = results.filter(Boolean);
    res.json({ ok: true, query: q, count: data.length, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

module.exports = router;
