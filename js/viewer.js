/* =============================================
   Page-by-page document viewer
   ============================================= */

(async function () {
  const [documents, carpetas, timeline] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json'),
    loadJSON('/data/timeline.json')
  ]);

  const docId = getParam('id');
  if (!docId) {
    window.location.href = '/documentos/';
    return;
  }

  const doc = documents.find(d => d.id === docId);
  if (!doc) {
    document.getElementById('viewer-content').innerHTML =
      '<div class="empty-state"><p>Documento no encontrado.</p><a href="/documentos/">Volver al catálogo</a></div>';
    return;
  }

  const carpeta = carpetas.find(c => c.id === doc.carpeta);

  // State — use global page numbers from the 987-page compiled PDF
  const globalStart = doc.global_page_start || 1;
  const totalPages = doc.page_count;
  let currentPage = 1; // local page (1-based within this doc)
  let zoom = 1;

  // Populate metadata
  document.getElementById('doc-title').textContent = doc.title;
  document.getElementById('doc-badges').innerHTML =
    classificationBadge(doc.classification) + ' ' + carpetaBadge(doc.carpeta);
  document.getElementById('doc-date').textContent = formatDate(doc.date);
  document.getElementById('doc-type').textContent = doc.type;
  document.getElementById('doc-original').textContent = doc.original_or_copy;
  document.getElementById('doc-pages').textContent = `${doc.page_count} páginas (desde p.${globalStart})`;
  document.getElementById('doc-reference').textContent = doc.reference_code;
  document.getElementById('doc-description-es').textContent = doc.description;

  // Historical context
  const historicalEvents = timeline.filter(e =>
    e.type === 'historical' &&
    Math.abs(parseInt(e.date.substring(0, 4)) - doc.year) <= 1
  );
  const contextEl = document.getElementById('doc-context');
  if (historicalEvents.length > 0) {
    contextEl.innerHTML = historicalEvents.map(e =>
      `<p><strong>${formatDate(e.date)}:</strong> ${e.description}</p>`
    ).join('');
  } else {
    contextEl.innerHTML = '<p>Sin eventos históricos cercanos registrados.</p>';
  }

  // Tags
  const tagsEl = document.getElementById('doc-tags');
  if (doc.tags && doc.tags.length > 0) {
    tagsEl.innerHTML = doc.tags.map(t =>
      `<span class="doc-tag">${t}</span>`
    ).join(' ');
  }

  // Navigation between documents
  const docIndex = documents.findIndex(d => d.id === docId);
  const prevDoc = docIndex > 0 ? documents[docIndex - 1] : null;
  const nextDoc = docIndex < documents.length - 1 ? documents[docIndex + 1] : null;
  const navLinks = document.getElementById('viewer-nav-links');

  navLinks.innerHTML = `
    ${prevDoc ? `<a href="/documentos/ver/?id=${prevDoc.id}">
      <span class="nav-label">Anterior</span>${truncate(prevDoc.title, 30)}
    </a>` : '<span></span>'}
    ${nextDoc ? `<a href="/documentos/ver/?id=${nextDoc.id}">
      <span class="nav-label">Siguiente</span>${truncate(nextDoc.title, 30)}
    </a>` : '<span></span>'}
  `;

  // Page viewer
  const imgContainer = document.getElementById('viewer-image');
  const pageIndicator = document.getElementById('page-indicator');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  const pz = initPanZoom(imgContainer);

  function getPageImagePath(pageNum) {
    return pageImageURL(globalStart + pageNum - 1);
  }

  function updatePage() {
    const globalPage = globalStart + currentPage - 1;
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    pageIndicator.title = `Página ${globalPage} del archivo original`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;

    const img = imgContainer.querySelector('img') || document.createElement('img');
    img.src = getPageImagePath(currentPage);
    img.alt = `${doc.title} — Página ${currentPage}`;

    img.onerror = function () {
      imgContainer.innerHTML = `<div class="viewer-placeholder">
        <p>Imagen no disponible</p>
        <p style="font-size:0.8rem">Página ${currentPage} de ${totalPages}</p>
      </div>`;
    };

    if (!img.parentNode) {
      imgContainer.innerHTML = '';
      imgContainer.appendChild(img);
    }

    pz.applyTransform();
  }

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; pz.reset(); updatePage(); }
  });

  btnNext.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; pz.reset(); updatePage(); }
  });

  btnZoomIn.addEventListener('click', () => {
    pz.setZoom(Math.min(pz.getZoom() + 0.25, 3));
  });

  btnZoomOut.addEventListener('click', () => {
    pz.setZoom(Math.max(pz.getZoom() - 0.25, 0.5));
  });

  btnZoomReset.addEventListener('click', () => pz.reset());

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentPage > 1) { currentPage--; pz.reset(); updatePage(); }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentPage < totalPages) { currentPage++; pz.reset(); updatePage(); }
    } else if (e.key === '+' || e.key === '=') {
      pz.setZoom(Math.min(pz.getZoom() + 0.25, 3));
    } else if (e.key === '-') {
      pz.setZoom(Math.max(pz.getZoom() - 0.25, 0.5));
    }
  });

  // Set page title and breadcrumb
  document.title = `${doc.title} — Archivos SIDE`;
  const breadcrumb = document.getElementById('breadcrumb-title');
  if (breadcrumb) breadcrumb.textContent = doc.title;

  updatePage();
})();
