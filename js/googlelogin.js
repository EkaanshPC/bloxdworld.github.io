console.log("🔥 Script loaded!");

const client = supabase.createClient(
  "https://pxmsgzfufvwxpnyeobwk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U",
  {
    auth: {
      persistSession: true,         // ✅ Keeps user logged in across reloads
      autoRefreshToken: true,       // ✅ Refreshes JWTs automatically
      storage: localStorage         // ✅ Stores session in browser
    }
  }
);

const authArea = document.getElementById("authArea");

authArea.innerHTML = "<li>Loading...</li>";
console.log("⚙️ Supabase client initialized:", client);

// ✅ 2️⃣ Handle OAuth redirect (PKCE or implicit)
async function handleOAuthRedirect() {
  console.log("🐱 handleOAuthRedirect() called");
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const hash = window.location.hash;

  console.log("🔍 URL params:", window.location.search);
  console.log("🔍 URL hash:", hash);

  if (code) {
    console.log("🎉 Found ?code param:", code);
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("❌ Error exchanging code:", error.message);
    } else {
      console.log("✅ Session established:", data.session);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (hash.includes("access_token")) {
    console.log("🎉 Found #access_token — letting Supabase handle it.");
    // Let Supabase handle it internally
  } else {
    console.log("⚠️ No OAuth params found.");
  }
}

// ✅ 3️⃣ Render UI based on user session
async function renderUser(sessionFromEvent) {
  console.log("🎭 renderUser() called");

  let session = sessionFromEvent;
  if (!session) {
    const { data, error } = await client.auth.getSession();
    session = data.session;
    console.log("client is",client)
    console.log("client.auth is",client.auth)
    console.log("💾 getSession() response:", session, error);
  }

  const user = session?.user;
  console.log("🗝️ Current user:", user);

  if (user) {
    console.log("✅ Logged in user:", user);

    // shorten email (backup if display_name missing)
    const email = user.email;
    const [local, domain] = email.split("@");
    const shortLocal = local.length > 7 ? local.slice(0, 7) + "..." : local;
    const shortEmail = `${shortLocal}@${domain}`;

    // fetch profile
    getProfile().then(profile => {
      authArea.innerHTML = `
        <div class="profile-dropdown">
          <button class="profile-btn">
            <img src="${
              profile.profile_picture || user.user_metadata.picture
            }" alt="avatar" class="profile-pic">
            <span class="profile-name">${
              profile.display_name || user.user_metadata.full_name || shortEmail
            }</span>
          </button>
          <div class="dropdown-content">
            <a href="/myprofile" style="color:white;" id="BEWHITEBRO">My Profile</a>
            <a href="#" id="logoutBtn" style="color:white;">Logout</a>
          </div>
        </div>
      `;

      // ✅ attach logout AFTER rendering
      document.getElementById("logoutBtn").onclick = async (e) => {
        e.preventDefault();
        console.log("🚪 Logging out...");
        await client.auth.signOut();
        setTimeout(() => renderUser(), 100); // Fallback
      };
    });

  } else {
    console.log("🙅 No user logged in.");

authArea.innerHTML = `
  <li>
    <a href="#" id="loginBtn" style="display: flex; align-items: center; gap: 8px;">
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style="height: 16px; border-radius:10px;">
      <span>Login</span>
    </a>
  </li>
`;

    document.getElementById("loginBtn").onclick = async (e) => {
      e.preventDefault();
      console.log("🔑 Starting OAuth sign in...");

      // 🔄 Clear any lingering session before redirect
      await client.auth.signOut();

      // 🔐 Force Google to show account picker
      await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          prompt: "select_account consent" // ✅ Force account switch
        }
      });
    };

    console.log("🔑 Login button set up.");
  }
}

// ✅ 4️⃣ Listen for auth state changes
client.auth.onAuthStateChange(async (_event, session) => {
  console.log("⚡ Auth state changed:", _event, session);

  // 🧹 Clean up hash AFTER session is valid
  if (session === null && window.location.hash.includes("access_token")) {
    console.log("🧹 Cleaning up #access_token from URL");
  
    window.location.hash = "";

    return; // Don't render UI if we're clearing the hash
  }
  if (session === null) {
    console.log("🙅 No session found.");
    authArea.innerHTML = "<li style=\"color:white;\" class=\"emailText\">Not logged in</li>";
    return;
  }

  await renderUser(session);
  console.log("🔄 User UI re-rendered.");
});

// ✅ 5️⃣ Run on page load
console.log("🏃 Running handleOAuthRedirect() & renderUser()...");
handleOAuthRedirect().then(() => renderUser());
console.log("🚀 Initialization complete.");
async function submitVote(modId) {
  const { data: { session }, error } = await client.auth.getSession();
  if (!session) {
    alert("🔒 You must be logged in to vote.");
    return;
  }

  const user = session.user;

  const { error: insertError } = await client.from("votes").insert({
    user_id: user.id,
    addon_id: modId
  });

  if (insertError) {
    if (insertError.code === "23505") {
      alert("⚠️ You’ve already voted for this mod.");
    } else {
      console.error("❌ Vote failed:", insertError);
      alert("Vote failed.");
    }
  } else {
    alert("✅ Vote submitted!");
  }
}

