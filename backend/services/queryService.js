// services/queryService.js
const supabase = require("../supabase/client");
const { generateEmbedding } = require("./embeddingService");

async function retrieveRelevantChunks(userQuery, chatbotId = null, matchCount = 5) {
  const queryEmbedding = await generateEmbedding(userQuery);

  // Supabase similarity search
  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    chatbot_id: chatbotId,
  });

  if (error) {
    console.error("Error in semantic search:", error.message);
    throw new Error("Vector search failed");
  }

  return data; // each item has content, similarity score
}

module.exports = { retrieveRelevantChunks };
