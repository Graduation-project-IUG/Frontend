document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-category-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      await MultaqaAPI.apiFetch("/category", { method: "POST", body });
      MultaqaAPI.notify("تمت إضافة التصنيف");
      window.location.href = "dashboard-categories.html";
    } catch (error) {
      MultaqaAPI.notify("تحتاج endpoint: POST /category أو POST /categories لإضافة التصنيفات.", "error");
    }
  });
});
