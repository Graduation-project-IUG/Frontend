// ===== ملتقى - ملف JavaScript الرئيسي =====

// ===== API Configuration =====
const API_BASE = window.API_BASE || "/api";
const CSRF_STORAGE_KEY = `csrfToken:${API_BASE}`;

// ===== CSRF Helper =====
async function getCsrfToken() {
  let token = sessionStorage.getItem(CSRF_STORAGE_KEY);
  if (token) return token;
  try {
    const res = await fetch(`${API_BASE}/csrf-token`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.csrfToken) {
        token = data.csrfToken;
        sessionStorage.setItem(CSRF_STORAGE_KEY, token);
      }
    }
  } catch (error) {
    const csrfError = new Error("تعذر تجهيز رمز الحماية CSRF");
    csrfError.status = 0;
    throw csrfError;
  }
  if (!token) {
    const csrfError = new Error("تعذر تجهيز رمز الحماية CSRF");
    csrfError.status = 0;
    throw csrfError;
  }
  return token;
}

// ===== API Fetch Wrapper =====
async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (unsafeMethods.includes(method)) {
    const csrf = await getCsrfToken();
    headers["x-csrf-token"] = csrf;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
    });
  } catch (networkErr) {
    const error = new Error(
      "تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.",
    );
    error.status = 0;
    error.data = {};
    throw error;
  }

  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
    sessionStorage.removeItem("csrfToken");
  }

  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {}

  if (!res.ok) {
    const error = new Error(
      getApiErrorMessage(json, `فشل الطلب (رمز ${res.status})`),
    );
    error.status = res.status;
    error.data = json;
    throw error;
  }

  return json;
}

// ===== API Methods =====
const API = {
  // Auth
  login: (email, password, rememberMe) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),

  // User
  register: (full_name, email, password) =>
    apiFetch("/user/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password }),
    }),
  getProfile: () => apiFetch("/user/profile"),
  getPublicProfile: (id) => apiFetch(`/user/profile/${id}`),
  updateProfile: (data) =>
    apiFetch("/user/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Posts
  createPost: (category, title, description, extra = {}) => {
    const payload =
      typeof category === "object" && category !== null
        ? category
        : { category, title, description, ...extra };
    return apiFetch("/post", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getPost: (id) => apiFetch(`/post/${id}`),
  updatePost: (id, data) =>
    apiFetch(`/post/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePost: (id) => apiFetch(`/post/${id}`, { method: "DELETE" }),
  getMyPosts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/user/posts${q ? "?" + q : ""}`);
  },
  getPostsByUser: (id, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/posts/user/${id}${q ? "?" + q : ""}`);
  },

  // Comments
  createComment: (post_id, content, rating) =>
    apiFetch(`/comment/${post_id}`, {
      method: "POST",
      body: JSON.stringify({ content, rating }),
    }),
  getComment: (id) => apiFetch(`/comment/${id}`),
  updateComment: (id, data) =>
    apiFetch(`/comment/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteComment: (id) => apiFetch(`/comment/${id}`, { method: "DELETE" }),

  // Reactions
  saveReaction: (post_id, reaction) =>
    apiFetch(`/reaction/${post_id}`, {
      method: "POST",
      body: JSON.stringify({
        reaction: Number.isFinite(Number(reaction)) ? Number(reaction) : 1,
      }),
    }),
  getReaction: (id) => apiFetch(`/reaction/${id}`),
  updateReaction: (id, reaction) =>
    apiFetch(`/reaction/${id}`, {
      method: "PUT",
      body: JSON.stringify({ reaction }),
    }),
  deleteReaction: (id) => apiFetch(`/reaction/${id}`, { method: "DELETE" }),

  // Reports
  saveReport: (post_id, reason) =>
    apiFetch(`/report/${post_id}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getReport: (id) => apiFetch(`/report/${id}`),
  updateReport: (id, reason) =>
    apiFetch(`/report/${id}`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
  deleteReport: (id) => apiFetch(`/report/${id}`, { method: "DELETE" }),

  // Admin – Users
  getUsers: () => apiFetch("/users"),
  addUser: (data) =>
    apiFetch("/user", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id, data) =>
    apiFetch(`/user/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id) => apiFetch(`/user/${id}`, { method: "DELETE" }),

  // Public posts feed
  getPosts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/posts${q ? "?" + q : ""}`);
  },

  // Admin – Reports list
  getReports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/reports${q ? "?" + q : ""}`);
  },

  // Categories
  getCategories: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/categories${q ? "?" + q : ""}`);
  },
  createCategory: (name, description) =>
    apiFetch("/category", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  updateCategory: (id, data) =>
    apiFetch(`/category/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) => apiFetch(`/category/${id}`, { method: "DELETE" }),
};

const CATEGORY_NAME_MAX_LENGTH = 20;
const CATEGORY_DESCRIPTION_MAX_LENGTH = 500;

// ===== Auth State Helpers =====
function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}
function setStoredUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}
function clearAuth() {
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
  sessionStorage.removeItem("csrfToken");
  sessionStorage.removeItem("currentUser");
}

const REACTED_POSTS_STORAGE_PREFIX = "multaqa:reacted-posts";

function getReactedPostsStorageKey(user = getStoredUser()) {
  const accountKey = user?.email?.trim().toLowerCase();
  return accountKey
    ? `${REACTED_POSTS_STORAGE_PREFIX}:${accountKey}`
    : null;
}

function getStoredReactedPostIds(user = getStoredUser()) {
  const storageKey = getReactedPostsStorageKey(user);
  if (!storageKey) return new Set();

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return new Set(
      (Array.isArray(stored) ? stored : [])
        .map((id) => String(id))
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

function saveStoredReactedPostIds(ids, user = getStoredUser()) {
  const storageKey = getReactedPostsStorageKey(user);
  if (!storageKey) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify([...ids]));
  } catch {}
}

function getServerReactionState(post) {
  if (!post || typeof post !== "object") return null;

  for (const key of ["hasReacted", "currentUserReacted", "userReacted"]) {
    if (typeof post[key] === "boolean") return post[key];
  }

  for (const key of ["currentUserReaction", "userReaction", "myReaction"]) {
    if (Object.prototype.hasOwnProperty.call(post, key)) {
      return post[key] !== null && post[key] !== undefined && post[key] !== false;
    }
  }

  return null;
}

function hasReactedToPost(postId, post = null, user = getStoredUser()) {
  const id = String(postId || "");
  if (!id) return false;

  const reactedIds = getStoredReactedPostIds(user);
  const serverState = getServerReactionState(post);
  if (serverState === null) return reactedIds.has(id);

  if (serverState) reactedIds.add(id);
  else reactedIds.delete(id);
  saveStoredReactedPostIds(reactedIds, user);
  return serverState;
}

function rememberReactedPost(postId, user = getStoredUser()) {
  const id = String(postId || "");
  if (!id) return;

  const reactedIds = getStoredReactedPostIds(user);
  reactedIds.add(id);
  saveStoredReactedPostIds(reactedIds, user);
}

function forgetReactedPost(postId, user = getStoredUser()) {
  const id = String(postId || "");
  if (!id) return;

  const reactedIds = getStoredReactedPostIds(user);
  reactedIds.delete(id);
  saveStoredReactedPostIds(reactedIds, user);
}

function getActionRecordId(post, type) {
  if (!post || typeof post !== "object") return null;
  const isReaction = type === "reaction";
  const keys = isReaction
    ? ["reactionId", "reaction_id", "currentUserReactionId", "userReactionId"]
    : ["reportId", "report_id", "currentUserReportId", "userReportId"];
  const nestedKeys = isReaction
    ? ["currentUserReaction", "userReaction", "myReaction"]
    : ["currentUserReport", "userReport", "myReport"];

  for (const key of keys) {
    if (post[key] !== undefined && post[key] !== null) return post[key];
  }
  for (const key of nestedKeys) {
    if (post[key] && typeof post[key] === "object" && post[key].id != null) {
      return post[key].id;
    }
  }
  return null;
}

function setReactionButtonState(button, reacted) {
  if (!button) return;
  button.dataset.reacted = String(reacted);
  button.classList.toggle("active", reacted);
  button.setAttribute("aria-pressed", String(reacted));
  button.setAttribute(
    "aria-label",
    reacted ? "إزالة الإعجاب من المنشور" : "إعجاب بالمنشور",
  );

  const label = button.querySelector("[data-reaction-label]");
  if (label) label.textContent = reacted ? "إزالة الإعجاب" : "إعجاب";
}

function getServerReportState(post) {
  if (!post || typeof post !== "object") return false;
  for (const key of ["hasReported", "currentUserReported", "userReported"]) {
    if (typeof post[key] === "boolean") return post[key];
  }
  return false;
}

function setReportButtonState(button, reported) {
  if (!button) return;
  button.dataset.reported = String(reported);
  button.classList.toggle("active", reported);
  button.setAttribute("aria-pressed", String(reported));
  button.setAttribute(
    "aria-label",
    reported ? "إزالة البلاغ عن المنشور" : "الإبلاغ عن المنشور",
  );

  const label = button.querySelector("[data-report-label]");
  if (label) label.textContent = reported ? "إزالة البلاغ" : "إبلاغ";
}

function requestReportReason() {
  return new Promise((resolve) => {
    document.querySelector(".report-dialog-overlay")?.remove();
    const previouslyFocused = document.activeElement;
    let settled = false;
    const overlay = document.createElement("div");
    overlay.className = "report-dialog-overlay";
    overlay.innerHTML = `
      <section class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="reportDialogTitle">
        <div class="report-dialog-header">
          <div>
            <span>مراجعة المحتوى</span>
            <h2 id="reportDialogTitle">الإبلاغ عن المنشور</h2>
          </div>
          <button type="button" class="report-dialog-close" aria-label="إغلاق">${Icons.x}</button>
        </div>
        <form class="report-dialog-form">
          <label for="reportReasonInput">سبب البلاغ</label>
          <textarea id="reportReasonInput" rows="4" maxlength="500" placeholder="اكتب سبباً واضحاً لا يقل عن 8 أحرف" required></textarea>
          <p class="report-dialog-error" role="alert" hidden></p>
          <div class="report-dialog-actions">
            <button type="button" class="btn btn-secondary" data-report-cancel>إلغاء</button>
            <button type="submit" class="btn btn-danger">إرسال البلاغ</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(overlay);

    const textarea = overlay.querySelector("textarea");
    const errorEl = overlay.querySelector(".report-dialog-error");
    const finish = (value) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
      previouslyFocused?.focus?.();
      resolve(value);
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") finish(null);
    };

    overlay.querySelector(".report-dialog-close")?.addEventListener("click", () => finish(null));
    overlay.querySelector("[data-report-cancel]")?.addEventListener("click", () => finish(null));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(null);
    });
    overlay.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const reason = textarea.value.trim();
      if (reason.length < 8) {
        errorEl.textContent = "سبب البلاغ يجب أن يكون 8 أحرف على الأقل.";
        errorEl.hidden = false;
        textarea.focus();
        return;
      }
      finish(reason);
    });
    document.addEventListener("keydown", handleKeydown);
    textarea.focus();
  });
}

const ADMIN_ONLY_PAGES = new Set([
  "add-user.html",
  "add-category.html",
]);

const AUTH_ONLY_PAGES = new Set([
  "add-post.html",
  "add-review.html",
  "edit-post.html",
  "feed.html",
  "my-posts.html",
  "post.html",
  "user-profile.html",
  "review-detail.html",
  "profile.html",
  "settings.html",
]);

const AUTH_LANDING_PAGES = new Set([
  "login.html",
  "register.html",
  "forgot_password.html",
]);

const GUEST_ALLOWED_PAGES = new Set(["index.html", ...AUTH_LANDING_PAGES]);

function getCurrentPageName() {
  return (
    window.location.pathname.split("/").filter(Boolean).pop() || "index.html"
  );
}

function isPagesDirectory() {
  return window.location.pathname.split("/").filter(Boolean).includes("pages");
}

function pageHref(pageName) {
  if (pageName === "index.html") {
    return isPagesDirectory() ? "../index.html" : "index.html";
  }
  return isPagesDirectory() ? pageName : `pages/${pageName}`;
}

function getSafeReturnTo(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    const pageName = url.pathname.split("/").filter(Boolean).pop() || "";
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/pages/")) return null;
    if (AUTH_LANDING_PAGES.has(pageName)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function loginHrefWithReturnTo(returnTo = null) {
  const target =
    getSafeReturnTo(returnTo) ||
    getSafeReturnTo(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  const loginHref = pageHref("login.html");
  return target
    ? `${loginHref}?returnTo=${encodeURIComponent(target)}`
    : loginHref;
}

function isAdminOnlyPageName(pageName) {
  return pageName.includes("dashboard") || ADMIN_ONLY_PAGES.has(pageName);
}

function isAdminOnlyPage() {
  return isAdminOnlyPageName(getCurrentPageName());
}

function isAuthOnlyPage() {
  return AUTH_ONLY_PAGES.has(getCurrentPageName());
}

function isAuthLandingPage() {
  return AUTH_LANDING_PAGES.has(getCurrentPageName());
}

function isGuestAllowedPage() {
  return GUEST_ALLOWED_PAGES.has(getCurrentPageName());
}

function shouldCheckPageAccess() {
  return true;
}

function shouldHideDuringAccessCheck() {
  return isAdminOnlyPage() || isAuthOnlyPage() || isAuthLandingPage() || !isGuestAllowedPage();
}

function isAdminRole(role) {
  if (role && typeof role === "object") {
    role = role.name || role.role || role.value;
  }
  return String(role || "").trim().toLowerCase() === "admin";
}

function updateRoleBasedUI(user) {
  if (!user) return;
  const isAdmin = isAdminRole(user.role);
  document.querySelectorAll("a[href]").forEach((link) => {
    const pageName = new URL(link.href, window.location.href).pathname
      .split("/")
      .filter(Boolean)
      .pop();
    if (pageName && isAdminOnlyPageName(pageName)) link.hidden = !isAdmin;
  });
}

function updateGuestUI() {
  document
    .querySelectorAll(".navbar-user, .navbar-btn, [data-authenticated-only]")
    .forEach((el) => {
      el.hidden = true;
    });

  document.querySelectorAll("[data-logout], a.logout").forEach((el) => {
    el.removeAttribute("data-logout");
    el.hidden = true;
  });

  const actions = document.querySelector(".navbar-actions");
  if (actions && !actions.querySelector(".guest-auth-actions")) {
    actions.insertAdjacentHTML(
      "afterbegin",
      `<div class="guest-auth-actions" style="display:flex;align-items:center;gap:0.5rem;">
        <a class="btn btn-secondary btn-sm" href="${pageHref("login.html")}">تسجيل الدخول</a>
        <a class="btn btn-primary btn-sm" href="${pageHref("register.html")}">إنشاء حساب</a>
      </div>`,
    );
  }

  document.querySelectorAll("a[href]").forEach((link) => {
    const targetUrl = new URL(link.href, window.location.href);
    const pageName = targetUrl.pathname
      .split("/")
      .filter(Boolean)
      .pop();
    if (!pageName || GUEST_ALLOWED_PAGES.has(pageName)) return;
    if (isAdminOnlyPageName(pageName) || AUTH_ONLY_PAGES.has(pageName)) {
      link.href = loginHrefWithReturnTo(
        `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
      );
    } else {
      link.href = pageHref("index.html");
    }
  });
}

