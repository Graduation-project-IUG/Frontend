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

  const CATEGORY_NAME_MAX_LENGTH = 20;
  const CATEGORY_DESCRIPTION_MAX_LENGTH = 500;
  let saving = false;
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    saving = true;

    const submitButton = form.querySelector('button[type="submit"]');
    const body = Object.fromEntries(new FormData(form).entries());
    body.name = String(body.name || "").trim();
    body.description = String(body.description || "").trim();
    try {
      if (!body.name) {
        throw new Error("اسم التصنيف مطلوب");
      }
      if (body.name.length < 3) {
        throw new Error("اسم التصنيف يجب أن يحتوي على 3 أحرف على الأقل");
      }
      if (body.name.length > CATEGORY_NAME_MAX_LENGTH) {
        throw new Error(`اسم التصنيف يجب ألا يتجاوز ${CATEGORY_NAME_MAX_LENGTH} حرفًا`);
      }
      if (body.description.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
        throw new Error(`وصف التصنيف يجب ألا يتجاوز ${CATEGORY_DESCRIPTION_MAX_LENGTH} حرفًا`);
      }
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAddCategoryPage);
} else {
  initAddCategoryPage();
}
