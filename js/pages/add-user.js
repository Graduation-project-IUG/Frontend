document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.MultaqaAccess?.ensurePageAccess?.())) return;

  const form = document.getElementById("add-user-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const body = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      status: formData.get("status"),
      birthdate: formData.get("birthdate"),
      bio: String(formData.get("bio") || ""),
    };

    const phone = String(formData.get("phone") || "").trim();
    const city = String(formData.get("city") || "").trim();
    if (phone) body.phone = phone;
    if (city) body.city = city;

    try {
      submitButton.disabled = true;
      await MultaqaAPI.apiFetch("/user", { method: "POST", body });
      MultaqaAPI.notify("تمت إضافة المستخدم");
      window.location.href = "dashboard-users.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذرت إضافة المستخدم", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
