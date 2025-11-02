// Bolt-Pass frontend logic with fixes for Settings Modal, Performance, Accessibility, and Error Handling

// Enhanced API layer with better error handling
const api = {
  post: (path, body) => fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader()
    },
    body: JSON.stringify(body)
  }).then(handleJSON),

  get: (path) => fetch(path, {
    headers: { 'Authorization': authHeader() }
  }).then(handleJSON),

  put: (path, body) => fetch(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader()
    },
    body: JSON.stringify(body)
  }).then(handleJSON),

  delete: (path) => fetch(path, {
    method: 'DELETE',
    headers: { 'Authorization': authHeader() }
  }).then(handleJSON)
};

function authHeader(){
  const t = localStorage.getItem('bp_token');
  return t ? `Bearer ${t}` : '';
}

// Enhanced error handling for API responses
function handleJSON(res){
  if (!res.ok) {
    return res.json().then(e => {
      console.error('API Error:', e);
      throw new Error(e.error || `HTTP ${res.status}: ${res.statusText}`);
    }).catch(err => {
      if (err instanceof Error) throw err;
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    });
  }
  return res.json();
}

// Performance: Cache DOM elements
const elements = {};
const qs = (selector) => {
  if (!elements[selector]) {
    elements[selector] = document.querySelector(selector);
  }
  return elements[selector];
};

// Main DOM elements
const authSection = qs('#authSection');
const vaultSection = qs('#vaultSection');
const userArea = qs('#userArea');
const loginForm = qs('#loginForm');
const registerForm = qs('#registerForm');
const tabLogin = qs('#tabLogin');
const tabRegister = qs('#tabRegister');
const fillDemo = qs('#fillDemo');
const entriesEl = qs('#entries');
const searchInput = qs('#searchInput');
const filtersEl = qs('#filters');
const fabAdd = qs('#fabAdd');

// Sidebar elements
const sidebar = qs('#sidebar');
const sidebarBackdrop = qs('#sidebarBackdrop');
const sidebarTitle = qs('#sidebarTitle');
const sidebarForm = qs('#sidebarForm');
const closeSidebarBtn = qs('#closeSidebar');
const cancelSidebarBtn = qs('#cancelSidebar');
const editIdInput = qs('#editId');
const sidebarTitleInput = qs('#sidebarTitleInput');
const sidebarWebsite = qs('#sidebarWebsite');
const sidebarEmail = qs('#sidebarEmail');
const sidebarPassword = qs('#sidebarPassword');
const sidebarCategory = qs('#sidebarCategory');
const strengthFill = qs('#strengthFill');
const strengthLabel = qs('#strengthLabel');
const togglePwEye = qs('#togglePwEye');
const genPw = qs('#genPw');
const errTitle = qs('#err-title');
const errPassword = qs('#err-password');

// View/Edit mode elements
const viewMode = qs('#viewMode');
const editMode = qs('#editMode');
const editBtn = qs('#editBtn');
const menuBtn = qs('#menuBtn');
const menuDropdown = qs('#menuDropdown');
const deleteBtn = qs('#deleteBtn');
const toggleViewPw = qs('#toggleViewPw');
const toast = qs('#toast');
const viewTitle = qs('#viewTitle');
const viewWebsite = qs('#viewWebsite');
const viewEmail = qs('#viewEmail');
const viewPassword = qs('#viewPassword');
const viewCategory = qs('#viewCategory');
const viewCreated = qs('#viewCreated');
const viewModified = qs('#viewModified');

// Settings modal elements
const settingsModal = qs('#settingsModal');
const settingsBackdrop = qs('#settingsBackdrop');
const settingsBtn = qs('#settingsBtn');
const closeSettingsBtn = qs('#closeSettings');
const modalLogoutBtn = qs('#modalLogoutBtn');
const modalStatTotal = qs('#modalStatTotal');
const modalStatWeak = qs('#modalStatWeak');
const modalStatStrong = qs('#modalStatStrong');
const settingsUserEmail = qs('#settingsUserEmail');

