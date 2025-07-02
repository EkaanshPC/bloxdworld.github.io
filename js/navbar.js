if (!/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  for (let i = 1; i <= 6; i++) {
    const label = document.getElementById(`mi${i}`);
    if (label) label.textContent = ""; // Clear label on desktop

    const link = document.getElementById(`i${i}`);
    if (!link) continue;

    // Hover to show label
    link.addEventListener("mouseenter", () => {
      label.textContent =
        i === 1 ? "Theme" :
        i === 2 ? "Leaderboard" :
        i === 3 ? "About" :
        i === 4 ? "Upload" :
        i === 5 ? "Mods" :
        i === 6 ? "Home" :
        "";
    });

    // Unhover to hide label
    link.addEventListener("mouseleave", () => {
      label.textContent = "";
    });
  }
