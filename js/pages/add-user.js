document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-user-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      await MultaqaAPI.apiFetch("/users", { method: "POST", body });
      MultaqaAPI.notify("تمت إضافة المستخدم");
      window.location.href = "dashboard-users.html";
    } catch (error) {
      MultaqaAPI.notify("تحتاج endpoint إداري: POST /users لإضافة مستخدم مع role والبيانات الإضافية.", "error");
    }
  });
});
