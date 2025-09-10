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
let currentPage = 1;
const modsPerPage = 10;
let allMods = []; // Declared earlier for clarity and consistency
let voteData = {}; // Stores total vote counts for each mod
let votedMods = {}; // Initialize as an empty object. This will be populated from Supabase.

console.log("Referrer:", document.referrer);
const themeToggle = document.getElementById("themeToggle");

// Apply saved theme on load (Keep localStorage for theme, as it's a client-side preference)
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
}

// Toggle and save preference (Keep localStorage for theme)
themeToggle.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
});

document.getElementById("sortVotes").addEventListener("click", () => {
    const sorted = [...allMods].sort((a,b) =>
        (voteData[b["Addon ID"]] || 0) - (voteData[a["Addon ID"]] || 0)
    );
    currentPage = 1; // Reset to first page on sort
    renderMods(sorted);
});

document.getElementById("categoryFilter").addEventListener("change", e => {
    const cat = e.target.value.toLowerCase();
    const filtered = allMods.filter(mod =>
        cat === "" || (mod["Category (what type of mod is this?)"] || "").toLowerCase() === cat
    );
    currentPage = 1; // Reset to first page on filter
    renderMods(filtered);
});

async function getUserSession() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) return null;
    return session.user;
}

function renderPagination(totalMods) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalMods / modsPerPage);
    const maxVisiblePages = 5;
    const pageBuffer = Math.floor(maxVisiblePages / 2);

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "←";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        currentPage--;
        renderMods(allMods);
    };
    paginationContainer.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - pageBuffer);
    let endPage = Math.min(totalPages, currentPage + pageBuffer);

    if (currentPage <= pageBuffer) {
        endPage = Math.min(totalPages, maxVisiblePages);
    }

    if (currentPage + pageBuffer >= totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationContainer.appendChild(createPageButton(1));
        if (startPage > 2) {
            paginationContainer.appendChild(createEllipsis());
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createPageButton(i));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationContainer.appendChild(createEllipsis());
        }
        paginationContainer.appendChild(createPageButton(totalPages));
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "→";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        currentPage++;
        renderMods(allMods);
    };
    paginationContainer.appendChild(nextBtn);
}

function createPageButton(pageNum) {
    const btn = document.createElement("button");
    btn.textContent = pageNum;
    btn.className = "page-btn";
    if (pageNum === currentPage) {
        btn.classList.add("active");
    }
    btn.onclick = () => {
        currentPage = pageNum;
        renderMods(allMods);
    };
    return btn;
}

function createEllipsis() {
    const span = document.createElement("span");
    span.textContent = "…";
    span.style.margin = "0 6px";
    span.style.color = "#888";
    return span;
}

function createTextElement(tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
}

// **IMPROVEMENT**: AI Summary Cache
const aiSummaryCache = {}; // Global cache for AI summaries

