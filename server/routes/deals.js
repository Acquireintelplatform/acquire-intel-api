// server/routes/deals.js
// Express router backed by Postgres (Render-compatible)

const express = require("express");
const router = express.Router();

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Don’t crash; still expose endpoints with clear error
  console.warn("[deals] DATABASE_URL is missing. Endpoints will 500.");
}

const pool =
  connectionString
    ? new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }, // required by Render PG
      })
    : null;

// Create table if not exists
async function ensureSchema() {
  if (!pool) return;
  await pool.query(`
    create table if not exists deals (
      id serial primary key,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      title text not null,
      stage text not null default 'New',
      value_gbp numeric,
      sector text,
      location text,
      notes text
    );
    -- cheap trigger to bump updated_at
    do $$
    begin
      if not exists (select 1 from pg_trigger where tgname = 'deals_set_updated_at') then
        create or replace function set_updated_at()
        returns trigger as $f$
        begin
          new.updated_at = now();
          return new;
        end;
        $f$ language plpgsql;

        create trigger deals_set_updated_at
        before update on deals
        for each row execute procedure set_updated_at();
      end if;
    end $$;
  `);
}
ensureSchema().catch((e) => console.error("[deals] schema error", e?.message || e));

function bad(res, status, msg) {
  return res.status(status).json({ ok: false, error: msg });
}

function n(x) {
  if (x == null || x === "") return null;
  const v = Number(String(x).replace(/[, ]/g, ""));
  return Number.isFinite(v) ? v : null;
}

/** GET /api/deals -> list */
router.get("/", async (_req, res) => {
  try {
    if (!pool) return bad(res, 500, "DATABASE_URL not configured");
    const { rows } = await pool.query(
      `select id, created_at as "createdAt", updated_at as "updatedAt",
              title, stage, value_gbp as value, sector, location, notes
         from deals
        order by created_at desc, id desc
        limit 1000`
    );
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (e) {
    bad(res, 500, e?.message || "list failed");
  }
});

/** POST /api/deals -> create */
router.post("/", express.json(), async (req, res) => {
  try {
    if (!pool) return bad(res, 500, "DATABASE_URL not configured");
    const { title, stage, value, sector, location, notes } = req.body || {};
    const t = (title || "").trim();
    if (!t) return bad(res, 400, "title is required");
    const s = (stage || "New").trim();

    const { rows } = await pool.query(
      `insert into deals (title, stage, value_gbp, sector, location, notes)
       values ($1,$2,$3,$4,$5,$6)
       returning id, created_at as "createdAt", updated_at as "updatedAt",
                 title, stage, value_gbp as value, sector, location, notes`,
      [t, s, n(value), sector || null, location || null, notes || null]
    );
    res.status(201).json({ ok: true, item: rows[0] });
  } catch (e) {
    bad(res, 500, e?.message || "create failed");
  }
});

/** PUT /api/deals/:id -> update */
router.put("/:id", express.json(), async (req, res) => {
  try {
    if (!pool) return bad(res, 500, "DATABASE_URL not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return bad(res, 400, "invalid id");

    const { title, stage, value, sector, location, notes } = req.body || {};
    const { rows } = await pool.query(
      `update deals
          set title = coalesce($2, title),
              stage = coalesce($3, stage),
              value_gbp = coalesce($4, value_gbp),
              sector = coalesce($5, sector),
              location = coalesce($6, location),
              notes = coalesce($7, notes)
        where id = $1
      returning id, created_at as "createdAt", updated_at as "updatedAt",
                title, stage, value_gbp as value, sector, location, notes`,
      [id, title || null, stage || null, n(value), sector || null, location || null, notes || null]
    );
    if (!rows.length) return bad(res, 404, "not found");
    res.json({ ok: true, item: rows[0] });
  } catch (e) {
    bad(res, 500, e?.message || "update failed");
  }
});

/** DELETE /api/deals/:id */
router.delete("/:id", async (req, res) => {
  try {
    if (!pool) return bad(res, 500, "DATABASE_URL not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return bad(res, 400, "invalid id");
    const r = await pool.query(`delete from deals where id = $1`, [id]);
    res.json({ ok: true, deleted: r.rowCount });
  } catch (e) {
    bad(res, 500, e?.message || "delete failed");
  }
});

/** POST /api/deals/seed -> demo rows */
router.post("/seed", async (_req, res) => {
  try {
    if (!pool) return bad(res, 500, "DATABASE_URL not configured");
    const demo = [
      ["Prime retail corner — Oxford Circus", "New", 27500000, "Retail", "Oxford Circus, London", "High footfall; 10-year lease."],
      ["Drive-thru pad site — A406", "Negotiating", 4800000, "Drive-thru", "North Circular (A406)", "QSR covenant required."],
      ["Food hall unit — Westfield", "Review", 6500000, "Food & Beverage", "Westfield London", "Turnkey fitout; 6% yield guidance."],
      ["Retail park box — M25 corridor", "New", 11200000, "Retail", "M25 corridor", "Existing A1; potential subdivision."],
      ["City kiosk — Liverpool Street", "Underwriting", 900000, "Food & Beverage", "Liverpool Street Station", "Commuter trade; morning bias."],
      ["High street double-front — Brighton", "Heads", 2100000, "Retail", "North Laine, Brighton", "Tourist trade; seasonal uplift."],
      ["Leisure box — Shopping mall", "Screening", 7200000, "Shopping malls", "Regional mall", "Anchor adjacencies strong."],
      ["New build shell — Zone 2", "New", 3800000, "New properties", "Zone 2 London", "Shell & core; capex required."]
    ];
    const values = demo.map((d) => `('${d[0].replace(/'/g, "''")}','${d[1]}',${d[2]},'${d[3]}','${d[4].replace(/'/g, "''")}','${d[5].replace(/'/g, "''")}')`).join(",");
    await pool.query(
      `insert into deals (title, stage, value_gbp, sector, location, notes) values ${values}`
    );
    res.json({ ok: true, inserted: demo.length });
  } catch (e) {
    bad(res, 500, e?.message || "seed failed");
  }
});

module.exports = router;
