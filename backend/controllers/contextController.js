// controllers/contextController.js
const extractTextFromFile = require("../utils/extractTextFromFile");
const chunkText = require("../utils/chunkText");
const { storeContextChunk } = require("../services/contextService");

exports.uploadContextFile = async (req, res) => {
  try {
    const file = req.file;
    const { chatbotId } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const ext = file.originalname.split(".").pop().toLowerCase();
    const text = await extractTextFromFile(file.buffer, ext);

    const chunks = chunkText(text, 300, 50);
    const results = [];

    for (const chunk of chunks) {
      const saved = await storeContextChunk(chunk, chatbotId);
      results.push(saved);
    }

    res.status(201).json({
      message: "File uploaded and embeddings stored",
      chunksStored: results.length,
      data: results.flat(),
    });
  } catch (error) {
    console.error("Upload file error:", error.message);
    res.status(500).json({ message: "Error processing file" });
  }
};
