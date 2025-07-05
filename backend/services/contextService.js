// services/contextService.js
const supabase = require("../supabase/client");
const { generateEmbedding } = require("./embeddingService");

async function storeContextChunk(content, chatbotId = null) {
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase.from("embeddings").insert([
    {
      content,
      embedding,
      chatbot_id: chatbotId,
    },
  ]);

  if (error) {
    console.error("Error storing embedding:", error.message);
    throw new Error("Failed to store embedding");
  }

  return data;
}

module.exports = { storeContextChunk };
