console.log("🔥 Script loaded!");

const client = supabase.createClient(
  "https://pxmsgzfufvwxpnyeobwk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U"
);

const authArea = document.getElementById("authArea");
console.log("⚙️ Supabase client initialized:", client);

// ✅ Handles redirect IF needed
async function handleOAuthRedirect() {
  console.log("🐱 handleOAuthRedirect() called");

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const hash = window.location.hash;

  console.log("🔍 URL params:", window.location.search);
  console.log("🔍 URL hash:", hash);

  if (code || hash.includes("access_token")) {
    console.log("🎉 Found OAuth params!");

    // Use exchangeCodeForSession if code param exists
    if (code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      console.log("🔁 exchangeCodeForSession() response:", data, error);

      if (error) {
        console.error("❌ Error exchanging code:", error.message);
      } else {
        console.log("✅ Session established:", data.session);
      }
    }

    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log("🧹 Cleaned up URL");
  } else {
    console.log("⚠️ No OAuth params found in URL");
  }
}

// ✅ Render user from local session
async function renderUser() {
  console.log("🎭 renderUser() called");

  const { data: { session }, error } = await client.auth.getSession();
  console.log("🗝️ getSession() response:", session, error);

  const user = session?.user || null;

  if (user) {
    console.log("✅ Logged in user:", user);
    authArea.innerHTML = `
      <li>
        <span style="color:white">${user.email}</span>
        <a href="#" id="logoutBtn">🚪 Logout</a>
      </li>
    `;
    document.getElementById("logoutBtn").onclick = async (e) => {
      e.preventDefault();
      console.log("🚪 Logging out...");
      await client.auth.signOut();
      console.log("🧹 Session cleared, reloading...");
      window.location.reload();
    };
  } else {
    console.log("🙅 No user logged in.");
    authArea.innerHTML = `
      <li><a href="#" id="loginBtn">🔑 Login</a></li>
    `;
    document.getElementById("loginBtn").onclick = async (e) => {
      e.preventDefault();
      console.log("🔑 Starting OAuth sign in...");
      await client.auth.signInWithOAuth({ provider: "google" });
    };
  }
}

// ✅ Always listen for auth state changes
client.auth.onAuthStateChange(async (_event, session) => {
  console.log("⚡ Auth state changed:", _event, session);
  await renderUser();
});

// ✅ Full flow: handle redirect IF needed, then restore session from localStorage
console.log("🏃 Running handleOAuthRedirect() & renderUser()...");
handleOAuthRedirect().then(renderUser);

