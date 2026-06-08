const forgotPasswordForm = document.querySelector(".forgot-password-form");

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;

    try {
        const response = await fetch(
            "http://localhost:3000/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to send reset link");
            return;
        }

        alert(data.message || "Password reset link sent to your email");
        window.location.replace("login.html");

    } catch (error) {
        console.error("Error sending reset link:", error);
        alert("Server Error");
    }
});
