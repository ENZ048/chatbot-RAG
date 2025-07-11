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
const {
  getClientConfig,
  updateClientConfig,
} = require("../controllers/clientConfigController");

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
  if (!data) return res.status(404).json({ message: "No active plan" });

  res.json({ subscription: data });
});

router.post("/:id/renew", adminProtect, async (req, res) => {
  const { id } = req.params;
  const { plan_id, months } = req.body;

  if (!plan_id || !months) {
    return res.status(400).json({ message: "plan_id and months are required" });
  }

  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + parseInt(months));

  // Optionally fetch plan name
  const { data: planData, error: planError } = await supabase
    .from("plans")
    .select("name")
    .eq("id", plan_id)
    .maybeSingle();

  if (planError) return res.status(500).json({ message: planError.message });

  // Deactivate existing subscriptions
  await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("chatbot_id", id)
    .eq("status", "active");

  // Create new subscription
  const { error } = await supabase.from("subscriptions").insert([
    {
      chatbot_id: id,
      plan_id,
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      status: "active",
      plan_name: planData?.name || null,
    },
  ]);

  if (error) return res.status(500).json({ message: error.message });

  res.json({ success: true, message: "Plan renewed successfully" });
});

router.get("/:id/config", getClientConfig); // Get config
router.put("/:id/config", updateClientConfig);

module.exports = router;
