// Bolt-Pass frontend logic (minimalist home)
const api = {
  post: (path, body) => fetch(path, {method:'POST',headers:{'Content-Type':'application/json','Authorization': authHeader()}, body: JSON.stringify(body)}).then(handleJSON),
  get: (path) => fetch(path, {headers: {'Authorization': authHeader()}}).then(handleJSON),
  put: (path, body) => fetch(path, {method:'PUT',headers:{'Content-Type':'application/json','Authorization': authHeader()}, body: JSON.stringify(body)}).then(handleJSON)
};

function authHeader(){
  const t = localStorage.getItem('bp_token');
  return t ? `Bearer ${t}` : '';
}

function handleJSON(res){
  if (!res.ok) return res.json().then(e => { throw e; });
  return res.json();
}

const qs = s => document.querySelector(s);

// Sections
const authSection = qs('#authSection');
const vaultSection = qs('#vaultSection');
const userArea = qs('#userArea');

// Auth
const loginForm = qs('#loginForm');
const registerForm = qs('#registerForm');
const tabLogin = qs('#tabLogin');
const tabRegister = qs('#tabRegister');
const fillDemo = qs('#fillDemo');
const btnLogout = qs('#btnLogout');

// Vault UI
const entriesEl = qs('#entries');
const searchInput = qs('#searchInput');
const filtersEl = qs('#filters');
const statTotal = qs('#statTotal');
const statWeak = qs('#statWeak');
const statStrong = qs('#statStrong');

// Sidebar elements
const sidebar = qs('#sidebar');
const sidebarBackdrop = qs('#sidebarBackdrop');
const sidebarTitle = qs('#sidebarTitle');
const sidebarForm = qs('#sidebarForm');
const closeSidebarBtn = qs('#closeSidebar');
const cancelSidebarBtn = qs('#cancelSidebar');
const fabAdd = qs('#fabAdd');
const editIdInput = qs('#editId');
const sidebarPassword = qs('#sidebarPassword');
const strengthFill = qs('#strengthFill');
const strengthLabel = qs('#strengthLabel');
const togglePwEye = qs('#togglePwEye');
const genPw = qs('#genPw');
const errTitle = qs('#err-title');
const errPassword = qs('#err-password');
const msg = qs('#msg');

// View/Edit mode elements
const viewMode = qs('#viewMode');
const editMode = qs('#editMode');
const editBtn = qs('#editBtn');
const menuBtn = qs('#menuBtn');
const menuDropdown = qs('#menuDropdown');
const deleteBtn = qs('#deleteBtn');
const toggleViewPw = qs('#toggleViewPw');
const toast = qs('#toast');

// View mode display elements
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

// Stats cache for modal
let currentStats = { total: 0, weak: 0, strong: 0 };

let allEntries = [];
let activeCategory = 'All';
let currentViewData = null; // Store current viewed entry data
let currentMode = 'add'; // 'add', 'view', 'edit'

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

function setUser(username){
  userArea.textContent = username || '';
  if (settingsUserEmail) settingsUserEmail.textContent = username || '';
  if (username) {
    show(settingsBtn);
  } else {
    hide(settingsBtn);
  }
}

function setToken(token, username){
  if (token){ localStorage.setItem('bp_token', token); localStorage.setItem('bp_user', username); setUser(username); }
  else { localStorage.removeItem('bp_token'); localStorage.removeItem('bp_user'); setUser(''); }
}

function checkAuth(){
  const t = localStorage.getItem('bp_token');
  const u = localStorage.getItem('bp_user');
  if (t && u){ setUser(u); hide(authSection); show(vaultSection); loadData(); }
  else { show(authSection); hide(vaultSection); }
}

