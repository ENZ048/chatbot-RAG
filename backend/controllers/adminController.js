const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { findAdminByEmail } = require("../models/adminModel");
const supabase = require("../supabase/client");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, isAdmin: true }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    console.log("🔐 Generated token payload:", {
      id: admin.id,
      email: admin.email,
      isAdmin: true
    });


    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
};

exports.getStats = async (req, res) => {
  try {
    // 1. Total companies
    const { count: totalCompanies } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    // 2. Total chatbots
    const { count: totalChatbots } = await supabase
      .from("chatbots")
      .select("*", { count: "exact", head: true });

    // 3. Unique users
     const { count: unique_users, error: countError } = await supabase
    .from("messages")
    .select("session_id", { count: "exact", head: true })
    .eq("chatbot_id", chatbotId);

  if (countError) return res.status(500).json({ error: countError.message });

    // 4. Total messages
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    // 5. Monthly token usage
    const { data: tokenData, error: tokenError } = await supabase
      .from("chatbots")
      .select("used_tokens, last_reset");

    if (tokenError) throw tokenError;

    const currentMonth = new Date().getMonth();
    const monthlyTokenUsage = tokenData.reduce((sum, row) => {
      const resetMonth = new Date(row.last_reset).getMonth();
      return resetMonth === currentMonth ? sum + (row.used_tokens || 0) : sum;
    }, 0);

    res.json({
      totalCompanies,
      totalChatbots,
      unique_users,
      totalMessages,
      monthlyTokenUsage
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};