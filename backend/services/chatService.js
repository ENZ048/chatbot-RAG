// services/chatService.js
const axios = require("axios");

async function generateAnswer(query, contextChunks) {
  const forbiddenKeywords = [
    "<html>",
    "<script>",
    "<style>",
    "css",
    "javascript",
    "js",
    "html",
    "python",
    "code",
    "login form",
    "write a function",
  ];

  const isCodeQuestion = forbiddenKeywords.some((word) =>
    query.toLowerCase().includes(word)
  );

  if (isCodeQuestion) {
    return res.status(403).json({
      answer:
        "I'm here to assist with our services. Unfortunately, I can't help with technical coding or scripts.",
    });
  }

  const systemPrompt = `
You are a professional customer support assistant for our company.

ONLY answer questions that are directly related to our business, based on the context below.

You MUST NOT answer:
- Coding or technical questions (HTML, CSS, JS, Python, etc.)
- Programming-related help
- Anything involving writing or explaining code

If a user asks such a question, politely respond:
"I'm here to assist with our services. Unfortunately, I can't provide technical coding help."

NEVER say things like "Based on the context", "According to the document", or "I don't have access to...". Speak naturally and professionally.

Context:
${contextChunks.join("\n---\n")}
`;

  if (!contextChunks.length) {
    return {
      answer:
        "I'm here to assist you with services related to our business. Could you please ask something specific about our offerings?",
      tokens: 0,
    };
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        top_p: 0.7,
        presence_penalty: 1.0,
        frequency_penalty: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      answer: response.data.choices[0].message.content,
      tokens: response.data.usage.total_tokens,
    };
  } catch (error) {
    console.error(
      "Error generating response:",
      error.response?.data || error.message
    );
    return "Sorry, I'm currently unable to assist with that. Please try again later.";
  }
}

module.exports = { generateAnswer };