function renderMods(mods) {
    const container = document.getElementById("mods-list");
    container.innerHTML = "";

    if (mods.length === 0) {
        container.appendChild(createTextElement("p", "No mods found."));
        renderPagination(0); // Also update pagination for 0 mods
        return;
    }

    const start = (currentPage - 1) * modsPerPage;
    const end = start + modsPerPage;
    const modsToShow = mods.slice(start, end);

    modsToShow.forEach(mod => {
        const modId = mod["Addon ID"];

        const card = document.createElement("div");
        card.addEventListener("click", (e) => {
            const isInteractive = e.target.closest("button") || e.target.closest("img.vote-icon");
            if (isInteractive) return;
            window.location.href = `https://bloxdworld.pages.dev/fullview?addonId=${modId}`;
        });

        card.className = "mod-card";

        const title = createTextElement("h3", mod["Addon Name"] || "Unnamed Mod");
        const category = createTextElement("p", `Category: ${mod["Category (what type of mod is this?)"] || "Uncategorized"}`);

        const details = document.createElement("div");
        details.className = "mod-details";
        const description = createTextElement("p", mod["About Addon / Description"] || "No description provided.");
        const formattedTimestamp = mod["Timestamp"];
        if (formattedTimestamp) {
            const dateElem = createTextElement("p", `Uploaded: ${formattedTimestamp}`);
            details.appendChild(dateElem);
        }

        const author = createTextElement("p", `Made by: ${mod["Author Name (leave blank for your username to be displayed anonymous)"] || "Anonymous"}`);
        author.style.color = "cyan";
        details.appendChild(description);
        description.className = "mod-description";
        details.appendChild(author);

        // 🧠 AI summary element
        const aiSummary = createTextElement("p", "");
        aiSummary.style.display = "none";
        aiSummary.style.fontStyle = "italic";
        aiSummary.style.color = "#00aaaa";
        aiSummary.style.marginTop = "8px";
        aiSummary.className = "ai-summary";
        details.appendChild(aiSummary);

        // Show/hide AI summary on hover
        card.addEventListener("mouseenter", () => {
            aiSummary.style.display = "block"; // override inline display:none
            aiSummary.classList.add("show");

            if (!aiSummaryCache[modId]) { // Check global cache
                aiSummary.textContent = "🧠 Loading AI summary...";

                fetch("https://tooltip-ai-proxy.ekaanshagarwal19564.workers.dev/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        label: `Mod Name: ${mod["Addon Name"] || "Unnamed"}, Description: ${mod["About Addon / Description"] || "None"}, Code: ${mod["Addon Code"] || "N/A"}, Author: ${mod["Author Name (leave blank for your username to be displayed anonymous)"] || "Anonymous"}`
                    })
                })
                .then(res => res.json())
                .then(data => {
                    const content = data.choices?.[0]?.message?.content || "No summary available.";
                    aiSummary.textContent = `🧠 ${content}`;
                    aiSummaryCache[modId] = `🧠 ${content}`; // Store in cache
                })
                .catch(err => {
                    console.error("❌ Failed to fetch AI summary:", err);
                    aiSummary.textContent = "⚠️ AI summary unavailable.";
                    aiSummaryCache[modId] = "⚠️ AI summary unavailable."; // Cache error too
                });
            } else {
                aiSummary.textContent = aiSummaryCache[modId]; // Use from cache
            }
        });

        card.addEventListener("mouseleave", () => {
            aiSummary.style.display = "none";
            aiSummary.classList.remove("show");
        });

        if (mod["Image (upload image to imgur, put the link here.)"]) {
            const img = document.createElement("img");
            img.src = mod["Image (upload image to imgur, put the link here.)"];
            img.alt = "Mod Image";
            details.appendChild(img);
        }

        if (mod["Addon Code"]) {
            const codeBlock = document.createElement("pre");
            codeBlock.textContent = mod["Addon Code"];
            details.appendChild(codeBlock);
        }

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "📋";
        copyBtn.className = "vote-btn";
        copyBtn.style.background = "none";
        copyBtn.style.border = "none";
        copyBtn.style.width="30px";
        copyBtn.style.height="30px";
        copyBtn.style.fontSize="30px";
        copyBtn.style.marginLeft = "10px";

        copyBtn.addEventListener("click", () => {
            const shareURL = `https://bloxdworld.pages.dev/fullview?addonId=${modId}`;
            navigator.clipboard.writeText(shareURL)
                .then(() => {
                    copyBtn.textContent = "✅";
                    setTimeout(() => {
                        copyBtn.textContent = "📋";
                    }, 1500);
                })
                .catch(err => {
                    console.error("❌ Failed to copy:", err);
                    copyBtn.textContent = "⚠️ Failed";
                });
        });

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "Show More";
        toggleBtn.className = "vote-btn";
        toggleBtn.addEventListener("click", () => {
            const isVisible = details.style.display === "block";
            details.style.display = isVisible ? "none" : "block";
            toggleBtn.textContent = isVisible ? "Show More" : "Show Less";
        });

        const voteContainer = document.createElement("div");
        voteContainer.style.marginTop = "10px";

        const upvoteBtn = document.createElement("img");
        upvoteBtn.src = "https://bloxdworld.pages.dev/pixil-frame-0%20(12).png";
        upvoteBtn.alt = "Upvote";
        upvoteBtn.style.width = "32px";
        upvoteBtn.style.cursor = "pointer";
        upvoteBtn.style.marginRight = "10px";
        upvoteBtn.classList.add("vote-icon");

        const voteCount = document.createElement("span");
        let currentVotes = voteData[modId] ? parseInt(voteData[modId]) : 0;
        voteCount.textContent = `${currentVotes}`;

        // IMPORTANT: Rely directly on votedMods from DB fetch
        if (votedMods[modId]) {
            upvoteBtn.src = "https://bloxdworld.pages.dev/pixilart-drawing.png";
            upvoteBtn.alt = "Voted";
            upvoteBtn.style.opacity = "0.7";
            upvoteBtn.title = "Click to remove vote";
        } else {
            upvoteBtn.title = "Click to upvote";
        }

        
        upvoteBtn.addEventListener("click", async () => {
            console.log(`DEBUG [Vote Click]: Click detected for mod ID: ${modId}.`);
            console.log(`DEBUG [Vote Click]: Initial currentVotes: ${currentVotes}, hasVoted locally (from DB-populated votedMods): ${!!votedMods[modId]}`);

            const user = await getUserSession();
            if (!user) {
                alert("🔒 You must be logged in to vote.");
                console.log("DEBUG [Vote Click]: User not logged in, vote aborted.");
                return;
            }
            console.log(`DEBUG [Vote Click]: User ID: ${user.id} is logged in.`);

            // Re-check hasVoted directly from the global votedMods (which is refreshed from DB)
            const hasVoted = votedMods[modId]; 

            if (hasVoted) {
                console.log("DEBUG [Vote Click]: User has previously voted. Attempting to remove vote from Supabase...");
                const { error } = await client
                    .from("votes")
                    .delete()
                    .eq("addon_id", modId)
                    .eq("user_id", user.id);

                if (error) {
                    console.error("ERROR [Vote Click]: Supabase error removing vote:", error);
                    alert("Failed to remove vote. Please try again.");
                    // Do NOT update local state if Supabase operation failed
                    return;
                }
                console.log("DEBUG [Vote Click]: Vote successfully removed from Supabase.");

                // Update local state and UI (no localStorage.setItem here)
                currentVotes--;
                voteData[modId] = currentVotes;
                voteCount.textContent = `${currentVotes}`;
                delete votedMods[modId]; // Remove from our in-memory object
                console.log(`DEBUG [Vote Click]: Local state updated: currentVotes=${currentVotes}, votedMods=${JSON.stringify(votedMods)}`);

                upvoteBtn.src = "https://bloxdworld.pages.dev/pixil-frame-0%20(12).png";
                upvoteBtn.alt = "Upvote";
                upvoteBtn.style.opacity = "1";
                upvoteBtn.title = "Click to upvote";
                console.log("DEBUG [Vote Click]: UI updated to 'upvote' state.");

            } else {
                console.log("DEBUG [Vote Click]: User has NOT previously voted. Attempting to add vote to Supabase...");
                const { error } = await client.from("votes").insert({
                    addon_id: modId,
                    user_id: user.id
                });

                if (error) {
                    if (error.code === "23505") { // Duplicate key error (already voted)
                        console.warn("WARN [Vote Click]: Supabase returned duplicate key error (user already voted).");
                        alert("⚠️ You’ve already voted for this mod.");
                    } else {
                        console.error("ERROR [Vote Click]: Supabase error submitting vote:", error);
                        alert("Vote failed. Please try again.");
                    }
                    return;
                }
                console.log("DEBUG [Vote Click]: Vote successfully added to Supabase.");

                // Update local state and UI (no localStorage.setItem here)
                currentVotes++;
                voteData[modId] = currentVotes;
                voteCount.textContent = `${currentVotes}`;
                votedMods[modId] = true; // Add to our in-memory object
                console.log(`DEBUG [Vote Click]: Local state updated: currentVotes=${currentVotes}, votedMods=${JSON.stringify(votedMods)}`);

                upvoteBtn.src = "https://bloxdworld.pages.dev/pixilart-drawing.png";
                upvoteBtn.alt = "Voted";
                upvoteBtn.style.opacity = "0.7";
                upvoteBtn.title = "Click to remove vote";
                console.log("DEBUG [Vote Click]: UI updated to 'voted' state.");
            }
            // After any vote action (insert/delete), re-render the mods to ensure all counts and button states are fresh
            // This is especially important if you sort by votes, as the count has changed.
            // However, a full re-render of all mods might be overkill, consider just updating the specific mod's display if performance is an issue.
            // For now, this is simpler and effective.
            renderMods(allMods); 
        });

        voteContainer.appendChild(upvoteBtn);
        voteContainer.appendChild(voteCount);
        voteContainer.appendChild(copyBtn);

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "mod-content";

        contentWrapper.appendChild(title);
        contentWrapper.appendChild(category);
        contentWrapper.appendChild(details);
        contentWrapper.appendChild(voteContainer);

        let icon = document.createElement("img");

        if (mod["Mod Icon (samething as Image uploading, but this will be displayed.)"]) {
            icon.src = mod["Mod Icon (samething as Image uploading, but this will be displayed.)"];
        } else {
            icon.src = "https://bloxdworld.pages.dev/assets/pixil-frame-0%20(14).png";
        }

        icon.alt = "Mod Icon";
        icon.className = "mod-icon";

        card.appendChild(icon);
        card.appendChild(contentWrapper);
        container.appendChild(card);
    });
    renderPagination(mods.length);
}