// Auth handlers
if (tabLogin && tabRegister){
  tabLogin.addEventListener('click', ()=>{ tabLogin.classList.add('active'); tabRegister.classList.remove('active'); loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); });
  tabRegister.addEventListener('click', ()=>{ tabRegister.classList.add('active'); tabLogin.classList.remove('active'); registerForm.classList.remove('hidden'); loginForm.classList.add('hidden'); });
}
if (fillDemo){
  fillDemo.addEventListener('click', ()=>{
    const u = loginForm.querySelector('[name="username"]');
    const p = loginForm.querySelector('[name="password"]');
    if (u) u.value = 'demo';
    if (p) p.value = 'demo123';
  });
}
if (loginForm){
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;
    try{ const res = await api.post('/api/login', {username,password}); setToken(res.token, username); hide(authSection); show(vaultSection); loadData(); }
    catch(err){ alert(err.error || 'Login failed'); }
  });
}
if (registerForm){
  registerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = registerForm.username.value.trim();
    const password = registerForm.password.value;
    const password2 = registerForm.password2.value;
    if (password !== password2){ alert('Passwords do not match'); return; }
    try{ const res = await api.post('/api/register', {username,password}); setToken(res.token, username); hide(authSection); show(vaultSection); loadData(); }
    catch(err){ alert(err.error || 'Register failed'); }
  });
}
if (btnLogout){ btnLogout.addEventListener('click', ()=>{ setToken(null); show(authSection); hide(vaultSection); closeSettingsModal(); }); }

// Settings modal functions
function openSettingsModal() {
  // Ensure modal elements exist
  if (!settingsModal || !settingsBackdrop) {
    console.error('Settings modal elements not found');
    return;
  }

  // Add active classes to show the modal
  settingsModal.classList.add('active');
  settingsBackdrop.classList.add('active');

  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';

  // Update stats in modal from cache
  if (modalStatTotal) modalStatTotal.textContent = String(currentStats.total);
  if (modalStatWeak) modalStatWeak.textContent = String(currentStats.weak);
  if (modalStatStrong) modalStatStrong.textContent = String(currentStats.strong);

  // Focus trap - focus the close button for accessibility
  if (closeSettingsBtn) {
    setTimeout(() => closeSettingsBtn.focus(), 100);
  }
}

function closeSettingsModal() {
  if (!settingsModal || !settingsBackdrop) return;

  // Remove active classes to hide the modal
  settingsModal.classList.remove('active');
  settingsBackdrop.classList.remove('active');

  // Restore body scroll
  document.body.style.overflow = '';

  // Return focus to settings button
  if (settingsBtn) {
    settingsBtn.focus();
  }
}

// Settings modal event handlers
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

// Data loading
async function loadData(){
  let entries = [];
  let stats = null;
  // Try titles endpoint first
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
  } catch (_) {
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
    } catch (err) {
      console.error('Failed to load any entries:', err);
      entriesEl.innerHTML = '<div class="card">Could not load entries. Please try again.</div>';
      return;
    }
  }

  // Try fetching stats from server if not computed already
  if (!stats) {
    try {
      stats = await api.get('/api/entries/stats');
    } catch (_) {
      stats = { total: entries.length, weak: 0, strong: 0 };
    }
  }

  // Update in-memory and UI
  allEntries = entries;
  currentStats = { total: stats.total ?? entries.length, weak: stats.weak ?? 0, strong: stats.strong ?? 0 };
  if (statTotal) statTotal.textContent = String(currentStats.total);
  if (statWeak) statWeak.textContent = String(currentStats.weak);
  if (statStrong) statStrong.textContent = String(currentStats.strong);

  // Update modal stats as well (if open later)
  if (modalStatTotal) modalStatTotal.textContent = String(currentStats.total);
  if (modalStatWeak) modalStatWeak.textContent = String(currentStats.weak);
  if (modalStatStrong) modalStatStrong.textContent = String(currentStats.strong);

  applyFilters();
}

