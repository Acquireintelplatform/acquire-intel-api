// server/index.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Health
app.get("/", (_req, res) => res.send("Acquire Intel API Running"));

// ROUTES (all mounted here)
app.use("/api/operatorRequirements", require("./routes/operatorRequirements")); // manual add + list
app.use("/api/operatorCsvUpload", require("./routes/operatorCsvUpload"));      // << CSV upload route
app.use("/api/operators", require("./routes/operators"));                       // stub list for dropdown

// Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

