const supabase = require("../supabase/client");

// 🟢 CREATE chatbot (admin-only)
exports.createChatbot = async (req, res) => {
  try {
    console.log("Create Chatbot request body:", req.body);

    const { companyId, name } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({ message: "companyId and chatbot name are required." });
    }

    // ✅ Fetch company details
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id, name, url")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) throw companyError;
    if (!companyData) {
      return res.status(404).json({ message: "Company not found." });
    }

    const { name: companyName, url: companyUrl } = companyData;

    // ✅ Insert chatbot with all required fields
    const { data, error } = await supabase
      .from("chatbots")
      .insert([
        {
          company_id: companyId,
          company_name: companyName,
          company_url: companyUrl,
          name,
        },
      ])
      .select("*");

    if (error) throw error;

    res.status(201).json({ message: "Chatbot created", data });
  } catch (err) {
    console.error("Create chatbot error:", err.message);
    res.status(500).json({ message: "Server error while creating chatbot" });
  }
};


// ✏️ EDIT chatbot
exports.editChatbot = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: "Chatbot name is required." });
    }

    const { data, error } = await supabase
      .from("chatbots")
      .update({ name })
      .eq("id", id)
      .select("*");

    if (error) throw error;

    res.status(200).json({ message: "Chatbot updated", data });
  } catch (err) {
    console.error("Edit chatbot error:", err.message);
    res.status(500).json({ message: "Server error while updating chatbot" });
  }
};

// ❌ DELETE chatbot
exports.deleteChatbot = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("chatbots").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Chatbot deleted" });
  } catch (err) {
    console.error("Delete chatbot error:", err.message);
    res.status(500).json({ message: "Server error while deleting chatbot" });
  }
};
