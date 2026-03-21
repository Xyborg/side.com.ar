/* =============================================
   Page-by-page document viewer
   ============================================= */

(async function () {
  const mainEl = document.getElementById('viewer-content');
  const isPreRendered = mainEl && mainEl.dataset.docId && mainEl.dataset.pageStart;

  let doc, documents, carpetas, timeline, themes;

  if (isPreRendered) {
    // SSG page — all metadata is in the HTML already.
    // Only need minimal data from data attributes for the page viewer.
    doc = {
      id: mainEl.dataset.docId,
      title: mainEl.dataset.docTitle,
      global_page_start: parseInt(mainEl.dataset.pageStart, 10),
      page_count: parseInt(mainEl.dataset.pageCount, 10)
    };
  } else {
    // Dynamic fallback — load all JSON data
    [documents, carpetas, timeline, themes] = await Promise.all([
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

    doc = documents.find(d => d.id === docId);
    if (!doc) {
      mainEl.innerHTML =
        '<div class="empty-state"><p>Documento no encontrado.</p><a href="/documentos/">Volver al catálogo</a></div>';
      return;
    }

    const globalStart = doc.global_page_start || 1;

    // Populate all metadata
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
        other.tags.forEach(t => { if (doc.tags.includes(t)) score += 3; });
        if (other.carpeta === doc.carpeta) score += 2;
        docThemes.forEach(theme => { if (theme.doc_ids.includes(other.id)) score += 2; });
        if (other.year === doc.year) score += 1;
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
            `<li><a href="/documentos/ver/${escapeAttr(r.id)}/">${escapeHtml(r.title)}</a><div class="related-meta">${carpetaBadge(r.carpeta)} ${formatDateShort(r.date)} · ${r.page_count} pág.</div></li>`
          ).join('') + '</ul>';
      } else {
        relatedEl.innerHTML = '<p style="color:#999;font-size:13px;">Sin documentos relacionados.</p>';
      }
    }

    // Navigation between documents
    const docIndex = documents.findIndex(d => d.id === doc.id);
    const prevDoc = docIndex > 0 ? documents[docIndex - 1] : null;
    const nextDoc = docIndex < documents.length - 1 ? documents[docIndex + 1] : null;
    const navLinks = document.getElementById('viewer-nav-links');

    navLinks.innerHTML = `
      ${prevDoc ? `<a href="/documentos/ver/${escapeAttr(prevDoc.id)}/">
        <span class="nav-label">Anterior</span>${escapeHtml(truncate(prevDoc.title, 30))}
      </a>` : '<span></span>'}
      ${nextDoc ? `<a href="/documentos/ver/${escapeAttr(nextDoc.id)}/">
        <span class="nav-label">Siguiente</span>${escapeHtml(truncate(nextDoc.title, 30))}
      </a>` : '<span></span>'}
    `;

    document.title = `${doc.title} — Archivos SIDE`;
    const breadcrumb = document.getElementById('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = doc.title;

    // Load analysis dynamically
    loadAnalysisDynamic(doc.id);
  }

  // --- Page viewer (always runs) ---

  const globalStart = doc.global_page_start || 1;
  const totalPages = doc.page_count;
  const requestedPage = parseInt(getParam('page') || '1', 10);
  let currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  let transcriptData = null;
  let transcriptVisible = true;

  const imgContainer = document.getElementById('viewer-image');
  const pageIndicator = document.getElementById('page-indicator');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const transcriptPanel = document.getElementById('viewer-transcript-panel') || document.getElementById('viewer-transcription');
  const transcriptBody = document.getElementById('viewer-transcript-body') || document.getElementById('transcription-text');
  const transcriptNotice = document.getElementById('transcription-notice');
  const transcriptPageLabel = document.getElementById('viewer-transcript-page-label');
  const btnToggleTranscript = document.getElementById('btn-toggle-transcript');
  const btnCopyTranscript = document.getElementById('btn-copy-transcript');
  const transcriptFooter = transcriptPanel ? transcriptPanel.querySelector('.viewer-transcript-footer') : null;
  const transcriptDisclaimer = ensureTranscriptDisclaimer();

  const pz = initPanZoom(imgContainer);

  function ensureTranscriptDisclaimer() {
    if (!transcriptPanel) return null;

    const legacyNotice = transcriptPanel.querySelector('.transcription-body .text-muted');
    if (legacyNotice && /Texto extraído automáticamente mediante OCR/i.test(legacyNotice.textContent || '')) {
      legacyNotice.remove();
    }

    const existing = transcriptPanel.querySelector('.transcription-disclaimer');
    if (existing) return existing;

    const disclaimer = document.createElement('p');
    disclaimer.className = 'transcription-disclaimer';
    disclaimer.textContent = 'Transcripción OCR corregida. Puede contener errores, especialmente en tablas, sellos y diagramas.';

    if (transcriptBody) {
      transcriptBody.insertBefore(disclaimer, transcriptBody.firstChild);
    } else {
      transcriptPanel.appendChild(disclaimer);
    }

    return disclaimer;
  }

  function updatePageURL() {
    const next = new URL(window.location.href);
    if (!isPreRendered) next.searchParams.set('id', doc.id);
    if (currentPage > 1) {
      next.searchParams.set('page', currentPage);
    } else {
      next.searchParams.delete('page');
    }
    window.history.replaceState({}, '', next.pathname + next.search);
  }

  function getTranscriptEntry(pageNum) {
    if (!transcriptData || !Array.isArray(transcriptData.pages)) return null;
    return transcriptData.pages.find(entry => entry.page === pageNum) || null;
  }

  function renderTranscript() {
    if (!transcriptBody) return;

    const globalPage = globalStart + currentPage - 1;
    if (transcriptPageLabel) {
      transcriptPageLabel.textContent = `Página ${currentPage} · Original ${globalPage}`;
    }

    if (!transcriptData || !Array.isArray(transcriptData.pages)) {
      loadTranscription(globalPage);
      if (btnCopyTranscript) btnCopyTranscript.disabled = true;
      return;
    }

    const entry = getTranscriptEntry(currentPage);
    if (!entry || !entry.text || !entry.text.trim()) {
      transcriptBody.innerHTML = '<div class="viewer-transcript-empty"><p>No hay texto transcripto para esta página.</p></div>';
      if (transcriptNotice) transcriptNotice.textContent = '';
      if (btnCopyTranscript) btnCopyTranscript.disabled = true;
      return;
    }

    transcriptBody.innerHTML = `<pre class="viewer-transcript-text">${escapeHTML(entry.text)}</pre>`;
    if (transcriptNotice) transcriptNotice.textContent = '(OCR corregido)';
    if (btnCopyTranscript) btnCopyTranscript.disabled = false;
  }

  function setTranscriptVisibility(visible) {
    if (!transcriptPanel || !btnToggleTranscript) return;
    transcriptVisible = visible;
    transcriptPanel.classList.toggle('is-collapsed', !visible);
    transcriptBody.hidden = !visible;
    if (transcriptDisclaimer) transcriptDisclaimer.hidden = !visible;
    if (transcriptFooter) transcriptFooter.hidden = !visible;
    btnToggleTranscript.textContent = visible ? 'Ocultar transcripción' : 'Mostrar transcripción';
    btnToggleTranscript.setAttribute('aria-expanded', String(visible));
  }
  function updatePage() {
    const globalPage = globalStart + currentPage - 1;
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    pageIndicator.title = `Página ${globalPage} del archivo original`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;

    const img = imgContainer.querySelector('img') || document.createElement('img');
    img.src = pageImageURL(globalPage);
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
    updatePageURL();
    renderTranscript();
  }

  async function loadTranscription(globalPage) {
    const padded = String(globalPage).padStart(4, '0');
    const textEl = transcriptBody;
    const noticeEl = transcriptNotice;
    if (!textEl) return;

    try {
      const res = await fetch(`/data/ocr/page-${padded}.json`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();

      textEl.innerHTML = `<pre class="viewer-transcript-text">${escapeHTML(data.text || 'Sin texto disponible.')}</pre>`;
      if (noticeEl) {
        noticeEl.textContent = data.confidence === 'low'
          ? '(calidad baja — posible diagrama)' : '(OCR automático)';
      }
    } catch (e) {
      textEl.innerHTML = '<div class="viewer-transcript-empty"><p>Transcripción no disponible para esta página.</p></div>';
      if (noticeEl) noticeEl.textContent = '';
    }
  }

  // --- Analysis ---

  const ANALYSIS_LABELS = {
    sintesis_descriptiva: 'Síntesis Descriptiva',
    analisis_institucional_politico: 'Análisis Institucional y Político',
    analisis_derechos_humanos: 'Análisis de Derechos Humanos',
    analisis_derecho_constitucional: 'Análisis de Derecho Constitucional',
    analisis_derecho_internacional: 'Análisis de Derecho Internacional',
    analisis_social: 'Análisis Social',
    observaciones_archivisticas: 'Observaciones Archivísticas'
  };

  async function loadAnalysisDynamic(id) {
    try {
      const res = await fetch('/data/analysis/' + id + '.json');
      if (!res.ok) return;
      const data = await res.json();
      const sections = data.sections;
      if (!sections) return;

      const container = document.getElementById('viewer-analysis');
      const sectionsEl = document.getElementById('analysis-sections');
      const relevanceEl = document.getElementById('analysis-relevance');

      if (sections.relevancia_derechos_humanos) {
        const rel = sections.relevancia_derechos_humanos;
        const nivel = rel.nivel || '';
        relevanceEl.textContent = nivel;
        relevanceEl.className = 'analysis-relevance-badge ' + nivel.toLowerCase();
        relevanceEl.title = rel.justificacion || '';
      }

      var html = '';
      Object.keys(ANALYSIS_LABELS).forEach(function (key) {
        if (!sections[key]) return;
        html += '<div class="analysis-section">' +
          '<div class="analysis-section-header" data-section="' + key + '">' +
          '<span>' + ANALYSIS_LABELS[key] + '</span>' +
          '<i class="fa fa-chevron-right chevron"></i>' +
          '</div>' +
          '<div class="analysis-section-body">' + escapeHtml(sections[key]) + '</div>' +
          '</div>';
      });

      if (sections.palabras_clave && sections.palabras_clave.length > 0) {
        html += '<div class="analysis-section">' +
          '<div class="analysis-section-header" data-section="palabras_clave">' +
          '<span>Palabras Clave</span>' +
          '<i class="fa fa-chevron-right chevron"></i>' +
          '</div>' +
          '<div class="analysis-section-body"><div class="analysis-keywords">' +
          sections.palabras_clave.map(function (k) { return '<span class="doc-tag">' + escapeHtml(k) + '</span>'; }).join('') +
          '</div></div></div>';
      }

      if (sections.relevancia_derechos_humanos && sections.relevancia_derechos_humanos.justificacion) {
        html += '<div class="analysis-section">' +
          '<div class="analysis-section-header" data-section="relevancia">' +
          '<span>Relevancia para Derechos Humanos</span>' +
          '<i class="fa fa-chevron-right chevron"></i>' +
          '</div>' +
          '<div class="analysis-section-body">' + escapeHtml(sections.relevancia_derechos_humanos.justificacion) + '</div>' +
          '</div>';
      }

      sectionsEl.innerHTML = html;
      container.style.display = 'block';
    } catch (e) {
      // Analysis not available
    }
  }

  // Accordion behavior — works for both pre-rendered and dynamic
  const analysisSectionsEl = document.getElementById('analysis-sections');
  if (analysisSectionsEl) {
    analysisSectionsEl.addEventListener('click', function (e) {
      var header = e.target.closest('.analysis-section-header');
      if (!header) return;
      var body = header.nextElementSibling;
      var isOpen = header.classList.contains('open');
      header.classList.toggle('open');
      body.style.display = isOpen ? 'none' : 'block';
    });
  }

  // --- Controls ---

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
  btnToggleTranscript.addEventListener('click', () => setTranscriptVisibility(!transcriptVisible));
  btnCopyTranscript.addEventListener('click', async () => {
    const entry = getTranscriptEntry(currentPage);
    if (!entry || !entry.text) return;
    try {
      await navigator.clipboard.writeText(entry.text);
      btnCopyTranscript.textContent = 'Texto copiado';
      window.setTimeout(() => {
        btnCopyTranscript.textContent = 'Copiar texto';
      }, 1500);
    } catch (err) {
      btnCopyTranscript.textContent = 'No se pudo copiar';
      window.setTimeout(() => {
        btnCopyTranscript.textContent = 'Copiar texto';
      }, 1500);
    }
  });

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

  transcriptData = await loadOptionalJSON(`/data/transcripts/${doc.id}.json`, null);
  if (btnToggleTranscript) setTranscriptVisibility(true);
  updatePage();
})();
