import { createClient } from "https://esm.sh/@supabase/supabase-js";

// --- Supabase Init ---
const supabaseUrl = "https://pxmsgzfufvwxpnyeobwk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U";
const client = createClient(supabaseUrl, supabaseKey);

// --- Admin Email ---
const ADMIN_EMAIL = "ekaanshagarwal19564@gmail.com";
// --- Debug: Just test the select ---
async function debugSelectOnly() {
  console.log("🔍 [debugSelectOnly] Testing raw select...");

  const { data, error } = await client
    .from("versions")
    .select(`
      *,
      mod:mod_id(id,title,shortdescription,file_path,icon,image)
    `);

  if (error) {
    console.error("❌ [debugSelectOnly] Error:", error);
  } else {
    console.log("✅ [debugSelectOnly] Raw select returned:");
    console.table(data); // shows rows in a nice table
  }
}

// --- Fetch pending versions ---
async function fetchPendingVersions() {
  console.log("🔍 [fetchPendingVersions] Starting fetch...");

  // Run the raw select debug
  await debugSelectOnly();

  const { data: versions, error } = await client
    .from("versions")
    .select(`
      *,
      mod:mod_id(id,title,shortdescription,file_path,icon,image)
    `)
    .eq("approved", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [fetchPendingVersions] Error fetching versions:", error);
    return [];
  }

  if (!versions || versions.length === 0) {
    console.warn("⚠️ [fetchPendingVersions] No pending versions found.");
    return [];
  }

  console.log(`✅ [fetchPendingVersions] Found ${versions.length} versions:`);
  console.table(versions);

  return versions;
}



// --- Render versions ---
function renderVersions(versions) {
  const container = document.getElementById("versions-list");
  container.innerHTML = "";

  if (!versions || versions.length === 0) {
    container.innerHTML = "<p>No pending versions to approve!</p>";
    return;
  }

  versions.forEach(v => {
    const card = document.createElement("div");
    card.className = "mod-card";
    card.innerHTML = `
      <img src="${v.mod.icon || v.mod.image || 'https://bloxdworld.pages.dev/assets/pixil-frame-0%20(14).png'}" class="mod-icon">
      <div class="mod-content">
        <h3>${v.mod.title} (Proposed Update)</h3>
        <div class="mod-meta">
          <p><b>Current Title:</b> ${v.mod.title}</p>
          <p><b>Proposed Title:</b> ${v.proposed_title}</p>
          <p><b>Current Description:</b> ${v.mod.shortdescription || "No description"}</p>
          <p><b>Proposed Description:</b> ${v.proposed_description || "No description"}</p>
          <p><b>Current File:</b> ${v.mod.file_path}</p>
          <p><b>Proposed File:</b> ${v.proposed_file_path}</p>
        </div>
        <div>
          <button class="approve-btn" onclick="approveVersion(${v.id})">✅ Approve</button>
          <button class="reject-btn" onclick="rejectVersion(${v.id})">❌ Reject</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Approve version ---
// --- Approve version ---
window.approveVersion = async (versionId) => {
  // fetch version
  const { data: version, error: vError } = await client
    .from("versions")
    .select("*")
    .eq("id", versionId)
    .single();
  if (vError) return alert("Error fetching version: " + vError.message);

  // update mod with proposed changes
  const { error: modError } = await client
    .from("mod")
    .update({
      title: version.proposed_title,
      shortdescription: version.proposed_description,
      file_path: version.proposed_file_path
    })
    .eq("id", version.mod_id);
  if (modError) return alert("Error updating mod: " + modError.message);

  // remove from versions table
  const { error: delError } = await client
    .from("versions")
    .delete()
    .eq("id", versionId);
  if (delError) return alert("Error deleting version: " + delError.message);

  // remove from UI instantly
  document.querySelector(`.mod-card[data-id="${versionId}"]`)?.remove();

  alert("✅ Version approved and mod updated!");
};



window.rejectVersion = async (versionId) => {
  const { error } = await client
    .from("versions")
    .delete()
    .eq("id", versionId);
  if (error) return alert("❌ Error rejecting version: " + error.message);

  // remove from UI instantly
  document.querySelector(`.mod-card[data-id="${versionId}"]`)?.remove();

  alert("❌ Version rejected!");
};


// --- Run ---
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await client.auth.getSession();
  const user = session?.user;

  if (!user || user.email !== ADMIN_EMAIL) {
    document.getElementById("versions-list").innerHTML = 
      "<p>❌ Access Denied. Only admin can view this page.</p>";
    return;
  }

  const versions = await fetchPendingVersions();
  renderVersions(versions);
});