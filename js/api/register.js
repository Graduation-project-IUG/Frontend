document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
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
          full_name: formData.get("full_name"),
          email: formData.get("email"),
          password: formData.get("password"),
        },
      });
      MultaqaAPI.notify("تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.");
      window.location.href = "/pages/login.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر إنشاء الحساب", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
