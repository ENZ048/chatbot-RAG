const express = require("express");
const router = express.Router();
const { uploadContextFile } = require("../controllers/contextController");
const upload = require("../middleware/uploadMiddleware");

router.post("/upload-file", upload.single("file"), uploadContextFile);

module.exports = router;
