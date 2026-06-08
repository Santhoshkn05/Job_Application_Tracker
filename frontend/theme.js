const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

const themeButtons = Array.from(document.querySelectorAll("#themeBtn, #mobileThemeBtn"));

themeButtons.forEach((button) => {
    if (!button) return;

    button.addEventListener("click", (event) => {
        event.preventDefault();
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }
    });
});
