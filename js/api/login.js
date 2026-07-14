
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form || !window.MultaqaAPI) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    try {
      submitButton.disabled = true;
      const data = await MultaqaAPI.apiFetch("/auth/login", {
        method: "POST",
        body: {
          email: formData.get("email"),
          password: formData.get("password"),
          rememberMe: formData.get("rememberMe") === "on",
        },
      });

      if (data?.csrfToken) sessionStorage.setItem("csrfToken", data.csrfToken);
      window.location.href = "/pages/dashboard.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر تسجيل الدخول", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});

