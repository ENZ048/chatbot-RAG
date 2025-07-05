// services/embeddingService.js
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-ada-002"; // Cheap and good for RAG

async function generateEmbedding(inputText) {
  try {
    const response = await axios.post(
      OPENAI_EMBEDDING_URL,
      {
        input: inputText,
        model: MODEL,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error.response?.data || error.message);
    throw new Error("Failed to generate embedding");
  }
}

module.exports = { generateEmbedding };
