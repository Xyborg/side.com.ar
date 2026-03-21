/* =============================================
   Page-by-page document viewer
   ============================================= */

(async function () {
  const [documents, carpetas, timeline, themes] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json'),
    loadJSON('/data/timeline.json'),
    loadJSON('/data/themes.json')
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
      `<p><strong>${formatDate(e.date)}:</strong> ${escapeHtml(e.description)}</p>`
    ).join('');
  } else {
    contextEl.innerHTML = '<p>Sin eventos históricos cercanos registrados.</p>';
  }

  // Structured data: DigitalDocument + update breadcrumb
  const schemaDoc = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    'name': doc.title,
    'description': doc.description,
    'dateCreated': doc.date,
    'inLanguage': 'es',
    'encodingFormat': 'image/jpeg',
    'numberOfPages': doc.page_count,
    'keywords': (doc.tags || []).join(', '),
    'isPartOf': {
      '@type': 'Dataset',
      '@id': 'https://side.com.ar/#dataset',
      'name': 'Documentos Desclasificados de la SIDE (1973–1983)'
    },
    'creator': {
      '@type': 'GovernmentOrganization',
      'name': 'Secretaría de Inteligencia de Estado (SIDE)'
    },
    'publisher': {
      '@type': 'Person',
      'name': 'Martin Aberastegue',
      'url': 'https://www.martinaberastegue.com'
    }
  };
  const schemaScript = document.createElement('script');
  schemaScript.type = 'application/ld+json';
  schemaScript.textContent = JSON.stringify(schemaDoc);
  document.head.appendChild(schemaScript);

  // Update breadcrumb schema with document name
  const breadcrumbEl = document.getElementById('schema-breadcrumb');
  if (breadcrumbEl) {
    try {
      const bc = JSON.parse(breadcrumbEl.textContent);
      bc.itemListElement[2].name = doc.title;
      breadcrumbEl.textContent = JSON.stringify(bc);
    } catch (e) { /* ignore */ }
  }

  // Tags
  const tagsEl = document.getElementById('doc-tags');
  if (doc.tags && doc.tags.length > 0) {
    tagsEl.innerHTML = doc.tags.map(t =>
      `<span class="doc-tag">${escapeHtml(t)}</span>`
    ).join(' ');
  }

  // Related documents
  const relatedEl = document.getElementById('doc-related');
  if (relatedEl) {
    const docThemes = themes.filter(t => t.doc_ids.includes(doc.id));
    const scores = {};

    documents.forEach(other => {
      if (other.id === doc.id) return;
      let score = 0;
      // +3 per shared tag
      other.tags.forEach(t => { if (doc.tags.includes(t)) score += 3; });
      // +2 if same carpeta
      if (other.carpeta === doc.carpeta) score += 2;
      // +2 if same theme
      docThemes.forEach(theme => { if (theme.doc_ids.includes(other.id)) score += 2; });
      // +1 if same year
      if (other.year === doc.year) score += 1;
      // +1 if same classification
      if (other.classification === doc.classification) score += 1;
      if (score > 0) scores[other.id] = score;
    });

    const related = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => documents.find(d => d.id === id));

    if (related.length > 0) {
      relatedEl.innerHTML = '<ul class="related-docs-list">' +
        related.map(r =>
          `<li><a href="/documentos/ver/?id=${escapeAttr(r.id)}">${escapeHtml(r.title)}</a><div class="related-meta">${carpetaBadge(r.carpeta)} ${formatDateShort(r.date)} · ${r.page_count} pág.</div></li>`
        ).join('') + '</ul>';
    } else {
      relatedEl.innerHTML = '<p style="color:#999;font-size:13px;">Sin documentos relacionados.</p>';
    }
  }

  // Navigation between documents
  const docIndex = documents.findIndex(d => d.id === docId);
  const prevDoc = docIndex > 0 ? documents[docIndex - 1] : null;
  const nextDoc = docIndex < documents.length - 1 ? documents[docIndex + 1] : null;
  const navLinks = document.getElementById('viewer-nav-links');

  navLinks.innerHTML = `
    ${prevDoc ? `<a href="/documentos/ver/?id=${escapeAttr(prevDoc.id)}">
      <span class="nav-label">Anterior</span>${escapeHtml(truncate(prevDoc.title, 30))}
    </a>` : '<span></span>'}
    ${nextDoc ? `<a href="/documentos/ver/?id=${escapeAttr(nextDoc.id)}">
      <span class="nav-label">Siguiente</span>${escapeHtml(truncate(nextDoc.title, 30))}
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
    loadTranscription(globalPage);
  }

  async function loadTranscription(globalPage) {
    const padded = String(globalPage).padStart(4, '0');
    const textEl = document.getElementById('transcription-text');
    const noticeEl = document.getElementById('transcription-notice');

    try {
      const res = await fetch(`/data/ocr/page-${padded}.json`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();

      textEl.textContent = data.text || 'Sin texto disponible.';
      noticeEl.textContent = data.confidence === 'low'
        ? '(calidad baja — posible diagrama)' : '';
    } catch (e) {
      textEl.textContent = 'Transcripción no disponible para esta página.';
      noticeEl.textContent = '';
    }
  }

  document.getElementById('btn-toggle-transcription').addEventListener('click', () => {
    const body = document.getElementById('transcription-body');
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  });

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
