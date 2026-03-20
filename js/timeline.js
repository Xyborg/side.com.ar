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

  let activeFilter = 'all';

  function getFiltered() {
    if (activeFilter === 'all') return timeline;
    if (activeFilter === 'documents') return timeline.filter(e => e.type === 'document');
    if (activeFilter === 'historical') return timeline.filter(e => e.type === 'historical');
    return timeline;
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
      html += `<div class="timeline-year-header">${year}</div>`;

      const yearEvents = years[year].sort((a, b) => a.date.localeCompare(b.date));

      for (const event of yearEvents) {
        const isDoc = event.type === 'document';
        const doc = isDoc ? documents.find(d => d.id === event.doc_id) : null;
        const carpetaClass = doc ? `badge-carpeta-${doc.carpeta}` : '';

        html += `
          <div class="timeline-entry ${event.type === 'historical' ? 'historical' : ''}"
               data-type="${event.type}"
               ${isDoc && event.doc_id ? `onclick="window.location.href='/documentos/ver/?id=${event.doc_id}'"` : ''}>
            <div class="entry-date">${formatDate(event.date)}</div>
            <h3>
              ${isDoc && doc ? carpetaBadge(doc.carpeta) + ' ' : ''}
              ${event.title}
            </h3>
            <p>${event.description}</p>
          </div>
        `;
      }
    }

    container.innerHTML = html;
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
