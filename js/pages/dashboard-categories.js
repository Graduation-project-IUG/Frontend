document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("categoriesTableBody");
  let categories = [];
  function render() {
    if (!categories.length) {
      tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">تحتاج الصفحة endpoint: <code>GET /categories</code> لجلب التصنيفات.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = categories.map((category) => {
      const id = category.id ?? category.name ?? category.category;
      const name = category.name || category.category || category.title || category;
      return `<tr><td><strong>${MultaqaAPI.escapeHTML(name)}</strong></td><td>${category.postsCount ?? category.postCount ?? '—'}</td><td><button class="btn btn-danger btn-sm" data-delete-category="${MultaqaAPI.escapeHTML(id)}">حذف</button></td></tr>`;
    }).join("");
  }
  try {
    const data = await MultaqaAPI.apiFetch("/categories");
    categories = Array.isArray(data) ? data : data?.categories || [];
  } catch (_) {}
  render();
  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-delete-category]");
    if (!btn) return;
    if (!confirm("هل تريد حذف التصنيف؟")) return;
    try {
      await MultaqaAPI.apiFetch(`/category/${btn.dataset.deleteCategory}`, { method: "DELETE" });
      categories = categories.filter((category) => String(category.id ?? category.name ?? category.category) !== btn.dataset.deleteCategory);
      render();
      MultaqaAPI.notify("تم حذف التصنيف");
    } catch (error) {
      MultaqaAPI.notify("تحتاج endpoint: DELETE /category/:id لحذف التصنيف", "error");
    }
  });
});