async function hasUserVoted(modId) {
  const { data: { session } } = await client.auth.getSession();
  const user = session?.user;
  if (!user) return false;

  const { data, error } = await client
    .from("votes")
    .select("*")
    .eq("addon_id", modId)
    .eq("user_id", user.id)
    .single();

  return !!data;
}
export async function getUID() {
  const { data: { user }, error } = await client.auth.getUser();
  if (error) {
    console.error("Failed to get UID:", error);
    return null;
  }
  return user.id; // this is the UID
}

export async function uploadMod({ 
  title, 
  file, 
  description, 
  image, 
  icon, 
  author, 
  category, 
  creatoruid,
  shortdescription,
  info 
}) {
  if (!title || !file) return { error: "Fill title and file!" };

  const fileExt = file.name.split('.').pop();
  const filePath = `mods/${Date.now()}.${fileExt}`;

  // Upload file to storage
  const { error: uploadError } = await client
    .storage
    .from('mod')
    .upload(filePath, file);

  if (uploadError) return { error: uploadError.message };

  // Insert row in database
  const { error: dbError } = await client
    .from('mod')
    .insert({
      title,
      description,
      image,
      icon,
      author,
      category,
      info,
      file_path: filePath,
      created_at: new Date(),
      creatoruid,
      shortdescription,
    });

  if (dbError) return { error: dbError.message };

  return { success: true };
}
export async function getProfile() {
  const uid = await getUID();
  if (!uid) return null;

  // Fetch profile, no .single() to avoid PGRST116
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("uid", uid);

  if (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }

  if (!data || data.length === 0) {
    // No profile exists yet, optionally create one
    const { data: newProfile, error: insertError } = await client
      .from("profiles")
      .insert({ uid })
      .select()
      .single(); // safe here, we know 1 row is returned

    if (insertError) {
      console.error("Failed to create new profile:", insertError);
      return null;
    }

    return newProfile;
  }

  // Return first profile if it exists
  return data[0];
}

export async function updateProfile({ display_name, profile_picture, bio }) {
  const uid = await getUID();
  if (!uid) return { error: "User not logged in!" };

  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        uid,
        display_name,
        profile_picture,
        bio
      },
      { onConflict: ["uid"], returning: "representation" } // make sure it returns the updated row
    );

  if (error) return { error: error.message };
  return { success: true, data };
}

async function getProfiles() {
  const { data, error } = await client
    .from("profiles")
    .select("*");

  if (error) {
    console.error("Failed to fetch profiles:", error);
    return [];
  }

  return data;
}
const SUPABASE_URL = "https://pxmsgzfufvwxpnyeobwk.supabase.co/rest/v1/mod";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U";

export async function getUserMods(uid) {
  const res = await fetch(`${SUPABASE_URL}?creatoruid=eq.${uid}`, {
    method: "GET",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    console.error("Failed request:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data;
}
 
let uid=await getUID()
getUserMods(uid).then(mods => mods.forEach(mod=>applyApprovedVersions(mod)));

async function applyApprovedVersions(mod) {
  const { data: versions } = await client
    .from("versions")
    .select("*")
    .eq("mod_id", mod.id)
    .eq("approved", true)
    .order("created_at", { ascending: true });

  if (versions && versions.length > 0) {
    // Apply the latest approved version
    const latest = versions[versions.length - 1];
    mod.title = latest.proposed_title;
    mod.shortdescription = latest.proposed_description;
    mod.file_path = latest.proposed_file_path;
  }

  return mod;
}
export async function approveVersion(versionId) {
  // Fetch version row
  const { data: version, error: vError } = await client
    .from("versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (vError) return console.error(vError);

  // Update the mod table
  const { error: modError } = await client
    .from("mod")
    .update({
      title: version.proposed_title,
      shortdescription: version.proposed_description,
      file_path: version.proposed_file_path
    })
    .eq("id", version.mod_id);

  if (modError) return console.error(modError);

  // Mark version as approved
  await client
    .from("versions")
    .update({ approved: true })
    .eq("id", versionId);

  console.log("Version approved and mod updated!");
}
export async function getUserProfileByUID(uid) {
  if (!uid) {
    console.error("❌ getProfile called with no uid");
    return null;
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("uid", uid)
    .limit(1);

  if (error) {
    console.error("❌ Failed to fetch profile:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log("ℹ️ No profile found for uid:", uid);

    // auto-create empty profile if none exists
    const { data: newProfile, error: insertError } = await client
      .from("profiles")
      .insert({ uid })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to create new profile:", insertError);
      return null;
    }

    return newProfile;
  }

  return data[0]; // ✅ first (and only) row
}
