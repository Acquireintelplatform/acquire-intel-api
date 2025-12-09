// utils/postcodeLookup.js
// Uses Node 18+ built-in fetch (no node-fetch dependency)

/**
 * Clean and normalise the raw input.
 * If it's not a postcode, we just treat it as a town name and return it.
 * If it IS a postcode, we call postcodes.io to get the town / admin_district.
 */
export async function lookupLocationFromPostcode(input) {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Remove spaces for API call
  const cleaned = trimmed.replace(/\s+/g, "").toUpperCase();

  // Simple UK postcode pattern: 1–2 letters + digits at start
  const postcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?/;

  // If it doesn't look like a postcode → treat as town name directly
  if (!postcodePattern.test(cleaned)) {
    return trimmed;
  }

  try {
    const url = `https://api.postcodes.io/postcodes/${cleaned}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error("Postcode API error:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();

    if (!data || data.status !== 200 || !data.result) {
      return null;
    }

    // Prefer admin_district (e.g. "Milton Keynes"), then parish, then region
    const result = data.result;
    const town =
      result.admin_district || result.parish || result.region || null;

    return town;
  } catch (err) {
    console.error("Postcode lookup failed:", err);
    return null;
  }
}
