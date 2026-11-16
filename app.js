/* Palazzo - Supabase fixed (no name conflict) */
const SUPABASE_URL = 'https://flidmlymjtwwrdvruegn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VR-2qy3tOrSD9weIBWWAQw_-4zh_XM_';

const DEFAULT_STATE = {
  navTitle: 'Palazzo',
  heroSub: 'Roleplay · Elite',
  logoSrc: '',
  cards: [
    { icon: '🏰', title: '¿Quiénes Somos?', text: 'Palazzo es una organización de roleplay enfocada en la lealtad, el respeto y el buen interpretar. Nacimos para dominar el escenario con estilo y disciplina.' },
    { icon: '🗺️', title: 'Territorio', text: 'Controlamos las zonas más estratégicas del mapa. Desde el centro hasta las afueras, Palazzo tiene presencia donde se requiere calidad de roleplay.' },
    { icon: '📜', title: 'Código', text: '1. La lealtad es lo primero.\n2. No traiciones a los tuyos.\n3. El grupo siempre va antes que el ego.\n4. Respeto entre miembros.\n5. Buen roleplay siempre.' },
    { icon: '🤝', title: '¿Cómo Ingresar?', text: 'Para unirte a Palazzo debes demostrar valía dentro del servidor. Contacta a un miembro o usa el enlace de postulación.' },
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
  photos: [],
  passHash: null
};

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return 'p_' + Math.abs(h).toString(16);
}

const DEFAULT_PASS = 'palazzo';
const DEFAULT_PASS_HASH = simpleHash(DEFAULT_PASS);

let sbClient = null;
let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
let isLoggedIn = false;
let currentPassHash = DEFAULT_PASS_HASH;

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function initSupabase() {
  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('Supabase SDK not loaded');
    applyState();
    return false;
  }
  sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await loadFromDB();
  return true;
}

async function loadFromDB() {
  try {
    const { data: row } = await sbClient.from('palazzo_data').select('data').eq('id','main').maybeSingle();
    if (row && row.data && Object.keys(row.data).length > 0) {
      state = { ...DEFAULT_STATE, ...row.data };
      if (state.passHash) currentPassHash = state.passHash;
    }
    const { data: photos } = await sbClient.from('photos').select('id,url,caption').order('created_at',{ascending:false});
    if (photos && photos.length) {
      state.photos = photos.map(p => ({ id: p.id, url: p.url, caption: p.caption || '' }));
    }
  } catch(e) { console.error('loadFromDB', e); }
  applyState();
}

async function saveStateToDB() {
  const payload = { navTitle: state.navTitle, heroSub: state.heroSub, logoSrc: state.logoSrc, cards: state.cards, contacto: state.contacto, passHash: currentPassHash };
  const { error } = await sbClient.from('palazzo_data').upsert({ id: 'main', data: payload, updated_at: new Date().toISOString() });
  if (error) { console.error(error); return false; }
  return true;
}

async function addPhotoToDB(url, caption) {
  const { data, error } = await sbClient.from('photos').insert({ url, caption: caption||'' }).select('id,url,caption').single();
  if (error) { console.error(error); return null; }
  return data;
}

async function deletePhotoFromDB(id) {
  const { error } = await sbClient.from('photos').delete().eq('id', id);
  return !error;
}

