const express = require("express");
const router = express.Router();
const {
  createChatbot,
  editChatbot,
  deleteChatbot,
} = require("../controllers/chatbotCOntroller");
const adminProtect = require("../middleware/adminAuthMiddleware");

router.post("/create", adminProtect, createChatbot);
router.put("/edit/:id", adminProtect, editChatbot);
router.delete("/delete/:id", adminProtect, deleteChatbot);

module.exports = router;
