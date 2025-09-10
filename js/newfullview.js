import { getUserProfileByUID } from "./googlelogin";

 Toastify({
  text: "This is still in alpha testing!",
  duration: 3000,
  gravity: "bottom", // bottom or top
  position: "right", // left, center, right
  backgroundColor: "linear-gradient(to right, #FF0000, #D3D3D3)",
  close: true,
}).showToast();
const supabaseUrl = "https://pxmsgzfufvwxpnyeobwk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U";
const client = supabase.createClient(supabaseUrl, supabaseKey);

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
    document.getElementById("descriptionbutton").href="https://bloxdworld.pages.dev/newfullview?addonid="+addonId
        document.getElementById("modversions").href="https://bloxdworld.pages.dev/versions?addonid="+addonId
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
  creatorProfile=await getUserProfileByUID(mod.creatoruid)
  console.log("data got! it is:",mod)
  document.getElementById("modTitle").textContent = mod.title;
  document.getElementById("uploadDate").textContent = mod.created_at.split("T")[0];
  document.getElementById("uploaderName").textContent = creatorProfile.display_name||mod.author;
  document.getElementById("creatorprofilepic").textContent=creatorProfile.profile_picture||"https://bloxdworld.pages.dev/assets/pixil-frame-0%20%2814%29.png"
  document.getElementById("uploaderName").href="https://bloxdworld.pages.dev/profile?useruid="+mod.creatoruid
  document.getElementById("category").textContent = mod.category || "Uncategorized";
 document.getElementById("shortDescription").textContent= mod.shortdescription || "No Info"
  document.getElementById("description").innerHTML = mod.description || "nothing here.... (except tumbleweeds)"
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