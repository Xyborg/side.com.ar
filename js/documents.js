/* =============================================
   Document listing, filtering, search
   ============================================= */

(async function () {
  const [documents, carpetas] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json')
  ]);

  const grid = document.getElementById('documents-grid');
  const searchBox = document.getElementById('search-box');
  const sortSelect = document.getElementById('sort-select');
  const countLabel = document.getElementById('doc-count-label');

  // Pre-populate from URL
  const urlCarpeta = getParam('carpeta');

  // Filters state
  let filters = {
    carpetas: urlCarpeta ? [parseInt(urlCarpeta)] : [],
    classifications: [],
    search: ''
  };

  // Render filter sidebar checkboxes
  function initFilters() {
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

  function render() {
    const docs = getFilteredDocs();

    if (countLabel) {
      countLabel.textContent = `${docs.length} de ${documents.length} documentos`;
    }

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
