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
  const vals = [c.name, c.category, c.min_sqft, c.max_sqft, c.use_class, c.preferred_locations, c.notes];
  const { rows } = await pool.query(sql, vals);
  return rows[0];
}

async function update(id, item) {
  const c = toCols(item);
  const sql = `
    update operator_requirements
       set name=$1,
           category=$2,
           min_sqft=$3,
           max_sqft=$4,
           use_class=$5,
           preferred_locations=$6,
           notes=$7
     where id=$8
     returning id, name, category, min_sqft, max_sqft, use_class, preferred_locations, notes, created_at;
  `;
  const vals = [c.name, c.category, c.min_sqft, c.max_sqft, c.use_class, c.preferred_locations, c.notes, id];
  const { rows } = await pool.query(sql, vals);
  return rows[0] || null;
}

async function bulkCreate(items) {
  const out = [];
  for (const i of items) out.push(await create(i));
  return out;
}

async function listRecent(n = 20) {
  const { rows } = await pool.query(
    `select id, name, category, min_sqft, max_sqft, use_class, preferred_locations, notes, created_at
       from operator_requirements
       order by created_at desc
       limit $1`,
    [n]
  );
  return rows;
}

async function removeById(id) {
  const { rowCount } = await pool.query(`delete from operator_requirements where id = $1`, [id]);
  return rowCount > 0;
}

module.exports = { create, update, bulkCreate, listRecent, removeById };
