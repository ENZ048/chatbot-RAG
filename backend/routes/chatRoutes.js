// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const { answerQuery } = require("../controllers/chatController");
const checkTokenLimits = require("../middleware/tokenLimitMiddleware");

router.post("/query",checkTokenLimits, answerQuery);

module.exports = router;