async function uploadImageToStorage(file) {
  const ext = (file.name.split('.').pop()||'jpg').toLowerCase();
  const path = Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.' + ext;
  const { error } = await sbClient.storage.from('photos').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return sbClient.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

function applyState() {
  const navTitle = document.getElementById('nav-title');
  const heroTitle = document.getElementById('hero-title');
  const heroSub = document.getElementById('hero-sub');
  if (navTitle) navTitle.textContent = state.navTitle || 'Palazzo';
  if (heroTitle) heroTitle.textContent = state.navTitle || 'Palazzo';
  if (heroSub) heroSub.textContent = state.heroSub || '';

  const logoCircle = document.getElementById('nav-logo-circle');
  const heroLogo = document.getElementById('hero-logo');
  if (logoCircle && heroLogo) {
    if (state.logoSrc) {
      logoCircle.innerHTML = '<img src="'+esc(state.logoSrc)+'" alt="Logo" onerror="this.remove()">';
      heroLogo.innerHTML = '<img src="'+esc(state.logoSrc)+'" alt="Logo">';
    } else {
      logoCircle.innerHTML = '<span class="logo-fallback">P</span>';
      heroLogo.innerHTML = '<span class="hero-logo-placeholder">P</span>';
    }
  }

  const grid = document.getElementById('info-grid');
  if (grid) {
    grid.innerHTML = (state.cards||[]).map(c =>
      '<div class="info-card"><div class="card-icon">'+(c.icon||'📌')+'</div><h2 class="card-title">'+esc(c.title)+'</h2><p class="card-text">'+esc(c.text)+'</p></div>'
    ).join('');
  }

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
  setText('postular-title', state.contacto && state.contacto.postularTitle);
  setText('postular-text', state.contacto && state.contacto.postularText);
  const reqs = ((state.contacto && state.contacto.postularReqs) || '').split('\n').filter(Boolean);
  const reqEl = document.getElementById('postular-reqs');
  if (reqEl) reqEl.innerHTML = reqs.map(r => '<li>✔ '+esc(r)+'</li>').join('');
  const postBtn = document.getElementById('postular-btn');
  if (postBtn) postBtn.href = (state.contacto && state.contacto.postularLink) || '#';
  setText('owner-name', (state.contacto && state.contacto.ownerName) || 'Owner');
  setText('owner-role', state.contacto && state.contacto.ownerRole);
  setText('owner-text', state.contacto && state.contacto.ownerText);
  const ownerBtn = document.getElementById('owner-btn');
  if (ownerBtn) ownerBtn.href = (state.contacto && state.contacto.ownerLink) || '#';

  renderPhotos();
}

function renderPhotos() {
  const grid = document.getElementById('photos-grid');
  if (!grid) return;
  if (!state.photos || !state.photos.length) {
    grid.innerHTML = '<div class="no-photos-msg">No hay fotos aún. El administrador puede añadirlas desde el panel.</div>';
    return;
  }
  grid.innerHTML = state.photos.map(p =>
    '<div class="photo-item" onclick="openLightbox(\''+esc(p.url)+'\')"><img src="'+esc(p.url)+'" loading="lazy">'+(p.caption?'<div class="photo-caption">'+esc(p.caption)+'</div>':'')+'</div>'
  ).join('');
}

function renderAdminPhotos() {
  const list = document.getElementById('admin-photos-list');
  if (!list) return;
  if (!state.photos.length) {
    list.innerHTML = '<p style="color:#456;text-align:center;grid-column:1/-1">Sin fotos</p>';
    return;
  }
  list.innerHTML = state.photos.map((p,i) =>
    '<div class="admin-photo-item"><img src="'+esc(p.url)+'"><button class="del-btn" onclick="deletePhoto('+i+')">✕</button></div>'
  ).join('');
}

function renderCardsEditor() {
  const container = document.getElementById('cards-editor');
  if (!container) return;
  container.innerHTML = (state.cards||[]).map((c,i) =>
    '<div class="card-editor-block"><h4>'+(c.icon||'📌')+' Tarjeta '+(i+1)+'</h4>'+
    '<div class="form-group"><label>Icono</label><input type="text" id="ce-icon-'+i+'" value="'+esc(c.icon)+'" maxlength="4"></div>'+
    '<div class="form-group"><label>Título</label><input type="text" id="ce-title-'+i+'" value="'+esc(c.title)+'"></div>'+
    '<div class="form-group"><label>Texto</label><textarea id="ce-text-'+i+'">'+esc(c.text)+'</textarea></div>'+
    '<button class="btn-neon" style="font-size:12px;padding:7px 16px" onclick="saveCard('+i+')">Guardar</button> <span class="save-msg" id="ce-msg-'+i+'"></span></div>'
  ).join('');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const tab = document.getElementById('tab-'+tabId);
  if (tab) tab.classList.add('active');
  const link = document.querySelector('.nav-link[data-tab="'+tabId+'"]');
  if (link) link.classList.add('active');
  if (tabId==='admin' && isLoggedIn) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
  }
}

function adminLogin() {
  const pass = (document.getElementById('admin-pass').value||'').trim();
  const err = document.getElementById('login-error');
  const hashed = simpleHash(pass);
  if (hashed===currentPassHash || hashed===DEFAULT_PASS_HASH || pass===DEFAULT_PASS) {
    isLoggedIn = true;
    err.textContent = '';
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('admin-pass').value = '';
    fillAdminForms(); renderCardsEditor(); renderAdminPhotos();
  } else {
    err.textContent = 'Contraseña incorrecta. Usa: palazzo';
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
  const sec = document.getElementById('admin-'+id);
  if (sec) sec.style.display = 'block';
  const btn = document.querySelector('.admin-tab-btn[data-admin="'+id+'"]');
  if (btn) btn.classList.add('active');
  if (id==='photos') renderAdminPhotos();
  if (id==='cards') renderCardsEditor();
}

function fillAdminForms() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  set('edit-nav-title', state.navTitle);
  set('edit-hero-sub', state.heroSub);
  set('edit-logo-url', state.logoSrc);
  set('edit-postular-title', state.contacto && state.contacto.postularTitle);
  set('edit-postular-text', state.contacto && state.contacto.postularText);
  set('edit-postular-reqs', state.contacto && state.contacto.postularReqs);
  set('edit-postular-link', state.contacto && state.contacto.postularLink);
  set('edit-owner-name', state.contacto && state.contacto.ownerName);
  set('edit-owner-role', state.contacto && state.contacto.ownerRole);
  set('edit-owner-text', state.contacto && state.contacto.ownerText);
  set('edit-owner-link', state.contacto && state.contacto.ownerLink);
}

