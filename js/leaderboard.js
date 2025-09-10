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
if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  document.body.classList.add("mobile");
}

const leaderboardContainer = document.getElementById("leaderboard-list");
const modContainer = document.getElementById("mod-of-the-day");

async function loadLeaderboard() {
  try {
    // 🔁 Fetch vote counts from Supabase
    const { data: votes, error: voteError } = await client
      .from("votes")
      .select("addon_id", { count: "exact" });

    if (voteError) throw voteError;

    // 🔁 Fetch mod metadata from Google Sheet
    const modsRes = await fetch("https://opensheet.vercel.app/1DR9qcrbVIV1uirY5MHHRPSQhuf5n8Cd2zuBb77uEZWg/Form%20Responses%201");
    const mods = await modsRes.json();

    // 🔁 Fetch Mod of the Day from Google Sheet
    const dailyRes = await fetch("https://opensheet.vercel.app/1DR9qcrbVIV1uirY5MHHRPSQhuf5n8Cd2zuBb77uEZWg/Form%20Responses%203");
    const dailyMods = await dailyRes.json();

    const approvedMods = mods.filter(mod => (mod["Approved"] || "").toLowerCase() === "true");

    // 🔍 Build a map of Addon ID → mod object
    const modMap = {};
    approvedMods.forEach(mod => {
      if (mod["Addon ID"]) {
        modMap[mod["Addon ID"]] = mod;
      }
    });

    // 🧮 Count votes per Addon ID
    const voteCountMap = {};
    votes.forEach(vote => {
      voteCountMap[vote.addon_id] = (voteCountMap[vote.addon_id] || 0) + 1;
    });

    // 🌟 Mod of the Day
    const latestDaily = dailyMods[dailyMods.length - 1];
    const modOfTheDay = latestDaily && modMap[latestDaily["Addon ID"]];

    if (modOfTheDay) {
      modContainer.innerHTML = `
        <div class="mods-header">🌟 Mod of the Day</div>
        <div class="mod-card featured">
          <h3>${modOfTheDay["Addon Name"] || "Unnamed Mod"}</h3>
          <p style="color: #888;">${voteCountMap[modOfTheDay["Addon ID"]] || 0} vote(s)</p>
        </div>
      `;
    } else {
      modContainer.innerHTML = `<p>⚠️ No Mod of the Day selected.</p>`;
    }

    // 🏆 Build leaderboard
    const sorted = Object.entries(voteCountMap)
      .map(([addonId, votes]) => ({
        addonId,
        name: modMap[addonId]?.["Addon Name"] || addonId,
        votes
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);

    leaderboardContainer.innerHTML = "";

    sorted.forEach((mod, index) => {
      const rank = index + 1;
      const emoji = rank === 1 ? "👑" : rank <= 3 ? "🔥" : "⭐";

      const entry = document.createElement("div");
      entry.className = rank === 1
        ? "winner"
        : rank <= 3
          ? "following-winners"
          : "others";

      entry.style.margin = "10px 0";
      entry.style.fontSize = "1.1rem";

      entry.innerHTML = `
        ${emoji} <strong>#${rank}</strong> — 
        <span style="font-weight: bold;">${mod.name}</span> 
        <span style="color: #888;">(${mod.votes} vote${mod.votes !== 1 ? "s" : ""})</span>
      `;

      leaderboardContainer.appendChild(entry);
    });

  } catch (err) {
    leaderboardContainer.textContent = "⚠️ Failed to load leaderboard.";
    console.error("Leaderboard error:", err);
  }
}

loadLeaderboard();
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

    const targets = document.querySelectorAll('.welcome-text, .welcome-para');

    targets.forEach(el => {
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
      });

      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--mouse-x', `50%`);
        el.style.setProperty('--mouse-y', `50%`);
      });
    });