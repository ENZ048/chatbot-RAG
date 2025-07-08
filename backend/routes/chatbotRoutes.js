const express = require("express");
const router = express.Router();
const {
  createChatbot,
  editChatbot,
  deleteChatbot,
  getAllChatbots
} = require("../controllers/chatbotCOntroller");
const adminProtect = require("../middleware/adminAuthMiddleware");

router.post("/create", adminProtect, createChatbot);
router.put("/edit/:id", adminProtect, editChatbot);
router.delete("/delete/:id", adminProtect, deleteChatbot);
router.get("/all", adminProtect, getAllChatbots);
router.get("/messages/:id", adminProtect, getMessageHistory);

module.exports = router;
