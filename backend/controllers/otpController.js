const { v4: uuidv4 } = require("uuid");
const supabase = require("../supabase/client");
const { sendOtpEmail } = require("../services/emailService");

// Send OTP
exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await supabase
    .from("user_otp_verifications")
    .insert([{ id: uuidv4(), email, otp }]);

  await sendOtpEmail(email, otp);

  res.json({ message: "OTP sent to your email" });
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  // After you get the email and otp...
  const chatbotId = req.body.chatbotId; // ✅ Ensure chatbotId is passed from frontend

  if (!chatbotId)
    return res.status(400).json({ message: "Chatbot ID is required" });

  // 1. Check active subscription for the chatbot
  const { data: subscription, error: subErr } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("chatbot_id", chatbotId)
    .eq("status", "active")
    .maybeSingle();

  if (subErr || !subscription) {
    return res
      .status(403)
      .json({ message: "No active plan for this chatbot." });
  }

  // 2. Count unique user sessions for this chatbot
  const { data: users } = await supabase
    .from("user_sessions")
    .select("email", { count: "exact", head: true })
    .eq("chatbot_id", chatbotId);

  const userCount = users?.count || 0;
  const maxUsers = subscription.plans.max_users;

  if (userCount >= maxUsers) {
    return res
      .status(403)
      .json({ message: "User limit reached for this plan. Upgrade required." });
  }

  const { data, error } = await supabase
    .from("user_otp_verifications")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0)
    return res.status(400).json({ message: "Invalid request" });

  const record = data[0];
  const isValid = record.otp === otp;
  const ageInMin = (new Date() - new Date(record.created_at)) / 60000;

  if (!isValid || ageInMin > 10)
    return res.status(400).json({ message: "OTP expired or incorrect" });

  // Create or update session
  const { data: existing } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("email", email)
    .limit(1);

  if (existing.length > 0) {
    await supabase
      .from("user_sessions")
      .update({ last_verified: new Date().toISOString() })
      .eq("email", email);
  } else {
    await supabase
      .from("user_sessions")
      .insert([
        {
          id: uuidv4(),
          email,
          chatbot_id: chatbotId,
          last_verified: new Date().toISOString(),
        },
      ]);
  }

  await supabase.from("verified_users").insert([
    {
      email,
      chatbot_id: chatbotId,
      verified_at: new Date().toISOString(),
      session_id: req.body.sessionId || null,
    },
  ]);

  res.json({ success: true });
};

// Check session valid
exports.checkSession = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const { data } = await supabase
    .from("user_sessions")
    .select("last_verified")
    .eq("email", email)
    .limit(1);

  if (!data || data.length === 0) return res.json({ valid: false });

  const SESSION_VALIDITY_HOURS = 6;

  const diffHours = (new Date() - new Date(data[0].last_verified)) / 3600000;
  return res.json({ valid: diffHours < SESSION_VALIDITY_HOURS });
};
