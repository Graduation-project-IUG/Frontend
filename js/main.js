// ===== ملتقى - ملف JavaScript الرئيسي =====

// ===== API Configuration =====
const API_BASE = 'https://graduation-project-swart-beta.vercel.app/api';

// ===== CSRF Helper =====
async function getCsrfToken() {
  let token = sessionStorage.getItem('csrfToken');
  if (token) return token;
  try {
    const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      token = data.csrfToken;
      sessionStorage.setItem('csrfToken', token);
    }
  } catch {}
  return token;
}

// ===== API Fetch Wrapper =====
async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (unsafeMethods.includes(method)) {
    const csrf = await getCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  let res;
  console.log(`API Request: ${method} ${path}`, options);
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
    });
  } catch (networkErr) {
    const error = new Error('تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.');
    error.status = 0;
    error.data = {};
    throw error;
  }

  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem('csrfToken');
  }

  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch {}

  if (!res.ok) {
    const error = new Error(json.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = json;
    throw error;
  }

  return json;
}

// ===== API Methods =====
const API = {
  // Auth
  login:    (email, password)             => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout:   ()                            => apiFetch('/auth/logout',   { method: 'POST' }),

  // User
  register: (full_name, email, password)  => apiFetch('/user/register', { method: 'POST', body: JSON.stringify({ full_name, email, password }) }),
  getProfile: ()                          => apiFetch('/user/profile'),

  // Posts
  createPost:  (category, title, description) => apiFetch('/post',       { method: 'POST',   body: JSON.stringify({ category, title, description }) }),
  getPost:     (id)                           => apiFetch(`/post/${id}`),
  updatePost:  (id, data)                     => apiFetch(`/post/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  deletePost:  (id)                           => apiFetch(`/post/${id}`, { method: 'DELETE' }),
  getMyPosts:  ()                             => apiFetch('/post'),

  // Comments
  createComment: (post_id, content, rating) => apiFetch(`/comment/${post_id}`, { method: 'POST',   body: JSON.stringify({ content, rating }) }),
  getComment:    (id)                       => apiFetch(`/comment/${id}`),
  updateComment: (id, data)                 => apiFetch(`/comment/${id}`,      { method: 'PUT',    body: JSON.stringify(data) }),
  deleteComment: (id)                       => apiFetch(`/comment/${id}`,      { method: 'DELETE' }),

  // Reactions
  saveReaction:   (post_id, reaction) => apiFetch(`/reaction/${post_id}`, { method: 'POST',   body: JSON.stringify({ reaction }) }),
  getReaction:    (id)                => apiFetch(`/reaction/${id}`),
  updateReaction: (id, reaction)      => apiFetch(`/reaction/${id}`,      { method: 'PUT',    body: JSON.stringify({ reaction }) }),
  deleteReaction: (id)                => apiFetch(`/reaction/${id}`,      { method: 'DELETE' }),

  // Reports
  saveReport:   (post_id, reason) => apiFetch(`/report/${post_id}`, { method: 'POST',   body: JSON.stringify({ reason }) }),
  getReport:    (id)              => apiFetch(`/report/${id}`),
  updateReport: (id, reason)      => apiFetch(`/report/${id}`,      { method: 'PUT',    body: JSON.stringify({ reason }) }),
  deleteReport: (id)              => apiFetch(`/report/${id}`,      { method: 'DELETE' }),
};

// ===== Auth State Helpers =====
function getStoredUser() {
  try { return JSON.parse(sessionStorage.getItem('currentUser')); } catch { return null; }
}
function setStoredUser(user) {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}
function clearAuth() {
  sessionStorage.removeItem('csrfToken');
  sessionStorage.removeItem('currentUser');
}

// ===== Button Loading State =====
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.innerHTML = '<span>جاري...</span>';
  } else {
    btn.disabled = false;
    btn.style.opacity = '';
    btn.innerHTML = btn._originalHtml || btn.innerHTML;
  }
}

// ===== Error Message Parser =====
function parseApiError(err) {
  if (Array.isArray(err?.data?.message)) {
    return err.data.message.map(e => e.message || JSON.stringify(e)).join(' | ');
  }
  if (typeof err?.data?.message === 'string') return err.data.message;
  return err?.message || 'حدث خطأ غير متوقع';
}

// ===== Navbar User Update =====
function updateNavbarUser(user) {
  if (!user) return;
  document.querySelectorAll('.navbar-user-info .name, .user-dropdown-header .name').forEach(el => {
    el.textContent = user.full_name || el.textContent;
  });
  document.querySelectorAll('.user-dropdown-header .email').forEach(el => {
    el.textContent = user.email || el.textContent;
  });
}

// ===== Login Page =====
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    setButtonLoading(submitBtn, true);
    try {
      const data = await API.login(email, password);
      if (data.csrfToken) sessionStorage.setItem('csrfToken', data.csrfToken);
      try {
        const profile = await API.getProfile();
        setStoredUser(profile);
      } catch {}
      window.location.href = '../index.html';
    } catch (err) {
      showNotification(parseApiError(err) || 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ===== Register Page =====
function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = document.getElementById('registerName').value.trim();
    const email     = document.getElementById('registerEmail').value.trim();
    const password  = document.getElementById('registerPassword').value;

    setButtonLoading(submitBtn, true);
    try {
      await API.register(full_name, email, password);
      showNotification('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1800);
    } catch (err) {
      showNotification(parseApiError(err), 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ===== Profile Page =====
async function initProfilePage() {
  if (!document.getElementById('profileEmail')) return;

  try {
    const profile = await API.getProfile();
    setStoredUser(profile);
    updateNavbarUser(profile);

    const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    set('profileName',  profile.full_name);
    set('profileEmail', profile.email);
    set('profilePhone', profile.phone);
    set('profileBio',   profile.bio);
    set('profileCity',  profile.city);

    const nameH1 = document.querySelector('.profile-info h1');
    if (nameH1 && profile.full_name) nameH1.textContent = profile.full_name;

    const cityCard = document.querySelector('.profile-stat-card .value');
    if (cityCard && profile.city) cityCard.textContent = profile.city;

    const locationEl = document.querySelector('.profile-info .location');
    if (locationEl && profile.city) {
      const svgEl = locationEl.querySelector('svg');
      locationEl.innerHTML = (svgEl ? svgEl.outerHTML : '') + ' ' + profile.city;
    }
  } catch (err) {
    if (err.status === 401) {
      showNotification('يجب تسجيل الدخول أولاً', 'error');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    }
  }
}

// ===== Add Review Page =====
function initAddReviewPage() {
  const form = document.getElementById('addReviewForm');
  if (!form) return;

  const ratingInput = document.getElementById('postRating');
  const submitBtn   = form.querySelector('[type="submit"]');

  // Char counter
  const descEl    = document.getElementById('postDescription');
  const counterEl = document.querySelector('.char-counter');
  if (descEl && counterEl) {
    descEl.addEventListener('input', () => {
      counterEl.textContent = `${descEl.value.length} / 1500 حرف`;
    });
  }

  // Edit mode: load existing post data
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  if (editId) {
    const heading = document.querySelector('h1');
    if (heading) heading.textContent = 'تعديل المراجعة';
    API.getPost(editId).then(post => {
      const titleEl    = document.getElementById('postTitle');
      const categoryEl = document.getElementById('postCategory');
      if (titleEl)    titleEl.value    = post.title       || '';
      if (categoryEl) categoryEl.value = post.category    || '';
      if (descEl)     descEl.value     = post.description || '';
      if (counterEl && descEl) counterEl.textContent = `${descEl.value.length} / 1500 حرف`;
    }).catch(() => showNotification('تعذّر تحميل بيانات المنشور', 'error'));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category    = document.getElementById('postCategory').value;
    const title       = document.getElementById('postTitle').value.trim();
    const description = descEl ? descEl.value.trim() : '';

    if (!category) { showNotification('الرجاء اختيار التصنيف', 'error'); return; }
    if (!title)    { showNotification('الرجاء إدخال العنوان', 'error'); return; }

    setButtonLoading(submitBtn, true);
    try {
      if (editId) {
        await API.updatePost(editId, { category, title, description: description || undefined });
        showNotification('تم تحديث المراجعة بنجاح!', 'success');
      } else {
        await API.createPost(category, title, description || undefined);
        showNotification('تم نشر المراجعة بنجاح!', 'success');
      }
      setTimeout(() => { window.location.href = 'my-posts.html'; }, 1500);
    } catch (err) {
      showNotification(err.status === 401 ? 'يجب تسجيل الدخول أولاً' : parseApiError(err), 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ===== Review Detail Page =====
async function initReviewDetailPage() {
  if (!document.getElementById('commentForm') && !document.getElementById('likeBtn')) return;

  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  // Load post from API if ?id= is present
  if (postId) {
    try {
      const post = await API.getPost(postId);
      const titleEl = document.querySelector('[data-post-title]');
      const descEl  = document.querySelector('[data-post-desc]');
      const badgeEl = document.querySelector('.review-detail-badge');
      if (titleEl) titleEl.textContent = post.title;
      if (descEl)  descEl.textContent  = post.description || '';
      if (badgeEl) badgeEl.textContent = post.category;
    } catch (err) {
      if (err.status === 401) showNotification('يجب تسجيل الدخول للاطلاع على التفاصيل', 'error');
    }
  }

  // Like / Reaction button
  const likeBtn = document.getElementById('likeBtn');
  if (likeBtn && postId) {
    likeBtn.addEventListener('click', async () => {
      const isActive = likeBtn.classList.contains('active');
      const countEl  = likeBtn.querySelector('.count');
      try {
        await API.saveReaction(postId, isActive ? 0 : 1);
        likeBtn.classList.toggle('active');
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + (isActive ? -1 : 1);
      } catch (err) {
        showNotification(err.status === 401 ? 'يجب تسجيل الدخول أولاً' : parseApiError(err), 'error');
      }
    });
  }

  // Comment form
  const commentForm = document.getElementById('commentForm');
  if (commentForm && postId) {
    const commentRatingInput = document.getElementById('commentRating');
    commentForm.querySelectorAll('.star-rating button').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        if (commentRatingInput) commentRatingInput.value = i + 1;
      });
    });

    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = document.getElementById('commentContent').value.trim();
      const rating  = parseInt(commentRatingInput?.value || '0');
      if (!content) { showNotification('الرجاء كتابة تعليق', 'error'); return; }

      const submitBtn = commentForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true);
      try {
        await API.createComment(postId, content, rating);
        showNotification('تم إرسال التعليق بنجاح!', 'success');
        document.getElementById('commentContent').value = '';
        if (commentRatingInput) commentRatingInput.value = '0';
      } catch (err) {
        showNotification(err.status === 401 ? 'يجب تسجيل الدخول أولاً' : parseApiError(err), 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  // Report button
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn && postId) {
    reportBtn.addEventListener('click', async () => {
      const reason = prompt('الرجاء ذكر سبب الإبلاغ (8 أحرف على الأقل):');
      if (!reason) return;
      if (reason.trim().length < 8) { showNotification('سبب الإبلاغ قصير جداً (8 أحرف على الأقل)', 'error'); return; }
      try {
        await API.saveReport(postId, reason.trim());
        showNotification('تم الإبلاغ عن هذا المنشور بنجاح، شكراً لك', 'success');
        reportBtn.disabled = true;
        reportBtn.style.opacity = '0.5';
      } catch (err) {
        showNotification(err.status === 401 ? 'يجب تسجيل الدخول أولاً' : parseApiError(err), 'error');
      }
    });
  }
}

// ===== My Posts Page =====
function initMyPostsPage() {
  if (!document.getElementById('postsList')) return;

  // Delete buttons
  document.querySelectorAll('.post-actions .delete[data-post-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
      try {
        await API.deletePost(postId);
        btn.closest('.post-card')?.remove();
        showNotification('تم حذف المنشور بنجاح', 'success');
      } catch (err) {
        showNotification(err.status === 401 ? 'يجب تسجيل الدخول أولاً' : parseApiError(err), 'error');
      }
    });
  });

  // Edit buttons → navigate to add-review.html?edit=id
  document.querySelectorAll('.post-actions .edit-btn[data-post-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = `add-review.html?edit=${btn.dataset.postId}`;
    });
  });
}

// ===== Logout =====
function initLogout() {
  document.querySelectorAll('a.logout').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await API.logout(); } catch {}
      clearAuth();
      const inPages = window.location.pathname.includes('/pages/');
      window.location.href = inPages ? 'login.html' : 'pages/login.html';
    });
  });
}

// ===== Mobile Menu Toggle =====
function initMobileMenu() {
  const menuBtn   = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('show');
    });
  }
}

// ===== User Dropdown Toggle =====
function initUserDropdown() {
  const userBtn     = document.getElementById('userDropdownBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      userDropdown.classList.remove('show');
    });
  }
}

// ===== Dashboard Sidebar Toggle =====
function initSidebar() {
  const sidebarBtn = document.getElementById('sidebarToggle');
  const sidebar    = document.getElementById('dashboardSidebar');
  const overlay    = document.getElementById('sidebarOverlay');
  if (sidebarBtn && sidebar && overlay) {
    sidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('open');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

// ===== Password Toggle =====
function initPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input    = btn.parentElement.querySelector('input');
      const showIcon = btn.querySelector('.show-icon');
      const hideIcon = btn.querySelector('.hide-icon');
      if (input.type === 'password') {
        input.type = 'text';
        showIcon.style.display = 'none';
        hideIcon.style.display = 'block';
      } else {
        input.type = 'password';
        showIcon.style.display = 'block';
        hideIcon.style.display = 'none';
      }
    });
  });
}

// ===== Star Rating =====
function initStarRating() {
  document.querySelectorAll('.star-rating').forEach(container => {
    const stars       = container.querySelectorAll('button');
    const ratingValue = container.querySelector('.rating-value');
    let currentRating = 0;

    stars.forEach((star, index) => {
      star.addEventListener('mouseenter', () => updateStars(stars, index + 1));
      star.addEventListener('mouseleave', () => updateStars(stars, currentRating));
      star.addEventListener('click', () => {
        currentRating = index + 1;
        updateStars(stars, currentRating);
        if (ratingValue) ratingValue.textContent = currentRating + ' من 5';
      });
    });
  });
}

function updateStars(stars, rating) {
  stars.forEach((star, index) => {
    const filled = index < rating;
    star.classList.toggle('active', filled);
    star.querySelector('svg').style.fill = filled ? '#f59e0b' : 'none';
  });
}

// ===== Image Upload =====
function initImageUpload() {
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const previewGrid = document.getElementById('imagePreview');
  let uploadedImages = [];

  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
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
    previewGrid.innerHTML = uploadedImages.map((src, i) => `
      <div class="image-preview-item">
        <img src="${src}" alt="صورة ${i + 1}">
        <button type="button" class="remove" onclick="removeImage(${i})">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `).join('');
  }

  window.removeImage = function(index) {
    uploadedImages.splice(index, 1);
    renderPreview();
  };
}

// ===== Filter Tags =====
function initFilterTags() {
  const filterContainer = document.getElementById('filterTags');
  if (!filterContainer) return;
  filterContainer.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      filterContainer.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
    });
  });
}

// ===== Review Like Toggle (kept for pages without postId) =====
function initLikeToggle() {
  const likeBtn = document.getElementById('likeBtn');
  if (likeBtn && !new URLSearchParams(window.location.search).get('id')) {
    likeBtn.addEventListener('click', () => {
      likeBtn.classList.toggle('active');
      const count = likeBtn.querySelector('.count');
      if (count) {
        const cur = parseInt(count.textContent) || 0;
        count.textContent = likeBtn.classList.contains('active') ? cur + 1 : cur - 1;
      }
    });
  }
}

// ===== Profile Edit Toggle =====
function initProfileEdit() {
  const editBtn = document.getElementById('editProfileBtn');
  const inputs  = document.querySelectorAll('.profile-form .form-input');
  if (!editBtn) return;

  editBtn.addEventListener('click', () => {
    const isEditing = editBtn.dataset.editing === 'true';
    if (!isEditing) {
      inputs.forEach(input => { input.removeAttribute('disabled'); input.classList.remove('bg-gray'); });
      editBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        حفظ البيانات
      `;
      editBtn.dataset.editing = 'true';
    } else {
      inputs.forEach(input => { input.setAttribute('disabled', 'true'); input.classList.add('bg-gray'); });
      editBtn.innerHTML  = 'تعديل البيانات';
      editBtn.dataset.editing = 'false';
      showNotification('تم حفظ البيانات بنجاح!', 'success');
    }
  });
}

// ===== Notification =====
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);
    padding:12px 24px;border-radius:12px;font-size:14px;font-weight:500;
    z-index:9999;animation:slideDown 0.3s ease;white-space:nowrap;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
  notification.style.color      = type === 'success' ? '#16a34a' : '#dc2626';
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== SVG Icons Helper =====
const Icons = {
  search: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  bell: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  chevronDown: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`,
  menu: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
  x: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  user: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  star: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  heart: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  send: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  trash2: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  edit: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  logout: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};
window.Icons = Icons;

// ===== Initialize on DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  // UI always
  initMobileMenu();
  initUserDropdown();
  initSidebar();
  initPasswordToggle();
  initStarRating();
  initImageUpload();
  initFilterTags();
  initLogout();

  // Populate navbar with cached user
  const cachedUser = getStoredUser();
  if (cachedUser) updateNavbarUser(cachedUser);

  // Page-specific
  initLoginPage();
  initRegisterPage();
  initProfilePage();
  initProfileEdit();
  initAddReviewPage();
  initReviewDetailPage();
  initMyPostsPage();
  initLikeToggle();
});

// Slide animations
const style = document.createElement('style');
style.textContent = `
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
