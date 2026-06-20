const loginForm = document.getElementById("login-form");

// test2
async function getCsrfToken() {
	const response = await fetch("/api/csrf-token", {
		method: "GET",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Failed to get CSRF token");
	}

	const data = await response.json();

	return data.csrfToken;
}

loginForm.addEventListener("submit", async function (event) {
	event.preventDefault();

	const form = event.currentTarget;
	const submitButton = form.querySelector('button[type="submit"]');

	const formData = new FormData(form);

	const email = formData.get("email");
	const password = formData.get("password");

	try {
		submitButton.disabled = true;

		const csrfToken = await getCsrfToken();

		const response = await fetch("/api/auth/login", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				"x-csrf-token": csrfToken,
			},
			body: JSON.stringify({
				email,
				password,
			}),
		});

		const data = await response.json().catch(() => null);

		if (!response.ok) {
			throw new Error(data?.message || "Login failed");
		}

		console.log("Login success:", data);

		// Redirect after successful login

		window.location.href = "/pages/dashboard.html";
		      
	} catch (error) {
		console.error("Login error:", error);
		alert(error.message);
	} finally {
		submitButton.disabled = false;
	}
});