// Header edit controls
const saveHeaderBtn = qs('#saveHeaderBtn');
const cancelHeaderBtn = qs('#cancelHeaderBtn');

// Application state
let allEntries = [];
let activeCategory = 'All';
let currentViewData = null;
let currentMode = 'add'; // 'add', 'view', 'edit'
let currentStats = { total: 0, weak: 0, strong: 0 };
let searchTimeout = null; // For debounced search

// Utility functions
function show(el){ if (el) el.classList.remove('hidden'); }
function hide(el){ if (el) el.classList.add('hidden'); }

// Enhanced user management with better error handling
function setUser(username){
  try {
    if (userArea) userArea.textContent = username || '';
    if (settingsUserEmail) settingsUserEmail.textContent = username || '';

    if (username) {
      show(settingsBtn);
    } else {
      hide(settingsBtn);
    }
  } catch (error) {
    console.error('Error setting user:', error);
  }
}

function setToken(token, username){
  try {
    if (token) {
      localStorage.setItem('bp_token', token);
      localStorage.setItem('bp_user', username);
      setUser(username);
    } else {
      localStorage.removeItem('bp_token');
      localStorage.removeItem('bp_user');
      setUser('');
    }
  } catch (error) {
    console.error('Error managing token:', error);
    showToast('Session error occurred', 'error');
  }
}

function checkAuth(){
  try {
    const t = localStorage.getItem('bp_token');
    const u = localStorage.getItem('bp_user');
    if (t && u) {
      setUser(u);
      hide(authSection);
      show(vaultSection);
      loadData();
    } else {
      show(authSection);
      hide(vaultSection);
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    show(authSection);
    hide(vaultSection);
  }
}

// Enhanced Settings Modal with proper focus management and accessibility
function openSettingsModal() {
  try {
    if (!settingsModal || !settingsBackdrop) {
      console.error('Settings modal elements not found');
      showToast('Settings unavailable', 'error');
      return;
    }

    // Store currently focused element for return focus
    const previouslyFocused = document.activeElement;

    // Add active classes to show the modal
    settingsModal.classList.add('active');
    settingsBackdrop.classList.add('active');

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Update stats in modal from cache
    updateModalStats();

    // Enhanced focus management for accessibility
    setTimeout(() => {
      if (closeSettingsBtn) {
        closeSettingsBtn.focus();
      }
    }, 100);

    // Store reference for focus return
    settingsModal.dataset.previousFocus = previouslyFocused?.id || '';

    // Add keyboard event listener for ESC key
    document.addEventListener('keydown', handleSettingsKeydown);

  } catch (error) {
    console.error('Error opening settings modal:', error);
    showToast('Failed to open settings', 'error');
  }
}

function closeSettingsModal() {
  try {
    if (!settingsModal || !settingsBackdrop) return;

    // Remove active classes to hide the modal
    settingsModal.classList.remove('active');
    settingsBackdrop.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';

    // Remove keyboard event listener
    document.removeEventListener('keydown', handleSettingsKeydown);

    // Return focus to previously focused element or settings button
    const previousFocusId = settingsModal.dataset.previousFocus;
    const previousElement = previousFocusId ? document.getElementById(previousFocusId) : null;

    setTimeout(() => {
      if (previousElement && previousElement.offsetParent !== null) {
        previousElement.focus();
      } else if (settingsBtn) {
        settingsBtn.focus();
      }
    }, 100);

  } catch (error) {
    console.error('Error closing settings modal:', error);
  }
}

function handleSettingsKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSettingsModal();
  }

  // Enhanced focus trap
  if (event.key === 'Tab') {
    trapFocusInModal(event, settingsModal);
  }
}

function updateModalStats() {
  try {
    if (modalStatTotal) modalStatTotal.textContent = String(currentStats.total);
    if (modalStatWeak) modalStatWeak.textContent = String(currentStats.weak);
    if (modalStatStrong) modalStatStrong.textContent = String(currentStats.strong);
  } catch (error) {
    console.error('Error updating modal stats:', error);
  }
}

// Focus trap utility for better accessibility
function trapFocusInModal(event, modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }
}

