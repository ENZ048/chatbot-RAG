const supabase = require("../supabase/client");

exports.getClientConfig = async (req, res) => {
  const chatbotId = req.params.id;

  const { data, error } = await supabase
    .from("client_configs")
    .select("*")
    .eq("chatbot_id", chatbotId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ message: "Error fetching config", error });
  }

  if (!data) {
    return res.status(404).json({ message: "Config not found" });
  }

  res.json(data);
};

exports.updateClientConfig = async (req, res) => {
  const chatbotId = req.params.id;
  const updates = req.body;

  const { data, error } = await supabase
    .from("client_configs")
    .upsert({ chatbot_id: chatbotId, ...updates }, { onConflict: ["chatbot_id"] });

  if (error) {
    return res.status(500).json({ message: "Error updating config", error });
  }

  res.json({ message: "Config updated successfully", config: data });
};
