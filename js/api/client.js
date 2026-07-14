// Shared API client for the frontend only.
// The backend is expected to be mounted behind /api in production (see vercel.json).
(function () {
  const API_BASE = window.API_BASE || "/api";
  const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  function cleanPath(path) {
    if (!path) return "";
    return path.startsWith("/") ? path : `/${path}`;
  }

  function getErrorMessage(data, fallback) {
    const candidates = [data?.issues, data?.errors, data?.message, data?.error];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }

      if (Array.isArray(candidate) && candidate.length) {
        const messages = candidate
          .map((item) => {
            if (typeof item === "string") return item;
            if (typeof item?.message === "string") return item.message;
            if (typeof item?.msg === "string") return item.msg;
            return null;
          })
          .filter(Boolean);

        if (messages.length) {
          return messages.length === 1
            ? messages[0]
            : messages.map((message) => `• ${message}`).join("\n");
        }
      }
    }

    return fallback;
  }

  async function getCsrfToken(force = false) {
    if (!force) {
      const cached = sessionStorage.getItem("csrfToken");
      if (cached) return cached;
    }

    const response = await fetch(`${API_BASE}/csrf-token`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("تعذر تجهيز رمز الحماية CSRF");
    }

    const data = await response.json();
    sessionStorage.setItem("csrfToken", data.csrfToken);
    return data.csrfToken;
  }

  async function apiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    let body = options.body;

    if (body && !(body instanceof FormData) && typeof body !== "string") {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    headers.set("Accept", "application/json");

    if (UNSAFE_METHODS.has(method)) {
      headers.set("x-csrf-token", await getCsrfToken());
    }

    const response = await fetch(`${API_BASE}${cleanPath(path)}`, {
      method,
      credentials: "include",
      headers,
      body,
    });

    const data = await response.json().catch(() => null);

    if (
      (response.status === 401 || response.status === 403) &&
      UNSAFE_METHODS.has(method)
    ) {
      sessionStorage.removeItem("csrfToken");
    }

    if (!response.ok) {
      const message = getErrorMessage(
        data,
        `فشل الطلب (رمز ${response.status})`,
      );
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setText(selector, value, fallback = "—") {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value || fallback;
    });
  }

  function getParam(name, fallback = null) {
    return new URLSearchParams(window.location.search).get(name) || fallback;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(date);
  }

  function stars(rating = 0) {
    const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return Array.from(
      { length: 5 },
      (_, i) =>
        `<svg class="${i < value ? "star-filled" : "star-empty"}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    ).join("");
  }

  function notify(message, type = "success") {
    if (typeof window.showNotification === "function") {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  }

  async function loadCurrentUser() {
    try {
      const user = await apiFetch("/user/profile");
      const name = user.full_name || "المستخدم";
      setText("[data-current-user-name]", name, "المستخدم");
      setText("[data-current-user-email]", user.email, "");
      setText("[data-current-user-city]", user.city, "—");
      return user;
    } catch (error) {
      return null;
    }
  }

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.removeItem("csrfToken");
      window.location.href = "/pages/login.html";
    }
  }

  document.addEventListener("click", (event) => {
    const logoutEl = event.target.closest("[data-logout]");
    if (logoutEl) {
      event.preventDefault();
      logout();
    }
  });

  window.MultaqaAPI = {
    API_BASE,
    apiFetch,
    getCsrfToken,
    escapeHTML,
    setText,
    getParam,
    formatDate,
    stars,
    notify,
    loadCurrentUser,
    logout,
  };
})();
