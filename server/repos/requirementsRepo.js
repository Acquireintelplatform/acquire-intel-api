// server/repos/requirementsRepo.js
const { pool } = require("../db/pool");

// Map app item fields -> DB columns
function toCols(i) {
  return {
    name: i.name,
    category: i.category ?? null,
    min_sqft: i.minSqft ?? null,
    max_sqft: i.maxSqft ?? null,
    use_class: i.useClass ?? null,
    preferred_locations: Array.isArray(i.preferredLocations) ? i.preferredLocations : [],
    notes: i.notes ?? null,
  };
}

async function create(item) {
  const c = toCols(item);
  const sql = `
    insert into operator_requirements
      (name, category, min_sqft, max_sqft, use_class, preferred_locations, notes)
    values ($1,$2,$3,$4,$5,$6,$7)
    returning id, name, category, min_sqft, max_sqft, use_class, preferred_locations, notes, created_at;
  `;
  const vals = [
    c.name, c.category, c.min_sqft, c.max_sqft, c.use_class, c.preferred_locations, c.notes,
  ];
  try {
    const { rows } = await pool.query(sql, vals);
    return rows[0];
  } catch (e) {
    // >>> TEMP LOGGING SO WE SEE THE REAL ERROR <<<
    console.error("[DB:create] error:", e.message);
    console.error("[DB:create] detail:", e.detail || "");
    console.error("[DB:create] hint:", e.hint || "");
    console.error("[DB:create] position:", e.position || "");
    console.error("[DB:create] values:", JSON.stringify(vals));
    throw e;
  }
}

async function bulkCreate(items) {
  const out = [];
  for (const i of items) out.push(await create(i)); // simple loop insert
  return out;
}

async function listRecent(n = 20) {
  try {
    const { rows } = await pool.query(
      `select id, name, category, min_sqft, max_sqft, use_class, preferred_locations, notes, created_at
         from operator_requirements
         order by created_at desc
         limit $1`, [n]
    );
    return rows;
  } catch (e) {
    console.error("[DB:listRecent] error:", e.message);
    throw e;
  }
}

async function removeById(id) {
  try {
    const { rowCount } = await pool.query(
      `delete from operator_requirements where id = $1`, [id]
    );
    return rowCount > 0;
  } catch (e) {
    console.error("[DB:removeById] error:", e.message);
    throw e;
  }
}

module.exports = { create, bulkCreate, listRecent, removeById };
