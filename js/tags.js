/* =============================================
   Tag Explorer — browse documents by tag
   ============================================= */

(async function () {
  const documents = await loadJSON('/data/documents.json');

  const tagListEl = document.getElementById('tag-list');
  const tagDetailEl = document.getElementById('tag-detail');
  const tagSearchEl = document.getElementById('tag-search');

  // Build tag index
  const tagIndex = {};
  documents.forEach(d => {
    d.tags.forEach(t => {
      if (!tagIndex[t]) tagIndex[t] = [];
      tagIndex[t].push(d);
    });
  });

  const sortedTags = Object.entries(tagIndex)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, docs]) => ({ tag, docs, count: docs.length }));

  let activeTag = null;

  function renderTagList(filter) {
    const q = (filter || '').toLowerCase();
    const filtered = q
      ? sortedTags.filter(t => t.tag.toLowerCase().includes(q))
      : sortedTags;

    tagListEl.innerHTML = filtered.map(({ tag, count }) =>
      `<div class="tag-list-item${activeTag === tag ? ' active' : ''}" data-tag="${escapeAttr(tag)}">
        ${escapeHtml(tag)}<span class="tag-item-count">${count}</span>
      </div>`
    ).join('') || '<p style="padding:12px;color:#999;">Sin resultados.</p>';

    tagListEl.querySelectorAll('.tag-list-item').forEach(el => {
      el.addEventListener('click', () => selectTag(el.dataset.tag));
    });
  }

  function selectTag(tag) {
    activeTag = tag;
    renderTagList(tagSearchEl ? tagSearchEl.value : '');
    renderDetail(tag);
  }

  function renderDetail(tag) {
    const docs = tagIndex[tag] || [];

    // Co-occurring tags
    const coTags = {};
    docs.forEach(d => {
      d.tags.forEach(t => {
        if (t !== tag) coTags[t] = (coTags[t] || 0) + 1;
      });
    });
    const sortedCoTags = Object.entries(coTags).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Mini timeline
    const yearCounts = {};
    for (let y = 1973; y <= 1983; y++) yearCounts[y] = 0;
    docs.forEach(d => { if (yearCounts[d.year] !== undefined) yearCounts[d.year]++; });
    const maxYear = Math.max(...Object.values(yearCounts), 1);

    let html = `
      <div class="tag-detail-header">
        <h2>"${escapeHtml(tag)}"</h2>
        <p style="color:#999;font-size:14px;">${docs.length} documento${docs.length !== 1 ? 's' : ''} con esta etiqueta</p>
      </div>
    `;

    // Co-occurring tags
    if (sortedCoTags.length > 0) {
      html += '<h4 style="font-size:13px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.03em;margin:15px 0 8px;">Etiquetas co-ocurrentes</h4>';
      html += '<div class="cooccurrence-tags">';
      html += sortedCoTags.map(([t, c]) =>
        `<span class="cooccurrence-tag" data-tag="${escapeAttr(t)}">${escapeHtml(t)} (${c})</span>`
      ).join('');
      html += '</div>';
    }

    // Mini timeline
    html += '<h4 style="font-size:13px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.03em;margin:20px 0 8px;">Distribución temporal</h4>';
    html += '<div class="tag-mini-timeline">';
    for (let y = 1973; y <= 1983; y++) {
      const h = yearCounts[y] > 0 ? Math.max((yearCounts[y] / maxYear) * 100, 8) : 0;
      html += `<div class="mini-bar" style="height:${h}%;" title="${y}: ${yearCounts[y]}"></div>`;
    }
    html += '</div>';
    html += '<div class="tag-mini-timeline-labels">';
    for (let y = 1973; y <= 1983; y++) html += `<span>${y}</span>`;
    html += '</div>';

    // Document list
    html += '<h4 style="font-size:13px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.03em;margin:20px 0 10px;">Documentos</h4>';
    html += '<div class="documents-grid">';
    docs.sort((a, b) => a.date.localeCompare(b.date)).forEach(doc => {
      html += `
        <a href="/documentos/ver/?id=${escapeAttr(doc.id)}" class="doc-card">
          <div class="doc-card-header">
            <div>
              <h3>${escapeHtml(doc.title)}</h3>
              <div class="doc-date">${formatDate(doc.date)}</div>
            </div>
            <div class="doc-card-badges">
              ${classificationBadge(doc.classification)}
            </div>
          </div>
          <p>${escapeHtml(truncate(doc.description, 120))}</p>
          <div class="doc-card-footer">
            ${carpetaBadge(doc.carpeta)}
            <span>${doc.page_count} pág.</span>
          </div>
        </a>
      `;
    });
    html += '</div>';

    tagDetailEl.innerHTML = html;

    // Bind co-occurrence clicks
    tagDetailEl.querySelectorAll('.cooccurrence-tag').forEach(el => {
      el.addEventListener('click', () => selectTag(el.dataset.tag));
    });
  }

  // Search
  if (tagSearchEl) {
    tagSearchEl.addEventListener('input', () => renderTagList(tagSearchEl.value));
  }

  function renderEmptyState() {
    tagDetailEl.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#999;">
        <i class="fa fa-tags" style="font-size:48px;margin-bottom:16px;display:block;opacity:0.3;"></i>
        <h3 style="color:#666;font-weight:600;margin-bottom:8px;">Seleccioná una etiqueta</h3>
        <p style="font-size:14px;">Elegí una etiqueta de la lista para ver los documentos asociados, co-ocurrencias y distribución temporal.</p>
      </div>
    `;
  }

  // Init — select from URL param or show empty state
  const urlTag = getParam('tag');

  renderTagList();
  if (urlTag && tagIndex[urlTag]) {
    selectTag(urlTag);
  } else {
    renderEmptyState();
  }
})();
