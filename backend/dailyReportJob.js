const cron = require("node-cron");
const { fetchChatbotsWithStats } = require("./controllers/chatbotCOntroller");
const generatePDFBuffer = require("./pdf/generatePDFBuffer");
const sendEmailWithPDF = require("./pdf/sendEmailWithPDF");
const supabase = require("./supabase/client");
const QuickChart = require("quickchart-js");
// const dayjs = require("dayjs");

// 📊 Chart (Optional - still used if you want to visualize token usage later)
function getTokenChartImageURL(usedTokens, remainingTokens) {
  const qc = new QuickChart();
  qc.setConfig({
    type: "pie",
    data: {
      labels: ["Tokens Consumed", "Tokens Remaining"],
      datasets: [{
        data: [usedTokens, remainingTokens],
        backgroundColor: ["#F44336", "#4CAF50"],
      }],
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
  qc.setWidth(400).setHeight(400);
  return qc.getUrl();
}

// ⏰ Scheduled run at 12 PM IST (6 AM UTC)
cron.schedule("0 6 * * *", async () => {
  console.log("⏰ Sending daily chatbot reports...");

  await sendAllReports();
});

// 👇 Manual test run
(async () => {
  console.log("🔧 Running manual daily report...");
  await sendAllReports(true);
})();

// 🧠 Core logic shared by cron and manual run
async function sendAllReports(isManual = false) {
  try {
    const chatbots = await fetchChatbotsWithStats();

    const grouped = {};
    for (const bot of chatbots) {
      if (!bot.company_email) continue;
      if (!grouped[bot.company_email]) grouped[bot.company_email] = [];
      grouped[bot.company_email].push(bot);
    }

    for (const [email, bots] of Object.entries(grouped)) {
      for (const bot of bots) {
        try {
          // 1. Fetch plan
          const { data: plan } = await supabase
            .from("subscriptions")
            .select("*, plans(*)")
            .eq("chatbot_id", bot.id)
            .eq("status", "active")
            .maybeSingle();

          const startDate = plan?.start_date ? new Date(plan.start_date) : null;
          const endDate = plan?.end_date ? new Date(plan.end_date) : null;

          const daysRemaining =
            startDate && endDate
              ? Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)))
              : "N/A";

          const planDuration =
            startDate && endDate
              ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
              : "N/A";

          const planName = plan?.plans?.name || "N/A";
          const maxUsers = plan?.plans?.max_users || "N/A";

          // 2. Fetch verified users
          const { data: verifiedUsers } = await supabase
            .from("verified_users")
            .select("id")
            .eq("chatbot_id", bot.id);

          const userCount = verifiedUsers?.length || 0;
          const usersLeft =
            typeof maxUsers === "number" ? Math.max(maxUsers - userCount, 0) : "N/A";

          // 3. Optional: Token chart (you can remove this if not needed)
          const remainingTokens =
            bot.token_limit != null && bot.used_tokens != null
              ? Math.max(bot.token_limit - bot.used_tokens, 0)
              : 0;
          const chartURL = getTokenChartImageURL(bot.used_tokens || 0, remainingTokens);

          // 4. Prepare PDF data
          const pdfBuffer = await generatePDFBuffer({
            name: bot.name,
            companyName: bot.company_name,
            domain: bot.company_url,
            totalMessages: bot.total_messages,
            uniqueUsers: userCount,
            usersLeft,
            planName,
            startDate: startDate?.toLocaleDateString("en-GB") || "N/A",
            endDate: endDate?.toLocaleDateString("en-GB") || "N/A",
            planDuration,
            daysRemaining,
            messageHistory: bot.message_history || [],
            chartURL,
          });

          // 5. Send
          await sendEmailWithPDF(
            email,
            `📊 Daily Chatbot Report - ${bot.name}${isManual ? " (Manual Test)" : ""}`,
            pdfBuffer,
            bot.name
          );

          console.log(`✅ Report sent to ${email} for "${bot.name}"`);
        } catch (err) {
          console.error(`❌ Error processing bot "${bot.name}" → ${email}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("❌ Top-level daily report error:", err);
  }
}
