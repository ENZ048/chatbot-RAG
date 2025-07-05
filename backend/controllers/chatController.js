// controllers/chatController.js
const { retrieveRelevantChunks } = require("../services/queryService");
const { generateAnswer } = require("../services/chatService");

exports.answerQuery = async (req, res) => {
  try {
    const { query, chatbotId } = req.body;

    if (!query || query.length < 5) {
      return res.status(400).json({ message: "Query too short or missing." });
    }

    const chunks = await retrieveRelevantChunks(query, chatbotId);
    const topContext = chunks.map(c => c.content);
    const answer = await generateAnswer(query, topContext);

    res.status(200).json({ answer, sources: topContext });
  } catch (error) {
    console.error("Answer generation error:", error.message);
    res.status(500).json({ message: "Error generating answer" });
  }
};