async function saveGeneral() {
  state.navTitle = document.getElementById('edit-nav-title').value.trim() || state.navTitle;
  state.heroSub = document.getElementById('edit-hero-sub').value.trim() || state.heroSub;
  const logoUrl = document.getElementById('edit-logo-url').value.trim();
  if (logoUrl) state.logoSrc = logoUrl;
  showMsg('save-general-msg','⏳ Guardando...');
  const ok = await saveStateToDB();
  applyState();
  showMsg('save-general-msg', ok ? '✓ Guardado en la nube' : '✗ Error');
}

async function saveCard(idx) {
  state.cards[idx].icon = document.getElementById('ce-icon-'+idx).value || state.cards[idx].icon;
  state.cards[idx].title = document.getElementById('ce-title-'+idx).value || state.cards[idx].title;
  state.cards[idx].text = document.getElementById('ce-text-'+idx).value || state.cards[idx].text;
  showMsg('ce-msg-'+idx,'⏳...');
  const ok = await saveStateToDB();
  applyState();
  showMsg('ce-msg-'+idx, ok ? '✓ Guardado' : '✗ Error');
}

async function saveContacto() {
  state.contacto.postularTitle = document.getElementById('edit-postular-title').value.trim();
  state.contacto.postularText = document.getElementById('edit-postular-text').value.trim();
  state.contacto.postularReqs = document.getElementById('edit-postular-reqs').value.trim();
  state.contacto.postularLink = document.getElementById('edit-postular-link').value.trim();
  state.contacto.ownerName = document.getElementById('edit-owner-name').value.trim();
  state.contacto.ownerRole = document.getElementById('edit-owner-role').value.trim();
  state.contacto.ownerText = document.getElementById('edit-owner-text').value.trim();
  state.contacto.ownerLink = document.getElementById('edit-owner-link').value.trim();
  showMsg('save-contacto-msg','⏳...');
  const ok = await saveStateToDB();
  applyState();
  showMsg('save-contacto-msg', ok ? '✓ Guardado' : '✗ Error');
}

async function changePass() {
  const np = document.getElementById('new-admin-pass').value.trim();
  if (np.length < 6) { showMsg('save-pass-msg','Mínimo 6 caracteres'); return; }
  currentPassHash = simpleHash(np);
  state.passHash = currentPassHash;
  document.getElementById('new-admin-pass').value = '';
  showMsg('save-pass-msg','⏳...');
  const ok = await saveStateToDB();
  showMsg('save-pass-msg', ok ? '✓ Contraseña actualizada' : '✗ Error');
}

async function addPhotoByUrl() {
  const url = document.getElementById('photo-url').value.trim();
  if (!url) return;
  const row = await addPhotoToDB(url,'');
  if (row) {
    state.photos.unshift({ id: row.id, url: row.url, caption: '' });
    document.getElementById('photo-url').value = '';
    renderPhotos(); renderAdminPhotos();
  } else alert('Error al guardar');
}

async function deletePhoto(idx) {
  if (!confirm('¿Eliminar esta foto?')) return;
  const p = state.photos[idx];
  if (p.id && !(await deletePhotoFromDB(p.id))) { alert('Error'); return; }
  state.photos.splice(idx,1);
  renderPhotos(); renderAdminPhotos();
}

async function handleFiles(files) {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const url = await uploadImageToStorage(file);
      const row = await addPhotoToDB(url, file.name);
      if (row) {
        state.photos.unshift({ id: row.id, url: row.url, caption: row.caption||'' });
        renderPhotos(); renderAdminPhotos();
      }
    } catch(e) { alert('Error: '+(e.message||e)); }
  }
}

function showMsg(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    if (text && !text.includes('⏳')) setTimeout(() => { el.textContent = ''; }, 3000);
  }
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.supabase === 'undefined') {
    try {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    } catch(e) { console.error('Failed to load Supabase SDK', e); }
  }

  await initSupabase();

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchTab(link.dataset.tab); });
  });

  const toggle = document.getElementById('nav-toggle');
  if (toggle) toggle.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });

  document.getElementById('login-btn')?.addEventListener('click', adminLogin);
  document.getElementById('admin-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
  document.getElementById('logout-btn')?.addEventListener('click', adminLogout);

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAdminSection(btn.dataset.admin));
  });

  document.getElementById('save-general-btn')?.addEventListener('click', saveGeneral);
  document.getElementById('save-contacto-btn')?.addEventListener('click', saveContacto);
  document.getElementById('change-pass-btn')?.addEventListener('click', changePass);
  document.getElementById('add-url-btn')?.addEventListener('click', addPhotoByUrl);

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

  document.getElementById('lightbox')?.addEventListener('click', closeLightbox);
});
