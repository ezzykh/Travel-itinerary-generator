// Saving and loading. Two back ends with the same functions:
//  - Supabase (accounts + cloud database) when CONFIG has keys
//  - Local mode (this browser only, no login) otherwise
import { CONFIG } from "./config.js";

const safeLS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

function localStore() {
  const user = { id: "local", email: "" };
  return {
    mode: "local",
    async current() { return user; },
    async login() { return user; }, async register() { return user; }, async logout() {},
    async resetPassword() {}, async updatePassword() {}, onRecovery() {},
    async getAgency() { return safeLS.get("ib.agency", { code: "LOCAL", profile: null }); },
    async saveProfile(profile) { const a = safeLS.get("ib.agency", { code: "LOCAL" }); a.profile = profile; if (!safeLS.set("ib.agency", a)) throw new Error("Browser storage is full. Use a smaller logo."); },
    async listTrips() { return safeLS.get("ib.trips", []).map(({ id, title, client, start, updatedAt }) => ({ id, title, client, start, updatedAt })); },
    async getTrip(id) { return safeLS.get("ib.trips", []).find((t) => t.id === id) || null; },
    async saveTrip(trip) {
      const all = safeLS.get("ib.trips", []).filter((t) => t.id !== trip.id);
      all.unshift({ ...trip, updatedAt: new Date().toISOString() });
      if (!safeLS.set("ib.trips", all)) throw new Error("Browser storage is full. Remove photos or delete old trips.");
    },
    async deleteTrip(id) { safeLS.set("ib.trips", safeLS.get("ib.trips", []).filter((t) => t.id !== id)); },
  };
}

async function supabaseStore() {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
  const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  const site = CONFIG.siteUrl || location.href.split("#")[0];
  const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  let recoveryCb = null;
  sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY" && recoveryCb) recoveryCb(); });

  return {
    mode: "cloud",
    async current() { const { data } = await sb.auth.getUser(); return data?.user || null; },
    async login(email, password) { return must(await sb.auth.signInWithPassword({ email, password })).user; },
    async register({ name, company, phone, email, password }) {
      const d = must(await sb.auth.signUp({ email, password, options: { emailRedirectTo: site, data: { name, company, phone } } }));
      return d.session ? d.user : null; // null = must confirm email first
    },
    async logout() { await sb.auth.signOut(); },
    async resetPassword(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: site })); },
    async updatePassword(password) { must(await sb.auth.updateUser({ password })); },
    onRecovery(cb) { recoveryCb = cb; },
    async getAgency() {
      const row = must(await sb.from("agencies").select("agency_code, name, phone, email, profile").maybeSingle());
      if (!row) return { code: "", profile: null, seed: null };
      const hasProfile = row.profile && Object.keys(row.profile).length;
      // A new account has only the details from sign-up; `seed` starts its profile.
      return { code: row.agency_code, profile: hasProfile ? row.profile : null, seed: { name: row.name || undefined, phone: row.phone || undefined, email: row.email || undefined } };
    },
    async saveProfile(profile) {
      const { data } = await sb.auth.getUser();
      must(await sb.from("agencies").update({ name: profile.name, phone: profile.phone, profile, updated_at: new Date().toISOString() }).eq("id", data.user.id));
    },
    async listTrips() {
      const rows = must(await sb.from("trips").select("id, title, client, start_date, updated_at").order("updated_at", { ascending: false }).limit(200));
      return rows.map((r) => ({ id: r.id, title: r.title, client: r.client, start: r.start_date, updatedAt: r.updated_at }));
    },
    async getTrip(id) { const r = must(await sb.from("trips").select("data").eq("id", id).maybeSingle()); return r ? r.data : null; },
    async saveTrip(trip) {
      const now = new Date().toISOString();
      must(await sb.from("trips").upsert({ id: trip.id, title: trip.title, client: trip.client, start_date: trip.start || null, data: { ...trip, updatedAt: now }, updated_at: now }));
    },
    async deleteTrip(id) { must(await sb.from("trips").delete().eq("id", id)); },
  };
}

export async function openStore() {
  if (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) return supabaseStore();
  return localStore();
}

// The trip being edited survives a page reload even before it is saved.
export const draft = {
  load(userId) { return safeLS.get("ib.draft." + userId, null); },
  save(userId, trip) { return safeLS.set("ib.draft." + userId, trip); },
  clear(userId) { safeLS.del("ib.draft." + userId); },
};
