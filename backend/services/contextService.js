// services/contextService.js
const supabase = require("../supabase/client");
const { batchGenerateEmbeddings } = require("./embeddingService");

async function storeContextChunks(chunks, chatbotId = null) {
  const embeddings = await batchGenerateEmbeddings(chunks);

  const insertData = chunks.map((content, index) => ({
    content,
    embedding: embeddings[index],
    chatbot_id: chatbotId,
  }));

  const { data, error } = await supabase
    .from("embeddings")
    .insert(insertData)
    .select("*");

  if (error) {
    console.error("Batch insert error:", error.message);
    throw new Error("Failed to store context chunks");
  }

  return data;
}

module.exports = { storeContextChunks };
