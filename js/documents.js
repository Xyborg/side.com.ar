/* =============================================
   Document listing, filtering, search
   ============================================= */

(async function () {
  const [documents, carpetas, transcriptIndex] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json'),
    loadOptionalJSON('/data/search-index.json', [])
  ]);

  const grid = document.getElementById('documents-grid');
  const searchBox = document.getElementById('search-box');
  const sortSelect = document.getElementById('sort-select');
  const countLabel = document.getElementById('doc-count-label');
  const transcriptResults = document.getElementById('transcript-results');
  const docsById = Object.fromEntries(documents.map(doc => [doc.id, doc]));

  // Pre-populate from URL
  const urlCarpeta = getParam('carpeta');

  // Filters state
  let filters = {
    carpetas: urlCarpeta ? [parseInt(urlCarpeta)] : [],
    years: [],
    classifications: [],
    search: ''
  };

  function getMatchingDocumentIds() {
    let docs = [...documents];

    if (filters.carpetas.length > 0) {
      docs = docs.filter(d => filters.carpetas.includes(d.carpeta));
    }

    if (filters.years.length > 0) {
      docs = docs.filter(d => filters.years.includes(d.year));
    }

    if (filters.classifications.length > 0) {
      docs = docs.filter(d => filters.classifications.includes(d.classification));
    }

    return new Set(docs.map(doc => doc.id));
  }

  function buildSnippet(text, query) {
    if (!text) return '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) return '';
    const normalizedText = normalizeSearchText(cleanText);
    const index = normalizedText.indexOf(query);
    if (index === -1) return truncate(cleanText, 180);

    const start = Math.max(0, index - 70);
    const end = Math.min(cleanText.length, index + query.length + 90);
    const snippet = cleanText.slice(start, end).trim();
    return `${start > 0 ? '... ' : ''}${snippet}${end < cleanText.length ? ' ...' : ''}`;
  }

  function getTranscriptMatches() {
    const query = normalizeSearchText(filters.search);
    if (!query || !Array.isArray(transcriptIndex) || transcriptIndex.length === 0) return [];

    const allowedDocIds = getMatchingDocumentIds();
    return transcriptIndex
      .filter(entry => {
        if (!allowedDocIds.has(entry.docId)) return false;
        const haystack = normalizeSearchText(`${entry.title || ''} ${entry.text || ''}`);
        return haystack.includes(query);
      })
      .slice(0, 12)
      .map(entry => {
        const doc = docsById[entry.docId];
        return {
          ...entry,
          doc,
          snippet: buildSnippet(entry.text || '', query)
        };
      })
      .filter(entry => entry.doc);
  }

  // Render filter sidebar checkboxes
  function initFilters() {
    // Year filters — build dynamically from data
    const yearContainer = document.getElementById('year-filters');
    if (yearContainer) {
      const years = [...new Set(documents.map(d => d.year))].sort();
      yearContainer.innerHTML = years.map(y =>
        `<label><input type="checkbox" class="filter-year" value="${y}"> ${y}</label>`
      ).join('');
      yearContainer.querySelectorAll('.filter-year').forEach(cb => {
        cb.addEventListener('change', () => {
          filters.years = [...document.querySelectorAll('.filter-year:checked')].map(c => parseInt(c.value));
          render();
        });
      });
    }

    // Carpeta filters
    document.querySelectorAll('.filter-carpeta').forEach(cb => {
      if (urlCarpeta && cb.value === urlCarpeta) cb.checked = true;
      cb.addEventListener('change', () => {
        filters.carpetas = [...document.querySelectorAll('.filter-carpeta:checked')].map(c => parseInt(c.value));
        render();
      });
    });

    // Classification filters
    document.querySelectorAll('.filter-classification').forEach(cb => {
      cb.addEventListener('change', () => {
        filters.classifications = [...document.querySelectorAll('.filter-classification:checked')].map(c => c.value);
        render();
      });
    });

    // Search
    if (searchBox) {
      searchBox.addEventListener('input', () => {
        filters.search = searchBox.value.toLowerCase().trim();
        render();
      });
    }

    // Sort
    if (sortSelect) {
      sortSelect.addEventListener('change', render);
    }
  }

  function getFilteredDocs() {
    let docs = [...documents];

    // Filter by carpeta
    if (filters.carpetas.length > 0) {
      docs = docs.filter(d => filters.carpetas.includes(d.carpeta));
    }

    // Filter by year
    if (filters.years.length > 0) {
      docs = docs.filter(d => filters.years.includes(d.year));
    }

    // Filter by classification
    if (filters.classifications.length > 0) {
      docs = docs.filter(d => filters.classifications.includes(d.classification));
    }

    // Search
    if (filters.search) {
      const q = filters.search;
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.description_en && d.description_en.toLowerCase().includes(q)) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    const sort = sortSelect ? sortSelect.value : 'date';
    if (sort === 'date') {
      docs.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sort === 'date-desc') {
      docs.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sort === 'title') {
      docs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'pages') {
      docs.sort((a, b) => b.page_count - a.page_count);
    }

    return docs;
  }

  function renderTranscriptResults(matches) {
    if (!transcriptResults) return;

    if (!filters.search || matches.length === 0) {
      transcriptResults.hidden = true;
      transcriptResults.innerHTML = '';
      return;
    }

    transcriptResults.hidden = false;
    transcriptResults.innerHTML = `
      <div class="transcript-results-header">
        <h2>Coincidencias en transcripciones</h2>
        <span>${matches.length} resultados</span>
      </div>
      <div class="transcript-results-list">
        ${matches.map(match => `
          <a class="transcript-result-card" href="${buildViewerURL(match.docId, match.page)}">
            <div class="transcript-result-meta">
              <span class="badge badge-carpeta badge-carpeta-${match.doc.carpeta}">Carpeta ${match.doc.carpeta}</span>
              <span>Página ${match.page}</span>
            </div>
            <h3>${escapeHTML(match.doc.title)}</h3>
            <p>${escapeHTML(match.snippet || 'Coincidencia en la transcripción del documento.')}</p>
          </a>
        `).join('')}
      </div>
    `;
  }

  function render() {
    const docs = getFilteredDocs();
    const transcriptMatches = getTranscriptMatches();

    if (countLabel) {
      countLabel.textContent = `${docs.length} de ${documents.length} documentos`;
    }

    renderTranscriptResults(transcriptMatches);

    if (docs.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No se encontraron documentos con los filtros seleccionados.</p></div>';
      return;
    }

    grid.innerHTML = docs.map(doc => `
      <a href="/documentos/ver/?id=${doc.id}" class="doc-card">
        <div class="doc-card-header">
          <div>
            <h3>${doc.title}</h3>
            <div class="doc-date">${formatDate(doc.date)}</div>
          </div>
          <div class="doc-card-badges">
            ${classificationBadge(doc.classification)}
          </div>
        </div>
        <p>${truncate(doc.description, 150)}</p>
        <div class="doc-card-footer">
          ${carpetaBadge(doc.carpeta)}
          <span>${doc.page_count} pág.</span>
        </div>
      </a>
    `).join('');
  }

  initFilters();
  render();
})();
