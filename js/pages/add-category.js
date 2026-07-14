document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.MultaqaAccess?.ensurePageAccess?.())) return;

  const form = document.getElementById("add-category-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      await MultaqaAPI.apiFetch("/category", { method: "POST", body });
      MultaqaAPI.notify("تمت إضافة التصنيف");
      window.location.href = "dashboard-categories.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذرت إضافة التصنيف", "error");
    }
  });
});