function renderAccessError() {
  document.body.innerHTML = `
    <main class="container" style="min-height:100vh;display:grid;place-items:center;padding-block:2rem;">
      <section class="card" style="max-width:520px;width:100%;text-align:center;">
        <div class="card-body">
          <h1 style="font-size:1.35rem;margin-bottom:0.5rem;">تعذر التحقق من الجلسة</h1>
          <p style="color:var(--gray-600);margin-bottom:1.25rem;">تحقق من اتصالك ثم أعد المحاولة.</p>
          <button class="btn btn-primary" type="button" onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
      </section>
    </main>`;
}

let pageAccessPromise;

async function ensurePageAccess() {
  if (!shouldCheckPageAccess()) return true;
  if (pageAccessPromise) return pageAccessPromise;

  pageAccessPromise = (async () => {
    try {
      const user = await API.getProfile();
      setStoredUser(user);
      updateNavbarUser(user);
      updateRoleBasedUI(user);

      if (!isAdminRole(user?.role)) {
        if (isAdminOnlyPage()) {
          window.location.replace(pageHref("feed.html"));
          return false;
        }
      }

      if (getCurrentPageName() === "index.html" || isAuthLandingPage()) {
        window.location.replace(pageHref("feed.html"));
        return false;
      }

      document.documentElement.classList.remove("auth-checking");
      return true;
    } catch (error) {
      document.documentElement.classList.remove("auth-checking");

      if (error?.status !== 401) {
        if (isGuestAllowedPage()) {
          updateGuestUI();
          return true;
        }
        renderAccessError();
        return false;
      }

      clearAuth();

      if (isGuestAllowedPage()) {
        updateGuestUI();
        return true;
      }

      const destination =
        isAdminOnlyPage() || isAuthOnlyPage()
          ? loginHrefWithReturnTo()
          : pageHref("index.html");
      window.location.replace(destination);
      return false;
    }
  })();

  return pageAccessPromise;
}

window.MultaqaAccess = { ensurePageAccess };

if (shouldHideDuringAccessCheck()) {
  document.documentElement.classList.add("auth-checking");
}

// ===== Button Loading State =====
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = "<span>جاري...</span>";
  } else {
    btn.disabled = false;
    btn.style.opacity = "";
    btn.innerHTML = btn._originalHtml || btn.innerHTML;
  }
}

// ===== Error Message Parser =====
function getApiErrorMessage(data, fallback = "حدث خطأ غير متوقع") {
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

function parseApiError(err) {
  return getApiErrorMessage(err?.data, err?.message || "حدث خطأ غير متوقع");
}

function toDateInputValue(value) {
  if (!value) return "";
  const text = String(value);
  const directMatch = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) return directMatch[0];

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// ===== HTML Escaping =====
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function unwrapApiArray(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [...preferredKeys, "posts", "data", "items", "results", "categories", "users"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = unwrapApiArray(value, preferredKeys);
      if (nested.length) return nested;
    }
  }

  return [];
}

function getEntityId(entity) {
  return firstDefined(entity?.id, entity?._id, entity?.post_id, entity?.postId);
}

function getCategoryName(post) {
  const category = post?.category;
  if (category && typeof category === "object") {
    return firstDefined(category.name, category.title, category.category, category.id, "غير مصنف");
  }
  return firstDefined(
    category,
    post?.category_name,
    post?.categoryName,
    post?.title ? post?.name : null,
    "غير مصنف",
  );
}

function getPostAuthor(post) {
  const author = post?.user || post?.author || post?.owner || {};
  return {
    id: firstDefined(
      author.id,
      author.userId,
      post?.userId,
      post?.user_id,
      post?.authorId,
    ),
    name: firstDefined(
      author.full_name,
      author.name,
      post?.full_name,
      post?.authorName,
      post?.user_name,
      "مستخدم",
    ),
    city: firstDefined(author.city, post?.authorCity, post?.user_city, ""),
  };
}

function getPostDate(post) {
  const value = firstDefined(post?.createdAt, post?.created_at, post?.date, post?.updatedAt);
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("ar-EG");
}

function getPostCount(post, ...keys) {
  for (const key of keys) {
    const value = post?.[key];
    if (typeof value === "number") return value;
    if (Array.isArray(value)) return value.length;
  }
  return 0;
}

function formatRelativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const elapsedMs = Date.now() - date.getTime();
  const future = elapsedMs < 0;
  const absoluteSeconds = Math.max(0, Math.abs(elapsedMs) / 1000);
  const units = [
    ["year", 365 * 24 * 60 * 60],
    ["month", 30 * 24 * 60 * 60],
    ["day", 24 * 60 * 60],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("ar", { numeric: "always" });

  for (const [unit, seconds] of units) {
    if (absoluteSeconds >= seconds) {
      const amount = Math.floor(absoluteSeconds / seconds);
      return formatter.format(future ? amount : -amount, unit);
    }
  }
  return "الآن";
}

function formatAbsoluteDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(date);
}

function renderFractionalStars(ratingValue, { compact = false } = {}) {
  const rating = Math.max(0, Math.min(5, Number(ratingValue) || 0));
  const starPath =
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  const stars = Array.from({ length: 5 }, (_, index) => {
    const fill = Math.max(0, Math.min(1, rating - index)) * 100;
    return `<span class="fractional-star${compact ? " compact" : ""}">
      <svg class="fractional-star-empty" viewBox="0 0 24 24" aria-hidden="true"><path d="${starPath}"/></svg>
      <span class="fractional-star-fill" style="width:${fill}%">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${starPath}"/></svg>
      </span>
    </span>`;
  }).join("");

  return `<span class="fractional-stars" role="img" aria-label="${rating.toFixed(1)} من 5">${stars}</span>`;
}

async function getPostFeedItem(postId) {
  const post = await API.getPost(postId);
  const postsRaw = await API.getPosts({
    page: 1,
    limit: 10,
    search: post.title,
    searchIn: "title",
  });
  return unwrapApiArray(postsRaw, ["posts"]).find(
    (post) => String(getEntityId(post)) === String(postId),
  ) || post;
}

