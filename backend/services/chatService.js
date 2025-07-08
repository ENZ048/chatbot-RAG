// services/chatService.js
const axios = require("axios");

async function generateAnswer(query, contextChunks) {
  const systemPrompt = `
You are a helpful customer support assistant. Only use the following context to answer the user's question. 
If the question is unrelated to the context, DO NOT try to answer it directly.
Instead, respond in a natural customer support tone like:
"I'm here to assist you with services related to our business. Could you please ask something specific about our offerings?"

Context:
${contextChunks.join("\n---\n")}
`;

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
