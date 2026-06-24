document.addEventListener("DOMContentLoaded", async () => {
  await MultaqaAPI.loadCurrentUser();
  const id = MultaqaAPI.getParam("id", "1");
  const commentsEl = document.getElementById("commentsList");
  let comments = [];

  function renderPost(post) {
    document.getElementById("postTitle").textContent = post.title || "منشور";
    document.getElementById("postCategory").textContent = post.category || "غير مصنف";
    document.getElementById("postDescription").textContent = post.description || "لا يوجد وصف لهذا المنشور.";
    document.getElementById("postDate").textContent = MultaqaAPI.formatDate(post.createdAt);
  }

  function renderAverage() {
    const rated = comments.filter((comment) => Number(comment.rating) > 0);
    const avg = rated.length ? rated.reduce((sum, c) => sum + Number(c.rating || 0), 0) / rated.length : 0;
    document.getElementById("averageRating").innerHTML = `${MultaqaAPI.stars(avg)}<span style="font-size:.875rem;color:var(--gray-500);margin-right:.5rem;">${avg ? avg.toFixed(1) : 'لا يوجد تقييم بعد'} / 5</span>`;
    document.getElementById("reviewsCount").textContent = rated.length;
  }

  function renderComments() {
    renderAverage();
    if (!comments.length) {
      commentsEl.innerHTML = `<div class="empty-state"><p>لا توجد تعليقات بعد، أو أن endpoint التعليقات غير متوفر حالياً.</p></div>`;
      return;
    }
    commentsEl.innerHTML = comments.map((comment) => `<div class="comment-item">
      <img src="../images/avatar-saeed.jpg" alt="">
      <div class="comment-item-body">
        <div class="comment-item-header"><div><span class="name">${MultaqaAPI.escapeHTML(comment.user?.full_name || comment.author || 'مستخدم')}</span><div class="review-stars">${MultaqaAPI.stars(comment.rating)}</div></div><span class="date">${MultaqaAPI.formatDate(comment.createdAt)}</span></div>
        <p>${MultaqaAPI.escapeHTML(comment.content)}</p>
      </div>
    </div>`).join("");
  }

  try {
    let details;
    try {
      details = await MultaqaAPI.apiFetch(`/post/${id}/details`);
    } catch (_) {
      details = await MultaqaAPI.apiFetch(`/post/${id}`);
    }
    renderPost(details.post || details);
    comments = details.comments || [];
    renderComments();
  } catch (error) {
    document.getElementById("postContent").innerHTML = `<div class="empty-state"><h3>تعذر تحميل المنشور</h3><p>${MultaqaAPI.escapeHTML(error.message)}</p></div>`;
  }

  document.getElementById("commentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await MultaqaAPI.apiFetch(`/comment/${id}`, {
        method: "POST",
        body: {
          content: formData.get("content"),
          rating: Number(formData.get("rating") || 0),
        },
      });
      MultaqaAPI.notify("تم إرسال التعليق");
      form.reset();
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر إرسال التعليق", "error");
    }
  });

  document.getElementById("reactBtn")?.addEventListener("click", async () => {
    try {
      await MultaqaAPI.apiFetch(`/reaction/${id}`, { method: "POST", body: { reaction: 1 } });
      MultaqaAPI.notify("تم حفظ التفاعل");
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر حفظ التفاعل", "error");
    }
  });

  document.getElementById("reportForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reason = new FormData(event.currentTarget).get("reason");
    try {
      await MultaqaAPI.apiFetch(`/report/${id}`, { method: "POST", body: { reason } });
      MultaqaAPI.notify("تم إرسال الإبلاغ");
      event.currentTarget.reset();
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر إرسال الإبلاغ", "error");
    }
  });
});
