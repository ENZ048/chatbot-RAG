// controllers/chatController.js
const { retrieveRelevantChunks } = require("../services/queryService");
const { generateAnswer } = require("../services/chatService");
const supabase = require("../supabase/client");

exports.answerQuery = async (req, res) => {
  try {
    const { query, chatbotId } = req.body;
    const sessionId = req.body.sessionId || "anonymous-session";

    if (!query) {
      return res.status(400).json({ message: "Please ask anything" });
    }

    const chunks = await retrieveRelevantChunks(query, chatbotId);
    const topContext = chunks.map((c) => c.content);
    const { answer, tokens, suggestions } = await generateAnswer(
      query,
      topContext
    );

    await supabase
      .from("chatbots")
      .update({
        used_tokens: req.chatbot.used_tokens + tokens,
        used_today: req.chatbot.used_today + tokens,
      })
      .eq("id", req.chatbot.id);

    await supabase.from("messages").insert([
      {
        chatbot_id: chatbotId,
        sender: "user",
        content: query,
        session_id: sessionId,
      },
    ]);

    await supabase.from("messages").insert([
      {
        chatbot_id: chatbotId,
        sender: "bot",
        content: answer,
        session_id: sessionId,
      },
    ]);

    res.status(200).json({  answer, suggestions, tokens });
  } catch (error) {
    console.error("Answer generation error:", error.message);
    res.status(500).json({ message: "Error generating answer" });
  }
};
