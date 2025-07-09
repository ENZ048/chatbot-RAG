const express = require("express");
const router = express.Router();
const { runDailyReportJob } = require("../services/dailyReportRunner");
const supabase = require("../supabase/client");
const {generatePDFBuffer} = require("../pdf/generatePDFBuffer");

router.post("/send", async (req, res) => {
  try {
    await runDailyReportJob();
    res.status(200).json({ success: true, message: "Daily report sent." });
  } catch (err) {
    console.error("❌ Error in /api/send-report:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

router.get("/download/:id", async (req, res) => {
  try {
    const chatbotId = req.params.id;

    // 1. Fetch chatbot
    const { data: chatbot, error: cbErr } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", chatbotId)
      .single();

    if (cbErr || !chatbot) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // 2. Fetch company
    const { data: company, error: compErr } = await supabase
      .from("companies")
      .select("name")
      .eq("id", chatbot.company_id)
      .single();

    // 3. Fetch all messages for chatbot
    const { data: messages, error: msgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .order("timestamp", { ascending: true });

    // 4. Calculate stats
    const totalMessages = messages.length;
    const uniqueUsers = new Set(messages.map((m) => m.sender)).size;
    const remainingTokens =
      chatbot.token_limit != null && chatbot.used_tokens != null
        ? Math.max(chatbot.token_limit - chatbot.used_tokens, 0)
        : "Unlimited";

    const reportData = {
      name: chatbot.name,
      company: company?.name || chatbot.company_name || "N/A",
      domain: chatbot.company_url,
      tokenLimit: chatbot.token_limit,
      usedTokens: chatbot.used_tokens,
      remainingTokens,
      totalMessages,
      uniqueUsers,
      generatedAt: new Date().toLocaleString(),
      messages,
    };

    const pdfBuffer = await generatePDFBuffer(reportData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${chatbot.name}-report.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating chatbot report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
