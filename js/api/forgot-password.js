document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgot-password-form");
  if (!form || !window.MultaqaAPI) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    try {
      submitButton.disabled = true;
      await MultaqaAPI.apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email: formData.get("email") },
      });
      MultaqaAPI.notify("تم إرسال تعليمات استعادة كلمة المرور إن كان البريد مسجلاً.");
    } catch (error) {
      MultaqaAPI.notify("هذه الصفحة جاهزة، لكنها تحتاج endpoint: POST /auth/forgot-password", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