function truncateText(text, maxLength = 220) {
  const value = String(text || "").trim();
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

// ===== Navbar User Update =====
function updateNavbarUser(user) {
  if (!user) return;
  document
    .querySelectorAll(".navbar-user-info .name, .user-dropdown-header .name")
    .forEach((el) => {
      el.textContent = user.full_name || el.textContent;
    });
  document.querySelectorAll(".user-dropdown-header .email").forEach((el) => {
    el.textContent = user.email || el.textContent;
  });
  document.querySelectorAll(".navbar-user-info .role").forEach((el) => {
    el.textContent = isAdminRole(user.role) ? "أدمن" : "مستخدم";
  });
  updateRoleBasedUI(user);
}

// ===== Login Page =====
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberPassword = document.getElementById("rememberme").checked;
    setButtonLoading(submitBtn, true);
    try {
      const data = await API.login(email, password, rememberPassword);
      if (data.csrfToken) sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken);
      const profile = await API.getProfile();
      setStoredUser(profile);
      const returnTo = getSafeReturnTo(
        new URLSearchParams(window.location.search).get("returnTo"),
      );
      window.location.href = returnTo || "feed.html";
    } catch (err) {
      showNotification(
        parseApiError(err) || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        "error",
      );
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ===== Register Page =====
function initRegisterPage() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    setButtonLoading(submitBtn, true);
    try {
      await API.register(full_name, email, password);
      const profile = await API.getProfile().catch(() => null);
      if (profile) {
        setStoredUser(profile);
        showNotification("تم إنشاء الحساب بنجاح.", "success");
        setTimeout(() => {
          window.location.href = "feed.html";
        }, 800);
        return;
      }
      showNotification(
        "تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.",
        "success",
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1800);
    } catch (err) {
      showNotification(parseApiError(err), "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ===== Profile Page =====
async function initProfilePage() {
  if (!document.getElementById("profileEmail")) return;

  try {
    const [profile, postsRaw] = await Promise.all([
      API.getProfile(),
      API.getMyPosts().catch(() => []),
    ]);
    setStoredUser(profile);
    updateNavbarUser(profile);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };
    set("profileName", profile.full_name);
    set("profileEmail", profile.email);
    set("profilePhone", profile.phone);
    set("profileBio", profile.bio);
    set("profileCity", profile.city);
    set("profileBirthdate", toDateInputValue(profile.birthdate));

    const nameH1 = document.querySelector(".profile-info h1");
    if (nameH1 && profile.full_name) nameH1.textContent = profile.full_name;

    const statCards = document.querySelectorAll(".profile-stat-card .value");
    if (statCards[0] && profile.city) statCards[0].textContent = profile.city;
    const posts = unwrapApiArray(postsRaw, ["posts"]);
    if (statCards[1]) statCards[1].textContent = posts.length;
    statCards[2]?.closest(".profile-stat-card")?.setAttribute("hidden", "");
    document.querySelector(".edit-avatar")?.setAttribute("hidden", "");

    const locationEl = document.querySelector(".profile-info .location");
    if (locationEl && profile.city) {
      const svgEl = locationEl.querySelector("svg");
      locationEl.textContent = "";
      if (svgEl) locationEl.appendChild(svgEl);
      locationEl.append(` ${profile.city}`);
    }
  } catch (err) {
    if (err.status === 401) {
      showNotification("يجب تسجيل الدخول أولاً", "error");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }
}

// ===== Add Review Page =====
function initAddReviewPage() {
  const form = document.getElementById("addReviewForm");
  if (!form) return;

  // Populate categories from API
  const categorySelect = document.getElementById("postCategory");
  if (categorySelect) {
    API.getCategories()
      .then((cats) => {
        if (!Array.isArray(cats) || cats.length === 0) return;
        const currentVal = categorySelect.value;
        categorySelect.innerHTML =
          '<option value="">اختر التصنيف</option>' +
          cats
            .map(
              (c) =>
                `<option value="${escHtml(String(c.id || ""))}">${escHtml(c.name || "")}</option>`,
            )
            .join("");
        if (currentVal) categorySelect.value = currentVal;
      })
      .catch(() => {});
  }

  const ratingInput = document.getElementById("postRating");
  const submitBtn = form.querySelector('[type="submit"]');

  // Char counter
  const descEl = document.getElementById("postDescription");
  const counterEl = document.querySelector(".char-counter");
  if (descEl && counterEl) {
    descEl.addEventListener("input", () => {
      counterEl.textContent = `${descEl.value.length} / 1500 حرف`;
    });
  }

  // Edit mode: load existing post data
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  if (editId) {
    const heading = document.querySelector("h1");
    if (heading) heading.textContent = "تعديل المراجعة";
    if (submitBtn)
      submitBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> تحديث المنشور`;
    API.getPost(editId)
      .then((post) => {
        const titleEl = document.getElementById("postTitle");
        const categoryEl = document.getElementById("postCategory");
        if (titleEl) titleEl.value = post.title || "";
        if (categoryEl) {
          // API returns category name; try to match by option text (after categories load)
          const trySet = () => {
            const match = Array.from(categoryEl.options).find(
              (o) =>
                o.text === post.category || o.value === String(post.category),
            );
            if (match) match.selected = true;
            else categoryEl.value = post.category || "";
          };
          // Delay slightly to allow async category load to finish
          setTimeout(trySet, 600);
        }
        if (descEl) descEl.value = post.description || "";
        if (counterEl && descEl)
          counterEl.textContent = `${descEl.value.length} / 1500 حرف`;
      })
      .catch(() => showNotification("تعذّر تحميل بيانات المنشور", "error"));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = document.getElementById("postCategory").value;
    const title = document.getElementById("postTitle").value.trim();
    const description = descEl ? descEl.value.trim() : "";
    const rating = Number(ratingInput?.value || 0) || undefined;
    const priceRange = document.getElementById("postPrice")?.value.trim();

    if (!category) {
      showNotification("الرجاء اختيار التصنيف", "error");
      return;
    }
    if (!title) {
      showNotification("الرجاء إدخال العنوان", "error");
      return;
    }

    setButtonLoading(submitBtn, true);
    try {
      if (editId) {
        await API.updatePost(editId, {
          category,
          title,
          description: description || undefined,
        });
        showNotification("تم تحديث المراجعة بنجاح!", "success");
      } else {
        await API.createPost({
          category,
          title,
          description: description || undefined,
          rating,
          price_range: priceRange || undefined,
        });
        showNotification("تم نشر المراجعة بنجاح!", "success");
      }
      setTimeout(() => {
        window.location.href = "my-posts.html";
      }, 1500);
    } catch (err) {
      showNotification(
        err.status === 401 ? "يجب تسجيل الدخول أولاً" : parseApiError(err),
        "error",
      );
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ===== Review Detail Page =====
async function initReviewDetailPage() {
  if (
    !document.getElementById("commentForm") &&
    !document.getElementById("likeBtn")
  )
    return;

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  const backLink = document.getElementById("postBackLink");
  backLink?.addEventListener("click", (event) => {
    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });

  // Update greeting with logged-in user's name
  const greetingEl = document.getElementById("pageGreeting");
  const cachedUser = getStoredUser();
  if (greetingEl && cachedUser && cachedUser.full_name) {
    const firstName = cachedUser.full_name.split(" ")[0];
    greetingEl.textContent = `مرحباً ${firstName}`;
  }

  const setMissingPostState = () => {
    const titleEl = document.querySelector("[data-post-title]");
    const descEl = document.querySelector("[data-post-desc]");
    const badgeEl = document.querySelector(".review-detail-badge");
    const authorEl = document.getElementById("reviewAuthorName");
    const authorCityEl = document.getElementById("reviewAuthorCity");
    const dateEl = document.getElementById("reviewAuthorDate");
    const sidebarNameEl = document.getElementById("sidebarAuthorName");
    const sidebarCityEl = document.getElementById("sidebarAuthorCity");
    const likeBtn = document.getElementById("likeBtn");
    const reportBtn = document.getElementById("reportBtn");
    const commentForm = document.getElementById("commentForm");

    if (titleEl) titleEl.textContent = "اختر منشوراً لعرض التفاصيل";
    if (descEl) {
      descEl.textContent =
        "لا يمكن عرض تفاصيل هذا المنشور لأن الرابط لا يحتوي على معرف منشور صالح.";
    }
    if (badgeEl) badgeEl.textContent = "غير محدد";
    if (authorEl) authorEl.textContent = "غير محدد";
    if (authorCityEl) authorCityEl.textContent = "";
    if (dateEl) dateEl.textContent = "";
    if (sidebarNameEl) sidebarNameEl.textContent = "غير محدد";
    if (sidebarCityEl) sidebarCityEl.textContent = "";

    [likeBtn, reportBtn].forEach((btn) => {
      if (!btn) return;
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      btn.style.opacity = "0.55";
    });
    const countEl = likeBtn?.querySelector(".count");
    if (countEl) countEl.textContent = "0";

    if (commentForm) {
      commentForm
        .querySelectorAll("input, textarea, button")
        .forEach((el) => {
          el.disabled = true;
        });
      const commentContent = document.getElementById("commentContent");
      if (commentContent) {
        commentContent.placeholder = "اختر منشوراً قبل إضافة تعليق";
      }
      const commentsBody = commentForm.closest(".card-body");
      const heading = commentsBody?.querySelector("h3");
      if (heading) heading.textContent = "التعليقات";
      commentsBody
        ?.querySelectorAll(".comment-item")
        .forEach((item) => item.remove());
    }
  };

  if (!postId) {
    setMissingPostState();
    return;
  }

  const detailCommentForm = document.getElementById("commentForm");
  const commentsBody = detailCommentForm?.closest(".card-body");
  const commentsHeading = commentsBody?.querySelector("h3");
  const renderCommentStarsHtml = (ratingValue) =>
    Array.from(
      { length: 5 },
      (_, i) =>
        `<svg class="${i < ratingValue ? "star-filled" : "star-empty"}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    ).join("");
  const normalizeComment = (comment) => {
    const author = comment.user || comment.author || comment.owner || {};
    return {
      content: comment.content || comment.comment || comment.text || "",
      rating: Number(comment.rating || comment.rate || 0) || 0,
      authorName:
        author.full_name ||
        author.name ||
        comment.authorName ||
        comment.user_name ||
        "مستخدم",
      createdAt: comment.createdAt || comment.created_at || comment.date,
    };
  };
  const extractComments = (source) => {
    const candidates = [
      source?.comments,
      source?.reviews,
      source?.data?.comments,
      source?.post?.comments,
    ];
    return candidates.find(Array.isArray) || [];
  };
  const renderComments = (comments, totalCount = comments.length) => {
    if (!commentsBody || !detailCommentForm) return;
    commentsBody
      .querySelectorAll(".comment-item, .comments-empty")
      .forEach((item) => item.remove());
    if (commentsHeading) {
      commentsHeading.textContent = `التعليقات (${totalCount})`;
    }
    if (!comments.length) {
      detailCommentForm.insertAdjacentHTML(
        "afterend",
        `<p class="comments-empty" style="text-align:center;color:var(--gray-400);padding:1rem 0;">${
          totalCount > 0
            ? "لا توفر واجهة الخادم الحالية نصوص التعليقات لعرضها."
            : "لا توجد تعليقات بعد."
        }</p>`,
      );
      return;
    }
    detailCommentForm.insertAdjacentHTML(
      "afterend",
      comments
        .map((rawComment) => {
          const comment = normalizeComment(rawComment);
          const date = comment.createdAt
            ? new Date(comment.createdAt).toLocaleDateString("ar-EG")
            : "";
          return `<div class="comment-item">
            <img src="../images/avatar-saeed.jpg" alt="${escHtml(comment.authorName)}">
            <div class="comment-item-body">
              <div class="comment-item-header">
                <div class="author">
                  <span class="name">${escHtml(comment.authorName)}</span>
                  <div class="stars">${renderCommentStarsHtml(comment.rating)}</div>
                </div>
                <span class="date">${escHtml(date)}</span>
              </div>
              <p>${escHtml(comment.content)}</p>
              <button class="comment-like-btn" type="button">أعجبني</button>
            </div>
          </div>`;
        })
        .join(""),
    );
  };
  const loadPostComments = async (post, details, totalCount = 0) => {
    let comments = extractComments(post);
    if (!comments.length && details) comments = extractComments(details);
    if (!comments.length) {
      try {
        const details = await apiFetch(`/post/${postId}/details`);
        comments = extractComments(details);
      } catch {}
    }
    renderComments(comments, Math.max(totalCount, comments.length));
  };

  const renderAverageRating = (ratingValue) => {
    const container = document.getElementById("reviewAverageRating");
    if (!container) return;
    const rating = Math.max(0, Math.min(5, Number(ratingValue) || 0));
    container.setAttribute("aria-label", `متوسط التقييم ${rating.toFixed(1)} من 5`);
    container.innerHTML = `${renderFractionalStars(rating)}<strong class="review-rating-value">${rating.toFixed(1)} <span>من 5</span></strong>`;
  };

  if (postId) {
    try {
      const post = await API.getPost(postId);
      const [postsRaw, categoriesRaw] = await Promise.all([
        API.getPosts({
          page: 1,
          limit: 10,
          search: post.title,
          searchIn: "title",
        }).catch(() => []),
        API.getCategories().catch(() => []),
      ]);
      const feedPost = unwrapApiArray(postsRaw, ["posts"]).find(
        (item) => String(getEntityId(item)) === String(postId),
      );
      const category = unwrapApiArray(categoriesRaw, ["categories"]).find(
        (item) =>
          String(firstDefined(item?.id, item?._id, item?.category_id)) ===
          String(firstDefined(post?.categoryId, post?.category_id)),
      );
      const mergedPost = {
        ...post,
        ...(feedPost || {}),
        category: firstDefined(feedPost?.name, category?.name, post?.category),
      };
      const titleEl = document.querySelector("[data-post-title]");
      const descEl = document.querySelector("[data-post-desc]");
      const badgeEl = document.querySelector(".review-detail-badge");
      const authorEl = document.getElementById("reviewAuthorName");
      const dateEl = document.getElementById("reviewAuthorDate");
      if (titleEl) titleEl.textContent = firstDefined(mergedPost.title, "");
      if (descEl) descEl.textContent = firstDefined(mergedPost.description, mergedPost.content, mergedPost.body, "");
      if (badgeEl) badgeEl.textContent = getCategoryName(mergedPost);
      const storedUser = getStoredUser();
      const postAuthor = getPostAuthor(mergedPost);
      const authorId = postAuthor.id;
      const publicProfile = authorId
        ? await API.getPublicProfile(authorId).catch(() => null)
        : null;
      const authorName = firstDefined(publicProfile?.full_name, postAuthor.name, "مستخدم");
      const authorCity = firstDefined(publicProfile?.city, postAuthor.city, "");
      if (authorEl) authorEl.textContent = authorName || "مستخدم";
      if (dateEl) dateEl.textContent = getPostDate(post);
      const authorCityEl = document.getElementById("reviewAuthorCity");
      const sidebarNameEl = document.getElementById("sidebarAuthorName");
      const sidebarCityEl = document.getElementById("sidebarAuthorCity");
      const publicProfileLink = document.getElementById("publicAuthorProfileLink");
      const profileHref = authorId
        ? `user-profile.html?id=${encodeURIComponent(String(authorId))}`
        : null;
      if (authorEl) {
        if (profileHref) authorEl.href = profileHref;
        else authorEl.removeAttribute("href");
      }
      if (publicProfileLink) {
        if (profileHref) {
          publicProfileLink.href = profileHref;
          publicProfileLink.removeAttribute("aria-disabled");
        } else {
          publicProfileLink.removeAttribute("href");
          publicProfileLink.setAttribute("aria-disabled", "true");
        }
      }
      if (authorCityEl) authorCityEl.textContent = authorCity || "";
      if (sidebarNameEl) sidebarNameEl.textContent = authorName || "مستخدم";
      if (sidebarCityEl) sidebarCityEl.textContent = authorCity || "";
      const authorAvatar = document.getElementById("reviewAuthorAvatar");
      const sidebarAuthorAvatar = document.getElementById("sidebarAuthorAvatar");
      if (authorAvatar) authorAvatar.textContent = (authorName || "م").trim().charAt(0) || "م";
      if (sidebarAuthorAvatar) sidebarAuthorAvatar.textContent = (authorName || "م").trim().charAt(0) || "م";
      const commentsCount = getPostCount(
        mergedPost,
        "commentsCount",
        "commentCount",
        "comments",
      );
      const reactionsCount = getPostCount(
        mergedPost,
        "reactionsCount",
        "reactionCount",
        "reactions",
        "likesCount",
        "likes",
      );
      const likeCountEl = document.querySelector("#likeBtn .count");
      const postCommentsCountEl = document.getElementById("postCommentsCount");
      if (likeCountEl) likeCountEl.textContent = String(reactionsCount);
      if (postCommentsCountEl) postCommentsCountEl.textContent = String(commentsCount);
      const detailLikeBtn = document.getElementById("likeBtn");
      const detailReportBtn = document.getElementById("reportBtn");
      setReactionButtonState(detailLikeBtn, hasReactedToPost(postId, mergedPost, storedUser));
      setReportButtonState(detailReportBtn, getServerReportState(mergedPost));
      if (detailLikeBtn) {
        detailLikeBtn.dataset.reactionId = String(getActionRecordId(mergedPost, "reaction") || "");
      }
      if (detailReportBtn) {
        detailReportBtn.dataset.reportId = String(getActionRecordId(mergedPost, "report") || "");
      }
      renderAverageRating(
        firstDefined(
          mergedPost.averageRating,
          mergedPost.avgRating,
          mergedPost.rating,
          0,
        ),
      );
      await loadPostComments(mergedPost, null, commentsCount);
    } catch (err) {
      if (err.status === 401)
        showNotification("يجب تسجيل الدخول للاطلاع على التفاصيل", "error");
      setMissingPostState();
      return;
    }
  }

  // Like / Reaction button
  const likeBtn = document.getElementById("likeBtn");
  if (likeBtn && postId) {
    likeBtn.addEventListener("click", async () => {
      const reacted = likeBtn.dataset.reacted === "true";
      if (reacted && !likeBtn.dataset.reactionId) {
        showNotification(
          "إزالة الإعجاب تحتاج أن يعيد الخادم reactionId مع بيانات المنشور أو أن يوفّر حذف التفاعل بمعرّف المنشور.",
          "error",
        );
        return;
      }
      setButtonLoading(likeBtn, true);
      try {
        if (reacted) {
          await API.deleteReaction(likeBtn.dataset.reactionId);
          forgetReactedPost(postId);
        } else {
          await API.saveReaction(postId, 1);
          rememberReactedPost(postId);
        }
        const updatedPost = await getPostFeedItem(postId).catch(() => null);
        if (updatedPost) {
          likeBtn.dataset.nextCount = String(
            getPostCount(
              updatedPost,
              "reactionsCount",
              "reactionCount",
              "reactions",
              "likesCount",
              "likes",
            ),
          );
        }
        likeBtn.dataset.nextReacted = String(
          updatedPost ? hasReactedToPost(postId, updatedPost) : !reacted,
        );
        likeBtn.dataset.nextReactionId = String(
          updatedPost ? getActionRecordId(updatedPost, "reaction") || "" : "",
        );
        showNotification(reacted ? "تمت إزالة الإعجاب" : "تم تسجيل الإعجاب", "success");
      } catch (err) {
        showNotification(
          err.status === 401 ? "يجب تسجيل الدخول أولاً" : parseApiError(err),
          "error",
        );
      } finally {
        setButtonLoading(likeBtn, false);
        if (likeBtn.dataset.nextReacted) {
          setReactionButtonState(likeBtn, likeBtn.dataset.nextReacted === "true");
          likeBtn.dataset.reactionId = likeBtn.dataset.nextReactionId || "";
          const restoredCountEl = likeBtn.querySelector(".count");
          if (restoredCountEl && likeBtn.dataset.nextCount) {
            restoredCountEl.textContent = likeBtn.dataset.nextCount;
          }
          delete likeBtn.dataset.nextReacted;
          delete likeBtn.dataset.nextReactionId;
          delete likeBtn.dataset.nextCount;
        }
      }
    });
  }

  const commentsButton = document.getElementById("commentsButton");
  commentsButton?.addEventListener("click", () => {
    detailCommentForm?.closest(".card")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("commentContent")?.focus({ preventScroll: true });
  });

  const shareBtn = document.getElementById("shareBtn");
  shareBtn?.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showNotification("تم نسخ رابط المنشور", "success");
      } else {
        window.prompt("انسخ رابط المنشور:", url);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        showNotification("تعذر مشاركة رابط المنشور", "error");
      }
    }
  });

  // Comment form
  const commentForm = document.getElementById("commentForm");
  if (commentForm && postId) {
    const commentRatingInput = document.getElementById("commentRating");
    const renderCommentStars = (ratingValue) =>
      Array.from(
        { length: 5 },
        (_, i) =>
          `<svg class="${i < ratingValue ? "star-filled" : "star-empty"}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      ).join("");
    const prependComment = (content, rating) => {
      const user = getStoredUser();
      const authorName = user?.full_name || "أنت";
      const date = new Date().toLocaleDateString("ar-EG");
      commentForm.insertAdjacentHTML(
        "afterend",
        `<div class="comment-item">
          <img src="../images/avatar-saeed.jpg" alt="${escHtml(authorName)}">
          <div class="comment-item-body">
            <div class="comment-item-header">
              <div class="author">
                <span class="name">${escHtml(authorName)}</span>
                <div class="stars">${renderCommentStars(rating)}</div>
              </div>
              <span class="date">${escHtml(date)}</span>
            </div>
            <p>${escHtml(content)}</p>
            <button class="comment-like-btn" type="button">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              أعجبني
            </button>
          </div>
        </div>`,
      );

      commentForm
        .closest(".card-body")
        ?.querySelectorAll(".comments-empty")
        .forEach((item) => item.remove());
      const heading = commentForm.closest(".card-body")?.querySelector("h3");
      const match = heading?.textContent.match(/\((\d+)\)/);
      if (heading && match) {
        heading.textContent = heading.textContent.replace(
          /\(\d+\)/,
          `(${Number(match[1]) + 1})`,
        );
      } else if (heading) {
        heading.textContent = "التعليقات (1)";
      }
      const actionCount = document.getElementById("postCommentsCount");
      if (actionCount) {
        actionCount.textContent = String(Number(actionCount.textContent) + 1);
      }
    };
    commentForm.querySelectorAll(".star-rating button").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        if (commentRatingInput) commentRatingInput.value = i + 1;
      });
    });

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = document.getElementById("commentContent").value.trim();
      const rating = parseInt(commentRatingInput?.value || "0");
      if (!content) {
        showNotification("الرجاء كتابة تعليق", "error");
        return;
      }

      const submitBtn = commentForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true);
      try {
        const created = await API.createComment(postId, content, rating);
        showNotification("تم إرسال التعليق بنجاح!", "success");
        prependComment(created?.content || content, Number(created?.rating ?? rating) || 0);
        document.getElementById("commentContent").value = "";
        if (commentRatingInput) commentRatingInput.value = "0";
      } catch (err) {
        showNotification(
          err.status === 401 ? "يجب تسجيل الدخول أولاً" : parseApiError(err),
          "error",
        );
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  // Report button
  const reportBtn = document.getElementById("reportBtn");
  if (reportBtn && postId) {
    reportBtn.addEventListener("click", async () => {
      const reported = reportBtn.dataset.reported === "true";
      if (reported && !reportBtn.dataset.reportId) {
        showNotification(
          "إزالة البلاغ تحتاج أن يعيد الخادم reportId مع بيانات المنشور أو أن يوفّر حذف البلاغ بمعرّف المنشور.",
          "error",
        );
        return;
      }
      const reason = reported ? null : await requestReportReason();
      if (!reported && !reason) return;
      setButtonLoading(reportBtn, true);
      try {
        if (reported) {
          await API.deleteReport(reportBtn.dataset.reportId);
        } else {
          await API.saveReport(postId, reason);
        }
        const updatedPost = await getPostFeedItem(postId).catch(() => null);
        reportBtn.dataset.nextReported = String(
          updatedPost ? getServerReportState(updatedPost) : !reported,
        );
        reportBtn.dataset.nextReportId = String(
          updatedPost ? getActionRecordId(updatedPost, "report") || "" : "",
        );
        showNotification(reported ? "تمت إزالة البلاغ" : "تم إرسال البلاغ للمراجعة", "success");
      } catch (err) {
        showNotification(
          err.status === 401 ? "يجب تسجيل الدخول أولاً" : parseApiError(err),
          "error",
        );
      } finally {
        setButtonLoading(reportBtn, false);
        if (reportBtn.dataset.nextReported) {
          setReportButtonState(reportBtn, reportBtn.dataset.nextReported === "true");
          reportBtn.dataset.reportId = reportBtn.dataset.nextReportId || "";
          delete reportBtn.dataset.nextReported;
          delete reportBtn.dataset.nextReportId;
        }
      }
    });
  }
}

// ===== My Posts Page =====
async function initMyPostsPage() {
  const postsListEl = document.getElementById("postsList");
  if (!postsListEl) return;

  const bioEl = document.getElementById("userBio");
  postsListEl.innerHTML =
    '<p style="text-align:center;color:var(--gray-400);padding:2rem;">جاري التحميل...</p>';

  try {
    const [postsRaw, profile] = await Promise.all([
      API.getMyPosts(),
      API.getProfile().catch(() => null),
    ]);

    if (profile) {
      setStoredUser(profile);
      updateNavbarUser(profile);
      if (bioEl) bioEl.textContent = profile.bio || "لا توجد نبذة شخصية.";
    }

    const posts = unwrapApiArray(postsRaw, ["posts"]);

    if (posts.length === 0) {
      postsListEl.innerHTML =
        '<p style="text-align:center;color:var(--gray-400);padding:2rem;">لا توجد مراجعات بعد. <a href="add-post.html">أضف مراجعة الآن</a></p>';
      return;
    }

    postsListEl.innerHTML = posts
      .map(
        (post) => {
          const postId = getEntityId(post);
          return `
      <div class="post-card" id="post-${escHtml(String(postId || ""))}">
        <div class="post-card-body">
          <div class="post-card-header">
            <div class="post-badges">
              <span class="badge badge-blue">${escHtml(getCategoryName(post))}</span>
            </div>
            <div class="post-actions">
              <button class="edit-btn" data-post-id="${escHtml(String(postId || ""))}" aria-label="تعديل المنشور" title="تعديل المنشور" ${postId ? "" : "disabled"}>
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="delete" data-post-id="${escHtml(String(postId || ""))}" aria-label="حذف المنشور" title="حذف المنشور" ${postId ? "" : "disabled"}>
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <a href="${postId ? `post.html?id=${escHtml(encodeURIComponent(String(postId)))}` : "#"}" style="display:block;margin-bottom:0.5rem;">
            <h3 style="font-size:1.125rem;font-weight:700;color:var(--gray-900);">${escHtml(post.title || "")}</h3>
          </a>
          <p style="color:var(--gray-600);font-size:0.875rem;line-height:1.6;margin-bottom:1rem;" class="line-clamp-3">${escHtml(post.description || "")}</p>
        </div>
      </div>
    `;
        },
      )
      .join("");

    postsListEl
      .querySelectorAll(".post-actions .delete[data-post-id]")
      .forEach((btn) => {
        btn.addEventListener("click", async () => {
          const postId = btn.dataset.postId;
          if (!confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
          try {
            await API.deletePost(postId);
            document.getElementById(`post-${postId}`)?.remove();
            showNotification("تم حذف المنشور بنجاح", "success");
          } catch (err) {
            showNotification(
              err.status === 401
                ? "يجب تسجيل الدخول أولاً"
                : parseApiError(err),
              "error",
            );
          }
        });
      });

    postsListEl
      .querySelectorAll(".post-actions .edit-btn[data-post-id]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          window.location.href = `edit-post.html?id=${btn.dataset.postId}`;
        });
      });

    const filterContainer = document.getElementById("filterTags");
    const searchInput = document.getElementById("myPostsSearch");
    if (filterContainer) {
      const categories = [...new Set(posts.map((post) => getCategoryName(post)))];
      filterContainer.innerHTML = ["الكل", ...categories]
        .map(
          (category, index) =>
            `<button type="button" class="filter-tag${index === 0 ? " active" : ""}">${escHtml(category)}</button>`,
        )
        .join("");
    }
    const applyMyPostsFilters = () => {
      const activeFilter =
        filterContainer?.querySelector(".filter-tag.active")?.textContent.trim() ||
        "الكل";
      const term = (searchInput?.value || "").trim().toLowerCase();
      postsListEl.querySelectorAll(".post-card").forEach((card) => {
        const category = card.querySelector(".badge")?.textContent.trim() || "";
        const searchable = card.textContent.toLowerCase();
        const matchesCategory = activeFilter === "الكل" || category === activeFilter;
        const matchesSearch = !term || searchable.includes(term);
        card.style.display = matchesCategory && matchesSearch ? "" : "none";
      });
    };
    if (filterContainer) {
      filterContainer.querySelectorAll(".filter-tag").forEach((tag) => {
        tag.addEventListener("click", () => {
          filterContainer
            .querySelectorAll(".filter-tag")
            .forEach((t) => t.classList.remove("active"));
          tag.classList.add("active");
          applyMyPostsFilters();
        });
      });
    }
    if (searchInput) searchInput.addEventListener("input", applyMyPostsFilters);
  } catch (err) {
    if (err.status === 401) {
      showNotification("يجب تسجيل الدخول أولاً", "error");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      postsListEl.innerHTML =
        '<p style="text-align:center;color:var(--danger);padding:2rem;">تعذّر تحميل المنشورات. الرجاء المحاولة لاحقاً.</p>';
    }
  }
}

// ===== Public User Profile Page =====
async function initPublicProfilePage() {
  const postsListEl = document.getElementById("publicProfilePostsList");
  if (!postsListEl) return;

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");
  const postsCountEl = document.getElementById("publicProfilePostsCount");
  const paginationEl = document.getElementById("publicProfilePagination");
  const backLink = document.getElementById("publicProfileBack");
  const postsPerPage = 10;
  const requestedPage = Number(params.get("page"));
  let currentPage = Number.isInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  let currentPosts = [];
  let hasNextPage = false;

  backLink?.addEventListener("click", (event) => {
    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });

  const setText = (id, value, fallback = "—") => {
    const element = document.getElementById(id);
    if (element) element.textContent = firstDefined(value, fallback);
  };

  const renderPosts = (posts) => {
    if (postsCountEl) postsCountEl.textContent = String(posts.length);
    if (!posts.length) {
      postsListEl.innerHTML = `
        <div class="feed-empty-state">
          <h3>لا توجد منشورات بعد</h3>
          <p>لم ينشر هذا المستخدم أي تجربة في هذه الصفحة.</p>
        </div>`;
      return;
    }

    postsListEl.innerHTML = posts
      .map((post) => {
        const postId = getEntityId(post);
        const rating = Number(firstDefined(post.averageRating, post.avgRating, post.rating, 0)) || 0;
        const commentsCount = getPostCount(post, "commentsCount", "commentCount", "comments");
        const reactionsCount = getPostCount(post, "reactionsCount", "reactionCount", "reactions", "likesCount", "likes");
        const description = truncateText(post.description || post.content || post.body || "", 260);
        const href = postId ? `post.html?id=${encodeURIComponent(String(postId))}` : "#";
        return `
          <article class="feed-post-card public-profile-post-card">
            <header class="feed-post-header">
              <div class="feed-post-author">
                <time datetime="${escHtml(String(firstDefined(post.createdAt, post.created_at, "")))}" title="${escHtml(formatAbsoluteDate(firstDefined(post.createdAt, post.created_at)))}">${escHtml(getPostDate(post))}</time>
              </div>
              <span class="feed-post-category">${escHtml(getCategoryName(post))}</span>
            </header>
            <a class="feed-post-content" href="${escHtml(href)}">
              <h3>${escHtml(firstDefined(post.title, "منشور بدون عنوان"))}</h3>
              ${description ? `<p>${escHtml(description)}</p>` : ""}
            </a>
            <div class="feed-post-metrics compact">
              <div class="feed-rating-metric">
                <div class="feed-rating-number"><strong>${rating.toFixed(1)}</strong><span>/ 5</span></div>
                ${renderFractionalStars(rating, { compact: true })}
                <span>متوسط التقييم</span>
              </div>
              <div class="feed-number-metric">${Icons.heart}<strong>${reactionsCount}</strong><span>إعجاب</span></div>
              <div class="feed-number-metric">${Icons.messageCircle}<strong>${commentsCount}</strong><span>تعليق</span></div>
            </div>
          </article>`;
      })
      .join("");
  };

  const renderPagination = () => {
    if (!paginationEl) return;
    if (!currentPosts.length && currentPage === 1) {
      paginationEl.hidden = true;
      return;
    }
    paginationEl.hidden = false;
    paginationEl.innerHTML = `
      <p class="feed-pagination-info">الصفحة ${currentPage} · ${currentPosts.length} منشور</p>
      <div class="feed-pagination-controls">
        <button type="button" class="feed-pagination-arrow" data-profile-page="previous" aria-label="الصفحة السابقة" ${currentPage === 1 ? "disabled" : ""}>${Icons.chevronRight}</button>
        <span class="feed-pagination-page active" aria-current="page">${currentPage}</span>
        <button type="button" class="feed-pagination-arrow" data-profile-page="next" aria-label="الصفحة التالية" ${hasNextPage ? "" : "disabled"}>${Icons.chevronLeft}</button>
      </div>`;
  };

  const loadPosts = async ({ scroll = false } = {}) => {
    postsListEl.setAttribute("aria-busy", "true");
    postsListEl.innerHTML = '<div class="feed-loading">جاري تحميل المنشورات...</div>';
    if (paginationEl) paginationEl.hidden = true;
    try {
      const postsRaw = await API.getPostsByUser(userId, {
        page: currentPage,
        limit: postsPerPage,
      });
      currentPosts = unwrapApiArray(postsRaw, ["posts"]);
      if (!currentPosts.length && currentPage > 1) {
        currentPage -= 1;
        await loadPosts({ scroll });
        return;
      }
      hasNextPage = false;
      if (currentPosts.length === postsPerPage) {
        const nextRaw = await API.getPostsByUser(userId, {
          page: currentPage + 1,
          limit: postsPerPage,
        });
        hasNextPage = unwrapApiArray(nextRaw, ["posts"]).length > 0;
      }
      renderPosts(currentPosts);
      renderPagination();
      const url = new URL(window.location.href);
      if (currentPage > 1) url.searchParams.set("page", String(currentPage));
      else url.searchParams.delete("page");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      if (scroll) postsListEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      currentPosts = [];
      if (postsCountEl) postsCountEl.textContent = "0";
      postsListEl.innerHTML = `
        <div class="feed-empty-state error">
          <h3>تعذر تحميل منشورات المستخدم</h3>
          <p>${escHtml(parseApiError(err))}</p>
          <button type="button" class="btn btn-secondary btn-sm" data-profile-retry>إعادة المحاولة</button>
        </div>`;
      postsListEl.querySelector("[data-profile-retry]")?.addEventListener("click", () => loadPosts());
    } finally {
      postsListEl.setAttribute("aria-busy", "false");
    }
  };

  if (!userId) {
    setText("publicProfileName", "مستخدم غير محدد");
    setText("publicProfileBio", "الرابط لا يحتوي على معرّف مستخدم صالح.");
    postsListEl.innerHTML = '<div class="feed-empty-state error"><h3>تعذر فتح الملف</h3><p>معرّف المستخدم مفقود من الرابط.</p></div>';
    return;
  }

  try {
    const profile = await API.getPublicProfile(userId);
    const name = firstDefined(profile.full_name, profile.name, "مستخدم");
    setText("publicProfileName", name);
    setText("publicProfileBio", profile.bio, "لا توجد نبذة شخصية.");
    setText("publicProfileCity", profile.city);
    setText("publicProfilePhone", profile.phone);
    setText("publicProfileBirthdate", profile.birthdate ? formatAbsoluteDate(profile.birthdate) : null);
    const createdAtEl = document.getElementById("publicProfileCreatedAt");
    if (createdAtEl) {
      createdAtEl.textContent = formatRelativeTime(profile.createdAt || profile.created_at);
      createdAtEl.title = formatAbsoluteDate(profile.createdAt || profile.created_at);
    }
    const avatar = document.getElementById("publicProfileAvatar");
    if (avatar) avatar.textContent = String(name).trim().charAt(0) || "م";
    document.title = `${name} - ملتقى`;
  } catch (err) {
    setText("publicProfileName", "تعذر تحميل الملف");
    setText("publicProfileBio", parseApiError(err));
  }

  paginationEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-page]");
    if (!button || button.disabled) return;
    currentPage += button.dataset.profilePage === "next" ? 1 : -1;
    currentPage = Math.max(1, currentPage);
    loadPosts({ scroll: true });
  });
  await loadPosts();
}

// ===== Feed Page =====
async function initFeedPage() {
  const feedListEl = document.getElementById("feedPostsList");
  if (!feedListEl) return;

  const filterForm = document.getElementById("feedFilterForm");
  const searchInput = document.getElementById("feedSearch");
  const searchInSelect = document.getElementById("feedSearchIn");
  const categorySelect = document.getElementById("feedCategory");
  const feedCountEl = document.getElementById("feedPostsCount");
  const paginationEl = document.getElementById("feedPagination");
  const userNameEls = document.querySelectorAll("[data-feed-user-name]");
  const postsPerPage = 10;
  const initialParams = new URLSearchParams(window.location.search);
  const requestedPage = Number(initialParams.get("page"));
  let currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let currentPosts = [];
  let hasNextPage = false;
  let requestVersion = 0;

  const getFilterParams = (page = currentPage, limit = postsPerPage) => {
    const params = { page, limit };
    const search = searchInput?.value.trim();
    const searchIn = searchInSelect?.value;
    const category = categorySelect?.value;
    if (search) {
      params.search = search;
      if (searchIn) params.searchIn = searchIn;
    }
    if (category) params.category = category;
    return params;
  };

  const updateFeedUrl = () => {
    const url = new URL(window.location.href);
    ["q", "search", "searchIn", "category", "page"].forEach((key) =>
      url.searchParams.delete(key),
    );
    const params = getFilterParams();
    if (params.search) url.searchParams.set("search", params.search);
    if (params.searchIn) url.searchParams.set("searchIn", params.searchIn);
    if (params.category) url.searchParams.set("category", params.category);
    if (currentPage > 1) url.searchParams.set("page", String(currentPage));
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const renderPosts = (posts) => {
    if (feedCountEl) feedCountEl.textContent = String(posts.length);

    if (!posts.length) {
      feedListEl.innerHTML = `
        <div class="feed-empty-state">
          <h3>لا توجد نتائج مطابقة</h3>
          <p>جرّب تغيير نص البحث أو مجال البحث أو التصنيف.</p>
        </div>
      `;
      return;
    }

    feedListEl.innerHTML = posts
      .map((post) => {
        const postId = getEntityId(post);
        const postHref = postId ? `post.html?id=${encodeURIComponent(String(postId))}` : "#";
        const author = getPostAuthor(post);
        const category = getCategoryName(post);
        const title = firstDefined(post.title, post.name, "منشور بدون عنوان");
        const description = truncateText(post.description || post.content || post.body || "", 320);
        const commentsCount = getPostCount(post, "commentsCount", "commentCount", "comments");
        const reactionsCount = getPostCount(post, "reactionsCount", "reactionCount", "reactions", "likesCount", "likes");
        const rating = Number(firstDefined(post.averageRating, post.avgRating, post.rating, 0)) || 0;
        const reportsCountValue = firstDefined(post.reportsCount, post.reportCount);
        const reportsCount = Number.isFinite(Number(reportsCountValue))
          ? Number(reportsCountValue)
          : null;
        const avatarLetter = String(author.name || "م").trim().charAt(0) || "م";
        const date = getPostDate(post);
        const reacted = hasReactedToPost(postId, post);
        const reported = getServerReportState(post);
        const reactionId = getActionRecordId(post, "reaction");
        const reportId = getActionRecordId(post, "report");

        return `
          <article class="feed-post-card" data-feed-post data-post-id="${escHtml(String(postId || ""))}">
            <header class="feed-post-header">
              <div class="feed-avatar">${escHtml(avatarLetter)}</div>
              <div class="feed-post-author">
                <strong>${escHtml(author.name)}</strong>
                <time datetime="${escHtml(String(firstDefined(post.createdAt, post.created_at, "")))}" title="${escHtml(formatAbsoluteDate(firstDefined(post.createdAt, post.created_at)))}">${escHtml(date)}</time>
              </div>
              <span class="feed-post-category">${escHtml(category)}</span>
            </header>

            <a href="${escHtml(postHref)}" class="feed-post-content">
              <h2>${escHtml(title)}</h2>
              ${description ? `<p>${escHtml(description)}</p>` : ""}
            </a>

            <div class="feed-post-metrics">
              <div class="feed-rating-metric">
                <div class="feed-rating-number"><strong>${rating.toFixed(1)}</strong><span>/ 5</span></div>
                ${renderFractionalStars(rating, { compact: true })}
                <span>متوسط التقييم</span>
              </div>
              <div class="feed-number-metric">
                ${Icons.heart}
                <strong data-feed-reactions-count>${reactionsCount}</strong>
                <span>إعجاب</span>
              </div>
              <div class="feed-number-metric">
                ${Icons.messageCircle}
                <strong data-feed-comments-count>${commentsCount}</strong>
                <span>تعليق</span>
              </div>
              <div class="feed-number-metric${reported ? " reported" : ""}">
                ${Icons.flag}
                <strong>${reportsCount === null ? (reported ? "تم" : "—") : reportsCount}</strong>
                <span>${reportsCount === null ? "بلاغي" : "بلاغ"}</span>
              </div>
            </div>

            <div class="feed-post-actions">
              <button type="button" class="${reacted ? "active" : ""}" data-feed-like="${escHtml(String(postId || ""))}" data-reaction-id="${escHtml(String(reactionId || ""))}" data-reacted="${reacted}" aria-pressed="${reacted}" ${postId ? "" : "disabled"}>
                ${Icons.heart}
                <span data-reaction-label>${reacted ? "إزالة الإعجاب" : "إعجاب"}</span>
              </button>
              <a href="${escHtml(postHref)}">
                ${Icons.messageCircle}
                <span>تعليق</span>
              </a>
              <button type="button" class="${reported ? "active report-active" : ""}" data-feed-report="${escHtml(String(postId || ""))}" data-report-id="${escHtml(String(reportId || ""))}" data-reported="${reported}" aria-pressed="${reported}" ${postId ? "" : "disabled"}>
                ${Icons.flag}
                <span data-report-label>${reported ? "إزالة البلاغ" : "إبلاغ"}</span>
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    feedListEl.querySelectorAll("[data-feed-like]").forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.feedLike;
        const reacted = button.dataset.reacted === "true";
        if (!postId) return;
        if (reacted && !button.dataset.reactionId) {
          showNotification(
            "إزالة الإعجاب تحتاج أن يعيد GET /posts حقل reactionId أو أن يوفّر الخادم حذف التفاعل بمعرّف المنشور.",
            "error",
          );
          return;
        }
        setButtonLoading(button, true);
        try {
          if (reacted) {
            await API.deleteReaction(button.dataset.reactionId);
            forgetReactedPost(postId);
            showNotification("تمت إزالة الإعجاب", "success");
          } else {
            await API.saveReaction(postId, 1);
            rememberReactedPost(postId);
            showNotification("تم تسجيل الإعجاب", "success");
          }
          await loadPage();
        } catch (err) {
          showNotification(parseApiError(err), "error");
        } finally {
          if (button.isConnected) setButtonLoading(button, false);
        }
      });
    });

    feedListEl.querySelectorAll("[data-feed-report]").forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.feedReport;
        const reported = button.dataset.reported === "true";
        if (!postId) return;
        if (reported && !button.dataset.reportId) {
          showNotification(
            "إزالة البلاغ تحتاج أن يعيد GET /posts حقل reportId أو أن يوفّر الخادم حذف البلاغ بمعرّف المنشور.",
            "error",
          );
          return;
        }
        const reason = reported ? null : await requestReportReason();
        if (!reported && !reason) return;
        setButtonLoading(button, true);
        try {
          if (reported) {
            await API.deleteReport(button.dataset.reportId);
            showNotification("تمت إزالة البلاغ", "success");
          } else {
            await API.saveReport(postId, reason);
            showNotification("تم إرسال البلاغ للمراجعة", "success");
          }
          await loadPage();
        } catch (err) {
          showNotification(parseApiError(err), "error");
        } finally {
          if (button.isConnected) setButtonLoading(button, false);
        }
      });
    });
  };

  const renderPagination = () => {
    if (!paginationEl) return;
    if (!currentPosts.length && currentPage === 1) {
      paginationEl.hidden = true;
      paginationEl.innerHTML = "";
      return;
    }

    const pageNumbers = [];
    if (currentPage > 1) pageNumbers.push(currentPage - 1);
    pageNumbers.push(currentPage);
    if (hasNextPage) pageNumbers.push(currentPage + 1);
    paginationEl.hidden = false;
    paginationEl.innerHTML = `
      <p class="feed-pagination-info">الصفحة ${currentPage} · ${currentPosts.length} منشور</p>
      <div class="feed-pagination-controls">
        <button type="button" class="feed-pagination-arrow" data-feed-page="previous" aria-label="الصفحة السابقة" ${currentPage === 1 ? "disabled" : ""}>
          ${Icons.chevronRight}
        </button>
        <div class="feed-pagination-pages">
          ${pageNumbers
            .map((page) => `<button type="button" class="feed-pagination-page${page === currentPage ? " active" : ""}" data-feed-page="${page}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`)
            .join("")}
        </div>
        <button type="button" class="feed-pagination-arrow" data-feed-page="next" aria-label="الصفحة التالية" ${hasNextPage ? "" : "disabled"}>
          ${Icons.chevronLeft}
        </button>
      </div>
    `;
  };

  const loadPage = async ({ scroll = false } = {}) => {
    const version = ++requestVersion;
    feedListEl.setAttribute("aria-busy", "true");
    feedListEl.innerHTML = '<div class="feed-loading">جاري تحميل المنشورات...</div>';
    if (paginationEl) paginationEl.hidden = true;

    try {
      const postsRaw = await API.getPosts(getFilterParams());
      if (version !== requestVersion) return;
      currentPosts = unwrapApiArray(postsRaw, ["posts"]);

      if (!currentPosts.length && currentPage > 1) {
        currentPage -= 1;
        await loadPage({ scroll });
        return;
      }

      hasNextPage = false;
      if (currentPosts.length === postsPerPage) {
        const nextRaw = await API.getPosts(
          getFilterParams(currentPage + 1, postsPerPage),
        );
        if (version !== requestVersion) return;
        hasNextPage = unwrapApiArray(nextRaw, ["posts"]).length > 0;
      }

      renderPosts(currentPosts);
      renderPagination();
      updateFeedUrl();
      if (scroll) feedListEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      if (version !== requestVersion) return;
      currentPosts = [];
      hasNextPage = false;
      if (feedCountEl) feedCountEl.textContent = "0";
      feedListEl.innerHTML = `
        <div class="feed-empty-state error">
          <h3>تعذر تحميل المنشورات</h3>
          <p>${escHtml(parseApiError(err))}</p>
          <button type="button" class="btn btn-secondary btn-sm" data-feed-retry>إعادة المحاولة</button>
        </div>`;
      feedListEl.querySelector("[data-feed-retry]")?.addEventListener("click", () => loadPage());
    } finally {
      if (version === requestVersion) feedListEl.setAttribute("aria-busy", "false");
    }
  };

  paginationEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-feed-page]");
    if (!button || button.disabled) return;

    const target = button.dataset.feedPage;
    const nextPage =
      target === "previous"
        ? currentPage - 1
        : target === "next"
          ? currentPage + 1
          : Number(target);
    if (!Number.isInteger(nextPage) || nextPage < 1) {
      return;
    }

    currentPage = nextPage;
    loadPage({ scroll: true });
  });

  try {
    const [categoriesRaw, profile] = await Promise.all([
      API.getCategories().catch(() => []),
      API.getProfile().catch(() => getStoredUser()),
    ]);

    if (profile) {
      setStoredUser(profile);
      updateNavbarUser(profile);
      userNameEls.forEach((el) => {
        el.textContent = profile.full_name || "المستخدم";
      });
    }

    const initialSearch = initialParams.get("search") || initialParams.get("q") || "";
    if (searchInput) searchInput.value = initialSearch;
    if (searchInSelect && ["title", "description"].includes(initialParams.get("searchIn"))) {
      searchInSelect.value = initialParams.get("searchIn");
    }

    if (categorySelect) {
      const categories = unwrapApiArray(categoriesRaw, ["categories"]);
      categorySelect.innerHTML = `<option value="">كل التصنيفات</option>${categories
        .map((category) => {
          const name = firstDefined(category?.name, category?.title, category?.category, category);
          return `<option value="${escHtml(String(name || ""))}">${escHtml(String(name || ""))}</option>`;
        })
        .join("")}`;
      categorySelect.value = initialParams.get("category") || "";
    }

    filterForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      currentPage = 1;
      loadPage({ scroll: true });
    });
    filterForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        currentPage = 1;
        loadPage({ scroll: true });
      }, 0);
    });
    await loadPage();
  } catch (err) {
    feedListEl.innerHTML =
      '<div class="feed-empty-state error"><h3>تعذر تحميل المنشورات</h3><p>تحقق من الاتصال أو حاول لاحقا.</p></div>';
    showNotification(parseApiError(err), "error");
  }
}

// ===== Index Page (Recent Reviews) =====
async function initIndexPage() {
  const gridEl = document.getElementById("recentReviewsGrid");
  if (!gridEl) return;

  gridEl.innerHTML =
    '<p style="text-align:center;color:var(--gray-400);padding:2rem;grid-column:1/-1;">جاري التحميل...</p>';

  try {
    const postsRaw = await API.getPosts({ page: 1, limit: 6 }).catch(() => []);
    const posts = Array.isArray(postsRaw) ? postsRaw : [];

    if (posts.length === 0) {
      const loggedIn = !!getStoredUser();
      gridEl.innerHTML = `<p style="text-align:center;color:var(--gray-400);padding:2rem;grid-column:1/-1;">${loggedIn ? "لا توجد مراجعات بعد." : "سجّل دخولك لرؤية المراجعات الأخيرة"}</p>`;
      return;
    }

    gridEl.innerHTML = posts
      .slice(0, 6)
      .map((post) => {
        const desc = post.description || "";
        const shortDesc = desc.length > 120 ? desc.slice(0, 120) + "..." : desc;
        const postId = post.id || post._id || "";
        const href = postId
          ? `pages/post.html?id=${escHtml(String(postId))}`
          : "pages/my-posts.html";
        return `
        <a href="${href}" class="review-card">
          <div class="review-card-body">
            <span class="review-card-badge">${escHtml(post.category || "")}</span>
            <h3 class="review-card-title">${escHtml(post.title || "")}</h3>
            <p class="review-card-desc">${escHtml(shortDesc)}</p>
            ${post.commentsCount != null ? `<div style="font-size:0.75rem;color:var(--gray-400);margin-top:0.5rem;">${post.commentsCount} تعليق · تقييم ${post.averageRating ?? "-"}</div>` : ""}
          </div>
        </a>
      `;
      })
      .join("");
  } catch {
    const loggedIn = !!getStoredUser();
    gridEl.innerHTML = loggedIn
      ? ""
      : `<p style="text-align:center;color:var(--gray-400);padding:2rem;grid-column:1/-1;">سجّل دخولك لرؤية المراجعات الأخيرة</p>`;
  }
}

// ===== Contact Page =====
function initContactPage() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName")?.value.trim();
    const email = document.getElementById("contactEmail")?.value.trim();
    const subject = document.getElementById("contactSubject")?.value.trim();
    const message = document.getElementById("contactMessage")?.value.trim();

    if (!name || !email || !subject || !message) {
      showNotification("الرجاء ملء جميع الحقول", "error");
      return;
    }

    showNotification(
      "خدمة إرسال الرسائل غير متاحة من الخادم حالياً. استخدم بيانات التواصل الظاهرة في الصفحة.",
      "error",
    );
  });
}

// ===== Settings Page =====
async function initSettingsPage() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  if (!saveBtn) return;

  try {
    const profile = await API.getProfile();
    setStoredUser(profile);
    updateNavbarUser(profile);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };
    set("settingsName", profile.full_name);
    set("settingsEmail", profile.email);
    set("settingsPhone", profile.phone);
    set("settingsCity", profile.city);
    set("settingsBio", profile.bio);
    set("settingsBirthdate", toDateInputValue(profile.birthdate));
  } catch (err) {
    if (err.status === 401) {
      showNotification("يجب تسجيل الدخول أولاً", "error");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }

  saveBtn.addEventListener("click", async () => {
    const full_name = document.getElementById("settingsName")?.value.trim();
    const phone = document.getElementById("settingsPhone")?.value.trim();
    const city = document.getElementById("settingsCity")?.value.trim();
    const bio = document.getElementById("settingsBio")?.value.trim();
    const birthdate = document
      .getElementById("settingsBirthdate")
      ?.value.trim();

    if (!full_name) {
      showNotification("الاسم الكامل مطلوب", "error");
      return;
    }

    const payload = { full_name };
    if (phone) payload.phone = phone;
    if (city) payload.city = city;
    payload.bio = bio || "";
    if (birthdate) payload.birthdate = birthdate;

    setButtonLoading(saveBtn, true);
    try {
      await API.updateProfile(payload);
      const updated = await API.getProfile();
      setStoredUser(updated);
      updateNavbarUser(updated);
      showNotification("تم حفظ الإعدادات بنجاح", "success");
    } catch (err) {
      showNotification(parseApiError(err), "error");
    } finally {
      setButtonLoading(saveBtn, false);
    }
  });
}

// ===== Dashboard Main Page =====
async function initDashboardPage() {
  const statsGrid = document.querySelector(".stats-grid");
  if (!statsGrid) return;
  statsGrid
    .querySelectorAll(".stat-card-badge, .stat-card .period")
    .forEach((element) => {
      element.hidden = true;
    });
  Array.from(statsGrid.parentElement?.children || [])
    .slice(1)
    .forEach((element) => {
      element.hidden = true;
    });
  const statH3s = statsGrid.querySelectorAll(".stat-card h3");
  if (!statH3s.length) return;

  const [usersRes, reportsRes, postsRes, catsRes] = await Promise.allSettled([
    API.getUsers(),
    API.getReports(),
    API.getPosts({ page: 1, limit: 100 }),
    API.getCategories(),
  ]);

  const count = (res) =>
    res.status === "fulfilled" ? unwrapApiArray(res.value).length : null;
  const fmt = (n, limit) =>
    n == null ? null : n === limit ? n + "+" : String(n);

  const u = count(usersRes);
  if (u != null && statH3s[0]) statH3s[0].textContent = fmt(u, null);
  const r = count(reportsRes);
  if (r != null && statH3s[1]) statH3s[1].textContent = fmt(r, null);
  const p = count(postsRes);
  if (p != null && statH3s[2]) statH3s[2].textContent = fmt(p, 100);
  const c = count(catsRes);
  if (c != null && statH3s[3]) statH3s[3].textContent = fmt(c, null);
}

// ===== Dashboard Users Page =====
async function initDashboardUsersPage() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  const addBtn = document.getElementById("addUserBtn");
  const modal = document.getElementById("userModal");
  const modalForm = document.getElementById("userModalForm");
  const modalTitle = document.getElementById("userModalTitle");
  const modalClose = document.getElementById("userModalClose");
  let editingId = null;

  async function loadUsers() {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400);">جاري التحميل...</td></tr>';
    try {
      const usersRaw = await API.getUsers();
      const users = unwrapApiArray(usersRaw, ["users"]);
      const countEl = document.getElementById("usersCount");
      if (countEl) countEl.textContent = users.length;

      if (users.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400);">لا يوجد مستخدمون</td></tr>';
        return;
      }
      tbody.innerHTML = users
        .map((u) => {
          const userId = firstDefined(u.id, u._id, u.user_id, u.userId);
          return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div style="width:40px;height:40px;background:var(--primary-light);color:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">${escHtml((u.full_name || "?")[0].toUpperCase())}</div>
              <div>
                <div style="font-weight:500;color:var(--gray-900);">${escHtml(u.full_name || "")}</div>
                <div style="font-size:0.75rem;color:var(--gray-500);">${escHtml(u.email || "")}</div>
              </div>
            </div>
          </td>
          <td>${escHtml(u.city || "-")}</td>
          <td><span class="status-badge ${u.role === "Admin" ? "active" : "pending"}">${u.role === "Admin" ? "أدمن" : "مستخدم"}</span></td>
          <td style="font-size:0.875rem;color:var(--gray-600);">${escHtml(u.phone || "-")}</td>
          <td><span class="status-badge ${u.status === "Active" ? "active" : "blocked"}">${u.status === "Active" ? "مفعل" : "متوقف"}</span></td>
          <td>
            <div style="display:flex;gap:0.25rem;">
              <button class="edit-user-btn" title="تعديل" aria-label="تعديل المستخدم"
                data-id="${escHtml(String(userId || ""))}"
                data-name="${escHtml(u.full_name || "")}"
                data-email="${escHtml(u.email || "")}"
                data-phone="${escHtml(u.phone || "")}"
                data-city="${escHtml(u.city || "")}"
                data-bio="${escHtml(u.bio || "")}"
                data-birthdate="${escHtml(toDateInputValue(u.birthdate))}"
                data-role="${escHtml(u.role || "User")}"
                data-status="${escHtml(u.status || "Active")}"
                style="padding:0.5rem;color:var(--primary);border-radius:var(--radius);background:var(--primary-light);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="delete-user-btn" title="حذف" aria-label="حذف المستخدم"
                data-id="${escHtml(String(userId || ""))}"
                data-name="${escHtml(u.full_name || "")}"
                style="padding:0.5rem;color:var(--danger);border-radius:var(--radius);background:#fee2e2;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
        })
        .join("");

      tbody.querySelectorAll(".edit-user-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!btn.dataset.id) {
            showNotification("لا يمكن تعديل مستخدم بدون معرف صالح", "error");
            return;
          }
          editingId = btn.dataset.id;
          if (modalTitle) modalTitle.textContent = "تعديل المستخدم";
          document.getElementById("uName").value = btn.dataset.name;
          document.getElementById("uEmail").value = btn.dataset.email;
          document.getElementById("uPhone").value = btn.dataset.phone;
          document.getElementById("uCity").value = btn.dataset.city;
          document.getElementById("uBio").value = btn.dataset.bio;
          document.getElementById("uBirthdate").value = btn.dataset.birthdate;
          document.getElementById("uRole").value = btn.dataset.role;
          document.getElementById("uStatus").value = btn.dataset.status;
          document.getElementById("uPassword").value = "";
          if (modal) modal.classList.add("show");
        });
      });

      tbody.querySelectorAll(".delete-user-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!btn.dataset.id) {
            showNotification("لا يمكن حذف مستخدم بدون معرف صالح", "error");
            return;
          }
          if (!confirm(`هل أنت متأكد من حذف المستخدم "${btn.dataset.name}"؟`))
            return;
          try {
            await API.deleteUser(btn.dataset.id);
            showNotification("تم حذف المستخدم بنجاح", "success");
            loadUsers();
          } catch (err) {
            showNotification(parseApiError(err), "error");
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger);">${err.status === 403 ? "ليس لديك صلاحية لعرض المستخدمين" : "تعذّر تحميل البيانات"}</td></tr>`;
    }
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "add-user.html";
    });
  }

  if (modalClose)
    modalClose.addEventListener(
      "click",
      () => modal && modal.classList.remove("show"),
    );
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });

  if (modalForm) {
    modalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!editingId) return;
      const pwd = document.getElementById("uPassword").value;
      const data = {
        full_name: document.getElementById("uName").value.trim(),
        email: document.getElementById("uEmail").value.trim(),
        role: document.getElementById("uRole").value,
        status: document.getElementById("uStatus").value,
        bio: document.getElementById("uBio").value.trim(),
        birthdate: document.getElementById("uBirthdate").value,
      };
      const phone = document.getElementById("uPhone").value.trim();
      const city = document.getElementById("uCity").value.trim();
      if (phone) data.phone = phone;
      if (city) data.city = city;
      if (pwd) data.password = pwd;

      const submitBtn = modalForm.querySelector('[type="submit"]');
      setButtonLoading(submitBtn, true);
      try {
        await API.updateUser(editingId, data);
        showNotification("تم تحديث المستخدم بنجاح", "success");
        modal.classList.remove("show");
        loadUsers();
      } catch (err) {
        showNotification(parseApiError(err), "error");
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  // Client-side search
  const searchInput = document.getElementById("usersSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.toLowerCase();
      tbody.querySelectorAll("tr").forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(term)
          ? ""
          : "none";
      });
    });
  }

  loadUsers();
}

