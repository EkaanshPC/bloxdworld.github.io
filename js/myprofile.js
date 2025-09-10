import { getUID } from "./googlelogin.js";
import * as leoProfanity from "https://cdn.jsdelivr.net/npm/leo-profanity/+esm"; 
import * as nsfwjs from "https://cdn.jsdelivr.net/npm/nsfwjs/+esm";

const client = supabase.createClient(
  "https://pxmsgzfufvwxpnyeobwk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage
    }
  }
);

// 🛡️ Text moderation
function cleanText(input) {
  return leoProfanity.clean(input || "");
}

// 🛡️ Image URL validation
function validateImageURL(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// 🛡️ Load NSFWJS model once
let nsfwModel = null;
async function loadNSFWModel() {
  if (!nsfwModel) {
    nsfwModel = await nsfwjs.load();
  }
  return nsfwModel;
}

// 🛡️ Image moderation check
async function isImageSafe(url) {
  if (!validateImageURL(url)) return false;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = async () => {
      try {
        const model = await loadNSFWModel();
        const predictions = await model.classify(img);
        console.log("NSFW Predictions:", predictions);

        // block porn, hentai, sexy if > 60% confidence
        const unsafe = predictions.some(p =>
          ["Porn", "Hentai", "Sexy"].includes(p.className) && p.probability > 0.6
        );

        resolve(!unsafe);
      } catch (err) {
        console.error("Image moderation failed:", err);
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
  });
}

async function loadProfile() {
  const uid = await getUID();
  if (!uid) return;

  const { data: profile, error } = await client
    .from("profiles")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (profile) {
    document.getElementById("displayName").value = profile.display_name || "";
    document.getElementById("bio").value = profile.bio || "";
    document.getElementById("profilePicture").value = profile.profile_picture || "";
    if (profile.profile_picture) {
      document.getElementById("profilePreview").src = profile.profile_picture;
    }
  }
}

document.getElementById("profilePicture").addEventListener("input", (e) => {
  const url = e.target.value;
  document.getElementById("profilePreview").src = 
    validateImageURL(url) ? url : "https://bloxdworld.pages.dev/assets/pixil-frame-0%20(14).png";
});

document.getElementById("saveProfile").addEventListener("click", async () => {
  const uid = await getUID();
  if (!uid) {
    Toastify({ text: "You must be logged in!", backgroundColor: "red", duration: 3000 }).showToast();
    return;
  }

  let display_name = cleanText(document.getElementById("displayName").value);
  let bio = cleanText(document.getElementById("bio").value);
  let profile_picture = document.getElementById("profilePicture").value;

  // 🛡️ Moderate image before saving
  if (!(await isImageSafe(profile_picture))) {
    profile_picture = "https://bloxdworld.pages.dev/assets/pixil-frame-0%20(14).png";
    Toastify({ text: "Unsafe image blocked. Default avatar applied.", backgroundColor: "orange", duration: 3000 }).showToast();
  }

  const { error } = await client
    .from("profiles")
    .upsert({ uid, display_name, bio, profile_picture }, { onConflict: ["uid"] });

  if (error) {
    Toastify({ text: "Failed to save profile!", backgroundColor: "red", duration: 3000 }).showToast();
    console.error(error);
    return;
  }

  Toastify({ text: "Profile updated!", backgroundColor: "#00ffff", duration: 3000 }).showToast();
});

loadProfile();

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