
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form") || document.getElementById("loginForm");
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
          email: formData.get("email") || document.getElementById("loginEmail")?.value,
          password:
            formData.get("password") ||
            document.getElementById("loginPassword")?.value,
          rememberMe:
            formData.get("rememberMe") === "on" ||
            document.getElementById("rememberme")?.checked === true,
        },
      });

      if (data?.csrfToken) {
        sessionStorage.setItem(`csrfToken:${MultaqaAPI.API_BASE}`, data.csrfToken);
      }
      window.location.href = "/pages/feed.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر تسجيل الدخول", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