// Enhanced data loading with better error handling and performance
async function loadData(){
  try {
    let entries = [];
    let stats = null;

    // Show loading state
    if (entriesEl) {
      entriesEl.innerHTML = '<div class="card">Loading passwords...</div>';
    }

    // Try titles endpoint first for better performance
    try {
      const titlesRes = await api.get('/api/entries/titles');
      if (Array.isArray(titlesRes.items)) {
        entries = titlesRes.items.map(x => ({
          id: x.id,
          title: x.title || 'Untitled',
          website_url: x.website_url || '',
          email: x.email || '',
          username: x.username || '',
          category: x.category || 'General',
          updated_at: x.updated_at,
          strength: x.strength || 'weak'
        }));
      }
    } catch (titlesError) {
      console.log('Titles endpoint unavailable, falling back to full entries');

      // Fallback to full entries if titles route not available
      try {
        const full = await api.get('/api/entries');
        if (Array.isArray(full.items)) {
          entries = full.items.map(x => ({
            id: x.id,
            title: x.title || 'Untitled',
            website_url: x.website_url || '',
            email: x.email || '',
            username: x.username || '',
            category: x.category || 'General',
            updated_at: x.updated_at,
            _password: x.password || ''
          })).map(e => ({...e, strength: strengthOf(e._password)}));

          // Compute stats locally if needed
          stats = computeStatsFromEntries(full.items);
        }
      } catch (fullError) {
        throw new Error('Failed to load entries from any endpoint');
      }
    }

    // Try fetching stats from server if not computed already
    if (!stats) {
      try {
        stats = await api.get('/api/entries/stats');
      } catch (statsError) {
        console.log('Stats endpoint unavailable, computing locally');
        stats = { total: entries.length, weak: 0, strong: 0 };
      }
    }

    // Update application state
    allEntries = entries;
    currentStats = {
      total: stats.total ?? entries.length,
      weak: stats.weak ?? 0,
      strong: stats.strong ?? 0
    };

    // Update modal stats as well
    updateModalStats();

    // Apply current filters and render
    applyFilters();

  } catch (error) {
    console.error('Failed to load data:', error);

    if (entriesEl) {
      entriesEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <h3>⚠️ Failed to load passwords</h3>
          <p>Please check your connection and try again.</p>
          <button onclick="loadData()" class="primary" style="margin-top: 16px;">Retry</button>
        </div>
      `;
    }

    showToast('Failed to load passwords', 'error');
  }
}

// Enhanced password utilities
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=[]{}<>?';
  let length = 16;
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randInt(0, charset.length - 1)];
  }
  return password;
}

function strengthOf(pw) {
  const len = (pw || '').length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSym = /[^A-Za-z0-9]/.test(pw);
  const diversity = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;

  if (len >= 12 && diversity >= 3) return 'strong';
  if (len >= 8 && diversity >= 2) return 'medium';
  return 'weak';
}

function computeStatsFromEntries(items){
  let total = 0, weak = 0, strong = 0;
  for (const item of items) {
    total++;
    const pw = item.password || '';
    const strength = strengthOf(pw);
    if (strength === 'strong') strong++;
    else if (strength === 'weak') weak++;
  }
  return { total, weak, strong };
}

// Performance: Debounced search
function applyFilters(){
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    try {
      const query = (searchInput?.value || '').toLowerCase();
      let items = allEntries.slice();

      // Apply category filter
      if (activeCategory && activeCategory !== 'All') {
        items = items.filter(item =>
          (item.category || '').toLowerCase() === activeCategory.toLowerCase()
        );
      }

      // Apply search filter
      if (query) {
        items = items.filter(item =>
          (item.title || '').toLowerCase().includes(query) ||
          (item.email || '').toLowerCase().includes(query) ||
          (item.username || '').toLowerCase().includes(query) ||
          (item.website_url || '').toLowerCase().includes(query)
        );
      }

      renderEntries(items);
    } catch (error) {
      console.error('Error applying filters:', error);
      showToast('Search error occurred', 'error');
    }
  }, 150); // Debounce search by 150ms
}

// Enhanced UI utilities
function updateStrengthUI() {
  try {
    if (!sidebarPassword || !strengthFill || !strengthLabel) return;

    const pw = sidebarPassword.value;
    const strength = strengthOf(pw);

    let width = 0, color = '#dc2626', label = 'Weak';

    if (strength === 'weak') {
      width = Math.min(33, pw.length * 4);
      color = '#dc2626';
      label = 'Weak';
    }
    if (strength === 'medium') {
      width = 66;
      color = '#ca8a04';
      label = 'Medium';
    }
    if (strength === 'strong') {
      width = 100;
      color = '#16a34a';
      label = 'Strong';
    }

    strengthFill.style.width = width + '%';
    strengthFill.style.background = color;
    strengthLabel.textContent = label;
  } catch (error) {
    console.error('Error updating strength UI:', error);
  }
}

function clearErrors(){
  try {
    if (errTitle) errTitle.textContent = '';
    if (errPassword) errPassword.textContent = '';
  } catch (error) {
    console.error('Error clearing form errors:', error);
  }
}

function validate(){
  try {
    clearErrors();
    let isValid = true;

    if (!sidebarTitleInput?.value?.trim()) {
      if (errTitle) errTitle.textContent = 'Title is required.';
      isValid = false;
    }

    if (!sidebarPassword?.value) {
      if (errPassword) errPassword.textContent = 'Password is required.';
      isValid = false;
    }

    return isValid;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Security: HTML escaping functions
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

// Utility functions for rendering
function firstLetter(str) {
  const char = (str || '').trim().charAt(0).toUpperCase();
  return char || '•';
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString();
  } catch {
    return '-';
  }
}

function formatLastUsed(dateStr) {
  if (!dateStr) return 'Never';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

// Enhanced entry rendering with performance optimizations
function renderEntries(items) {
  try {
    if (!entriesEl) return;

    // Clear existing entries
    entriesEl.innerHTML = '';

    if (!items.length) {
      // Empty state
      entriesEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔐</div>
          <div class="empty-title">No passwords found</div>
          <div class="empty-subtitle">${activeCategory === 'All' ? 'Click the + button to add your first password' : 'Try adjusting your search or filter'}</div>
        </div>
      `;
      return;
    }

    // Performance: Use DocumentFragment for batch DOM updates
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      const websiteLine = item.website_url ?
        `<div class="entry-line">${escapeHtml(item.website_url)}</div>` : '';
      const userLine = (item.email || item.username) ?
        `<div class="entry-sub">${escapeHtml(item.email || item.username)}</div>` : '';
      const lastUsed = formatLastUsed(item.updated_at);

      const card = document.createElement('div');
      card.className = 'entry-card';
      card.dataset.id = item.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Password for ${item.title}`);

      card.innerHTML = `
        <div class="avatar" title="${escapeAttr(item.title)}">${escapeHtml(firstLetter(item.title))}</div>
        <div class="entry-main">
          <div class="entry-title">${escapeHtml(item.title)}</div>
          ${userLine}
          ${websiteLine}
          <div class="entry-footer">
            <span class="dot ${item.strength || 'weak'}" aria-label="${item.strength || 'weak'} password"></span> 
            Last used: ${escapeHtml(lastUsed)}
          </div>
        </div>
        <div class="tag">${escapeHtml(item.category || 'General')}</div>
      `;

      // Enhanced accessibility: keyboard support
      const handleCardActivation = (e) => {
        if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
          e.preventDefault();
          openSidebar('view', item);
        }
      };

      card.addEventListener('click', handleCardActivation);
      card.addEventListener('keydown', handleCardActivation);

      fragment.appendChild(card);
    }

    entriesEl.appendChild(fragment);

  } catch (error) {
    console.error('Error rendering entries:', error);
    if (entriesEl) {
      entriesEl.innerHTML = '<div class="card">Error displaying passwords</div>';
    }
  }
}

// Enhanced sidebar management
function openSidebar(mode, data = null) {
  try {
    currentMode = mode;
    currentViewData = data;

    if (!sidebar || !sidebarBackdrop) {
      console.error('Sidebar elements not found');
      return;
    }

    // Show sidebar
    sidebar.classList.add('active');
    sidebarBackdrop.classList.add('active');

    // Configure based on mode
    if (mode === 'add') {
      sidebarTitle.textContent = 'Add New Password';
      show(editMode);
      hide(viewMode);
      hide(editBtn);
      hide(menuBtn);
      hide(saveHeaderBtn);
      hide(cancelHeaderBtn);
      resetForm();
    } else if (mode === 'view') {
      sidebarTitle.textContent = 'Password Details';
      show(viewMode);
      hide(editMode);
      show(editBtn);
      show(menuBtn);
      hide(saveHeaderBtn);
      hide(cancelHeaderBtn);
      loadAndDisplayView(data.id);
    } else if (mode === 'edit') {
      sidebarTitle.textContent = 'Edit Password';
      hide(viewMode);
      show(editMode);
      hide(editBtn);
      hide(menuBtn);
      show(saveHeaderBtn);
      show(cancelHeaderBtn);
      populateEditForm(data);
    }

    // Focus management
    setTimeout(() => {
      if (mode === 'add' || mode === 'edit') {
        sidebarTitleInput?.focus();
      } else {
        editBtn?.focus();
      }
    }, 100);

  } catch (error) {
    console.error('Error opening sidebar:', error);
    showToast('Failed to open details', 'error');
  }
}

function closeSidebar() {
  try {
    if (sidebar) sidebar.classList.remove('active');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    closeMenuDropdown();
    currentViewData = null;
    currentMode = 'add';
  } catch (error) {
    console.error('Error closing sidebar:', error);
  }
}

function switchToEditMode() {
  if (currentViewData) {
    openSidebar('edit', currentViewData);
  }
}

function resetForm() {
  try {
    if (sidebarForm) sidebarForm.reset();
    if (editIdInput) editIdInput.value = '';
    clearErrors();
    updateStrengthUI();
  } catch (error) {
    console.error('Error resetting form:', error);
  }
}

function populateEditForm(data) {
  try {
    if (!data) return;

    if (editIdInput) editIdInput.value = data.id || '';
    if (sidebarTitleInput) sidebarTitleInput.value = data.title || '';
    if (sidebarWebsite) sidebarWebsite.value = data.website_url || '';
    if (sidebarEmail) sidebarEmail.value = data.email || data.username || '';
    if (sidebarCategory) sidebarCategory.value = data.category || 'General';

    // Load password separately for security
    loadPasswordForEdit(data.id);

  } catch (error) {
    console.error('Error populating edit form:', error);
    showToast('Failed to load password details', 'error');
  }
}

async function loadAndDisplayView(id) {
  try {
    const res = await api.get(`/api/entries/${id}`);
    const item = res?.item;
    if (!item) {
      throw new Error('Password not found');
    }

    currentViewData = { ...item, id };

    // Update view fields
    if (viewTitle) viewTitle.textContent = item.title || 'Untitled';

    if (viewWebsite) {
      if (item.website_url) {
        viewWebsite.href = item.website_url;
        viewWebsite.textContent = item.website_url;
        viewWebsite.parentElement.style.display = 'flex';
      } else {
        viewWebsite.parentElement.style.display = 'none';
      }
    }

    if (viewEmail) {
      if (item.email || item.username) {
        viewEmail.textContent = item.email || item.username || '-';
        viewEmail.parentElement.parentElement.style.display = 'block';
      } else {
        viewEmail.parentElement.parentElement.style.display = 'none';
      }
    }

    if (viewPassword) {
      viewPassword.textContent = '••••••••';
      viewPassword.dataset.password = item.password || '';
      viewPassword.dataset.masked = 'true';
      viewPassword.classList.add('password-masked');
    }

    if (viewCategory) viewCategory.textContent = item.category || 'General';
    if (viewCreated) viewCreated.textContent = formatTimestamp(item.created_at);
    if (viewModified) viewModified.textContent = formatTimestamp(item.updated_at);

  } catch (error) {
    console.error('Failed to load password details:', error);
    showToast('Failed to load password details', 'error');
  }
}

async function loadPasswordForEdit(id) {
  try {
    const res = await api.get(`/api/entries/${id}`);
    const password = res?.item?.password || '';
    if (sidebarPassword) {
      sidebarPassword.value = password;
      updateStrengthUI();
    }
  } catch (error) {
    console.error('Failed to load password:', error);
    if (sidebarPassword) sidebarPassword.value = '';
    showToast('Failed to load password', 'error');
  }
}

// Enhanced toast notifications
function showToast(message, type = 'success') {
  try {
    if (!toast) return;

    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#16a34a';
    toast.classList.add('show');

    // Auto-hide toast
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);

    // Accessibility: announce to screen readers
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('role', 'status');

  } catch (error) {
    console.error('Error showing toast:', error);
  }
}

// Enhanced clipboard functionality
async function copyToClipboard(text, label) {
  try {
    if (!text) {
      showToast('Nothing to copy', 'error');
      return;
    }

    await navigator.clipboard.writeText(text);
    showToast(`${label} copied!`);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    showToast('Failed to copy', 'error');
  }
}

// Menu dropdown management
function toggleMenuDropdown(event) {
  try {
    if (!menuDropdown || !menuBtn) return;

    const isHidden = menuDropdown.classList.contains('hidden');
    if (isHidden) {
      // Position dropdown below menu button
      const rect = menuBtn.getBoundingClientRect();
      menuDropdown.style.top = rect.bottom + 5 + 'px';
      menuDropdown.style.right = window.innerWidth - rect.right + 'px';
      menuDropdown.classList.remove('hidden');
    } else {
      closeMenuDropdown();
    }
    event.stopPropagation();
  } catch (error) {
    console.error('Error toggling menu dropdown:', error);
  }
}

function closeMenuDropdown() {
  try {
    if (menuDropdown) menuDropdown.classList.add('hidden');
  } catch (error) {
    console.error('Error closing menu dropdown:', error);
  }
}

// Enhanced delete functionality
async function deletePassword() {
  if (!currentViewData) return;

  try {
    const confirmed = confirm(`Are you sure you want to delete "${currentViewData.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    await api.delete(`/api/entries/${currentViewData.id}`);

    showToast('Password deleted successfully');
    closeSidebar();
    await loadData();
  } catch (error) {
    console.error('Failed to delete password:', error);
    showToast('Failed to delete password', 'error');
  }
}

