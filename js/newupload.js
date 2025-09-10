  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  import { getProfile, uploadMod, getUID } from "./googlelogin.js";
  import * as leoProfanity from "https://cdn.jsdelivr.net/npm/leo-profanity/+esm";
  import * as nsfwjs from "https://cdn.jsdelivr.net/npm/nsfwjs/+esm";

  // client setup
  const client = createClient(
    "https://pxmsgzfufvwxpnyeobwk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U",
    { auth: { persistSession: true, autoRefreshToken: true, storage: localStorage } }
  );

  console.log("point reached! client created!");

// 🛡️ text moderation

function cleanImages(input) {

  return input.replace(/<img[^>]*>/gi, match => {

    // Only allow http/https links

    if (/src\s*=\s*["']?(https?:\/\/[^"'>\s]+)/i.test(match)) {

      return match; // legit img, keep it

    }

    return "🚫"; // blocked img

  });

}

async function moderateImagesInDescription(html) {

  await loadNSFWModel(); // make sure the model is loaded

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



      const predictions = await nsfwModel.classify(imageEl);



      // 👈 HERE: calculate nsfwScore

      const nsfwScore = predictions.find(p =>

        ["Porn", "Hentai", "Sexy"].includes(p.className)

      )?.probability || 0;



      // 👈 Remove or replace image if NSFW

      if (nsfwScore > 0.7) {

        img.alt = "NSFW image removed";

      }



    } catch (err) {

      console.warn("Failed to scan image:", err);

      img.replaceWith("⚠️ [Unscannable Image]");

    }

  }



  return div.innerHTML;

}



function cleanText(input) {

  return (input || "")

    .replace(/<\s*script[^>]*>/gi, "********")

    .replace(/<\s*\/\s*script\s*>/gi, "********");

}



async function sanitizeDescription(input) {

  let safeText = cleanText(input);

  safeText = leoProfanity.clean(safeText); // profanity filter

  let moderated = await moderateImagesInDescription(safeText);

  return moderated;

}





// 🛡️ image url validator

function validateImageURL(url) {

  if (!url) return false;

  try {

    const u = new URL(url);

    return ["http:", "https:"].includes(u.protocol);

  } catch {

    return false;

  }

}



// 🛡️ NSFWJS setup

let nsfwModel = null;

async function loadNSFWModel() {

  if (!nsfwModel) nsfwModel = await nsfwjs.load();

  return nsfwModel;

}

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

        console.log("Image moderation:", predictions);

        const unsafe = predictions.some(

          (p) => ["Porn", "Sexy", "Hentai"].includes(p.className) && p.probability > 0.6

        );

        resolve(!unsafe);

      } catch {

        resolve(false);

      }

    };

    img.onerror = () => resolve(false);

  });

}


  console.log("DOM ready (no wrapper). Checking user session...");

  const uploadBtn = document.querySelector(".upload-container button");
  const status = document.getElementById("uploadStatus");
  const shortInput = document.getElementById("modShort");
  const message = document.getElementById("wordCountMsg");

  shortInput.addEventListener("input", () => {
    const words = shortInput.value.trim().split(/\s+/).filter(Boolean);
    if (words.length > 30) {
      message.textContent = `Limit exceeded: ${words.length} words (max 30)`;
      shortInput.value = words.slice(0, 30).join(" ");
    } else {
      message.textContent = `Words: ${words.length}/30`;
    }
  });

  uploadBtn.addEventListener("click", async () => {
    console.log("Upload button clicked.");
    status.textContent = "Uploading... ⏳";

    try {
      const { data: { session } } = await client.auth.getSession();
      const user = session?.user;
      if (!user?.email) {
        status.textContent = "❌ You must be logged in to upload a mod!";
        return;
      }

      const profile = await getProfile();
      const author = profile.display_name || user.user_metadata.display_name || user.email;

      // grab form data
      let title = document.getElementById("modTitle").value;
      let file = document.getElementById("modFile").files[0];
      let description = document.getElementById("modDescription").value;
      let image ="";
      let icon = document.getElementById("modIcon").value;
      let category = document.getElementById("modCategory").value;
      let shortdescription = document.getElementById("modShort").value;
       let typeofcode = document.getElementById("modTypeOfCode").value;

      // clean text + sanitize desc
      title = cleanText(title);
      description = await sanitizeDescription(description);
      shortdescription = cleanText(shortdescription);
      category = cleanText(category);

      // validate images
      if (!(await isImageSafe(icon))) icon = "https://bloxdworld.pages.dev/assets/pixil-frame-0 (14).png";

      const modData = { title, file, description, image, icon, author, category, creatoruid: getUID(), shortdescription, info: { extra: "submitted via form" }, typeofcode };

      const result = await uploadMod(modData);
      status.textContent = result.error ? "❌ " + result.error : "✅ Upload successful!";
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Upload failed due to an unexpected error.";
    }
  });