const express = require("express");
const router = express.Router();
const {
  createCompany,
  editCompany,
  deleteCompany,
  getAllCompaniesWithChatbots,
} = require("../controllers/companyController");
const adminProtect = require("../middleware/adminAuthMiddleware");

router.post("/create", adminProtect, createCompany);
router.put("/edit/:id", adminProtect, editCompany);
router.delete("/delete/:id", adminProtect, deleteCompany);
router.get("/all", adminProtect, getAllCompaniesWithChatbots);

module.exports = router;
