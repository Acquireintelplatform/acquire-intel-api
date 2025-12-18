// PUT /api/deals/:id  → Update a deal
router.put("/deals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, stage, value_gbp, sector, location, notes } = req.body;

    const result = await pool.query(
      `UPDATE deals 
       SET title=$1, stage=$2, value_gbp=$3, sector=$4, location=$5, notes=$6, updated_at=NOW() 
       WHERE id=$7 RETURNING *`,
      [title, stage, value_gbp, sector, location, notes, id]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("PUT /api/deals/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/deals/:id  → Delete a deal
router.delete("/deals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM deals WHERE id=$1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/deals/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