// Password strength and utilities
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=[]{}<>?';
  let l = 16;
  let pw = '';
  for (let i = 0; i < l; i++) pw += charset[randInt(0, charset.length - 1)];
  return pw;
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
  let total=0, weak=0, strong=0;
  for (const it of items){
    total++;
    const pw = it.password || '';
    const s = strengthOf(pw);
    if (s === 'strong') strong++;
    else if (s === 'weak') weak++;
  }
  return { total, weak, strong };
}

// Filters and search
if (filtersEl){
  filtersEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('.pill'); if (!btn) return;
    [...filtersEl.querySelectorAll('.pill')].forEach(p=>p.classList.remove('selected'));
    btn.classList.add('selected');
    activeCategory = btn.dataset.cat || 'All';
    applyFilters();
  });
}
if (searchInput){ searchInput.addEventListener('input', applyFilters); }

function applyFilters(){
  const q = (searchInput?.value || '').toLowerCase();
  let items = allEntries.slice();
  if (activeCategory && activeCategory !== 'All') items = items.filter(it => (it.category||'').toLowerCase() === activeCategory.toLowerCase());
  if (q) items = items.filter(it => (it.title||'').toLowerCase().includes(q) || (it.email||'').toLowerCase().includes(q) || (it.username||'').toLowerCase().includes(q) || (it.website_url||'').toLowerCase().includes(q));
  renderEntries(items);
}

// Utilities and helpers appended
function updateStrengthUI() {
  const pw = sidebarPassword.value;
  const s = strengthOf(pw);
  let width = 0, color = '#dc2626', label = 'Weak';
  if (s === 'weak') { width = Math.min(33, pw.length * 4); color = '#dc2626'; label = 'Weak'; }
  if (s === 'medium') { width = 66; color = '#ca8a04'; label = 'Medium'; }
  if (s === 'strong') { width = 100; color = '#16a34a'; label = 'Strong'; }
  strengthFill.style.width = width + '%';
  strengthFill.style.background = color;
  strengthLabel.textContent = label;
}

function clearErrors(){
  if (errTitle) errTitle.textContent = '';
  if (errPassword) errPassword.textContent = '';
}

function validate(){
  clearErrors();
  let ok = true;
  if (!sidebarForm.title.value.trim()) { if (errTitle) errTitle.textContent = 'Title is required.'; ok = false; }
  if (!sidebarPassword.value) { if (errPassword) errPassword.textContent = 'Password is required.'; ok = false; }
  return ok;
}

