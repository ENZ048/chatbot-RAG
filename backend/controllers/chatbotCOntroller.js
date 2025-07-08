const supabase = require("../supabase/client");

// 🟢 CREATE chatbot (admin-only)
exports.createChatbot = async (req, res) => {
  try {
    console.log("Create Chatbot request body:", req.body);

    const { companyId, name } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({ message: "companyId and chatbot name are required." });
    }

    // ✅ Fetch company details
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id, name, url")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) throw companyError;
    if (!companyData) {
      return res.status(404).json({ message: "Company not found." });
    }

    const { name: companyName, url: companyUrl } = companyData;

    // ✅ Insert chatbot with all required fields
    const { data, error } = await supabase
      .from("chatbots")
      .insert([
        {
          company_id: companyId,
          company_name: companyName,
          company_url: companyUrl,
          name,
        },
      ])
      .select("*");

    if (error) throw error;

    res.status(201).json({ message: "Chatbot created", data });
  } catch (err) {
    console.error("Create chatbot error:", err.message);
    res.status(500).json({ message: "Server error while creating chatbot" });
  }
};


// ✏️ EDIT chatbot
exports.editChatbot = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: "Chatbot name is required." });
    }

    const { data, error } = await supabase
      .from("chatbots")
      .update({ name })
      .eq("id", id)
      .select("*");

    if (error) throw error;

    res.status(200).json({ message: "Chatbot updated", data });
  } catch (err) {
    console.error("Edit chatbot error:", err.message);
    res.status(500).json({ message: "Server error while updating chatbot" });
  }
};

// ❌ DELETE chatbot
exports.deleteChatbot = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("chatbots").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Chatbot deleted" });
  } catch (err) {
    console.error("Delete chatbot error:", err.message);
    res.status(500).json({ message: "Server error while deleting chatbot" });
  }
};


exports.getAllChatbotsWithStats = async (req, res) => {
  try {
    const { data: chatbots, error } = await supabase.from("chatbots").select("*");
    if (error) throw error;

    const enriched = await Promise.all(
      chatbots.map(async (bot) => {
        // Count unique users (distinct session_id)
        const { count: uniqueUsers } = await supabase
          .from("messages")
          .select("session_id", { count: "exact", head: true })
          .eq("chatbot_id", bot.id)
          .distinct("session_id");

        // Count total messages
        const { count: totalMessages } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("chatbot_id", bot.id);

        return {
          ...bot,
          unique_users: uniqueUsers || 0,
          total_messages: totalMessages || 0,
          used_tokens: bot.used_tokens || 0,
          token_limit: bot.token_limit || null,
          last_reset: bot.last_reset || null,
        };
      })
    );

    res.json({ chatbots: enriched });
  } catch (err) {
    console.error("Error in getAllChatbotsWithStats:", err);
    res.status(500).json({ message: "Error fetching chatbots" });
  }
};


exports.updateTokenLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { token_limit } = req.body;

    const { data, error } = await supabase
      .from("chatbots")
      .update({ token_limit })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Token limit updated", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}