// ===== Dashboard Reports Page =====
async function initDashboardReportsPage() {
  const tbody = document.getElementById("reportsTableBody");
  if (!tbody) return;

  async function loadReports() {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-400);">جاري التحميل...</td></tr>';
    try {
      const reportsRaw = await API.getReports();
      const reports = unwrapApiArray(reportsRaw, ["reports"]);
      const countEl = document.getElementById("reportsCount");
      if (countEl) countEl.textContent = reports.length;

      if (reports.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-400);">لا توجد إبلاغات</td></tr>';
        return;
      }
      tbody.innerHTML = reports
        .map((r) => {
          const postId = getEntityId(r.post) || firstDefined(r.postId, r.post_id);
          const reportId = firstDefined(r.id, r._id, r.report_id, r.reportId);
          return `
        <tr>
          <td>
            <div style="font-weight:500;color:var(--gray-900);font-size:0.875rem;">${escHtml(r.post?.title || `منشور #${postId}`)}</div>
            ${r.post?.category ? `<div style="font-size:0.75rem;color:var(--gray-500);">${escHtml(r.post.category)}</div>` : ""}
          </td>
          <td style="font-size:0.875rem;">${escHtml(r.user?.full_name || "-")}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.875rem;" title="${escHtml(r.reason || "")}">${escHtml(r.reason || "")}</td>
          <td style="font-size:0.875rem;color:var(--gray-500);">${r.createdAt ? new Date(r.createdAt).toLocaleDateString("ar-EG") : "-"}</td>
          <td>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              ${
                postId
                  ? `<a href="post.html?id=${escHtml(String(postId))}" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.375rem 0.625rem;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-lg);font-size:0.8rem;">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>عرض</a>`
                  : ""
              }
              <button class="delete-report-btn" aria-label="حذف الإبلاغ" data-id="${escHtml(String(reportId || ""))}" ${reportId ? "" : "disabled"}
                style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.375rem 0.625rem;background:#fee2e2;color:var(--danger);border-radius:var(--radius-lg);font-size:0.8rem;border:none;cursor:pointer;">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>حذف</button>
            </div>
          </td>
        </tr>`;
        })
        .join("");

      tbody.querySelectorAll(".delete-report-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!btn.dataset.id) {
            showNotification("لا يمكن حذف إبلاغ بدون معرف صالح", "error");
            return;
          }
          if (!confirm("هل أنت متأكد من حذف هذا الإبلاغ؟")) return;
          try {
            await API.deleteReport(btn.dataset.id);
            showNotification("تم حذف الإبلاغ بنجاح", "success");
            loadReports();
          } catch (err) {
            showNotification(parseApiError(err), "error");
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--danger);">${err.status === 403 ? "ليس لديك صلاحية لعرض الإبلاغات" : "تعذّر تحميل البيانات"}</td></tr>`;
    }
  }

  const searchInput = document.getElementById("reportsSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.toLowerCase();
      tbody.querySelectorAll("tr").forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(term)
          ? ""
          : "none";
      });
    });
  }

  loadReports();
}