document.addEventListener('DOMContentLoaded', async () => {

    try {
        console.log("DEBUG [DOMContentLoaded]: Starting mod data fetch...");
        const response = await fetch("https://opensheet.vercel.app/1DR9qcrbVIV1uirY5MHHRPSQhuf5n8Cd2zuBb77uEZWg/Form%20Responses%201");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const mods = await response.json();
        if (!Array.isArray(mods)) {
            throw new Error("Mods data is not an array");
        }
        allMods = mods.filter(mod => (mod["Approved"] || "").toLowerCase() === "true");
        console.log(`DEBUG [DOMContentLoaded]: Fetched ${allMods.length} approved mods.`);
    } catch (err) {
        const container = document.getElementById("mods-list");
        container.appendChild(createTextElement("p", "⚠️ Failed to load mods. Check console for details."));
        console.error("ERROR [DOMContentLoaded]: Error loading mods:", err);
        return;
    }

    const currentUser = await getUserSession();
    console.log("DEBUG [DOMContentLoaded]: Current logged-in user:", currentUser ? currentUser.id : "None");

    try {
        console.log("DEBUG [DOMContentLoaded]: Starting vote data fetch from Supabase...");
        
        const { data: allVotesData, error: allVotesError } = await client
            .from("votes")
            .select("addon_id, user_id");

        if (allVotesError) {
            console.error("ERROR [DOMContentLoaded]: Supabase error fetching all votes:", allVotesError.message, "Code:", allVotesError.code);
            console.error("ERROR [DOMContentLoaded]: >> CHECK YOUR SUPABASE RLS POLICIES FOR 'SELECT' ON THE 'VOTES' TABLE! <<");
            throw allVotesError;
        }

        console.log("DEBUG [DOMContentLoaded]: Raw vote data from Supabase:", allVotesData);
        
        console.log("DEBUG [DOMContentLoaded]: Total vote records fetched from Supabase:", allVotesData ? allVotesData.length : 0);

        voteData = {}; 
        // Reset votedMods completely, as we're rebuilding it from the database
        votedMods = {}; // No need for Object.keys(votedMods).forEach(key => delete votedMods[key]); if initialized empty


        if (Array.isArray(allVotesData)) {
            if (allVotesData.length === 0) {
                console.log("DEBUG [DOMContentLoaded]: Supabase returned an EMPTY array for votes. This means no votes exist in the DB or RLS is blocking access.");
            }
            allVotesData.forEach(voteRecord => {
                if (voteRecord.addon_id) {
                    
                    voteData[voteRecord.addon_id] = (voteData[voteRecord.addon_id] || 0) + 1;

                    
                    if (currentUser && voteRecord.user_id === currentUser.id) {
                        votedMods[voteRecord.addon_id] = true;
                    }
                } else {
                    console.warn("WARN [DOMContentLoaded]: Vote record found without 'addon_id':", voteRecord);
                }
            });
            console.log("DEBUG [DOMContentLoaded]: Aggregated voteData object (total counts):", voteData);
            console.log(`DEBUG [DOMContentLoaded]: Total unique mods with votes: ${Object.keys(voteData).length}`);
            
            if (currentUser) {
                console.log(`DEBUG [DOMContentLoaded]: User ${currentUser.id} has voted for (votedMods):`, votedMods);
                // REMOVED: localStorage.setItem("votedMods", JSON.stringify(votedMods));
            } else {
                console.log("DEBUG [DOMContentLoaded]: No user logged in, 'votedMods' remains empty."); // Updated log
            }

        } else {
            console.warn("WARN [DOMContentLoaded]: Supabase votes data is NOT an array. This is unexpected:", allVotesData);
        }

        
        console.log("DEBUG [DOMContentLoaded]: Rendering mods with fetched data.");
        renderMods(allMods);

    } catch (err) {
        console.error("ERROR [DOMContentLoaded]: Overall error in initial vote fetch or processing:", err);
        renderMods(allMods);
        const container = document.getElementById("mods-list");
        container.appendChild(createTextElement("p", `⚠️ Failed to load vote counts: ${err.message || err}. Check console & Supabase RLS.`));
    }

    
    document.getElementById("search").addEventListener("input", e => {
        const query = e.target.value.toLowerCase();
        const filtered = allMods.filter(mod =>
            (mod["Addon Name"] || "").toLowerCase().includes(query) ||
            (mod["About Addon / Description"] || "").toLowerCase().includes(query) ||
            (mod["Author Name (leave blank for your username to be displayed anonymous)"] || "").toLowerCase().includes(query)
        );
        currentPage = 1;
        renderMods(filtered);
    });

    document.getElementById("sortVotes").addEventListener("click", () => {
        const sorted = [...allMods].sort((a,b) =>
            (voteData[b["Addon ID"]] || 0) - (voteData[a["Addon ID"]] || 0)
        );
        currentPage = 1;
        renderMods(sorted);
    });

    document.getElementById("categoryFilter").addEventListener("change", e => {
        const cat = e.target.value.toLowerCase();
        const filtered = allMods.filter(mod =>
            cat === "" || (mod["Category (what type of mod is this?)"] || "").toLowerCase() === cat
        );
        currentPage = 1;
        renderMods(filtered);
    });

    if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.body.classList.add("mobile");
    }
});