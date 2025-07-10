const express = require("express");
const router = express.Router();
const supabase = require("../supabase/client");


router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("duration_days", { ascending: true });

  if (error) return res.status(500).json({ message: error.message });
  res.json({ plans: data });
});

module.exports = router;
