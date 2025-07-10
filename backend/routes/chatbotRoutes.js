const express = require("express");
const router = express.Router();
const {
  createChatbot,
  editChatbot,
  deleteChatbot,
  getMessageHistory,
  updateTokenLimit,
  getAllChatbotsWithStats,
} = require("../controllers/chatbotCOntroller");
const adminProtect = require("../middleware/adminAuthMiddleware");
const supabase = require("../supabase/client");

router.post("/create", adminProtect, createChatbot);
router.put("/edit/:id", adminProtect, editChatbot);
router.delete("/delete/:id", adminProtect, deleteChatbot);
router.get("/all", adminProtect, getAllChatbotsWithStats);
router.get("/messages/:id", adminProtect, getMessageHistory);
router.put("/update-token-limit/:id", adminProtect, updateTokenLimit);

router.get("/:id/subscription", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("chatbot_id", id)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json({ subscription: data });
});

module.exports = router;
