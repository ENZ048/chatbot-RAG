const supabase = require("../supabase/client");

// 🟢 CREATE chatbot (admin-only)
exports.createChatbot = async (req, res) => {
  try {
    console.log("Create Chatbot request body:", req.body);

    const { companyId, name } = req.body;

    if (!companyId || !name) {
      return res
        .status(400)
        .json({ message: "companyId and chatbot name are required." });
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

    // ✅ Insert chatbot
    const { data: chatbotData, error } = await supabase
      .from("chatbots")
      .insert([
        {
          company_id: companyId,
          company_name: companyName,
          company_url: companyUrl,
          name,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    // ✅ Assign default 1-month subscription plan
    const DEFAULT_PLAN_ID = "5da80e73-d3d1-40eb-83ac-147e4359e63a"; // Replace with actual ID from `plans` table
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select("name")
      .eq("id", DEFAULT_PLAN_ID)
      .single();

    if (planError) throw planError;

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert([
        {
          chatbot_id: chatbotData.id,
          plan_id: DEFAULT_PLAN_ID,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
          plan_name: planData.name,
          company_name: companyName,
        },
      ]);

    if (subscriptionError) throw subscriptionError;

    res.status(201).json({
      message: "Chatbot created with default plan",
      data: chatbotData,
    });
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
    const { data: chatbots, error } = await supabase
      .from("chatbots")
      .select("*");
    if (error) throw error;

    const enriched = await Promise.all(
      chatbots.map(async (bot) => {
        // Get all messages for chatbot
        const { data: messages, error: msgErr } = await supabase
          .from("messages")
          .select("session_id")
          .eq("chatbot_id", bot.id);

        if (msgErr) throw msgErr;

        const uniqueSessions = new Set(messages.map((m) => m.session_id));
        const uniqueUsers = uniqueSessions.size;

        const { count: totalMessages } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("chatbot_id", bot.id);

        return {
          ...bot,
          unique_users: uniqueUsers,
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

exports.getMessageHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("messages") // or whatever your table is called
      .select("*")
      .eq("chatbot_id", id)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    res.status(200).json({ messages: data });
  } catch (err) {
    console.error("Fetch messages error:", err.message);
    res.status(500).json({ message: "Error fetching message history" });
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
};

exports.fetchChatbotsWithStats = async () => {
  const { data: chatbots, error } = await supabase.from("chatbots").select(`
      *,
      company:company_id (
        name,
        email
      )
    `);

  if (error) throw error;

  const enriched = await Promise.all(
    chatbots.map(async (bot) => {
      const { data: messages, error: msgErr } = await supabase
        .from("messages")
        .select("session_id")
        .eq("chatbot_id", bot.id);
      if (msgErr) throw msgErr;

      const { data: history, error: historyErr } = await supabase
        .from("messages")
        .select("sender, content")
        .eq("chatbot_id", bot.id)
        .order("timestamp", { ascending: false })
        .limit(100); // latest 10 messages

      if (historyErr) throw historyErr;

      const uniqueSessions = new Set(messages.map((m) => m.session_id));
      const uniqueUsers = uniqueSessions.size;

      const { count: totalMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("chatbot_id", bot.id);

      return {
        ...bot,
        unique_users: uniqueUsers,
        total_messages: totalMessages || 0,
        used_tokens: bot.used_tokens || 0,
        token_limit: bot.token_limit || null,
        company_email: bot.company?.email || null,
        company_name: bot.company?.name || null,
        message_history: history || [],
      };
    })
  );

  return enriched;
};


