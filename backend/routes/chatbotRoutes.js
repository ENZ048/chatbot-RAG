const express = require("express");
const router = express.Router();
const {
  createChatbot,
  editChatbot,
  deleteChatbot,
  getMessageHistory,
  updateTokenLimit,
  getAllChatbotsWithStats
} = require("../controllers/chatbotCOntroller");
const adminProtect = require("../middleware/adminAuthMiddleware");

router.post("/create", adminProtect, createChatbot);
router.put("/edit/:id", adminProtect, editChatbot);
router.delete("/delete/:id", adminProtect, deleteChatbot);
router.get("/all", adminProtect, getAllChatbotsWithStats);
router.get("/messages/:id", adminProtect, getMessageHistory);
router.put("/update-token-limit/:id",adminProtect, updateTokenLimit);

module.exports = router;
