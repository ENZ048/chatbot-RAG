// services/configService.js
const supabase = require("../supabase/client");

async function getClientConfig(chatbotId) {
  try {
    const { data, error } = await supabase
      .from("client_configs")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .maybeSingle();

    if (error) {
      console.warn(
        `No client config found for chatbotId: ${chatbotId}`,
        error.message
      );
      return {};
    }

    return {
      demo_keywords: data?.demo_keywords || [
        "demo",
        "free trial",
        "try it",
        "sample",
      ],
      default_suggestions: data?.default_suggestions || [
        "Contact info",
        "Pricing",
        "Talk to agent",
      ],
      ...data,
    };
  } catch (err) {
    console.error("Supabase getClientConfig error:", err.message);
    return {};
  }
}

module.exports = { getClientConfig };
