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

    const mainAnswer = response.data.choices[0].message.content;

    // 🔁 Now ask GPT to generate 3 related suggestions:
    const suggestionPrompt = `Based on the following answer, generate exactly 3 short follow-up suggestions that are under 5 words each. Avoid punctuation. Do NOT include explanations. Return ONLY a JSON array of 3 strings.

Answer: "${mainAnswer}"`;

    const suggestionResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: suggestionPrompt }],
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
      const raw = suggestionResponse.data.choices[0].message.content;
      const parsed = JSON.parse(raw);
      suggestions = generateSuggestions(parsed);
    } catch (e) {
      suggestions = [];
    }

    if (suggestions.length > 3) {
      suggestions = suggestions.slice(0, 3);
    }

    return {
      answer: mainAnswer,
      suggestions,
      tokens:
        response.data.usage.total_tokens +
          suggestionResponse.data.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error(
      "Error generating response:",
      error.response?.data || error.message
    );
    return {
      answer:
        "Sorry, I'm currently unable to assist with that. Please try again later.",
      suggestions: [],
      tokens: 0,
    };
  }
}

function generateSuggestions(rawSuggestions) {
  const maxLength = 80; // Max characters per suggestion
  return rawSuggestions
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .slice(0, 4) // Show only 4 max
    .map((s) => (s.length > maxLength ? s.slice(0, maxLength - 3) + "..." : s));
}

module.exports = { generateAnswer };
