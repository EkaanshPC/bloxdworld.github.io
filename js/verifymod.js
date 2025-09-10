import { createClient } from "https://esm.sh/@supabase/supabase-js";

// --- Supabase Init ---
const supabaseUrl = "https://pxmsgzfufvwxpnyeobwk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U"; // replace with your anon key
const client = createClient(supabaseUrl, supabaseKey);

// --- Admin Email ---
const ADMIN_EMAIL = "ekaanshagarwal19564@gmail.com";
// --- Fetch mods that are not approved yet ---
async function fetchMods() {
  const { data: mods, error } = await client
    .from("mod")
    .select("*")
    .eq("approval", null) // only pending mods
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching mods:", error.message);
    return [];
  }
  return mods;
}

// --- Render mods in the admin dashboard ---
function renderMods(mods) {
  const container = document.getElementById("mods-list");
  container.innerHTML = "";

  if (!mods || mods.length === 0) {
    container.innerHTML = "<p>No mods waiting for verification!</p>";
    return;
  }

  mods.forEach(mod => {
    const card = document.createElement("div");
    card.className = "mod-card";
    card.innerHTML = `
      <img src="${mod.icon || mod.image || 'https://bloxdworld.pages.dev/assets/pixil-frame-0%20(14).png'}" class="mod-icon">
      <div class="mod-content">
        <h3>${mod.title}</h3>
        <div class="mod-meta">
          <p><b>Author:</b> ${mod.author || "Unknown"}</p>
          <p><b>Category:</b> ${mod.category || "Misc"}</p>
          <p><b>Description:</b> ${(mod.description || "No description").slice(0,100)}${mod.description && mod.description.length > 100 ? "…" : ""}</p>
        </div>
        <div>
          <button class="approve-btn" onclick="verifyMod('${mod.id}', true)">✅ Approve</button>
          <button class="reject-btn" onclick="verifyMod('${mod.id}', false)">❌ Reject</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Approve / Reject a mod ---
window.verifyMod = async (modId, approve) => {
  const updates = { approval: approve }; // true = approved
  const { error } = await client
    .from("mod")
    .update(updates)
    .eq("id", modId);

  if (error) return alert("Error updating mod: " + error.message);

  alert(approve ? "✅ Mod approved!" : "❌ Mod rejected!");
  
  const mods = await fetchMods();
  renderMods(mods);
};

// --- Run on page load ---

// --- Run ---
document.addEventListener("DOMContentLoaded", async () => {
const { data: { session } } = await client.auth.getSession();
const user = session?.user;

if (!user || user.email !== "ekaanshagarwal19564@gmail.com") {
    document.getElementById("mods-list").innerHTML = 
        "<p>❌ Access Denied. Only admin can view this page.</p>";
    return;
}
  const mods = await fetchMods();
  renderMods(mods);
});