document.addEventListener("DOMContentLoaded", async () => {
  if (
    window.MultaqaAccess?.ensurePageAccess &&
    !(await window.MultaqaAccess.ensurePageAccess())
  ) {
    return;
  }
  await MultaqaAPI.loadCurrentUser();
  const form = document.getElementById("add-post-form");
  const categorySelect = document.getElementById("categorySelect");

  try {
    const categories = await MultaqaAPI.apiFetch("/categories");
    const list = Array.isArray(categories)
      ? categories
      : Array.isArray(categories?.categories)
        ? categories.categories
        : Array.isArray(categories?.data)
          ? categories.data
          : Array.isArray(categories?.data?.categories)
            ? categories.data.categories
            : [];
    if (list.length) {
      categorySelect.innerHTML =
        '<option value="">اختر التصنيف</option>' +
        list
        .map((category) => {
          const name =
            category.name || category.category || category.title || category;
          const value =
            category.id ?? category.category_id ?? category._id ?? name;
          return `<option value="${MultaqaAPI.escapeHTML(value)}">${MultaqaAPI.escapeHTML(name)}</option>`;
        })
          .join("");
    }
  } catch (_) {
    // Keep static fallback categories until /categories exists.
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    try {
      submitButton.disabled = true;
      await MultaqaAPI.apiFetch("/post", {
        method: "POST",
        body: {
          title: formData.get("title"),
          category: formData.get("category"),
          description: formData.get("description") || undefined,
        },
      });
      MultaqaAPI.notify("تم نشر المنشور بنجاح");
      window.location.href = "/pages/feed.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر نشر المنشور", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
