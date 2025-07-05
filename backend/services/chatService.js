// services/chatService.js
const axios = require("axios");

async function generateAnswer(query, contextChunks) {
  const systemPrompt = `You are a helpful assistant. Use the context below to answer the user question accurately.\n\nContext:\n${contextChunks.join(
    "\n---\n"
  )}`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}

module.exports = { generateAnswer };
