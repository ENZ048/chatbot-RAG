const express = require("express");
const router = express.Router();
const { login, getStats, createAdmin } = require("../controllers/adminController");
const supabase = require("../supabase/client");


router.post("/login", login);
router.get("/stats", getStats);
router.post('/create', createAdmin);
router.get("/all", async (req, res) => {
  const { data, error } = await supabase
    .from("admins")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, admins: data });
});

module.exports = router;