// ===== Dashboard Categories Page =====
async function initDashboardCategoriesPage() {
  const tbody = document.getElementById("categoriesTableBody");
  if (!tbody) return;

  const addBtn = document.getElementById("addCategoryBtn");
  const modal = document.getElementById("categoryModal");
  const modalForm = document.getElementById("categoryModalForm");
  const modalTitle = document.getElementById("categoryModalTitle");
  const modalClose = document.getElementById("categoryModalClose");
  let editingId = null;
  let categorySaving = false;

  async function loadCategories() {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--gray-400);">جاري التحميل...</td></tr>';
    try {
      const catsRaw = await API.getCategories();
      const cats = unwrapApiArray(catsRaw, ["categories"]);
      const countEl = document.getElementById("categoriesCount");
      if (countEl) countEl.textContent = cats.length;

      if (cats.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--gray-400);">لا توجد تصنيفات</td></tr>';
        return;
      }
      tbody.innerHTML = cats
        .map((c) => {
          const categoryId = firstDefined(c.id, c._id, c.category_id, c.categoryId);
          const categoryName = firstDefined(c.name, c.title, c.category, "");
          return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div style="width:40px;height:40px;background:var(--primary-light);color:var(--primary);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;flex-shrink:0;">${escHtml((categoryName || "?")[0])}</div>
              <div>
                <div style="font-weight:500;color:var(--gray-900);">${escHtml(categoryName)}</div>
                ${c.description ? `<div style="font-size:0.75rem;color:var(--gray-500);">${escHtml(c.description)}</div>` : ""}
              </div>
            </div>
          </td>
          <td style="font-weight:500;">${firstDefined(c._count?.posts, c.postsCount, c.postCount, "-")}</td>
          <td style="font-size:0.875rem;color:var(--gray-500);">${c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-EG") : "-"}</td>
          <td>
            <div style="display:flex;gap:0.25rem;">
              <button class="edit-cat-btn" title="تعديل" aria-label="تعديل التصنيف"
                data-id="${escHtml(String(categoryId || ""))}"
                data-name="${escHtml(categoryName)}"
                data-desc="${escHtml(c.description || "")}"
                style="padding:0.5rem;color:var(--primary);border-radius:var(--radius);background:var(--primary-light);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="delete-cat-btn" title="حذف" aria-label="حذف التصنيف"
                data-id="${escHtml(String(categoryId || ""))}"
                data-name="${escHtml(categoryName)}"
                style="padding:0.5rem;color:var(--danger);border-radius:var(--radius);background:#fee2e2;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
        })
        .join("");

      tbody.querySelectorAll(".edit-cat-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!btn.dataset.id) {
            showNotification("لا يمكن تعديل تصنيف بدون معرف صالح", "error");
            return;
          }
          editingId = btn.dataset.id;
          if (modalTitle) modalTitle.textContent = "تعديل التصنيف";
          document.getElementById("catName").value = btn.dataset.name;
          document.getElementById("catDesc").value = btn.dataset.desc;
          if (modal) modal.classList.add("show");
        });
      });

      tbody.querySelectorAll(".delete-cat-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!btn.dataset.id) {
            showNotification("لا يمكن حذف تصنيف بدون معرف صالح", "error");
            return;
          }
          if (!confirm(`هل أنت متأكد من حذف التصنيف "${btn.dataset.name}"؟`))
            return;
          try {
            await API.deleteCategory(btn.dataset.id);
            showNotification("تم حذف التصنيف بنجاح", "success");
            loadCategories();
          } catch (err) {
            showNotification(parseApiError(err), "error");
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--danger);">${err.status === 403 ? "ليس لديك صلاحية لعرض التصنيفات" : "تعذّر تحميل البيانات"}</td></tr>`;
    }
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      editingId = null;
      if (modalTitle) modalTitle.textContent = "إضافة تصنيف جديد";
      if (modalForm) modalForm.reset();
      if (modal) modal.classList.add("show");
    });
  }

  if (modalClose)
    modalClose.addEventListener(
      "click",
      () => modal && modal.classList.remove("show"),
    );
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });

  if (modalForm) {
    modalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (categorySaving) return;
      categorySaving = true;
      const name = document.getElementById("catName").value.trim();
      const description =
        document.getElementById("catDesc").value.trim() || undefined;
      if (!name) {
        showNotification("اسم التصنيف مطلوب", "error");
        categorySaving = false;
        return;
      }
      if (name.length < 3) {
        showNotification("اسم التصنيف يجب أن يحتوي على 3 أحرف على الأقل", "error");
        categorySaving = false;
        return;
      }
      if (name.length > CATEGORY_NAME_MAX_LENGTH) {
        showNotification(`اسم التصنيف يجب ألا يتجاوز ${CATEGORY_NAME_MAX_LENGTH} حرفًا`, "error");
        categorySaving = false;
        return;
      }
      if (description && description.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
        showNotification(`وصف التصنيف يجب ألا يتجاوز ${CATEGORY_DESCRIPTION_MAX_LENGTH} حرفًا`, "error");
        categorySaving = false;
        return;
      }

      const submitBtn = modalForm.querySelector('[type="submit"]');
      setButtonLoading(submitBtn, true);
      try {
        if (editingId) {
          await API.updateCategory(editingId, { name, description });
          showNotification("تم تحديث التصنيف بنجاح", "success");
        } else {
          await API.createCategory(name, description);
          showNotification("تم إضافة التصنيف بنجاح", "success");
        }
        modal.classList.remove("show");
        loadCategories();
      } catch (err) {
        showNotification(parseApiError(err), "error");
      } finally {
        categorySaving = false;
        setButtonLoading(submitBtn, false);
      }
    });

  }

  const searchInput = document.getElementById("categoriesSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.toLowerCase();
      tbody.querySelectorAll("tr").forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(term)
          ? ""
          : "none";
      });
    });
  }

  loadCategories();
}

