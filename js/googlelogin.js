console.log("🔥 Script loaded!");

// ✅ 1️⃣ Initialize Supabase client with persistent session
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
    console.log("💾 getSession() response:", session, error);
  }

  const user = session?.user;
  console.log("🗝️ Current user:", user);

  if (user) {
    console.log("✅ Logged in user:", user);
    authArea.innerHTML = `
        <span style="color:white">${user.email}</span>
        <a href="#" id="logoutBtn">🚪 Logout</a>
    `;
document.getElementById("logoutBtn").onclick = async (e) => {
  e.preventDefault();
  console.log("🚪 Logging out...");
  await client.auth.signOut();
  setTimeout(() => renderUser(), 100); // Fallback in case event doesn't fire
};
  } else {
    console.log("🙅 No user logged in.");
    authArea.innerHTML = `
      <li><a href="#" id="loginBtn">🔑 Login with Google</a></li>
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
    authArea.innerHTML = "<li style=\"color:white;\">Not logged in</li>";
    return;
  }

  await renderUser(session);
  console.log("🔄 User UI re-rendered.");
});

// ✅ 5️⃣ Run on page load
console.log("🏃 Running handleOAuthRedirect() & renderUser()...");
handleOAuthRedirect().then(() => renderUser());

// ✅ 6️⃣ Handle page reloads