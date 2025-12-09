import pool from "./utils/db.js";

const sampleOperators = [
  {
    operator_name: "Starbucks",
    sector: "F&B",
    website: "https://www.starbucks.co.uk",
    notes: "Coffee chain, typical size 1200–2000 sqft."
  },
  {
    operator_name: "Nando's",
    sector: "F&B",
    website: "https://www.nandos.co.uk",
    notes: "Restaurant, size usually 2500–4000 sqft."
  },
  {
    operator_name: "Tesco Express",
    sector: "Grocery",
    website: "https://www.tesco.com",
    notes: "Convenience format 3000–6000 sqft."
  },
  {
    operator_name: "Five Guys",
    sector: "F&B",
    website: "https://fiveguys.co.uk",
    notes: "Burger chain, 2000–3500 sqft."
  }
];

async function seed() {
  try {
    console.log("🌱 Seeding operators...");

    for (const op of sampleOperators) {
      await pool.query(
        `
        INSERT INTO operators (operator_name, sector, website, notes)
        VALUES ($1, $2, $3, $4)
      `,
        [op.operator_name, op.sector, op.website, op.notes]
      );
    }

    console.log("✅ DONE.");
  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    process.exit(0);
  }
}

seed();