// ===== Page Greeting =====
function updatePageGreeting() {
  const greetingEl = document.getElementById("pageGreeting");
  if (!greetingEl) return;
  const user = getStoredUser();
  if (user && user.full_name) {
    const firstName = user.full_name.split(" ")[0];
    greetingEl.textContent = `مرحباً ${firstName}`;
  }
}

// ===== Logout =====
function initLogout() {
  document.querySelectorAll("a.logout, [data-logout]").forEach((el) => {
    if (el.dataset.logoutBound === "true") return;
    el.dataset.logoutBound = "true";
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await API.logout();
      } catch (err) {
        if (err?.status !== 401) {
          console.warn("Server logout failed; clearing the local session.", err);
        }
      } finally {
        clearAuth();
        const inPages = window.location.pathname.includes("/pages/");
        window.location.href = inPages ? "login.html" : "pages/login.html";
      }
    });
  });
}

// ===== Mobile Menu Toggle =====
function initMobileMenu() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn && mobileMenu) {
    menuBtn.setAttribute("aria-controls", "mobileMenu");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("show");
      menuBtn.setAttribute(
        "aria-expanded",
        mobileMenu.classList.contains("show") ? "true" : "false",
      );
    });
  }
}

// ===== User Dropdown Toggle =====
function initUserDropdown() {
  const userBtn = document.getElementById("userDropdownBtn");
  const userDropdown = document.getElementById("userDropdown");
  if (userBtn && userDropdown) {
    userBtn.setAttribute("role", "button");
    userBtn.setAttribute("tabindex", "0");
    userBtn.setAttribute("aria-controls", "userDropdown");
    userBtn.setAttribute("aria-expanded", "false");
    const toggleDropdown = (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
      userBtn.setAttribute(
        "aria-expanded",
        userDropdown.classList.contains("show") ? "true" : "false",
      );
    };
    userBtn.addEventListener("click", toggleDropdown);
    userBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDropdown(e);
      }
    });
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show");
      userBtn.setAttribute("aria-expanded", "false");
    });
  }
}