// Enhanced form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  try {
    if (!validate()) return;

    const formData = new FormData(sidebarForm);
    const data = {
      title: formData.get('title'),
      website_url: formData.get('website_url'),
      email: formData.get('email'),
      password: formData.get('password'),
      category: formData.get('category')
    };

    const isEdit = currentMode === 'edit';

    if (isEdit) {
      await api.put(`/api/entries/${editIdInput.value}`, data);
      showToast('Password updated successfully');
    } else {
      await api.post('/api/entries', data);
      showToast('Password saved successfully');
    }

    closeSidebar();
    await loadData();

  } catch (error) {
    console.error('Failed to save password:', error);
    showToast('Failed to save password', 'error');
  }
}

// Event listeners setup
function initializeEventListeners() {
  try {
    // Auth handlers
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
      });
    }

    if (fillDemo) {
      fillDemo.addEventListener('click', () => {
        const usernameInput = loginForm.querySelector('[name="username"]');
        const passwordInput = loginForm.querySelector('[name="password"]');
        if (usernameInput) usernameInput.value = 'demo';
        if (passwordInput) passwordInput.value = 'demo123';
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const username = loginForm.username.value.trim();
          const password = loginForm.password.value;
          const res = await api.post('/api/login', { username, password });
          setToken(res.token, username);
          hide(authSection);
          show(vaultSection);
          loadData();
        } catch (error) {
          showToast(error.message || 'Login failed', 'error');
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const username = registerForm.username.value.trim();
          const password = registerForm.password.value;
          const password2 = registerForm.password2.value;

          if (password !== password2) {
            showToast('Passwords do not match', 'error');
            return;
          }

          const res = await api.post('/api/register', { username, password });
          setToken(res.token, username);
          hide(authSection);
          show(vaultSection);
          loadData();
        } catch (error) {
          showToast(error.message || 'Registration failed', 'error');
        }
      });
    }

    // Settings modal handlers
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettingsModal);
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', closeSettingsModal);
    }

    if (settingsBackdrop) {
      settingsBackdrop.addEventListener('click', closeSettingsModal);
    }

    if (modalLogoutBtn) {
      modalLogoutBtn.addEventListener('click', () => {
        setToken(null);
        show(authSection);
        hide(vaultSection);
        closeSettingsModal();
      });
    }

    // Sidebar handlers
    if (fabAdd) {
      fabAdd.addEventListener('click', () => openSidebar('add'));
    }

    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', closeSidebar);
    }

    if (cancelSidebarBtn) {
      cancelSidebarBtn.addEventListener('click', () => {
        if (currentMode === 'edit' && currentViewData) {
          openSidebar('view', currentViewData);
        } else {
          closeSidebar();
        }
      });
    }

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    if (editBtn) {
      editBtn.addEventListener('click', switchToEditMode);
    }

    if (saveHeaderBtn) {
      saveHeaderBtn.addEventListener('click', () => {
        sidebarForm.dispatchEvent(new Event('submit'));
      });
    }

    if (cancelHeaderBtn) {
      cancelHeaderBtn.addEventListener('click', () => {
        if (currentViewData) {
          openSidebar('view', currentViewData);
        } else {
          closeSidebar();
        }
      });
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', toggleMenuDropdown);
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        closeMenuDropdown();
        deletePassword();
      });
    }

    if (sidebarForm) {
      sidebarForm.addEventListener('submit', handleFormSubmit);
    }

    // Password field handlers
    if (sidebarPassword) {
      sidebarPassword.addEventListener('input', updateStrengthUI);
    }

    if (togglePwEye) {
      togglePwEye.addEventListener('click', () => {
        const isPassword = sidebarPassword.type === 'password';
        sidebarPassword.type = isPassword ? 'text' : 'password';
        togglePwEye.textContent = isPassword ? '🙈' : '👁️';
      });
    }

    if (toggleViewPw) {
      toggleViewPw.addEventListener('click', () => {
        const isMasked = viewPassword.dataset.masked === 'true';
        if (isMasked) {
          viewPassword.textContent = viewPassword.dataset.password;
          viewPassword.classList.remove('password-masked');
          toggleViewPw.textContent = '🙈';
          toggleViewPw.title = 'Hide password';
          viewPassword.dataset.masked = 'false';
        } else {
          viewPassword.textContent = '••••••••';
          viewPassword.classList.add('password-masked');
          toggleViewPw.textContent = '👁️';
          toggleViewPw.title = 'Show password';
          viewPassword.dataset.masked = 'true';
        }
      });
    }

    if (genPw) {
      genPw.addEventListener('click', () => {
        const newPassword = generatePassword();
        if (sidebarPassword) {
          sidebarPassword.value = newPassword;
          updateStrengthUI();
        }

        // Add visual feedback
        genPw.classList.add('animating');
        setTimeout(() => {
          genPw.classList.remove('animating');
        }, 600);
      });
    }

    // Search and filter handlers
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    if (filtersEl) {
      filtersEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill');
        if (!btn) return;

        [...filtersEl.querySelectorAll('.pill')].forEach(p => p.classList.remove('selected'));
        btn.classList.add('selected');
        activeCategory = btn.dataset.cat || 'All';
        applyFilters();
      });
    }

    // Global handlers
    document.addEventListener('click', () => {
      closeMenuDropdown();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          searchInput?.focus();
        }
      }
    });

  } catch (error) {
    console.error('Error initializing event listeners:', error);
  }
}

// Initialize application
function init() {
  try {
    initializeEventListeners();
    checkAuth();
  } catch (error) {
    console.error('Application initialization failed:', error);
    showToast('Application failed to start', 'error');
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