function escapeHtml(s){ if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function escapeAttr(s){ return (s||'').replace(/"/g,'&quot;'); }

function firstLetter(s){ const c = (s||'').trim().charAt(0).toUpperCase(); return c || '•'; }
function formatDate(s){ if (!s) return ''; try{ const d = new Date(s); return d.toLocaleString(); }catch{ return ''; } }
function formatLastUsed(s){
  if (!s) return '';
  const d = new Date(s);
  const now = new Date();
  const diffMs = now - d;
  const sec = Math.floor(diffMs/1000);
  const min = Math.floor(sec/60);
  const hr = Math.floor(min/60);
  const day = Math.floor(hr/24);
  if (sec < 60) return 'Just now';
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hour${hr>1?'s':''} ago`;
  if (day < 7) return `${day} day${day>1?'s':''} ago`;
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}

function renderEntries(items){
  entriesEl.innerHTML = '';
  if (!items.length){
    // Empty state
    entriesEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <div class="empty-title">No passwords saved yet</div>
        <div class="empty-subtitle">Click the + button below to add your first password</div>
      </div>
    `;
    return;
  }
  for (const it of items){
    const websiteLine = it.website_url ? `<div class="entry-line">${escapeHtml(it.website_url)}</div>` : '';
    const userLine = (it.email || it.username) ? `<div class="entry-sub">${escapeHtml(it.email || it.username)}</div>` : '';
    const lastUsed = formatLastUsed(it.updated_at);
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.id = it.id;
    card.innerHTML = `
      <div class="avatar" title="${escapeHtml(it.title)}">${escapeHtml(firstLetter(it.title))}</div>
      <div class="entry-main">
        <div class="entry-title">${escapeHtml(it.title)}</div>
        ${userLine}
        ${websiteLine}
        <div class="entry-footer"><span class="dot ${it.strength || 'weak'}"></span> Last used: ${escapeHtml(lastUsed)}</div>
      </div>
      <div class="tag">${escapeHtml(it.category || 'General')}</div>
    `;

    // Click on card to view (not edit)
    card.addEventListener('click', () => {
      openSidebar('view', it);
    });

    entriesEl.appendChild(card);
  }
}

function closeSidebar() {
  sidebar.classList.remove('active');
  sidebarBackdrop.classList.remove('active');
  closeMenuDropdown();
  currentViewData = null;
}

async function loadAndDisplayView(id) {
  try {
    const res = await api.get(`/api/entries/${id}`);
    const item = res?.item;
    if (!item) return;

    currentViewData = { ...item, id };

    viewTitle.textContent = item.title || 'Untitled';

    if (item.website_url) {
      viewWebsite.href = item.website_url;
      viewWebsite.textContent = item.website_url;
      viewWebsite.parentElement.style.display = 'flex';
    } else {
      viewWebsite.parentElement.style.display = 'none';
    }

    if (item.email || item.username) {
      viewEmail.textContent = item.email || item.username || '-';
      viewEmail.parentElement.parentElement.style.display = 'block';
    } else {
      viewEmail.parentElement.parentElement.style.display = 'none';
    }

    viewPassword.textContent = '••••••••';
    viewPassword.dataset.password = item.password || '';
    viewPassword.dataset.masked = 'true';

    viewCategory.textContent = item.category || 'General';

    // Format timestamps
    viewCreated.textContent = formatTimestamp(item.created_at);
    viewModified.textContent = formatTimestamp(item.updated_at);

  } catch (err) {
    console.error('Failed to load password details:', err);
    showToast('Failed to load password details', 'error');
  }
}

async function loadPasswordForEdit(id) {
  try {
    const res = await api.get(`/api/entries/${id}`);
    const pw = res?.item?.password || '';
    sidebarPassword.value = pw;
    updateStrengthUI();
  } catch (err) {
    console.error('Failed to load password:', err);
    sidebarPassword.value = '';
  }
}

// Toast notification
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#ef4444' : '#16a34a';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Copy to clipboard
async function copyToClipboard(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied!`);
  } catch (err) {
    showToast('Failed to copy', 'error');
  }
}

// Menu dropdown
function toggleMenuDropdown(event) {
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
}

function closeMenuDropdown() {
  menuDropdown.classList.add('hidden');
}

// Delete password
async function deletePassword() {
  if (!currentViewData) return;

  if (!confirm(`Are you sure you want to delete "${currentViewData.title}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await fetch(`/api/entries/${currentViewData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': authHeader() }
    });

    showToast('Password deleted successfully');
    closeSidebar();
    await loadData();
  } catch (err) {
    showToast('Failed to delete password', 'error');
  }
}

// Sidebar event handlers
if (fabAdd) {
  fabAdd.addEventListener('click', () => openSidebar('add'));
}

if (closeSidebarBtn) {
  closeSidebarBtn.addEventListener('click', closeSidebar);
}

if (cancelSidebarBtn) {
  cancelSidebarBtn.addEventListener('click', () => {
    if (currentMode === 'edit' && currentViewData) {
      // Return to view mode
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

if (menuBtn) {
  menuBtn.addEventListener('click', toggleMenuDropdown);
}

if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    closeMenuDropdown();
    deletePassword();
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

// Copy buttons
document.addEventListener('click', (e) => {
  const copyBtn = e.target.closest('.copy-btn');
  if (!copyBtn) return;

  const copyType = copyBtn.dataset.copy;
  if (!copyType || !currentViewData) return;

  let textToCopy = '';
  let label = '';

  if (copyType === 'url') {
    textToCopy = currentViewData.website_url || '';
    label = 'URL';
  } else if (copyType === 'email') {
    textToCopy = currentViewData.email || currentViewData.username || '';
    label = 'Email';
  } else if (copyType === 'password') {
    textToCopy = currentViewData.password || '';
    label = 'Password';
  }

  if (textToCopy) {
    copyToClipboard(textToCopy, label);

    // Visual feedback
    copyBtn.classList.add('copied');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.textContent = originalText;
    }, 1500);
  }
});

// Init
checkAuth();

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
    closeMenuDropdown();
  }
});

