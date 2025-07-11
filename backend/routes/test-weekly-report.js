const express = require("express");
const router = express.Router();
const generateWeeklyPDFBuffer = require("../pdf/generateWeeklyPDFBuffer");

router.get("/test-weekly-report", async (req, res) => {
  try {
    const dummyData = {
      companyName: "Troika Tech Solutions",
      domain: "https://troikatech.in",
      planName: "Business",
      planDuration: 365,
      startDate: "10/08/2025",
      endDate: "10/08/2026",
      daysRemaining: 390,
      uniqueUsers: 132,
      remainingUsers: 1868,
      totalMessages: 4500,
      messageHistory: [
        { sender: "user", content: "What services do you offer?" },
        { sender: "bot", content: "We offer AI website development, SEO, and chatbot solutions." },
        { sender: "user", content: "Can I see your portfolio?" },
        { sender: "bot", content: "Sure! Visit our portfolio at troikatech.in/portfolio" }
      ]
    };

    const pdfBuffer = await generateWeeklyPDFBuffer(dummyData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Weekly_Report_Test.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating test report:", err);
    res.status(500).json({ error: "Failed to generate test report" });
  }
});

module.exports = router;
