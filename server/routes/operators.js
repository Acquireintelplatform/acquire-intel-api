// server/routes/operators.js
const express = require("express");
const router = express.Router();

/**
 * Temporary operator list for the dropdown.
 * Replace with DB later.
 */
const operators = [
  { id: 1, name: "Starbucks" },
  { id: 2, name: "Nando's" },
  { id: 3, name: "Tesco Express" },
  { id: 4, name: "KFC" },
  { id: 5, name: "Domino's" },
  { id: 6, name: "Pret A Manger" },
  { id: 7, name: "Costa Coffee" }
];

router.get("/", (_req, res) => res.json(operators));

module.exports = router;