if (genPw) {
  genPw.addEventListener('click', () => {
    const pw = generatePassword();
    sidebarPassword.value = pw;
    updateStrengthUI();

    // Shimmer animation
    genPw.classList.add('animating');
    setTimeout(() => genPw.classList.remove('animating'), 650);
  });
}

if (togglePwEye) {
  togglePwEye.addEventListener('click', () => {
    if (sidebarPassword.type === 'password') { sidebarPassword.type = 'text'; togglePwEye.textContent = '🙈'; }
    else { sidebarPassword.type = 'password'; togglePwEye.textContent = '👁️'; }
  });
}

if (sidebarPassword) {
  sidebarPassword.addEventListener('input', updateStrengthUI);
}

if (sidebarForm) {
  sidebarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    if (!validate()) return;

    const payload = {
      title: sidebarForm.title.value.trim(),
      website_url: sidebarForm.website_url.value.trim(),
      email: sidebarForm.email.value.trim(),
      category: sidebarForm.category.value,
      password: sidebarPassword.value
    };

    try {
      const editId = editIdInput.value;
      if (editId) {
        // Update existing
        await api.put(`/api/entries/${editId}`, payload);
        showToast('Password updated successfully');
        // Return to view mode
        await loadData();
        const updatedEntry = allEntries.find(e => e.id == editId);
        if (updatedEntry) {
          openSidebar('view', updatedEntry);
        } else {
          closeSidebar();
        }
      } else {
        // Create new
        await api.post('/api/entries', payload);
        showToast('Password added successfully');
        closeSidebar();
        await loadData(); // Refresh list
      }
    } catch (err) {
      msg.textContent = err.error || 'Save failed';
      showToast(err.error || 'Save failed', 'error');
    }
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape key
  if (e.key === 'Escape') {
    if (!sidebar.classList.contains('active') && !settingsModal.classList.contains('active')) return;

    if (settingsModal.classList.contains('active')) {
      closeSettingsModal();
    } else if (sidebar.classList.contains('active')) {
      if (currentMode === 'edit' && currentViewData) {
        // Return to view mode on escape during edit
        openSidebar('view', currentViewData);
      } else {
        closeSidebar();
      }
    }
    e.preventDefault();
  }
});

// Header Save/Cancel events
if (saveHeaderBtn) {
  saveHeaderBtn.addEventListener('click', () => {
    if (sidebarForm) sidebarForm.requestSubmit();
  });
}
if (cancelHeaderBtn) {
  cancelHeaderBtn.addEventListener('click', () => {
    if (currentMode === 'edit' && currentViewData) {
      openSidebar('view', currentViewData);
    } else {
      closeSidebar();
    }
  });
}

function showElement(el){ el.classList.remove('hidden'); }
function hideElement(el){ el.classList.add('hidden'); }

function showFade(el){
  if (!el) return;
  el.style.opacity = '0';
  showElement(el);
  requestAnimationFrame(()=>{ el.style.opacity = '1'; });
}
function hideFade(el){
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(()=> hideElement(el), 250);
}

