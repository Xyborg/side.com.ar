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
  const urlTag = getParam('tag');

  // Filters state
  let filters = {
    carpetas: urlCarpeta ? [parseInt(urlCarpeta)] : [],
    years: [],
    classifications: [],
    tags: urlTag ? [urlTag] : [],
    search: ''
  };

  // --- Highlight helper ---
  function highlight(text, query) {
    if (!query || query.length > 100) return escapeHtml(text);
    const safe = escapeHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + escaped + ')', 'gi');
    return safe.replace(regex, '<mark class="search-highlight">$1</mark>');
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

    // Tag filters — build dynamically from data, sorted by frequency
    const tagContainer = document.getElementById('tag-filters');
    if (tagContainer) {
      const tagCounts = {};
      documents.forEach(d => d.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }));
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));

      tagContainer.innerHTML = sortedTags.map(({ tag, count }) =>
        `<label><input type="checkbox" class="filter-tag" value="${escapeAttr(tag)}"${filters.tags.includes(tag) ? ' checked' : ''}> ${escapeHtml(tag)} <span class="tag-count">(${count})</span></label>`
      ).join('');
      tagContainer.querySelectorAll('.filter-tag').forEach(cb => {
        cb.addEventListener('change', () => {
          filters.tags = [...document.querySelectorAll('.filter-tag:checked')].map(c => c.value);
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

    // Filter by tags
    if (filters.tags.length > 0) {
      docs = docs.filter(d => filters.tags.some(t => d.tags.includes(t)));
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
    const q = filters.search;

    if (countLabel) {
      countLabel.textContent = `${docs.length} de ${documents.length} documentos`;
    }

    if (docs.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No se encontraron documentos con los filtros seleccionados.</p></div>';
      return;
    }

    grid.innerHTML = docs.map(doc => {
      const title = q ? highlight(doc.title, q) : escapeHtml(doc.title);
      const desc = q ? highlight(truncate(doc.description, 150), q) : escapeHtml(truncate(doc.description, 150));
      return `
      <a href="/documentos/ver/?id=${escapeAttr(doc.id)}" class="doc-card">
        <div class="doc-card-header">
          <div>
            <h3>${title}</h3>
            <div class="doc-date">${formatDate(doc.date)}</div>
          </div>
          <div class="doc-card-badges">
            ${classificationBadge(doc.classification)}
          </div>
        </div>
        <p>${desc}</p>
        <div class="doc-card-footer">
          ${carpetaBadge(doc.carpeta)}
          <span>${doc.page_count} pág.</span>
        </div>
      </a>
    `;
    }).join('');
  }

  initFilters();
  render();
})();
