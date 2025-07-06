 console.log("🔥 Script loaded!");

  const client = supabase.createClient(
    "https://pxmsgzfufvwxpnyeobwk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXNnemZ1ZnZ3eHBueWVvYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjU1OTksImV4cCI6MjA2NzM0MTU5OX0.-fRzI_259AIkq60Ck7PcgpX2SThnp8rBwVGglKxgY2U"
  );

  const authArea = document.getElementById("authArea");
  console.log("⚙️ Supabase client initialized:", client);

  async function handleOAuthRedirect() {
    console.log("🐱 handleOAuthRedirect() called");
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    console.log("🔍 URL params:", window.location.search);
    console.log("🔍 Extracted code:", code);

    if (code) {
      console.log("🎉 Found code param:", code);

      const { data, error } = await client.auth.exchangeCodeForSession(code);
      console.log("🔁 exchangeCodeForSession() response:", data, error);

      if (error) {
        console.error("❌ Error exchanging code:", error.message);
      } else {
        console.log("✅ Session established:", data.session);
        console.log("🗝️ Access token:", data.session?.access_token);
      }

      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log("🧹 Cleaned up URL");
    } else {
      console.log("⚠️ No code param found in URL");
    }
  }

  async function renderUser() {
    console.log("🎭 renderUser() called");
    const { data: { user }, error } = await client.auth.getUser();
    console.log("🧾 getUser() response:", user, error);

    if (user) {
      console.log("✅ Logged in user:", user);
      authArea.innerHTML = `
        <li><span style="color:white">${user.email}</span><a href="#" id="logoutBtn">🚪 Logout</a></li>
      `;
      document.getElementById("logoutBtn").onclick = async (e) => {
        e.preventDefault();
        console.log("🚪 Logging out...");
        await client.auth.signOut();
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

  client.auth.onAuthStateChange(async (_event, session) => {
    console.log("⚡ Auth state changed:", _event, session);
    console.log("📦 Local storage:", localStorage);
    await renderUser();
  });

  // Run on page load
  console.log("🏃 Running handleOAuthRedirect() then renderUser()...");
  handleOAuthRedirect().then(renderUser);
