// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const { answerQuery } = require("../controllers/chatController");

router.post("/query", answerQuery);

module.exports = router;
