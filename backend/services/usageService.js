// services/usageService.js
const supabase = require("../supabase/client");

async function checkAndUpdateUsage(chatbotId) {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  const { data: bots, error } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", chatbotId)
    .limit(1);

  if (error || !bots.length) throw new Error("Chatbot not found");

  const bot = bots[0];

  // Block if manually disabled
  if (bot.status === "disabled") {
    throw new Error("Chatbot is disabled");
  }

  // Reset if last used was on a different day
  let updates = {};
  if (bot.lastUsedAt !== today) {
    updates.dailyUsed = 0;
    updates.lastUsedAt = today;
  }

  const dailyUsed = updates.dailyUsed ?? bot.dailyUsed;
  const monthlyUsed = bot.monthlyUsed;

  // Check limits
  if (dailyUsed >= bot.dailyLimit) throw new Error("Daily limit exceeded");
  if (monthlyUsed >= bot.monthlyLimit) throw new Error("Monthly limit exceeded");

  // Update usage
  updates.dailyUsed = dailyUsed + 1;
  updates.monthlyUsed = monthlyUsed + 1;

  const { error: updateError } = await supabase
    .from("chatbots")
    .update(updates)
    .eq("id", chatbotId);

  if (updateError) throw new Error("Failed to update usage");
}

module.exports = { checkAndUpdateUsage };
