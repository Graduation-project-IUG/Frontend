document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("reportsTableBody");
  try {
    const data = await MultaqaAPI.apiFetch("/reports");
    const reports = Array.isArray(data) ? data : data?.reports || [];
    if (!reports.length) throw new Error("empty");
    tbody.innerHTML = reports.map((report) => `<tr>
      <td>${MultaqaAPI.escapeHTML(report.post?.title || `منشور #${report.postId || '—'}`)}</td>
      <td>${MultaqaAPI.escapeHTML(report.user?.full_name || report.reporter || `مستخدم #${report.userId || '—'}`)}</td>
      <td>${MultaqaAPI.escapeHTML(report.reason || '—')}</td>
      <td><a class="btn btn-secondary btn-sm" href="post.html?id=${report.postId}">فتح المنشور</a></td>
      <td><button class="btn btn-danger btn-sm" data-delete-report="${report.id}">حذف</button></td>
    </tr>`).join("");
  } catch (_) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">تحتاج الصفحة endpoint: <code>GET /reports</code> لجلب كل الإبلاغات للإدارة.</div></td></tr>`;
  }
  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-delete-report]");
    if (!btn) return;
    try {
      await MultaqaAPI.apiFetch(`/report/${btn.dataset.deleteReport}`, { method: "DELETE" });
      btn.closest("tr").remove();
      MultaqaAPI.notify("تم حذف الإبلاغ");
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر حذف الإبلاغ", "error");
    }
  });
});
