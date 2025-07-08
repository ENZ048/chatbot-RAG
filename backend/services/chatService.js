// services/chatService.js
const axios = require("axios");

async function generateAnswer(query, contextChunks) {
  const systemPrompt = `
You are a friendly, professional customer support assistant for our company.

Only use the information provided in the context below to answer questions.
Respond like a real human support agent — do NOT mention the "context", "document", or "source".
Never say phrases like "Based on the context" or "I found in the data".
If you don't know the answer, respond like this:
"I'm here to help with our services. Could you ask something more specific so I can assist you better?"

Speak naturally, helpfully, and always stay on topic.

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
