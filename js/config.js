// App settings. Fill in the Supabase values to turn on accounts and cloud saving.
// With the Supabase values empty, the app runs in "local mode": no login, and
// everything is saved in this browser only (useful for testing and demos).
export const CONFIG = {
  appName: "Itinerary Builder",
  appNameAr: "منشئ البرامج السياحية",
  supabaseUrl: "",      // e.g. "https://abcd1234.supabase.co"
  supabaseAnonKey: "",  // the project's publishable / anon key (safe to ship; RLS protects data)
  siteUrl: "",          // public address of the app, used in sign-up and password-reset emails
};