// ===== Dashboard Sidebar Toggle =====
function initSidebar() {
  const sidebarBtn = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("dashboardSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebarBtn && sidebar && overlay) {
    sidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("open");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
  }
}

function ensureDashboardLogoutLink() {
  const footer = document.querySelector(".dashboard-sidebar-footer");
  if (!footer || footer.querySelector("[data-logout]")) return;
  footer.insertAdjacentHTML(
    "beforeend",
    '<a href="login.html" class="logout" data-logout style="color:var(--danger);margin-top:0.75rem;">تسجيل الخروج</a>',
  );
}

function initHeaderUtilities() {
  document
    .querySelectorAll(".navbar-btn, .dashboard-topbar-right > button")
    .forEach((button) => {
      button.hidden = true;
    });

  document
    .querySelectorAll(
      ".navbar-search input, .mobile-search input, .dashboard-topbar-search input",
    )
    .forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const query = input.value.trim();
        if (!query) return;
        window.location.href = `${pageHref("feed.html")}?q=${encodeURIComponent(query)}`;
      });
    });
}

function initAccessibleControls() {
  document.querySelectorAll("button:not([aria-label])").forEach((button) => {
    const title = button.getAttribute("title");
    const visibleText = button.textContent.trim();
    if (title) {
      button.setAttribute("aria-label", title);
    } else if (!visibleText && button.closest(".star-rating")) {
      const stars = Array.from(button.closest(".star-rating").querySelectorAll("button"));
      const index = stars.indexOf(button) + 1;
      button.setAttribute("aria-label", `تقييم ${index} من 5`);
    } else if (!visibleText && button.id === "mobileMenuBtn") {
      button.setAttribute("aria-label", "فتح القائمة");
    } else if (!visibleText && button.id === "sidebarToggle") {
      button.setAttribute("aria-label", "فتح لوحة التنقل");
    } else if (!visibleText && button.id === "sidebarClose") {
      button.setAttribute("aria-label", "إغلاق لوحة التنقل");
    } else if (!visibleText && button.classList.contains("navbar-btn")) {
      button.setAttribute("aria-label", "الإشعارات");
    }
  });
}

