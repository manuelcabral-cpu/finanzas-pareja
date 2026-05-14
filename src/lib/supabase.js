import { createClient } from "@supabase/supabase-js";

const URL  = import.meta.env.VITE_SUPABASE_URL;
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(URL, KEY);

// ── Transacciones ──────────────────────────────────
export const getTxs = async () => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const insertTx = async (tx) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert(tx)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTx = async (id) => {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
};

// ── Perfil ─────────────────────────────────────────
export const updateProfile = async (id, fields) => {
  const { error } = await supabase.from("profiles").update(fields).eq("id", id);
  if (error) throw error;
};

export const getProfiles = async () => {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data;
};

//── Agregado de patrimonio ──────────────────────────
export const getPatrimonio = async () => {
  const { data, error } = await supabase
    .from("patrimonio")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const insertPatrimonio = async (item) => {
  const { data, error } = await supabase
    .from("patrimonio")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePatrimonio = async (id, fields) => {
  const { error } = await supabase.from("patrimonio").update(fields).eq("id", id);
  if (error) throw error;
};

export const deletePatrimonio = async (id) => {
  const { error } = await supabase.from("patrimonio").delete().eq("id", id);
  if (error) throw error;
};