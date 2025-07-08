const supabase = require("../supabase/client");

async function checkTokenLimits(req, res, next) {
  const { chatbotId } = req.body;
  const today = new Date().toISOString().split("T")[0];

  // Fetch chatbot record
  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", chatbotId)
    .maybeSingle();

  if (error || !chatbot) {
    return res.status(404).json({ message: "Chatbot not found" });
  }

  // Daily reset check
  if (chatbot.last_reset !== today) {
    await supabase
      .from("chatbots")
      .update({ used_today: 0, last_reset: today })
      .eq("id", chatbotId);
    chatbot.used_today = 0;
  }

  // Check limits
  if (chatbot.used_tokens >= chatbot.token_limit) {
    return res.status(403).json({ message: "Total token limit reached." });
  }

//   if (chatbot.used_today >= chatbot.daily_limit) {
//     return res.status(429).json({ message: "Daily token limit reached." });
//   }

  // Attach chatbot record for later use
  req.chatbot = chatbot;
  next();
}

module.exports = checkTokenLimits;
