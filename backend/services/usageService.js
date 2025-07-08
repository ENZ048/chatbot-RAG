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

  // Check monthly limit only
  if (bot.monthlyUsed >= bot.monthlyLimit) {
    throw new Error("Monthly limit exceeded");
  }

  // Always increment monthly usage
  const { error: updateError } = await supabase
    .from("chatbots")
    .update({
      monthlyUsed: bot.monthlyUsed + 1,
    })
    .eq("id", chatbotId);

  if (updateError) throw new Error("Failed to update usage");
}

module.exports = { checkAndUpdateUsage };
