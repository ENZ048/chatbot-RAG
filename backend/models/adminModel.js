const supabase = require("../supabase/client");
const bcrypt = require("bcrypt");

async function findAdminByEmail(email) {
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function createAdmin(email, password) {
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const { data, error } = await supabase
    .from("admins")
    .insert([{ email, password_hash }]);

  if (error) throw error;
  return data;
}

module.exports = { findAdminByEmail, createAdmin };
