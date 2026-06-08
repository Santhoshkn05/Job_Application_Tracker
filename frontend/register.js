const registerForm = document.querySelector(".register-form");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
    }

    const user = {
        name,
        email,
        password
    };

    try {
        const response = await fetch(
            "http://localhost:3000/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(user)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }
        
        alert("Registration Successful");
        window.location.replace("login.html");

    } catch (error) {
        console.error(error);
        alert("Server Error");
    }
});