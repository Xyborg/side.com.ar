/* =============================================
   Statistics page — Charts, tag cloud, archive map
   ============================================= */

(async function () {
  const [documents, carpetas] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json')
  ]);

  const CARPETA_COLORS = {
    1: '#5B3A29',
    2: '#2E7D33',
    3: '#C62828'
  };

  const CARPETA_NAMES = {
    1: 'Carpeta 1: Orgánicas',
    2: 'Carpeta 2: Normativa',
    3: 'Carpeta 3: CAA'
  };

  // --- Chart.js global defaults ---
  Chart.defaults.font.family = "'Encode Sans', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#666';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;

  // ================================================
  // Chart 1: Documentos por año (stacked bar by carpeta)
  // ================================================
  (function () {
    const years = [];
    for (let y = 1973; y <= 1983; y++) years.push(y);

    const datasets = [1, 2, 3].map(c => ({
      label: CARPETA_NAMES[c],
      data: years.map(y => documents.filter(d => d.year === y && d.carpeta === c).length),
      backgroundColor: CARPETA_COLORS[c]
    }));

    new Chart(document.getElementById('chart-year'), {
      type: 'bar',
      data: { labels: years, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterTitle: function (items) {
                const year = items[0].label;
                const total = documents.filter(d => d.year === parseInt(year)).length;
                return total + ' documento' + (total !== 1 ? 's' : '') + ' en total';
              }
            }
          }
        }
      }
    });
  })();

  // ================================================
  // Chart 2: Clasificación (doughnut)
  // ================================================
  (function () {
    const sCount = documents.filter(d => d.classification === 'S').length;
    const escCount = documents.filter(d => d.classification === 'ESC').length;

    new Chart(document.getElementById('chart-classification'), {
      type: 'doughnut',
      data: {
        labels: ['Secreto (S)', 'Est. Secreto y Conf. (ESC)'],
        datasets: [{
          data: [sCount, escCount],
          backgroundColor: ['#C62828', '#8b0000'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const pct = ((ctx.raw / documents.length) * 100).toFixed(0);
                return ctx.label + ': ' + ctx.raw + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  })();

  // ================================================
  // Chart 3: Tipo de documento (horizontal bar)
  // ================================================
  (function () {
    const types = {};
    documents.forEach(d => { types[d.type] = (types[d.type] || 0) + 1; });
    const sorted = Object.entries(types).sort((a, b) => b[1] - a[1]);

    new Chart(document.getElementById('chart-type'), {
      type: 'bar',
      data: {
        labels: sorted.map(([t]) => t),
        datasets: [{
          data: sorted.map(([, c]) => c),
          backgroundColor: '#75AADB'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    });
  })();

  // ================================================
  // Chart 4: Páginas por documento (bar, sorted by size)
  // ================================================
  (function () {
    const sorted = [...documents].sort((a, b) => b.page_count - a.page_count);

    new Chart(document.getElementById('chart-pages'), {
      type: 'bar',
      data: {
        labels: sorted.map(d => 'Doc ' + d.number),
        datasets: [{
          data: sorted.map(d => d.page_count),
          backgroundColor: sorted.map(d => CARPETA_COLORS[d.carpeta])
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                const doc = sorted[items[0].dataIndex];
                return doc.title;
              },
              label: function (ctx) {
                const pct = ((ctx.raw / 987) * 100).toFixed(1);
                return ctx.raw + ' páginas (' + pct + '% del archivo)';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      }
    });
  })();

  // ================================================
  // Chart 5: Páginas por carpeta (doughnut)
  // ================================================
  (function () {
    const pageByCarpeta = [1, 2, 3].map(c =>
      documents.filter(d => d.carpeta === c).reduce((sum, d) => sum + d.page_count, 0)
    );

    new Chart(document.getElementById('chart-carpeta-pages'), {
      type: 'doughnut',
      data: {
        labels: [1, 2, 3].map(c => CARPETA_NAMES[c]),
        datasets: [{
          data: pageByCarpeta,
          backgroundColor: [CARPETA_COLORS[1], CARPETA_COLORS[2], CARPETA_COLORS[3]],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const pct = ((ctx.raw / 987) * 100).toFixed(1);
                return ctx.label + ': ' + ctx.raw + ' pág. (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  })();

  // ================================================
  // Tag Cloud
  // ================================================
  (function () {
    const container = document.getElementById('tag-cloud');
    if (!container) return;

    const tagCounts = {};
    documents.forEach(d => d.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }));

    const entries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...entries.map(([, c]) => c));
    const minSize = 13;
    const maxSize = 28;

    container.innerHTML = entries.map(([tag, count]) => {
      const size = minSize + ((count / maxCount) * (maxSize - minSize));
      return `<a href="/documentos/?tag=${encodeURIComponent(tag)}" style="font-size:${size.toFixed(1)}px;" title="${count} documento${count > 1 ? 's' : ''}">${tag}</a>`;
    }).join('');
  })();

  // ================================================
  // Archive Map (page distribution)
  // ================================================
  (function () {
    const mapContainer = document.getElementById('archive-map');
    if (!mapContainer) return;

    const TOTAL = 987;
    const sorted = [...documents].sort((a, b) => a.global_page_start - b.global_page_start);

    mapContainer.innerHTML = sorted.map(doc => {
      const pct = (doc.page_count / TOTAL) * 100;
      const minPct = Math.max(pct, 0.4);
      const color = CARPETA_COLORS[doc.carpeta];
      return `<div class="archive-map-segment" style="flex-basis:${minPct}%;background:${color};" onclick="window.location.href='/documentos/ver/?id=${doc.id}'">
        <div class="archive-map-tooltip">${doc.title}<br>${doc.page_count} pág. (${pct.toFixed(1)}%)</div>
      </div>`;
    }).join('');

    // Legend
    const legendEl = document.getElementById('archive-map-legend');
    if (legendEl) {
      legendEl.innerHTML = [1, 2, 3].map(c =>
        `<span><span class="swatch" style="background:${CARPETA_COLORS[c]};"></span>${CARPETA_NAMES[c]}</span>`
      ).join('');
    }
  })();

})();
