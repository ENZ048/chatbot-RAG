// services/embeddingService.js
const axios = require("axios");
const axiosRetry = require("axios-retry");
const dotenv = require("dotenv");
dotenv.config();

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-ada-002";

// 🔹 Single input (already exists)
async function generateEmbedding(inputText) {
  if (!inputText || typeof inputText !== "string") {
    throw new Error("Input must be a non-empty string");
  }

  if (inputText.length > 16000) {
    inputText = inputText.substring(0, 16000); // ~4000 tokens safety limit
  }

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

// 🔹 Batch input version (more efficient)
async function batchGenerateEmbeddings(inputArray) {
  if (!Array.isArray(inputArray) || inputArray.length === 0) {
    throw new Error("Input must be a non-empty array of strings");
  }

  // Optional: truncate each input to avoid token overflow
  const cleanedInput = inputArray.map((str) => {
    if (typeof str !== "string") return "";
    return str.length > 16000 ? str.substring(0, 16000) : str;
  });

  try {
    const response = await axios.post(
      OPENAI_EMBEDDING_URL,
      {
        input: cleanedInput,
        model: MODEL,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Return array of embeddings (aligned with input)
    return response.data.data.map((d) => d.embedding);
  } catch (error) {
    console.error("Error generating batch embeddings:", error.response?.data || error.message);
    throw new Error("Failed to generate batch embeddings");
  }
}

module.exports = { generateEmbedding, batchGenerateEmbeddings };
