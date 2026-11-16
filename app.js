/* Palazzo - Improved version (full green theme) */

const DEFAULT_STATE = {
  navTitle: 'Palazzo',
  heroSub: 'Roleplay · Elite',
  logoSrc: '',
  cards: [
    { icon: '🏰', title: '¿Quiénes Somos?', text: 'Palazzo es una organización de roleplay enfocada en la lealtad, el respeto y el buen interpretar. Nacimos para dominar el escenario con estilo y disciplina.' },
    { icon: '🗺️', title: 'Territorio', text: 'Controlamos las zonas más estratégicas del mapa. Desde el centro hasta las afueras, Palazzo tiene presencia donde se requiere calidad de roleplay.' },
    { icon: '📜', title: 'Código', text: '1. La lealtad es lo primero.\n2. No traiciones a los tuyos.\n3. El grupo siempre va antes que el ego.\n4. Respeto entre miembros.\n5. Buen roleplay siempre.' },
    { icon: '🤝', title: '¿Cómo Ingresar?', text: 'Para unirte a Palazzo debes demostrar valía dentro del servidor. Contacta a un miembro o usa el enlace de postulación. No aceptamos roles débiles.' },
    { icon: '🖥️', title: 'Servidor', text: 'Juega en el servidor de roleplay donde Palazzo opera. Busca la comunidad y vive el mejor RP.' },
    { icon: '💬', title: 'Contacto', text: 'Únete a nuestro Discord para novedades, postulaciones y coordinación del grupo.' }
  ],
  contacto: {
    postularTitle: 'Postular a Palazzo',
    postularText: '¿Quieres formar parte de Palazzo? Demuestra lealtad, respeto y buen roleplay.',
    postularReqs: 'Nivel medio de roleplay\nDisponibilidad\nLealtad y respeto',
    postularLink: '#',
    ownerName: 'Owner',
    ownerRole: 'Fundador',
    ownerText: 'Para asuntos importantes contacta al owner.',
    ownerLink: '#'
  },
  photos: []
};

// Simple hash for demo password (not production-grade)
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return 'p_' + Math.abs(h).toString(16);
}

const DEFAULT_PASS_HASH = simpleHash('Palazzo2026!'); // default password

let state = loadState();
let isLoggedIn = false;
let currentPassHash = localStorage.getItem('palazzo_pass_hash') || DEFAULT_PASS_HASH;

