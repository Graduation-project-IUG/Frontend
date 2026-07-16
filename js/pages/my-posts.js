
document.addEventListener("DOMContentLoaded", async () => {
  await MultaqaAPI.loadCurrentUser();
  const listEl =
    document.getElementById("myPostsList") || document.getElementById("postsList");
  const counterEl = document.getElementById("myPostsCounter");
  const searchInput = document.getElementById("postsSearch");
  let posts = [];
  if (!listEl) return;

  function render(items) {
    if (counterEl) counterEl.textContent = items.length;
    if (!items.length) {
      listEl.innerHTML = `<div class="empty-state"><h3>لا توجد منشورات بعد</h3><p>عندما تضيف منشوراً جديداً سيظهر هنا مباشرة.</p><a class="btn btn-primary" href="add-post.html">إضافة منشور</a></div>`;
      return;
    }

    listEl.innerHTML = items.map((post) => {
      const id = post.id;
      return `<article class="post-card">
        <div class="post-card-body">
          <div class="post-card-header">
            <div class="post-badges"><span class="badge badge-blue">${MultaqaAPI.escapeHTML(post.category || 'غير مصنف')}</span></div>
            <div class="post-actions">
              <a class="btn btn-secondary btn-sm" href="edit-post.html?id=${id}">تعديل</a>
              <button class="btn btn-danger btn-sm" data-delete-post="${id}">حذف</button>
            </div>
          </div>
          <a href="post.html?id=${id}" style="display:block;margin-bottom:.5rem"><h3 style="font-size:1.125rem;font-weight:700;color:var(--gray-900);">${MultaqaAPI.escapeHTML(post.title)}</h3></a>
          <p class="review-card-desc">${MultaqaAPI.escapeHTML(post.description || 'لا يوجد وصف لهذا المنشور.')}</p>
          <div class="review-card-meta"><span>${MultaqaAPI.formatDate(post.createdAt)}</span></div>
        </div>
      </article>`;
    }).join("");
  }

  try {
    const data = await MultaqaAPI.apiFetch("/user/posts");
    posts = Array.isArray(data) ? data : data?.posts || [];
    render(posts);
  } catch (error) {
    listEl.innerHTML = `<div class="empty-state"><h3>تعذر تحميل المنشورات</h3><p>${MultaqaAPI.escapeHTML(error.message || "يرجى تسجيل الدخول ثم المحاولة مرة أخرى.")}</p></div>`;
  }

  searchInput?.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    render(posts.filter((post) => `${post.title || ''} ${post.description || ''} ${post.category || ''}`.toLowerCase().includes(q)));
  });

  listEl?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-post]");
    if (!button) return;
    if (!confirm("هل تريد حذف هذا المنشور؟")) return;
    try {
      await MultaqaAPI.apiFetch(`/post/${button.dataset.deletePost}`, { method: "DELETE" });
      posts = posts.filter((post) => String(post.id) !== button.dataset.deletePost);
      render(posts);
      MultaqaAPI.notify("تم حذف المنشور");
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر حذف المنشور", "error");
    }
  });
});
