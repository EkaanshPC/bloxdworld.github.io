import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as leoProfanity from "https://cdn.jsdelivr.net/npm/leo-profanity/+esm";
import * as nsfwjs from "https://cdn.jsdelivr.net/npm/nsfwjs/+esm";

// 🛡️ NSFWJS setup
let nsfwModel = null;
async function loadNSFWModel() {
  if (!nsfwModel) nsfwModel = await nsfwjs.load();
  return nsfwModel;
}

// 🛡️ Text moderation
function cleanText(input) {
  return (input || "")
    .replace(/<\s*script[^>]*>/gi, "********")
    .replace(/<\s*\/\s*script\s*>/gi, "********")
    .replace(/\S+/g, word => leoProfanity.clean(word));
}

// 🛡️ Image moderation inside HTML
async function moderateImagesInDescription(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const images = div.querySelectorAll("img");

  for (let img of images) {
    try {
      const imageEl = new Image();
      imageEl.crossOrigin = "anonymous";
      imageEl.src = img.src;
      await new Promise((res, rej) => {
        imageEl.onload = res;
        imageEl.onerror = rej;
      });

      const predictions = await loadNSFWModel().then(m => m.classify(imageEl));
      const nsfwScore = predictions.find(p =>
        ["Porn", "Hentai", "Sexy"].includes(p.className)
      )?.probability || 0;

      if (nsfwScore > 0.7) img.replaceWith("🚫 [NSFW Image Removed]");
    } catch (err) {
      console.warn("Failed to scan image:", err);
      img.replaceWith("⚠️ [Unscannable Image]");
    }
  }

  return div.innerHTML;
}

// 🛡️ Sanitize description
async function sanitizeDescription(input) {
  let safeText = cleanText(input);
  let moderated = await moderateImagesInDescription(safeText);
  return moderated;
}

const SUPABASE_URL = "https://pxmsgzfufvwxpnyeobwk.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const modsList = document.getElementById("modsList");
import { getUserMods } from "./googlelogin.js"
async function fetchAndRenderMods() {
  const { data: { user } } = await supabase.auth.getUser(); 
  if (!user) return;

  const mods = await getUserMods(user.id);
  renderMods(mods);
}

function renderMods(mods) {
  modsList.innerHTML = mods.map(mod => modsList.innerHTML += `
  <div class="mod-card" data-id="${mod.id}" style="border:1px solid #ddd; padding:10px; border-radius:8px; width:350px; margin-bottom:10px;">
    <!-- Flex container for image + title -->
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
      <img src="${mod.icon||"https://bloxdworld.pages.dev/assets/pixil-frame-0%20%2814%29.png"}" style="width:100px; height:100px; object-fit:contain;">
      <h3 style="margin:0;">${mod.title}</h3>
    </div>

    <p>${mod.shortdescription || "No description"}</p>

    <a href="https://bloxdworld.pages.dev/newfullview?addonid=${mod.id}" target="_blank" 
       style="display:block; width:100%; padding:5px 0; background-color:lightgray; text-decoration:none; color:inherit; border-radius:5px; text-align:center; margin-bottom:5px;">
       Download
    </a>

    <button class="delete-btn" style="width:100%; margin-bottom:5px;">Delete</button>
    <button class="add-version-btn" style="width:100%;">Add Version</button>
  </div>
`.join(""))

  modsList.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const modId = e.target.closest(".mod-card").dataset.id;
      if (confirm("Are you sure you want to delete this mod?")) {
        await deleteMod(modId);
      }
    });
  });

  modsList.querySelectorAll(".add-version-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const modCard = e.target.closest(".mod-card");
    const modId = modCard.dataset.id;

    // If form already exists, don't add another
    if (modCard.querySelector(".version-form")) return;

    // Create form
  const formHtml = `
  <div class="version-form">
    <input type="text" name="title" placeholder="Proposed Title" value="${modCard.querySelector("h3").textContent}">
    <textarea name="description" placeholder="Proposed Description">${modCard.querySelector("p").textContent}</textarea>
    <input type="file" name="file_upload" accept=".txt,.js,.json">
    <button class="submit-version-btn">Submit Update</button>
    <button class="cancel-version-btn">Cancel</button>
  </div>
`;

    modCard.insertAdjacentHTML("beforeend", formHtml);

    // Cancel button
    modCard.querySelector(".cancel-version-btn").addEventListener("click", () => {
      modCard.querySelector(".version-form").remove();
    });

    // Submit button
modCard.querySelector(".submit-version-btn").addEventListener("click", async () => {
  const form = modCard.querySelector(".version-form");
  const proposedTitle = form.querySelector("input[name='title']").value;
  const proposedDesc = form.querySelector("textarea[name='description']").value;
  const fileInput = form.querySelector("input[name='file_upload']");
  const file = fileInput.files[0];

  if (!file) return alert("Please upload a file!");

  // 🛡️ Moderate title & description
  const safeTitle = cleanText(proposedTitle);
  const safeDesc = await sanitizeDescription(proposedDesc);

  // Upload file to Supabase Storage
  const filePath = `${modId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("mods").upload(filePath, file);
  if (uploadError) return alert("❌ Upload failed: " + uploadError.message);

  const { data } = supabase.storage.from("mods").getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  // Insert moderated version proposal
  const { error: insertError } = await supabase.from("versions").insert({
    mod_id: modId,
    proposed_title: safeTitle,
    proposed_description: safeDesc,
    proposed_file_path: publicUrl,
    created_at: new Date(),
    approved: false
  });

  if (insertError) return alert("❌ Failed to submit version: " + insertError.message);
  alert("✅ Update proposal submitted! Awaiting approval.");
  form.remove();
});
  });
});
}

async function deleteMod(modId) {
  const { error } = await supabase.from("mod").delete().eq("id", modId);
  if (error) return alert("Failed to delete mod: " + error.message);
  alert("Mod deleted!");
  fetchAndRenderMods();
}

async function createVersion(modId, version) {
  const { error } = await supabase.from("versions").insert({
    mod_id: modId,
    version_name: version,
    created_at: new Date()
  });
  if (error) return alert("Failed to add version: " + error.message);
  alert("Version added!");
}

fetchAndRenderMods();

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