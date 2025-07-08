const axios = require("axios");

async function generateAnswer(query, contextChunks) {
  const systemPrompt = `
You are a professional customer support assistant for our company.

Only answer questions using the following context. Do NOT respond to unrelated questions or code-related prompts.
Speak naturally and clearly.

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
          { role: "user", content: query }
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

    const mainAnswer = response.data.choices[0].message.content;

    // 🔁 Now ask GPT to generate 3 related suggestions:
    const suggestionPrompt = `Based on this answer: "${mainAnswer}", suggest 3 natural follow-up questions a customer might ask. Respond as a JSON array of strings.`;

    const suggestionResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: suggestionPrompt }
        ],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let suggestions = [];

    try {
      suggestions = JSON.parse(suggestionResponse.data.choices[0].message.content);
    } catch (e) {
      suggestions = [];
    }

    return {
      answer: mainAnswer,
      suggestions,
      tokens: response.data.usage.total_tokens + suggestionResponse.data.usage.total_tokens,
    };
  } catch (error) {
    console.error("Error generating response:", error.response?.data || error.message);
    return {
      answer: "Sorry, I'm currently unable to assist with that. Please try again later.",
      suggestions: [],
      tokens: 0
    };
  }
}

module.exports = { generateAnswer };
