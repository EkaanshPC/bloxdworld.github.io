  import { createClient } from "https://esm.sh/@supabase/supabase-js";

  // ✅ Supabase init (only anon key, not service key!)
  const supabaseUrl = "https://pxmsgzfufvwxpnyeobwk.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U"; // not service!
  const client = createClient(supabaseUrl, supabaseKey);

 async function fetchMods() {
  console.log("🔄 Fetching mods from Supabase...");
  const { data: mods, error } = await client
    .from("mod")
    .select("*")
    .eq("approval", true)        // ✅ Only approved mods
    .order("created_at", { ascending: false });

  if (error) {
    Toastify({
  text: "❌ Error fetching mods:"+ error.message,
  duration: 3000,
  gravity: "bottom", // bottom or top
  position: "right", // left, center, right
  backgroundColor: "linear-gradient(to right, #FF0000, #D3D3D3)",
  close: true,
}).showToast();
    console.error("❌ Error fetching mods:", error.message);
    return [];
  }
  console.log("✅ Got mods:", mods);
  return mods;
}


  function renderMods(mods) {
    const container = document.getElementById("mod-list");
    container.innerHTML = "";

    mods.forEach(mod => {
      const card = document.createElement("div");
      card.className = "mod-card";
      card.addEventListener("click", () => {
  // Redirect user
  window.location.href = "https://bloxdworld.pages.dev/newfullview?addonid="+mod.id;
});
card.innerHTML = `
  <img src="${mod.icon || mod.image || "https://bloxdworld.pages.dev/assets/pixil-frame-0%20(14).png"}" alt="icon" class="mod-icon">
  <div class="mod-content">
    <div class="mod-header">
      <h3>${mod.title}</h3>
      <div class="mod-meta">
        <p><b>Author:</b> ${mod.author || "Unknown"}</p>
      </div>
    </div>
    <p class="mod-description">${(mod.shortdescription || "")}</p>
    <div class="mod-meta">
      <p><b>Category:</b> ${mod.category || "Not specified"}</p>
    </div>
  </div>
`;



      container.appendChild(card);
    });
  }

  // Copy link helper
  window.copyLink = async (filePath) => {
    const { data } = client.storage.from("mod").getPublicUrl(filePath);
    if (data?.publicUrl) {
      await navigator.clipboard.writeText(data.publicUrl);
      Toastify({
  text: "Link copied!",
  duration: 3000,
  gravity: "bottom", // bottom or top
  position: "right", // left, center, right
  backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
  close: true,
}).showToast();
    }
  };

  // Run on page load
  document.addEventListener("DOMContentLoaded", async () => {
    const mods = await fetchMods();
    renderMods(mods);
  });
  const themeToggle = document.getElementById("themeToggle");

// Apply saved theme on load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

// Toggle and save preference
themeToggle.addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.toggle("dark-mode");

  // Save preference
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
});