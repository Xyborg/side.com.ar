/* =============================================
   Timeline rendering
   ============================================= */

(async function () {
  const [timeline, documents] = await Promise.all([
    loadJSON('/data/timeline.json'),
    loadJSON('/data/documents.json')
  ]);

  const container = document.getElementById('timeline-container');
  const filterBtns = document.querySelectorAll('.timeline-filter');
  const pillsContainer = document.getElementById('timeline-year-pills');

  let activeFilter = 'all';

  function getFiltered() {
    if (activeFilter === 'all') return timeline;
    if (activeFilter === 'documents') return timeline.filter(e => e.type === 'document');
    if (activeFilter === 'historical') return timeline.filter(e => e.type === 'historical');
    return timeline;
  }

  function renderPills() {
    if (!pillsContainer) return;
    const events = getFiltered();
    const yearCounts = {};
    events.forEach(e => { yearCounts[e.year] = (yearCounts[e.year] || 0) + 1; });
    const sortedYears = Object.keys(yearCounts).sort();

    pillsContainer.innerHTML = sortedYears.map(y =>
      `<span class="timeline-year-pill" data-year="${y}">${y} <span class="pill-count">(${yearCounts[y]})</span></span>`
    ).join('');

    pillsContainer.querySelectorAll('.timeline-year-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const yearHeader = container.querySelector(`.timeline-year-header[data-year="${pill.dataset.year}"]`);
        if (yearHeader) {
          const headerOffset = document.querySelector('.site-header')?.offsetHeight || 60;
          const top = yearHeader.getBoundingClientRect().top + window.pageYOffset - headerOffset - 15;
          window.scrollTo({ top, behavior: 'smooth' });
          pillsContainer.querySelectorAll('.timeline-year-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        }
      });
    });
  }

  function render() {
    const events = getFiltered();

    // Group by year
    const years = {};
    events.forEach(e => {
      const y = e.year;
      if (!years[y]) years[y] = [];
      years[y].push(e);
    });

    let html = '';
    const sortedYears = Object.keys(years).sort();

    for (const year of sortedYears) {
      html += `<div class="timeline-year-header" data-year="${year}">${year}</div>`;

      const yearEvents = years[year].sort((a, b) => a.date.localeCompare(b.date));

      for (const event of yearEvents) {
        const isDoc = event.type === 'document';
        const doc = isDoc ? documents.find(d => d.id === event.doc_id) : null;

        html += `
          <div class="timeline-entry ${event.type === 'historical' ? 'historical' : ''}"
               data-type="${event.type}"
               ${isDoc && event.doc_id ? `data-doc-id="${escapeAttr(event.doc_id)}"` : ''}>
            <div class="entry-date">${formatDate(event.date)}</div>
            <h3>
              ${isDoc && doc ? carpetaBadge(doc.carpeta) + ' ' : ''}
              ${escapeHtml(event.title)}
            </h3>
            <p>${escapeHtml(event.description)}</p>
          </div>
        `;
      }
    }

    container.innerHTML = html;

    container.querySelectorAll('.timeline-entry[data-doc-id]').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        window.location.href = '/documentos/ver/' + encodeURIComponent(el.dataset.docId) + '/';
      });
    });

    renderPills();
  }

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  render();
})();
