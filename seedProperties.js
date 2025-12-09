// seedProperties.js
import db from "./server/db.js";

async function seed() {
  console.log("Seeding sample properties...");

  const sample = [
    {
      address_line1: "Unit 12 High Street",
      address_line2: "Westminster",
      town: "London",
      postcode: "W1A 1AA",
      latitude: 51.515,
      longitude: -0.141,
      use_class: "E",
      size_sqft: 1200,
      description: "Prime retail unit",
      is_active: true
    },
    {
      address_line1: "45 Market Road",
      address_line2: "City Centre",
      town: "Manchester",
      postcode: "M1 2AB",
      latitude: 53.479,
      longitude: -2.244,
      use_class: "E",
      size_sqft: 1800,
      description: "Strong footfall F&B pitch",
      is_active: true
    },
    {
      address_line1: "Retail Pod",
      address_line2: "Liverpool One",
      town: "Liverpool",
      postcode: "L1 8JQ",
      latitude: 53.403,
      longitude: -2.985,
      use_class: "F1",
      size_sqft: 950,
      description: "Compact kiosk / grab-and-go",
      is_active: true
    }
  ];

  for (const p of sample) {
    await db.query(
      `INSERT INTO properties
      (address_line1, address_line2, town, postcode, latitude, longitude, use_class, size_sqft, description, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        p.address_line1,
        p.address_line2,
        p.town,
        p.postcode,
        p.latitude,
        p.longitude,
        p.use_class,
        p.size_sqft,
        p.description,
        p.is_active
      ]
    );
  }

  console.log("DONE.");
  process.exit();
}

seed();
