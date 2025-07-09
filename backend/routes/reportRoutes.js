const express = require("express");
const router = express.Router();
const { runDailyReportJob } = require("../services/dailyReportRunner");

router.post("/send", async (req, res) => {
  try {
    await runDailyReportJob();
    res.status(200).json({ success: true, message: "Daily report sent." });
  } catch (err) {
    console.error("❌ Error in /api/send-report:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

module.exports = router;
