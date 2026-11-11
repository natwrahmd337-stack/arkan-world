const SUPABASE_URL = "https://pwjntufyeydlbzolmgsi.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_G1SkuEoFaxOWnO4ycNZiIw_XT3tOiVF";
window.arkanSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
