// routes/companiesHouse.js
// Companies House "Late Filings" filtered by your SIC list.
// Uses Node 20's global fetch (no extra deps). In-memory only.

const express = require("express");
const router = express.Router();

/** READ YOUR KEY FROM ENV (Render → Environment → CH_API_KEY) */
const CH_API_KEY = process.env.CH_API_KEY || "";
const CH_BASE = "https://api.company-information.service.gov.uk";

/** Your master SICs (keep in sync with routes/distressSic.js) */
const SIC_CODES = new Set([
  "56101","56102","56103","56104","56105",
  "56301","56302","56303","56304",
  "85100","88910","88990",
  "47110","47190","47210","47220","47230","47240","47250","47260","47300",
  "47410","47420","47430","47440","47490","47510","47520","47530","47540",
  "47590","47610","47620","47630","47640","47650","47710","47721","47722",
  "47730","47741","47749","47750","47760","47770","47780","47789","47799",
  "47810","47820","47890","47910","47990",
  "47112","10710","47240",
  "93130","93110",
  "59140",
  "64191","64192",
  "93210","93290",
]);

function authHeader() {
  if (!CH_API_KEY) throw new Error("Missing CH_API_KEY");
  const token = Buffer.from(`${CH_API_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: authHeader() });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    const e = new Error(`CH ${r.status}: ${url} :: ${t.slice(0, 200)}`);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

/** Run in series to be gentle with CH limits */
async function mapSeries(items, fn) {
  const out = [];
  for (const it of items) out.push(await fn(it));
  return out;
}

/**
 * GET /api/companieshouse/late-filings?query=retail&limit=20
 * Returns companies whose SIC matches your list AND accounts.overdue === true.
 */
router.get("/late-filings", async (req, res) => {
  try {
    if (!CH_API_KEY) return res.status(500).json({ ok: false, error: "Missing CH_API_KEY env" });

    const q = String(req.query.query || "").trim() || "retail";
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)));

    // 1) Search
    const searchUrl = `${CH_BASE}/search/companies?q=${encodeURIComponent(q)}&items_per_page=${limit}`;
    const search = await fetchJson(searchUrl);
    const items = Array.isArray(search?.items) ? search.items : [];

    // 2) Expand profiles to check SIC + accounts.overdue
    const limited = items.slice(0, limit);
    const results = await mapSeries(limited, async (it) => {
      const number = it?.company_number;
      if (!number) return null;

      try {
        const profile = await fetchJson(`${CH_BASE}/company/${number}`);

        const sic = Array.isArray(profile?.sic_codes) ? profile.sic_codes.map(String) : [];
        const hasSicMatch = sic.some((code) => SIC_CODES.has(code));
        if (!hasSicMatch) return null;

        const accounts = profile?.accounts || {};
        const overdue = accounts?.overdue === true;
        if (!overdue) return null;

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
      } catch {
        return null; // skip bad rows, keep going
      }
    });

    const data = results.filter(Boolean);
    res.json({ ok: true, query: q, count: data.length, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

module.exports = router;
