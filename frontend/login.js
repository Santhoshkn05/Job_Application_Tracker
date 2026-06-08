const loginForm = document.querySelector(".login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(
            "http://localhost:3000/login",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        localStorage.setItem("userId", data.user.id);

        alert("Login Successful");
        window.location.replace("index.html");

    } catch (error) {
        console.error(error);
        alert("Server Error");
    }
});