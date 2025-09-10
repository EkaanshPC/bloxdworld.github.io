const supabaseUrl = "https://pxmsgzfufvwxpnyeobwk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U"; // safe anon key
const client = supabase.createClient(supabaseUrl, supabaseKey);
import { getUserProfileByUID } from "./googlelogin";
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const addonId = params.get("addonid");
    document.getElementById("descriptionbutton").href="https://bloxdworld.pages.dev/newfullview?addonid="+addonId
    document.getElementById("modversions").href="https://bloxdworld.pages.dev/versions?addonid="+addonId
  if (!addonId) {
    Toastify({
      text: "No AddonId found in URL!",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "linear-gradient(to right, #FF0000, #D3D3D3)",
      close: true,
    }).showToast();
    return console.error("No Addon ID in URL");
  }

  const container = document.getElementById("mod-detail-page");
  container.innerHTML = `<h2>Versions</h2>`;

  // --- Fetch mod info (Current Version) ---
  const { data: mod, error: modError } = await client
    .from("mod")
    .select("id, title, file_path")
    .eq("id", addonId)
    .single();
  if (modError) {
    console.error("❌ Error fetching mod info:", modError);
    return;
  }

  // Current Version accordion
  const currentId = "version-current";
  container.innerHTML += `
    <div class="version-card">
      <button class="accordion" data-file="${mod.file_path}" data-target="${currentId}">
        Current Version — <small>${mod.title}</small>
      </button>
      <div id="${currentId}" class="panel">
        <pre class="code-block">Loading...</pre>
      </div>
    </div>
  `;

  // --- Fetch all other versions ---
const { data: versions, error } = await client
  .from("versions")
  .select("id, proposed_title, created_at, proposed_file_path")
  .eq("mod_id", addonId)
  .eq("approved", true)   // only approved versions
  .order("created_at", { ascending: false });


  if (error) {
    console.error("❌ Error fetching versions:", error);
    Toastify({
      text: `Error fetching versions: ${error.message}`,
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "linear-gradient(to right, #FF0000, #D3D3D3)",
      close: true,
    }).showToast();
    return;
  }

  if (!versions || versions.length === 0) {
    container.innerHTML += `<p>No previous versions uploaded yet.</p>`;
  } else {
    versions.forEach(v => {
      const versionId = `version-${v.id}`;
      container.innerHTML += `
        <div class="version-card">
          <button class="accordion" data-file="${v.proposed_file_path}" data-target="${versionId}">
            ${v.proposed_title || "Untitled Version"} — <small>${v.proposed_created_at.split("T")[0]}</small>
          </button>
          <div id="${versionId}" class="panel">
            <pre class="code-block">Loading...</pre>
          </div>
        </div>
      `;
    });
  }

  // --- Accordion logic ---
  document.querySelectorAll(".accordion").forEach(btn => {
    btn.addEventListener("click", async () => {
      const panel = document.getElementById(btn.dataset.target);
      panel.classList.toggle("open");

      if (panel.classList.contains("open") && panel.dataset.loaded !== "true") {
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/mod/${btn.dataset.file}`;
        try {
          const res = await fetch(fileUrl);
          const code = await res.text();
          panel.querySelector(".code-block").textContent = code;
          panel.dataset.loaded = "true";
        } catch (err) {
          panel.querySelector(".code-block").textContent = "❌ Failed to load code.";
        }
      }
    });
  });
});
document.addEventListener("DOMContentLoaded", async ()=>{
  const params = new URLSearchParams(window.location.search);
  const addonId = params.get("addonid");
  if(!addonId) {
    Toastify({
  text: "No AddonId found in URL!",
  duration: 3000,
  gravity: "bottom", // bottom or top
  position: "right", // left, center, right
  backgroundColor: "linear-gradient(to right, #FF0000, #D3D3D3)",
  close: true,
}).showToast();
    return console.error("No Addon ID in URL");}

  const { data, error } = await client
    .from("mod")
    .select("*")
    .eq("id", addonId)
    .single();
  if(error) {
    Toastify({
  text: `Error while finding mod: ${error}`,
  duration: 3000,
  gravity: "bottom", // bottom or top
  position: "right", // left, center, right
  backgroundColor: "linear-gradient(to right, #FF0000, #D3D3D3)",
  close: true,
}).showToast();
    return console.error(error);}

  const mod = data;
  let creatorProfile=await getUserProfileByUID(mod.creatoruid)
  console.log("data got! it is:",mod)
  document.getElementById("modTitle").textContent = mod.title;
  document.getElementById("uploadDate").textContent = mod.created_at.split("T")[0];
  document.getElementById("uploaderName").textContent = creatorProfile.display_name||mod.author;
  document.getElementById("creatorprofilepic").textContent=creatorProfile.profile_picture||"https://bloxdworld.pages.dev/assets/pixil-frame-0%20%2814%29.png"
  document.getElementById("uploaderName").href="https://bloxdworld.pages.dev/profile?useruid="+mod.creatoruid
  document.getElementById("category").textContent = mod.category || "Uncategorized";
 document.getElementById("shortDescription").textContent= mod.shortdescription || "No Info"
  document.getElementById("typeofcode").innerHTML = mod.typeofcode

  window.getLink = async (filePath) => {
    const { data } = client.storage.from("mod").getPublicUrl(filePath);
    if (data?.publicUrl) {
      return data;
    }
  };
  document.getElementById("modIcon").src = mod.icon || "https://bloxdworld.pages.dev/assets/pixil-frame-0%20%2814%29.png";

document.getElementById("copyButton").addEventListener("click", async () => {
  const data = await getLink(mod.file_path);
  const link = data.publicUrl;

  try {
    const response = await fetch(link);
    const code = await response.text(); // get raw code
    console.log(`[DEBUG] copyBtn: code fetched!`);
    navigator.clipboard.writeText(code).then(() => {
      Toastify({
        text: "Code copied to clipboard!",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ADD8E6, #D3D3D3)",
        close: true,
      }).showToast();
    });
  } catch (err) {
    console.error("Failed to fetch code:", err);
    Toastify({
      text: "❌ Failed to copy code",
      backgroundColor: "red",
      duration: 3000,
    }).showToast();
  }
});

});

if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  document.body.classList.add("mobile");
}

const themeToggle = document.getElementById("themeToggle");
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");

themeToggle.addEventListener("click", e => {
  e.preventDefault();
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});