// ===== Password Toggle =====
function initPasswordToggle() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const showIcon = btn.querySelector(".show-icon");
      const hideIcon = btn.querySelector(".hide-icon");
      if (input.type === "password") {
        input.type = "text";
        showIcon.style.display = "none";
        hideIcon.style.display = "block";
      } else {
        input.type = "password";
        showIcon.style.display = "block";
        hideIcon.style.display = "none";
      }
    });
  });
}

// ===== Star Rating =====
function initStarRating() {
  document.querySelectorAll(".star-rating").forEach((container) => {
    const stars = container.querySelectorAll("button");
    const ratingValue = container.querySelector(".rating-value");
    const hiddenRating = container
      .closest("form")
      ?.querySelector('input[type="hidden"][id$="Rating"]');
    let currentRating = 0;

    stars.forEach((star, index) => {
      star.addEventListener("mouseenter", () => updateStars(stars, index + 1));
      star.addEventListener("mouseleave", () =>
        updateStars(stars, currentRating),
      );
      star.addEventListener("click", () => {
        currentRating = index + 1;
        updateStars(stars, currentRating);
        if (hiddenRating) hiddenRating.value = String(currentRating);
        if (ratingValue) ratingValue.textContent = currentRating + " من 5";
      });
    });
  });
}

function updateStars(stars, rating) {
  stars.forEach((star, index) => {
    const filled = index < rating;
    star.classList.toggle("active", filled);
    star.querySelector("svg").style.fill = filled ? "#f59e0b" : "none";
  });
}

// ===== Image Upload =====
function initImageUpload() {
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("fileInput");
  const previewGrid = document.getElementById("imagePreview");
  let uploadedImages = [];

  if (uploadZone && fileInput) {
    uploadZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      Array.from(e.target.files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadedImages.push(ev.target.result);
          renderPreview();
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function renderPreview() {
    if (!previewGrid) return;
    previewGrid.innerHTML = uploadedImages
      .map(
        (src, i) => `
      <div class="image-preview-item">
        <img src="${src}" alt="صورة ${i + 1}">
        <button type="button" class="remove" onclick="removeImage(${i})" aria-label="إزالة الصورة ${i + 1}">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `,
      )
      .join("");
  }

  window.removeImage = function (index) {
    uploadedImages.splice(index, 1);
    renderPreview();
  };
}

// ===== Filter Tags =====
function initFilterTags() {
  const filterContainer = document.getElementById("filterTags");
  if (!filterContainer) return;
  filterContainer.querySelectorAll(".filter-tag").forEach((tag) => {
    tag.setAttribute("role", "button");
    tag.setAttribute("tabindex", "0");
    tag.addEventListener("click", () => {
      filterContainer
        .querySelectorAll(".filter-tag")
        .forEach((t) => t.classList.remove("active"));
      tag.classList.add("active");
    });
    tag.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        tag.click();
      }
    });
  });
}

// ===== Review Like Toggle (kept for pages without postId) =====
function initLikeToggle() {
  const likeBtn = document.getElementById("likeBtn");
  if (likeBtn && !new URLSearchParams(window.location.search).get("id")) {
    likeBtn.addEventListener("click", () => {
      likeBtn.classList.toggle("active");
      const count = likeBtn.querySelector(".count");
      if (count) {
        const cur = parseInt(count.textContent) || 0;
        count.textContent = likeBtn.classList.contains("active")
          ? cur + 1
          : cur - 1;
      }
    });
  }
}

// ===== Profile Edit Toggle =====
function initProfileEdit() {
  const editBtn = document.getElementById("editProfileBtn");
  const inputs = document.querySelectorAll(".profile-form .form-input");
  const editableInputs = Array.from(inputs).filter(
    (input) => input.id !== "profileEmail",
  );
  if (!editBtn) return;

  editBtn.addEventListener("click", async () => {
    const isEditing = editBtn.dataset.editing === "true";
    if (!isEditing) {
      editableInputs.forEach((input) => {
        input.removeAttribute("disabled");
        input.classList.remove("bg-gray");
      });
      editBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        حفظ البيانات
      `;
      editBtn.dataset.editing = "true";
    } else {
      const full_name = document.getElementById("profileName")?.value.trim();
      const phone = document.getElementById("profilePhone")?.value.trim();
      const city = document.getElementById("profileCity")?.value.trim();
      const bio = document.getElementById("profileBio")?.value.trim();
      const birthdate = document
        .getElementById("profileBirthdate")
        ?.value.trim();
      if (!full_name) {
        showNotification("الاسم الكامل مطلوب", "error");
        return;
      }

      const payload = { full_name };
      if (phone) payload.phone = phone;
      if (city) payload.city = city;
      payload.bio = bio || "";
      if (birthdate) payload.birthdate = birthdate;

      setButtonLoading(editBtn, true);
      try {
        await API.updateProfile(payload);
        const updated = await API.getProfile();
        setStoredUser(updated);
        updateNavbarUser(updated);
        editableInputs.forEach((input) => {
          input.setAttribute("disabled", "true");
          input.classList.add("bg-gray");
        });
        editBtn.dataset.editing = "false";
        showNotification("تم حفظ البيانات بنجاح!", "success");
      } catch (err) {
        showNotification(parseApiError(err), "error");
      } finally {
        setButtonLoading(editBtn, false);
        if (editBtn.dataset.editing === "false") {
          editBtn.innerHTML = "تعديل البيانات";
        }
      }
    }
  });
}

// ===== Notification =====
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);
    padding:12px 24px;border-radius:12px;font-size:14px;font-weight:500;
    z-index:9999;animation:slideDown 0.3s ease;white-space:pre-line;
    width:max-content;max-width:min(92vw,720px);text-align:right;line-height:1.7;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.style.background = type === "success" ? "#dcfce7" : "#fee2e2";
  notification.style.color = type === "success" ? "#16a34a" : "#dc2626";
  document.body.appendChild(notification);
  const duration = String(message).length > 120 ? 7000 : 3500;
  setTimeout(() => {
    notification.style.animation = "slideUp 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// ===== SVG Icons Helper =====
const Icons = {
  search: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  bell: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  chevronDown: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronLeft: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>`,
  menu: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
  x: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  user: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  star: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  heart: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  messageCircle: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  flag: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  send: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  trash2: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  edit: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  logout: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};
window.Icons = Icons;

// ===== Initialize on DOM Ready =====
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await ensurePageAccess())) return;

  // UI always
  initMobileMenu();
  initUserDropdown();
  initSidebar();
  ensureDashboardLogoutLink();
  initHeaderUtilities();
  initAccessibleControls();
  initPasswordToggle();
  initStarRating();
  initImageUpload();
  initLogout();

  // Populate navbar with cached user
  const cachedUser = getStoredUser();
  if (cachedUser) {
    updateNavbarUser(cachedUser);
    updateRoleBasedUI(cachedUser);
  }

  // Page-specific
  initLoginPage();
  initRegisterPage();
  initProfilePage();
  initPublicProfilePage();
  initProfileEdit();
  initAddReviewPage();
  initReviewDetailPage();
  initFeedPage();
  initMyPostsPage();
  initLikeToggle();
  initIndexPage();
  initContactPage();
  initSettingsPage();
  initDashboardPage();
  initDashboardUsersPage();
  initDashboardReportsPage();
  initDashboardCategoriesPage();
  updatePageGreeting();
});

// Slide animations
const style = document.createElement("style");
style.textContent = `
  html.auth-checking body { visibility:hidden; }
  @keyframes slideDown {
    from { transform: translate(-50%, -20px); opacity: 0; }
    to   { transform: translate(-50%, 0);     opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translate(-50%, 0);     opacity: 1; }
    to   { transform: translate(-50%, -20px); opacity: 0; }
  }
`;
document.head.appendChild(style);