function openSidebar(mode = 'add', entry = null) {
  sidebar.classList.add('active');
  sidebarBackdrop.classList.add('active');
  currentMode = mode;

  // Reset header actions visibility
  const showHeaderEditPair = (show) => {
    if (saveHeaderBtn) (show ? showElement(saveHeaderBtn) : hideElement(saveHeaderBtn));
    if (cancelHeaderBtn) (show ? showElement(cancelHeaderBtn) : hideElement(cancelHeaderBtn));
  };
  const showHeaderViewButtons = (show) => {
    if (editBtn) (show ? showElement(editBtn) : hideElement(editBtn));
    if (menuBtn) (show ? showElement(menuBtn) : hideElement(menuBtn));
  };

  if (mode === 'add') {
    sidebarTitle.textContent = 'Add New Password';
    sidebarForm.reset();
    editIdInput.value = '';
    hideFade(viewMode);
    showFade(editMode);
    showHeaderEditPair(true);
    showHeaderViewButtons(false);
    updateStrengthUI();
  } else if (mode === 'view' && entry) {
    sidebarTitle.textContent = 'Password Details';
    currentViewData = entry;
    showFade(viewMode);
    hideFade(editMode);
    showHeaderEditPair(false);
    showHeaderViewButtons(true);
    loadAndDisplayView(entry.id);
  } else if (mode === 'edit' && entry) {
    sidebarTitle.textContent = 'Edit Password';
    editIdInput.value = entry.id;
    qs('#sidebarTitleInput').value = entry.title || '';
    qs('#sidebarWebsiteUrl').value = entry.website_url || '';
    qs('#sidebarEmail').value = entry.email || entry.username || '';
    qs('#sidebarCategory').value = entry.category || 'General';
    hideFade(viewMode);
    showFade(editMode);
    showHeaderEditPair(true);
    showHeaderViewButtons(false);
    loadPasswordForEdit(entry.id);
  }
  clearErrors();
  msg.textContent = '';
}

function switchToEditMode() {
  if (!currentViewData) return;
  currentMode = 'edit';
  sidebarTitle.textContent = 'Edit Password';

  // Pre-fill form
  editIdInput.value = currentViewData.id;
  qs('#sidebarTitleInput').value = currentViewData.title || '';
  qs('#sidebarWebsiteUrl').value = currentViewData.website_url || '';
  qs('#sidebarEmail').value = currentViewData.email || currentViewData.username || '';
  qs('#sidebarCategory').value = currentViewData.category || 'General';
  sidebarPassword.value = currentViewData.password || '';

  hideFade(viewMode);
  showFade(editMode);
  // Toggle header buttons
  if (saveHeaderBtn) showElement(saveHeaderBtn);
  if (cancelHeaderBtn) showElement(cancelHeaderBtn);
  if (editBtn) hideElement(editBtn);
  if (menuBtn) hideElement(menuBtn);
  updateStrengthUI();
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return '-';
  }
}

// Sidebar functions
function openSidebar_old(mode = 'add', entry = null) {
  // Legacy implementation retained for reference; not used.
  sidebar.classList.add('active');
  sidebarBackdrop.classList.add('active');
  currentMode = mode;
  if (mode === 'add') {
    sidebarTitle.textContent = 'Add New Password';
    sidebarForm.reset();
    editIdInput.value = '';
    hide(viewMode);
    show(editMode);
    hide(editBtn);
    hide(menuBtn);
    updateStrengthUI();
  } else if (mode === 'view' && entry) {
    sidebarTitle.textContent = 'Password Details';
    currentViewData = entry;
    show(viewMode);
    hide(editMode);
    show(editBtn);
    show(menuBtn);
    loadAndDisplayView(entry.id);
  } else if (mode === 'edit' && entry) {
    sidebarTitle.textContent = 'Edit Password';
    editIdInput.value = entry.id;
    qs('#sidebarTitleInput').value = entry.title || '';
    qs('#sidebarWebsiteUrl').value = entry.website_url || '';
    qs('#sidebarEmail').value = entry.email || entry.username || '';
    qs('#sidebarCategory').value = entry.category || 'General';
    hide(viewMode);
    show(editMode);
    hide(editBtn);
    hide(menuBtn);
    loadPasswordForEdit(entry.id);
  }
  clearErrors();
  msg.textContent = '';
}
