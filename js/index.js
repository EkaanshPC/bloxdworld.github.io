const themeToggle = document.getElementById("themeToggle");
    const banner = document.getElementById("bworldbanner");

    // Apply saved theme on load
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
      banner.src = "What you’d expect (1).png";
    } else {
      banner.src = "What you’d expect.png";
    }

    // Toggle and save preference
    themeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.toggle("dark-mode");

      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        banner.src = "What you’d expect (1).png";
      } else {
        localStorage.setItem("theme", "light");
        banner.src = "What you’d expect.png";
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
if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  document.body.classList.add("mobile");
}
