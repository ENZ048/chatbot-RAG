const { fetchChatbotsWithStats } = require("../controllers/chatbotCOntroller");
const generateWeeklyPDFBuffer = require("../pdf/generateWeeklyPDFBuffer");
const sendEmailWithPDF = require("../pdf/sendEmailWithPDF");
const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);

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
        const start = dayjs(bot.start_date);
        const end = dayjs(bot.end_date);
        const today = dayjs();
        const totalDays = end.diff(start, "day");
        const daysRemaining = end.diff(today, "day");

        // const usedTokens = bot.used_tokens || 0;
        // const tokenLimit = bot.token_limit || 0;
        // const remainingTokens = tokenLimit > 0 ? Math.max(tokenLimit - usedTokens, 0) : "Unlimited";
        const usersUsed = bot.unique_users || 0;
        const remainingUsers = tokenLimit > 0 ? Math.max(tokenLimit - usersUsed, 0) : "Unlimited";

        const pdfBuffer = await generateWeeklyPDFBuffer({
          name: bot.name,
          companyName: bot.company_name,
          domain: bot.company_url,
          planName: bot.plan_name || "Business",
          planDuration: totalDays,
          startDate: start.format("DD/MM/YYYY"),
          endDate: end.format("DD/MM/YYYY"),
          daysRemaining,
        //   tokenLimit,
          uniqueUsers: usersUsed,
          remainingUsers,
          totalMessages: bot.total_messages,
        //   usedTokens,
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
