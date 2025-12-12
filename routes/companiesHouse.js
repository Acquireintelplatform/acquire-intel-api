// routes/companiesHouse.js
const express = require("express");
const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args));
const router = express.Router();

/**
 * Uses env CH_API_KEY. We only proxy/normalize basic search and flag potential late filings
 * (true API signals vary; this returns status + basic data safely).
 */
const CH_BASE = "https://api.company-information.service.gov.uk";
const CH_API_KEY = process.env.CH_API_KEY || "";

function authHeader() {
  if (!CH_API_KEY) throw new Error("Missing CH_API_KEY env");
  // Companies House uses HTTP Basic with API key as username, blank password
  const token = Buffer.from(`${CH_API_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

/**
 * GET /api/companieshouse/late-filings?query=coffee&limit=20
 * - query: free text (company, area, etc.)
 * - limit: 1..50
 *
 * NOTE: We do a search and return records + simple flags; you can refine later.
 */
router.get("/late-filings", async (req, res) => {
  try {
    const q = String(req.query.query || "").trim() || "restaurant";
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)));

    const url = `${CH_BASE}/search/companies?q=${encodeURIComponent(q)}&items_per_page=${limit}`;
    const r = await fetch(url, { headers: { ...authHeader() } });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ ok: false, error: "CH upstream error", detail: text });
    }
    const data = await r.json();

    const items = (data?.items || []).map((it) => ({
      name: it?.title || "",
      number: it?.company_number || "",
      status: it?.company_status || "",           // basic status
      address: it?.address_snippet || "",
      // For now we don’t geocode here (next step). Keep raw coordinates empty.
      lat: null,
      lng: null,
      // Simple derived flags (placeholder; refine with filing endpoints later)
      possibleLate: it?.company_status === "active" ? false : false,
      // Keep raw if needed on the frontend:
      raw: { kind: it?.kind || "", date_of_creation: it?.date_of_creation || "" },
    }));

    res.json({ ok: true, query: q, count: items.length, data: items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

module.exports = router;
