document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("usersTableBody");
  try {
    const data = await MultaqaAPI.apiFetch("/users");
    const users = Array.isArray(data) ? data : data?.users || [];
    if (!users.length) throw new Error("empty");
    tbody.innerHTML = users.map((user) => `<tr>
      <td><strong>${MultaqaAPI.escapeHTML(user.full_name)}</strong><br><span style="color:var(--gray-500);font-size:.75rem">${MultaqaAPI.escapeHTML(user.email)}</span></td>
      <td>${MultaqaAPI.escapeHTML(user.city || '—')}</td>
      <td>${MultaqaAPI.escapeHTML(user.phone || '—')}</td>
      <td><span class="status-badge ${user.role === 'Admin' ? 'pending' : 'active'}">${MultaqaAPI.escapeHTML(user.role || 'User')}</span></td>
    </tr>`).join("");
  } catch (_) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">تحتاج الصفحة endpoint: <code>GET /users</code> لجلب المستخدمين للإدارة.</div></td></tr>`;
  }
});
