async function initAddCategoryPage() {
  if (initAddCategoryPage.started) return;
  initAddCategoryPage.started = true;

  if (
    window.MultaqaAccess?.ensurePageAccess &&
    !(await window.MultaqaAccess.ensurePageAccess())
  ) {
    return;
  }

  const form = document.getElementById("add-category-form");
  if (!form) return;

  let saving = false;
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    saving = true;

    const submitButton = form.querySelector('button[type="submit"]');
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      if (submitButton) submitButton.disabled = true;
      await MultaqaAPI.apiFetch("/category", { method: "POST", body });
      MultaqaAPI.notify("تمت إضافة التصنيف");
      window.location.href = "dashboard-categories.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذرت إضافة التصنيف", "error");
    } finally {
      saving = false;
      if (submitButton) submitButton.disabled = false;
    }
  };

  form.addEventListener("submit", handleSubmit);
  form.querySelector('button[type="submit"]')?.addEventListener("click", (event) => {
    event.preventDefault();
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAddCategoryPage);
} else {
  initAddCategoryPage();
}
