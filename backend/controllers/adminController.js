const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { findAdminByEmail } = require("../models/adminModel");
const supabase = require("../supabase/client");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log(req.body);

  try {
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    console.log("🔐 Generated token payload:", {
      id: admin.id,
      email: admin.email,
      isAdmin: true,
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

    // 3. Unique users (distinct session_id)
    const { data: sessions, error: sessionError } = await supabase
      .from("messages")
      .select("session_id");

    if (sessionError) throw sessionError;

    const sessionIds = new Set(sessions.map((msg) => msg.session_id));
    const unique_users = sessionIds.size;

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
      monthlyTokenUsage,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required." });
    }

    // Check if email already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingAdmin) {
      return res
        .status(400)
        .json({ error: "Admin with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin (id will be auto-generated)
    const { data, error } = await supabase
      .from("admins")
      .insert([
        {
          name,
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          created_at: new Date().toISOString(),
        },
      ])
      .select(); // Return inserted row

    if (error) {
      console.error("Supabase insert error:", error.message);
      return res.status(500).json({ error: "Failed to create admin" });
    }

    // Success
    return res.status(201).json({
      success: true,
      admin: {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        created_at: data[0].created_at,
      },
    });
  } catch (err) {
    console.error("CreateAdmin error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
