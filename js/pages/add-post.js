document.addEventListener("DOMContentLoaded", async () => {
  await MultaqaAPI.loadCurrentUser();
  const form = document.getElementById("add-post-form");
  const categorySelect = document.getElementById("categorySelect");

  try {
    const categories = await MultaqaAPI.apiFetch("/categories");
    const list = Array.isArray(categories)
      ? categories
      : categories?.categories || [];
    if (list.length) {
      categorySelect.innerHTML =
        '<option value="">اختر التصنيف</option>' +
        list
          .map((category) => {
            const name =
              category.name || category.category || category.title || category;
            return `<option value="${MultaqaAPI.escapeHTML(name)}">${MultaqaAPI.escapeHTML(name)}</option>`;
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
      window.location.href = "/pages/my-posts.html";
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر نشر المنشور", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
