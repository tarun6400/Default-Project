/* ============================================================================
 * config.js — Supabase connection settings
 *
 * 1. Create a project at https://supabase.com
 * 2. Run supabase/schema.sql, then supabase/seed.sql in the SQL editor
 * 3. Copy your Project URL and anon key from Settings > API into this file
 *
 * Leave the values blank to run the site in demo mode with bundled sample
 * data — every page and interaction still works, nothing hits the network.
 * ========================================================================== */

window.FARMDIRECT_CONFIG = {
  supabaseUrl: "",      // e.g. "https://abcdefghijklm.supabase.co"
  supabaseAnonKey: "",  // the "anon public" key — safe to ship in a browser

  // optional
  appName: "FarmDirect",
  version: "1.0.0",
  problemId: "SIH26033",
};
