
document.addEventListener("DOMContentLoaded", () => {
  const form =
    document.getElementById("register-form") ||
    document.getElementById("registerForm");
  if (!form || !window.MultaqaAPI) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    try {
      submitButton.disabled = true;
      await MultaqaAPI.apiFetch("/user/register", {
        method: "POST",
        body: {
          full_name:
            formData.get("full_name") ||
            document.getElementById("registerName")?.value,
          email:
            formData.get("email") ||
            document.getElementById("registerEmail")?.value,
          password:
            formData.get("password") ||
            document.getElementById("registerPassword")?.value,
        },
      });
      MultaqaAPI.notify("تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.");
      const profile = await MultaqaAPI.apiFetch("/user/profile").catch(() => null);
      if (profile) {
        window.location.href = "/pages/feed.html";
        return;
      }
      window.location.href = "/pages/login.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر إنشاء الحساب", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
