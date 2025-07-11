const express = require("express");
const router = express.Router();
const supabase = require("../supabase/client");
const QuickChart = require("quickchart-js");

const { runDailyReportJob } = require("../services/dailyReportRunner");
const { runWeeklyReportJob } = require("../services/runWeeklyReportJob");
const generatePDFBuffer = require("../pdf/generatePDFBuffer");

function getTokenChartImageURL(usedTokens, remainingTokens) {
  const qc = new QuickChart();
  qc.setConfig({
    type: "pie",
    data: {
      labels: ["Tokens Consumed", "Tokens Remaining"],
      datasets: [
        {
          data: [usedTokens, remainingTokens],
          backgroundColor: ["#F44336", "#4CAF50"],
        },
      ],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });
  qc.setWidth(400).setHeight(400);
  return qc.getUrl();
}

// 📩 Daily Report Job Trigger
router.post("/send", async (req, res) => {
  try {
    await runDailyReportJob();
    res.status(200).json({ success: true, message: "Daily report sent." });
  } catch (err) {
    console.error("❌ Error in /api/send-report:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 📩 Weekly Report Job Trigger
router.post("/send-weekly", async (req, res) => {
  try {
    await runWeeklyReportJob();
    res.status(200).json({ success: true, message: "Weekly report sent." });
  } catch (err) {
    console.error("❌ Error in /api/send-weekly:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 📥 Admin-only: Download Report PDF
router.get("/download/:id", async (req, res) => {
  try {
    const chatbotId = req.params.id;

    // 1. Fetch chatbot
    const { data: chatbot, error: cbErr } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", chatbotId)
      .single();
    if (cbErr || !chatbot)
      return res.status(404).json({ error: "Chatbot not found" });

    // 2. Fetch company
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", chatbot.company_id)
      .single();

    // 3. Fetch active plan subscription
    const { data: plan } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("chatbot_id", chatbotId)
      .eq("status", "active")
      .maybeSingle();

    const startDate = plan?.start_date ? new Date(plan.start_date) : null;
    const endDate = plan?.end_date ? new Date(plan.end_date) : null;
    const planDuration =
      startDate && endDate
        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        : "N/A";
    const daysLeft =
      endDate
        ? Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)))
        : "N/A";

    const planName = plan?.plans?.name || "N/A";
    const maxUsers = plan?.plans?.max_users || "N/A";

    // 4. Fetch message history
    const { data: messageHistory } = await supabase
      .from("messages")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .order("timestamp", { ascending: true });

    const totalMessages = messageHistory.length;

    // 5. Count verified user sessions
    const { data: verifiedUsers } = await supabase
      .from("verified_users")
      .select("id")
      .eq("chatbot_id", chatbotId);

    const uniqueUsers = verifiedUsers.length;
    const usersLeft =
      typeof maxUsers === "number" ? Math.max(maxUsers - uniqueUsers, 0) : "N/A";

    // 6. Generate chart
    const remainingTokens =
      chatbot.token_limit != null && chatbot.used_tokens != null
        ? Math.max(chatbot.token_limit - chatbot.used_tokens, 0)
        : "Unlimited";

    const chartURL = getTokenChartImageURL(
      chatbot.used_tokens || 0,
      remainingTokens === "Unlimited" ? 0 : remainingTokens
    );

    // 7. Final Report Data
    const reportData = {
      name: chatbot.name,
      companyName: company?.name || chatbot.company_name || "N/A",
      domain: chatbot.company_url,
      tokenLimit: chatbot.token_limit,
      usedTokens: chatbot.used_tokens,
      remainingTokens,
      totalMessages,
      uniqueUsers,
      usersLeft,
      planName,
      startDate: startDate?.toLocaleDateString("en-GB") || "N/A",
      endDate: endDate?.toLocaleDateString("en-GB") || "N/A",
      planDuration,
      daysRemaining: daysLeft,
      generatedAt: new Date().toLocaleString(),
      messageHistory,
      chartURL,
    };

    const pdfBuffer = await generatePDFBuffer(reportData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${chatbot.name}-report.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Error generating chatbot report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
