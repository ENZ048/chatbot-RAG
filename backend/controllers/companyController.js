const supabase = require("../supabase/client");

// ✅ Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: "Company name and domain (URL) are required." });
    }

    const existing = await supabase
      .from("companies")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    if (existing.data) {
      return res.status(409).json({ message: "Company domain (URL) already exists." });
    }

    const { data, error } = await supabase
      .from("companies")
      .insert([{ name, url }])
      .select("*");

    if (error) throw error;

    res.status(201).json({ message: "Company created", data });
  } catch (err) {
    console.error("Create company error:", err.message);
    res.status(500).json({ message: "Server error while creating company" });
  }
};

// ✏️ Edit existing company
exports.editCompany = async (req, res) => {
  const { id } = req.params;
  const { name, url } = req.body;

  try {
    if (!name && !url) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    if (url) {
      const existing = await supabase
        .from("companies")
        .select("id")
        .eq("url", url)
        .neq("id", id)
        .maybeSingle();

      if (existing.data) {
        return res.status(409).json({ message: "Company domain (URL) already exists." });
      }
    }

    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (url) updatePayload.url = url;

    const { data, error } = await supabase
      .from("companies")
      .update(updatePayload)
      .eq("id", id)
      .select("*");

    if (error) throw error;

    res.status(200).json({ message: "Company updated", data });
  } catch (err) {
    console.error("Edit company error:", err.message);
    res.status(500).json({ message: "Server error while editing company" });
  }
};

// ❌ Delete company
exports.deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    // Automatically deletes related chatbots if FK is ON DELETE CASCADE
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Company deleted" });
  } catch (err) {
    console.error("Delete company error:", err.message);
    res.status(500).json({ message: "Server error while deleting company" });
  }
};

// 📦 Get all companies with their chatbots
exports.getAllCompaniesWithChatbots = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*, chatbots(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ companies: data });
  } catch (err) {
    console.error("Fetch companies error:", err.message);
    res.status(500).json({ message: "Error fetching companies and chatbots" });
  }
};
