// server/repos/pinsRepo.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CATS = new Set([
  "lateFilings",
  "leaseExpiring",
  "foodBeverage",
  "retail",
  "driveThru",
  "shoppingMalls",
  "newProperties",
]);

function validatePin({ title, type, lat, lng }) {
  if (!title || typeof title !== "string" || !title.trim()) {
    return "title required";
  }
  if (!CATS.has(type)) return "invalid type";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "invalid lat/lng";
  return null;
}

async function listAll() {
  const q = `
    SELECT id, title, type, lat, lng, address, created_at
    FROM aie.map_pins
    ORDER BY created_at DESC, id DESC
  `;
  const { rows } = await pool.query(q);
  // FE expects { id?, title, type, lat, lng, address }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    lat: Number(r.lat),
    lng: Number(r.lng),
    address: r.address || "",
  }));
}

async function insertOne({ title, type, lat, lng, address }) {
  const err = validatePin({ title, type, lat, lng });
  if (err) throw new Error(err);

  const q = `
    INSERT INTO aie.map_pins (title, type, lat, lng, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, type, lat, lng, address, created_at
  `;
  const { rows } = await pool.query(q, [
    title.trim(),
    type,
    lat,
    lng,
    address?.trim() || null,
  ]);
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    lat: Number(r.lat),
    lng: Number(r.lng),
    address: r.address || "",
  };
}

module.exports = { listAll, insertOne, validatePin };
