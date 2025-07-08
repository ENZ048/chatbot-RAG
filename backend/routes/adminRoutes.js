const express = require("express");
const router = express.Router();
const { login, getStats } = require("../controllers/adminController");


router.post("/login", login);
router.get("/stats", getStats);

module.exports = router;