function loadState() {
  try {
    const raw = localStorage.getItem('palazzo_state');
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  localStorage.setItem('palazzo_state', JSON.stringify(state));
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ========== RENDER ========== */
function applyState() {
  document.getElementById('nav-title').textContent = state.navTitle || 'Palazzo';
  document.getElementById('hero-title').textContent = state.navTitle || 'Palazzo';
  document.getElementById('hero-sub').textContent = state.heroSub || '';

  const logoCircle = document.getElementById('nav-logo-circle');
  const heroLogo = document.getElementById('hero-logo');
  if (state.logoSrc) {
    logoCircle.innerHTML = `<img src="${esc(state.logoSrc)}" alt="Logo" onerror="this.remove()">`;
    heroLogo.innerHTML = `<img src="${esc(state.logoSrc)}" alt="Logo" onerror="this.parentElement.innerHTML='<span class=\\'hero-logo-placeholder\\'>P</span>'">`;
  } else {
    logoCircle.innerHTML = '<span class="logo-fallback">P</span>';
    heroLogo.innerHTML = '<span class="hero-logo-placeholder">P</span>';
  }

  // Cards
  const grid = document.getElementById('info-grid');
  grid.innerHTML = state.cards.map(c => `
    <div class="info-card">
      <div class="card-icon">${c.icon || '📌'}</div>
      <h2 class="card-title">${esc(c.title)}</h2>
      <p class="card-text">${esc(c.text)}</p>
    </div>
  `).join('');

  // Contacto
  document.getElementById('postular-title').textContent = state.contacto.postularTitle || '';
  document.getElementById('postular-text').textContent = state.contacto.postularText || '';
  const reqs = (state.contacto.postularReqs || '').split('\n').filter(Boolean);
  document.getElementById('postular-reqs').innerHTML = reqs.map(r => `<li>✔ ${esc(r)}</li>`).join('');
  const postBtn = document.getElementById('postular-btn');
  postBtn.href = state.contacto.postularLink || '#';
  postBtn.textContent = 'Postular';

  document.getElementById('owner-name').textContent = state.contacto.ownerName || 'Owner';
  document.getElementById('owner-role').textContent = state.contacto.ownerRole || '';
  document.getElementById('owner-text').textContent = state.contacto.ownerText || '';
  document.getElementById('owner-btn').href = state.contacto.ownerLink || '#';

  renderPhotos();
}

function renderPhotos() {
  const grid = document.getElementById('photos-grid');
  if (!state.photos || state.photos.length === 0) {
    grid.innerHTML = '<div class="no-photos-msg" id="no-photos">No hay fotos aún. El administrador puede añadirlas desde el panel.</div>';
    return;
  }
  grid.innerHTML = state.photos.map((p, i) => `
    <div class="photo-item" onclick="openLightbox('${esc(p.url)}')">
      <img src="${esc(p.url)}" alt="${esc(p.caption || 'Foto')}" loading="lazy">
      ${p.caption ? `<div class="photo-caption">${esc(p.caption)}</div>` : ''}
    </div>
  `).join('');
}

function renderAdminPhotos() {
  const list = document.getElementById('admin-photos-list');
  if (!list) return;
  if (!state.photos.length) {
    list.innerHTML = '<p style="color:#456;grid-column:1/-1;text-align:center">Sin fotos</p>';
    return;
  }
  list.innerHTML = state.photos.map((p, i) => `
    <div class="admin-photo-item">
      <img src="${esc(p.url)}" alt="">
      <button class="del-btn" onclick="deletePhoto(${i})" title="Eliminar">✕</button>
    </div>
  `).join('');
}

function renderCardsEditor() {
  const container = document.getElementById('cards-editor');
  if (!container) return;
  container.innerHTML = state.cards.map((c, i) => `
    <div class="card-editor-block">
      <h4>${c.icon || '📌'} Tarjeta ${i + 1}</h4>
      <div class="form-group"><label>Icono (emoji)</label><input type="text" id="ce-icon-${i}" value="${esc(c.icon)}" maxlength="4"></div>
      <div class="form-group"><label>Título</label><input type="text" id="ce-title-${i}" value="${esc(c.title)}"></div>
      <div class="form-group"><label>Texto</label><textarea id="ce-text-${i}">${esc(c.text)}</textarea></div>
      <button class="btn-neon" style="font-size:12px;padding:7px 16px" onclick="saveCard(${i})">Guardar</button>
      <span class="save-msg" id="ce-msg-${i}"></span>
    </div>
  `).join('');
}

/* ========== TABS ========== */
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const tab = document.getElementById('tab-' + tabId);
  if (tab) tab.classList.add('active');
  document.querySelector(`.nav-link[data-tab="${tabId}"]`)?.classList.add('active');
  document.querySelector('.nav-links')?.classList.remove('open');

  if (tabId === 'admin' && isLoggedIn) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
  }
}

/* ========== ADMIN ========== */
function adminLogin() {
  const pass = document.getElementById('admin-pass').value;
  const err = document.getElementById('login-error');
  if (simpleHash(pass) === currentPassHash) {
    isLoggedIn = true;
    err.textContent = '';
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('admin-pass').value = '';
    fillAdminForms();
    renderCardsEditor();
    renderAdminPhotos();
  } else {
    err.textContent = 'Contraseña incorrecta';
  }
}

function adminLogout() {
  isLoggedIn = false;
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

function switchAdminSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('admin-' + id);
  if (sec) sec.style.display = 'block';
  document.querySelector(`.admin-tab-btn[data-admin="${id}"]`)?.classList.add('active');
  if (id === 'photos') renderAdminPhotos();
  if (id === 'cards') renderCardsEditor();
}

function fillAdminForms() {
  document.getElementById('edit-nav-title').value = state.navTitle || '';
  document.getElementById('edit-hero-sub').value = state.heroSub || '';
  document.getElementById('edit-logo-url').value = state.logoSrc || '';

  document.getElementById('edit-postular-title').value = state.contacto.postularTitle || '';
  document.getElementById('edit-postular-text').value = state.contacto.postularText || '';
  document.getElementById('edit-postular-reqs').value = state.contacto.postularReqs || '';
  document.getElementById('edit-postular-link').value = state.contacto.postularLink || '';
  document.getElementById('edit-owner-name').value = state.contacto.ownerName || '';
  document.getElementById('edit-owner-role').value = state.contacto.ownerRole || '';
  document.getElementById('edit-owner-text').value = state.contacto.ownerText || '';
  document.getElementById('edit-owner-link').value = state.contacto.ownerLink || '';
}

