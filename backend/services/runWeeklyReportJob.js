const { fetchChatbotsWithStats } = require("../controllers/chatbotCOntroller");
const generateWeeklyPDFBuffer = require("../pdf/generateWeeklyPDFBuffer");
const sendEmailWithPDF = require("../pdf/sendEmailWithPDF");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);
const supabase = require("../supabase/client");

const runWeeklyReportJob = async () => {
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
        // 🧾 Fetch plan details from subscriptions and plans
        const { data: plan } = await supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("chatbot_id", bot.id)
          .eq("status", "active")
          .maybeSingle();

        const start = plan?.start_date ? dayjs(plan.start_date) : null;
        const end = plan?.end_date ? dayjs(plan.end_date) : null;
        const today = dayjs();

        const totalDays = start && end ? end.diff(start, "day") : "N/A";
        const daysRemaining = end ? end.diff(today, "day") : "N/A";

        const planName = plan?.plans?.name || "N/A";
        const maxUsers = plan?.plans?.max_users || "N/A";

        // 👥 Count verified users
        const { data: verifiedUsers } = await supabase
          .from("verified_users")
          .select("id")
          .eq("chatbot_id", bot.id);
        const usersUsed = verifiedUsers?.length || 0;
        const remainingUsers =
          typeof maxUsers === "number" ? Math.max(maxUsers - usersUsed, 0) : "N/A";

        // 📄 Generate PDF
        const pdfBuffer = await generateWeeklyPDFBuffer({
          name: bot.name,
          companyName: bot.company_name,
          domain: bot.company_url,
          planName,
          planDuration: totalDays,
          startDate: start?.format("DD/MM/YYYY") || "N/A",
          endDate: end?.format("DD/MM/YYYY") || "N/A",
          daysRemaining,
          uniqueUsers: usersUsed,
          remainingUsers,
          totalMessages: bot.total_messages,
          messageHistory: bot.message_history || [],
        });

        await sendEmailWithPDF(
          email,
          `📊 Weekly Chatbot Usage Report - ${bot.name}`,
          pdfBuffer,
          bot.name
        );

        console.log(`✅ Weekly report sent to ${email} for "${bot.name}"`);
      } catch (err) {
        console.error(`❌ Failed for "${bot.name}" → ${email}:`, err);
      }
    }
  }
};

module.exports = { runWeeklyReportJob };
