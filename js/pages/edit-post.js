document.addEventListener("DOMContentLoaded", async () => {
  if (
    window.MultaqaAccess?.ensurePageAccess &&
    !(await window.MultaqaAccess.ensurePageAccess())
  ) {
    return;
  }
  const id = MultaqaAPI.getParam("id");
  const form = document.getElementById("edit-post-form");
  const categorySelect = document.getElementById("editPostCategory");
  if (!id) {
    document.getElementById("editPostStatus").innerHTML =
      "<div class='empty-state'>لم يتم تحديد رقم المنشور.</div>";
    form.style.display = "none";
    return;
  }

  try {
    const [post, categoriesData] = await Promise.all([
      MultaqaAPI.apiFetch(`/post/${id}`),
      MultaqaAPI.apiFetch("/categories"),
    ]);
    const categories = Array.isArray(categoriesData)
      ? categoriesData
      : Array.isArray(categoriesData?.categories)
        ? categoriesData.categories
        : Array.isArray(categoriesData?.data)
          ? categoriesData.data
          : Array.isArray(categoriesData?.data?.categories)
            ? categoriesData.data.categories
            : [];
    if (!categories.length) {
      throw new Error("لا توجد تصنيفات متاحة لتعديل المنشور");
    }

    categorySelect.innerHTML =
      '<option value="">اختر التصنيف</option>' +
      categories
        .map((category) => {
          const categoryId =
            category.id ?? category._id ?? category.category_id ?? category.categoryId;
          const categoryName = category.name || category.title || "تصنيف";
          return `<option value="${MultaqaAPI.escapeHTML(categoryId)}">${MultaqaAPI.escapeHTML(categoryName)}</option>`;
        })
        .join("");

    form.title.value = post.title || "";
    form.description.value = post.description || "";

    const postCategoryId =
      post.category_id ?? post.categoryId ?? post.category?.id ?? null;
    if (postCategoryId != null) {
      categorySelect.value = String(postCategoryId);
    } else {
      const postCategoryName =
        typeof post.category === "string"
          ? post.category
          : post.category?.name || "";
      const matchingOption = Array.from(categorySelect.options).find(
        (option) => option.textContent.trim() === postCategoryName,
      );
      if (matchingOption) categorySelect.value = matchingOption.value;
    }
  } catch (error) {
    const message =
      error?.status === 403
        ? "لا يملك هذا الحساب صلاحية تحميل التصنيفات أو تعديل هذا المنشور."
        : error.message || "تعذر تحميل المنشور أو التصنيفات.";
    document.getElementById("editPostStatus").innerHTML =
      `<div class="empty-state">${MultaqaAPI.escapeHTML(message)}</div>`;
    form.style.display = "none";
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const rawCategoryId = String(formData.get("category") || "");
    const categoryId = /^\d+$/.test(rawCategoryId)
      ? Number(rawCategoryId)
      : rawCategoryId;
    try {
      submitButton.disabled = true;
      await MultaqaAPI.apiFetch(`/post/${id}`, {
        method: "PUT",
        body: {
          title: formData.get("title"),
          category: categoryId,
          description: formData.get("description") || undefined,
        },
      });
      MultaqaAPI.notify("تم تحديث المنشور");
      window.location.href = `post.html?id=${encodeURIComponent(id)}`;
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر تحديث المنشور", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
