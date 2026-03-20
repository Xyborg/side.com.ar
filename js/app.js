/* =============================================
   SIDE Declassified Documents Explorer
   Shared utilities and navigation
   ============================================= */

// --- HTML escaping ---
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// --- Data loading ---
async function loadJSON(path) {
  const res = await fetch(path + '?v=2');
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// --- Navigation ---
function initNav() {
  const path = location.pathname;
  document.querySelectorAll('.navbar-nav > li').forEach(li => {
    const link = li.querySelector(':scope > a');
    if (!link) return;
    const href = link.getAttribute('href');

    if (li.classList.contains('dropdown')) {
      const childLinks = li.querySelectorAll('.dropdown-menu a');
      childLinks.forEach(a => {
        const childHref = a.getAttribute('href');
        if (childHref && path.startsWith(childHref)) {
          a.parentElement.classList.add('active');
          li.classList.add('active');
        }
      });
    } else if (href === '/' && (path === '/' || path === '/index.html')) {
      li.classList.add('active');
    } else if (href && href !== '/' && path.startsWith(href)) {
      li.classList.add('active');
    }
  });
}

// --- Date formatting ---
function formatDate(dateStr) {
  if (!dateStr) return '';
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} de ${months[m - 1]} de ${y}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// --- Classification badge ---
function classificationBadge(cls) {
  const c = cls.toUpperCase();
  if (c === 'ESC') {
    return '<span class="badge-classification badge-esc">ESC</span>';
  }
  return '<span class="badge-classification badge-s">SECRETO</span>';
}

// --- Carpeta badge ---
function carpetaBadge(carpetaNum) {
  return `<span class="badge badge-carpeta badge-carpeta-${carpetaNum}">Carpeta ${carpetaNum}</span>`;
}

// --- Truncate text ---
function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.substring(0, max).trim() + '...';
}

// --- Image CDN ---
// Proxy page images through WordPress Photon CDN to save bandwidth.
// Change SITE_DOMAIN once the custom domain is live.
const SITE_DOMAIN = 'side.com.ar';
const CDN_HOSTS = ['i0.wp.com', 'i1.wp.com', 'i2.wp.com'];

function pageImageURL(globalPage) {
  const padded = String(globalPage).padStart(4, '0');
  const host = CDN_HOSTS[globalPage % CDN_HOSTS.length];
  return `https://${host}/${SITE_DOMAIN}/images/pages/page-${padded}.jpg`;
}

// --- Pan & Zoom for image viewers ---
// Call initPanZoom(container) where container holds an <img>.
// Returns { getZoom, setZoom, reset } to integrate with existing zoom buttons.
function initPanZoom(container) {
  let zoom = 1, panX = 0, panY = 0;
  let dragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;

  function applyTransform() {
    const img = container.querySelector('img');
    if (!img) return;
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    img.style.cursor = zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default';
    img.classList.toggle('zoomed', zoom > 1);
  }

  function setZoom(z) {
    zoom = z;
    // Clamp pan so image doesn't drift too far
    if (zoom <= 1) { panX = 0; panY = 0; }
    applyTransform();
  }

  function reset() {
    zoom = 1; panX = 0; panY = 0;
    applyTransform();
  }

  function onPointerDown(e) {
    if (zoom <= 1) return;
    const img = container.querySelector('img');
    if (!img || e.target !== img) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    startPanX = panX; startPanY = panY;
    img.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    panX = startPanX + (e.clientX - startX);
    panY = startPanY + (e.clientY - startY);
    applyTransform();
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    const img = container.querySelector('img');
    if (img) img.style.cursor = zoom > 1 ? 'grab' : 'default';
  }

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // Prevent image drag ghost
  container.addEventListener('dragstart', e => e.preventDefault());

  // Mouse wheel zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    zoom = Math.max(0.5, Math.min(3, zoom + delta));
    if (zoom <= 1) { panX = 0; panY = 0; }
    applyTransform();
  }, { passive: false });

  return { getZoom: () => zoom, setZoom, reset, applyTransform };
}

// --- URL params ---
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// --- Disclaimer Modal ---
function showDisclaimer() {
  if (localStorage.getItem('side_disclaimer_accepted')) return;

  const overlay = document.createElement('div');
  overlay.className = 'disclaimer-overlay';
  overlay.innerHTML = `
    <div class="disclaimer-modal">
      <div class="disclaimer-icon"><i class="fa fa-exclamation-triangle"></i></div>
      <h2>Aviso importante</h2>
      <p>
        Este <strong>no es un sitio oficial</strong> del Gobierno de la República Argentina
        ni de la Secretaría de Inteligencia de Estado.
      </p>
      <p>
        El único objetivo de este sitio es facilitar la navegación y consulta de los
        documentos históricos ya publicados por el Estado argentino en el marco de la
        desclasificación de archivos de la SIDE (1973–1983).
      </p>
      <div class="disclaimer-highlight">
        Para acceder al sitio oficial de la Secretaría de Inteligencia y sus archivos,
        visitá <strong>argentina.gob.ar/inteligencia/archivos</strong>.
      </div>
      <div class="disclaimer-actions">
        <button class="btn btn-decline" id="disclaimer-decline">No acepto</button>
        <button class="btn btn-primary" id="disclaimer-accept">Entendido, continuar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('disclaimer-accept').addEventListener('click', () => {
    localStorage.setItem('side_disclaimer_accepted', '1');
    overlay.remove();
  });

  document.getElementById('disclaimer-decline').addEventListener('click', () => {
    window.location.href = 'https://www.argentina.gob.ar/inteligencia/archivos';
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  showDisclaimer();
});
