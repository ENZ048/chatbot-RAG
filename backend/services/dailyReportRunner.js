const { fetchChatbotsWithStats } = require("../controllers/chatbotCOntroller");
const generatePDFBuffer = require("../pdf/generatePDFBuffer");
const sendEmailWithPDF = require("../pdf/sendEmailWithPDF");
const QuickChart = require("quickchart-js");

function getTokenChartImageURL(usedTokens, remainingTokens) {
  const qc = new QuickChart();
  qc.setConfig({
    type: 'pie',
    data: {
      labels: ['Tokens Consumed', 'Tokens Remaining'],
      datasets: [{
        data: [usedTokens, remainingTokens],
        backgroundColor: ['#F44336', '#4CAF50'],
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
  qc.setWidth(400).setHeight(400);
  return qc.getUrl();
}

const runDailyReportJob = async () => {
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
        const tokenLimit = typeof bot.token_limit === "number" ? bot.token_limit : 0;
        const usedTokens = bot.used_tokens || 0;
        const remainingTokens = tokenLimit > 0 ? Math.max(tokenLimit - usedTokens, 0) : 0;
        const chartURL = getTokenChartImageURL(usedTokens, remainingTokens);

        const pdfBuffer = await generatePDFBuffer({
          name: bot.name,
          companyName: bot.company_name,
          domain: bot.company_url,
          usedTokens,
          remainingTokens,
          tokenLimit: bot.token_limit || "Unlimited",
          totalMessages: bot.total_messages,
          uniqueUsers: bot.unique_users,
          messageHistory: bot.message_history || [],
          chartURL,
        });

        await sendEmailWithPDF(
          email,
          `📊 Daily Chatbot Report - ${bot.name}`,
          pdfBuffer,
          bot.name
        );

        console.log(`✅ Report sent to ${email} for chatbot "${bot.name}"`);
      } catch (err) {
        console.error(`❌ Failed for "${bot.name}" → ${email}:`, err);
      }
    }
  }
};

module.exports = { runDailyReportJob };