function saveGeneral() {
  state.navTitle = document.getElementById('edit-nav-title').value.trim() || state.navTitle;
  state.heroSub = document.getElementById('edit-hero-sub').value.trim() || state.heroSub;
  const logoUrl = document.getElementById('edit-logo-url').value.trim();
  if (logoUrl) state.logoSrc = logoUrl;
  saveState();
  applyState();
  showMsg('save-general-msg', '✓ Guardado');
}

function saveCard(idx) {
  state.cards[idx].icon = document.getElementById('ce-icon-' + idx).value || state.cards[idx].icon;
  state.cards[idx].title = document.getElementById('ce-title-' + idx).value || state.cards[idx].title;
  state.cards[idx].text = document.getElementById('ce-text-' + idx).value || state.cards[idx].text;
  saveState();
  applyState();
  showMsg('ce-msg-' + idx, '✓ Guardado');
}

function saveContacto() {
  state.contacto.postularTitle = document.getElementById('edit-postular-title').value.trim();
  state.contacto.postularText = document.getElementById('edit-postular-text').value.trim();
  state.contacto.postularReqs = document.getElementById('edit-postular-reqs').value.trim();
  state.contacto.postularLink = document.getElementById('edit-postular-link').value.trim();
  state.contacto.ownerName = document.getElementById('edit-owner-name').value.trim();
  state.contacto.ownerRole = document.getElementById('edit-owner-role').value.trim();
  state.contacto.ownerText = document.getElementById('edit-owner-text').value.trim();
  state.contacto.ownerLink = document.getElementById('edit-owner-link').value.trim();
  saveState();
  applyState();
  showMsg('save-contacto-msg', '✓ Guardado');
}

function changePass() {
  const np = document.getElementById('new-admin-pass').value.trim();
  if (np.length < 6) {
    showMsg('save-pass-msg', 'Mínimo 6 caracteres');
    return;
  }
  currentPassHash = simpleHash(np);
  localStorage.setItem('palazzo_pass_hash', currentPassHash);
  document.getElementById('new-admin-pass').value = '';
  showMsg('save-pass-msg', '✓ Contraseña actualizada (local)');
}

function addPhotoByUrl() {
  const url = document.getElementById('photo-url').value.trim();
  if (!url) return;
  state.photos.push({ url, caption: '' });
  saveState();
  document.getElementById('photo-url').value = '';
  renderPhotos();
  renderAdminPhotos();
}

function deletePhoto(idx) {
  if (!confirm('¿Eliminar esta foto?')) return;
  state.photos.splice(idx, 1);
  saveState();
  renderPhotos();
  renderAdminPhotos();
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      state.photos.push({ url: e.target.result, caption: file.name });
      saveState();
      renderPhotos();
      renderAdminPhotos();
    };
    reader.readAsDataURL(file);
  });
}

function showMsg(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    setTimeout(() => { el.textContent = ''; }, 2500);
  }
}

/* ========== LIGHTBOX ========== */
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  applyState();

  // Nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });

  // Admin
  document.getElementById('login-btn')?.addEventListener('click', adminLogin);
  document.getElementById('admin-pass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });
  document.getElementById('logout-btn')?.addEventListener('click', adminLogout);

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAdminSection(btn.dataset.admin));
  });

  document.getElementById('save-general-btn')?.addEventListener('click', saveGeneral);
  document.getElementById('save-contacto-btn')?.addEventListener('click', saveContacto);
  document.getElementById('change-pass-btn')?.addEventListener('click', changePass);
  document.getElementById('add-url-btn')?.addEventListener('click', addPhotoByUrl);

  // Drop zone
  const dropZone = document.getElementById('drop-zone');
  const photoInput = document.getElementById('photo-input');
  if (dropZone && photoInput) {
    dropZone.addEventListener('click', () => photoInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    photoInput.addEventListener('change', () => handleFiles(photoInput.files));
  }

  // Lightbox
  document.getElementById('lightbox')?.addEventListener('click', closeLightbox);
});
