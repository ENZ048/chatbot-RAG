const express = require("express");
const router = express.Router();
const { login, getStats, createAdmin } = require("../controllers/adminController");


router.post("/login", login);
router.get("/stats", getStats);
router.post('/create', createAdmin);

module.exports = router;
