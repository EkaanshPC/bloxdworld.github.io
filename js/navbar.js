if (!(/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
  for (let i = 1; i <= 6; i++) {
    const mi = document.getElementById(`mi${i}`);
    if (mi) mi.innerHTML = "";

    const btn = document.getElementById(`i${i}`);
    if (!btn) continue;

    btn.addEventListener("mouseenter", () => {
      btn.textContent =
        i === 1 ? "Home" :
        i === 2 ? "Mods" :
        i === 3 ? "Upload" :
        i === 4 ? "About" :
        i === 5 ? "Leaderboard" :
        i === 6 ? "Toggle Dark Mode" :
        "";
    });

    btn.addEventListener("mouseleave", () => {
      btn.textContent = ""; // or reset to icon if needed
    });
  }
}
