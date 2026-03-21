/* =============================================
   Statistics page — Charts, tag cloud, archive map
   ============================================= */

(async function () {
  const [documents, carpetas, themes] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json'),
    loadJSON('/data/themes.json')
  ]);

  const TOTAL_PAGES = documents.reduce((s, d) => s + d.page_count, 0);

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

  // Helper: set insight text
  function setInsight(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ================================================
  // KPI Cards
  // ================================================
  (function () {
    var container = document.getElementById('kpi-row');
    if (!container) return;

    var avgPages = Math.round(TOTAL_PAGES / documents.length);
    var escCount = documents.filter(function (d) { return d.classification === 'ESC'; }).length;
    var escPct = Math.round((escCount / documents.length) * 100);
    var years = documents.map(function (d) { return d.year; });
    var minYear = Math.min.apply(null, years);
    var maxYear = Math.max.apply(null, years);

    var kpis = [
      { value: documents.length, label: 'Documentos desclasificados' },
      { value: TOTAL_PAGES.toLocaleString('es-AR'), label: 'Páginas totales' },
      { value: minYear + '–' + maxYear, label: 'Rango temporal' },
      { value: avgPages + ' pág.', label: 'Promedio por documento' },
      { value: escPct + '%', label: 'Clasificados ESC' },
      { value: '3', label: 'Carpetas temáticas' }
    ];

    container.innerHTML = kpis.map(function (k) {
      return '<div class="kpi-card"><div class="kpi-value">' + k.value + '</div><div class="kpi-label">' + k.label + '</div></div>';
    }).join('');
  })();

  // ================================================
  // Chart 1: Documentos por año (stacked bar by carpeta)
  // ================================================
  (function () {
    var years = [];
    for (var y = 1973; y <= 1983; y++) years.push(y);

    var datasets = [1, 2, 3].map(function (c) {
      return {
        label: CARPETA_NAMES[c],
        data: years.map(function (y) {
          return documents.filter(function (d) { return d.year === y && d.carpeta === c; }).length;
        }),
        backgroundColor: CARPETA_COLORS[c]
      };
    });

    new Chart(document.getElementById('chart-year'), {
      type: 'bar',
      data: { labels: years, datasets: datasets },
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
                var year = items[0].label;
                var total = documents.filter(function (d) { return d.year === parseInt(year); }).length;
                return total + ' documento' + (total !== 1 ? 's' : '') + ' en total';
              }
            }
          }
        }
      }
    });

    // Insight: busiest year by doc count
    var yearCounts = {};
    documents.forEach(function (d) { yearCounts[d.year] = (yearCounts[d.year] || 0) + 1; });
    var maxYear = Object.keys(yearCounts).reduce(function (a, b) { return yearCounts[a] > yearCounts[b] ? a : b; });
    setInsight('insight-year', maxYear + ' fue el año con más documentos producidos: ' + yearCounts[maxYear] + ' documentos.');
  })();

  // ================================================
  // Chart 2: Páginas producidas por año (area chart)
  // ================================================
  (function () {
    var years = [];
    for (var y = 1973; y <= 1983; y++) years.push(y);

    var pagesByYear = years.map(function (y) {
      return documents.filter(function (d) { return d.year === y; })
        .reduce(function (s, d) { return s + d.page_count; }, 0);
    });

    new Chart(document.getElementById('chart-pages-year'), {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Páginas',
          data: pagesByYear,
          fill: true,
          backgroundColor: 'rgba(117, 170, 219, 0.2)',
          borderColor: '#75AADB',
          borderWidth: 2,
          pointBackgroundColor: '#75AADB',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var pct = ((ctx.raw / TOTAL_PAGES) * 100).toFixed(1);
                return ctx.raw + ' páginas (' + pct + '% del total)';
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

    // Insight: year with most pages
    var maxPages = Math.max.apply(null, pagesByYear);
    var maxIdx = pagesByYear.indexOf(maxPages);
    var maxPagesYear = years[maxIdx];
    var docsThatYear = documents.filter(function (d) { return d.year === maxPagesYear; });
    setInsight('insight-pages-year', maxPagesYear + ' concentra ' + maxPages + ' páginas (' + ((maxPages / TOTAL_PAGES) * 100).toFixed(0) + '% del archivo) en ' + docsThatYear.length + ' documento' + (docsThatYear.length !== 1 ? 's' : '') + '.');
  })();

  // ================================================
  // Chart 3: Clasificación por año (stacked bar)
  // ================================================
  (function () {
    var years = [];
    for (var y = 1973; y <= 1983; y++) years.push(y);

    var sData = years.map(function (y) {
      return documents.filter(function (d) { return d.year === y && d.classification === 'S'; }).length;
    });
    var escData = years.map(function (y) {
      return documents.filter(function (d) { return d.year === y && d.classification === 'ESC'; }).length;
    });

    new Chart(document.getElementById('chart-classification-year'), {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          { label: 'Secreto (S)', data: sData, backgroundColor: '#C62828' },
          { label: 'ESC', data: escData, backgroundColor: '#8b0000' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Insight
    var escDocs = documents.filter(function (d) { return d.classification === 'ESC'; });
    var escYears = escDocs.map(function (d) { return d.year; });
    var minEsc = Math.min.apply(null, escYears);
    setInsight('insight-classification', 'Los documentos ESC (Estrictamente Secreto y Confidencial) aparecen a partir de ' + minEsc + '. Todos fueron producidos bajo la dictadura militar.');
  })();

  // ================================================
  // Chart 4: Período histórico (horizontal bar)
  // ================================================
  (function () {
    var periodOrder = [
      'Gobierno de Lanusse (transición)',
      'Gobierno de Perón',
      'Gobierno de Isabel Perón',
      'Dictadura militar — Proceso de Reorganización Nacional',
      'Dictadura militar — final del Proceso',
      'Transición democrática'
    ];

    var periodColors = [
      '#999',
      '#75AADB',
      '#FCBF49',
      '#C62828',
      '#8b0000',
      '#2E7D33'
    ];

    var periodDocs = periodOrder.map(function (p) {
      return documents.filter(function (d) { return d.historical_period === p; }).length;
    });

    // Split long labels into multi-line arrays for Chart.js
    function wrapLabel(text, maxWidth) {
      if (text.length <= maxWidth) return text;
      var words = text.split(' ');
      var lines = [];
      var line = '';
      words.forEach(function (w) {
        if ((line + ' ' + w).trim().length > maxWidth && line) {
          lines.push(line.trim());
          line = w;
        } else {
          line = line ? line + ' ' + w : w;
        }
      });
      if (line) lines.push(line.trim());
      return lines;
    }

    // Filter out periods with 0 docs
    var filteredLabels = [];
    var filteredData = [];
    var filteredColors = [];
    var filteredRawLabels = [];
    periodOrder.forEach(function (p, i) {
      if (periodDocs[i] > 0) {
        filteredLabels.push(wrapLabel(p, 28));
        filteredRawLabels.push(p);
        filteredData.push(periodDocs[i]);
        filteredColors.push(periodColors[i]);
      }
    });

    new Chart(document.getElementById('chart-period'), {
      type: 'bar',
      data: {
        labels: filteredLabels,
        datasets: [{
          data: filteredData,
          backgroundColor: filteredColors
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var rawLabel = filteredRawLabels[ctx.dataIndex];
                var pages = documents.filter(function (d) { return d.historical_period === rawLabel; })
                  .reduce(function (s, d) { return s + d.page_count; }, 0);
                return ctx.raw + ' doc' + (ctx.raw !== 1 ? 's' : '') + ', ' + pages + ' páginas';
              }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    });
  })();

  // ================================================
  // Chart 5: Tipo de documento (horizontal bar)
  // ================================================
  (function () {
    var types = {};
    documents.forEach(function (d) { types[d.type] = (types[d.type] || 0) + 1; });
    var sorted = Object.entries(types).sort(function (a, b) { return b[1] - a[1]; });

    new Chart(document.getElementById('chart-type'), {
      type: 'bar',
      data: {
        labels: sorted.map(function (e) { return e[0]; }),
        datasets: [{
          data: sorted.map(function (e) { return e[1]; }),
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
  // Chart 6: Páginas por documento (bar, sorted) + mean/median lines
  // ================================================
  (function () {
    var sorted = documents.slice().sort(function (a, b) { return b.page_count - a.page_count; });

    var pages = documents.map(function (d) { return d.page_count; });
    var mean = pages.reduce(function (s, p) { return s + p; }, 0) / pages.length;
    var sortedPages = pages.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sortedPages.length / 2);
    var median = sortedPages.length % 2 !== 0 ? sortedPages[mid] : (sortedPages[mid - 1] + sortedPages[mid]) / 2;

    new Chart(document.getElementById('chart-pages'), {
      type: 'bar',
      data: {
        labels: sorted.map(function (d) { return 'Doc ' + d.number; }),
        datasets: [{
          data: sorted.map(function (d) { return d.page_count; }),
          backgroundColor: sorted.map(function (d) { return CARPETA_COLORS[d.carpeta]; })
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
                return sorted[items[0].dataIndex].title;
              },
              label: function (ctx) {
                var pct = ((ctx.raw / TOTAL_PAGES) * 100).toFixed(1);
                return ctx.raw + ' páginas (' + pct + '% del archivo)';
              }
            }
          },
          annotation: {
            annotations: {
              meanLine: {
                type: 'line',
                yMin: mean,
                yMax: mean,
                borderColor: '#EF6C00',
                borderWidth: 2,
                borderDash: [6, 3],
                label: {
                  display: true,
                  content: 'Media: ' + Math.round(mean),
                  position: 'start',
                  backgroundColor: '#EF6C00',
                  color: '#fff',
                  font: { size: 11 }
                }
              },
              medianLine: {
                type: 'line',
                yMin: median,
                yMax: median,
                borderColor: '#2E7D33',
                borderWidth: 2,
                borderDash: [6, 3],
                label: {
                  display: true,
                  content: 'Mediana: ' + median,
                  position: 'end',
                  backgroundColor: '#2E7D33',
                  color: '#fff',
                  font: { size: 11 }
                }
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

    // Insight: concentration
    var top2 = sorted.slice(0, 2);
    var top2Pages = top2[0].page_count + top2[1].page_count;
    var top2Pct = ((top2Pages / TOTAL_PAGES) * 100).toFixed(0);
    setInsight('insight-pages', 'El ' + top2Pct + '% del archivo (' + top2Pages + ' páginas) corresponde a solo 2 documentos: Doc ' + top2[0].number + ' y Doc ' + top2[1].number + '. La mediana es ' + median + ' páginas — la distribución es muy asimétrica.');
  })();

  // ================================================
  // Chart 7: Páginas por carpeta (doughnut)
  // ================================================
  (function () {
    var pageByCarpeta = [1, 2, 3].map(function (c) {
      return documents.filter(function (d) { return d.carpeta === c; })
        .reduce(function (sum, d) { return sum + d.page_count; }, 0);
    });

    new Chart(document.getElementById('chart-carpeta-pages'), {
      type: 'doughnut',
      data: {
        labels: [1, 2, 3].map(function (c) { return CARPETA_NAMES[c]; }),
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
                var pct = ((ctx.raw / TOTAL_PAGES) * 100).toFixed(1);
                return ctx.label + ': ' + ctx.raw + ' pág. (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  })();

  // ================================================
  // Chart 8: Original vs. Copia (doughnut)
  // ================================================
  (function () {
    var originals = 0;
    var copies = 0;
    documents.forEach(function (d) {
      if (d.original_or_copy.toLowerCase().indexOf('copia') !== -1 && d.original_or_copy.toLowerCase().indexOf('original') === -1) {
        copies++;
      } else {
        originals++;
      }
    });

    new Chart(document.getElementById('chart-original-copy'), {
      type: 'doughnut',
      data: {
        labels: ['Original', 'Copia'],
        datasets: [{
          data: [originals, copies],
          backgroundColor: ['#232D4F', '#75AADB'],
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
                var pct = ((ctx.raw / documents.length) * 100).toFixed(0);
                return ctx.label + ': ' + ctx.raw + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  })();

  // ================================================
  // Chart 9: Temas transversales (bar chart)
  // ================================================
  (function () {
    var canvas = document.getElementById('chart-themes');
    if (!canvas || !themes) return;

    var themeLabels = themes.map(function (t) { return t.title; });
    var themeDocs = themes.map(function (t) { return t.doc_ids.length; });
    var themeColors = themes.map(function (t) { return t.color; });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: themeLabels,
        datasets: [{
          label: 'Documentos',
          data: themeDocs,
          backgroundColor: themeColors
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var theme = themes[ctx.dataIndex];
                var pages = theme.doc_ids.reduce(function (s, id) {
                  var doc = documents.find(function (d) { return d.id === id; });
                  return s + (doc ? doc.page_count : 0);
                }, 0);
                return ctx.raw + ' documentos, ' + pages + ' páginas';
              }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 2 }, grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    });
  })();

  // ================================================
  // Theme × Carpeta heatmap table
  // ================================================
  (function () {
    var container = document.getElementById('theme-heatmap-container');
    if (!container || !themes) return;

    var html = '<table class="theme-heatmap"><thead><tr><th>Tema</th>';
    [1, 2, 3].forEach(function (c) {
      html += '<th>' + CARPETA_NAMES[c] + '</th>';
    });
    html += '<th>Total</th></tr></thead><tbody>';

    themes.forEach(function (t) {
      html += '<tr><td style="border-left:3px solid ' + t.color + ';">' + escapeHtml(t.title) + '</td>';
      var total = 0;
      [1, 2, 3].forEach(function (c) {
        var count = t.doc_ids.filter(function (id) {
          var doc = documents.find(function (d) { return d.id === id; });
          return doc && doc.carpeta === c;
        }).length;
        total += count;
        var cellClass = 'cell-' + Math.min(count, 5);
        html += '<td class="' + cellClass + '">' + (count || '—') + '</td>';
      });
      html += '<td><strong>' + total + '</strong></td></tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  })();

  // ================================================
  // Tag Cloud (with carpeta-based coloring)
  // ================================================
  (function () {
    var container = document.getElementById('tag-cloud');
    if (!container) return;

    var tagCounts = {};
    var tagCarpetas = {};
    documents.forEach(function (d) {
      d.tags.forEach(function (t) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
        if (!tagCarpetas[t]) tagCarpetas[t] = {};
        tagCarpetas[t][d.carpeta] = (tagCarpetas[t][d.carpeta] || 0) + 1;
      });
    });

    var entries = Object.entries(tagCounts).sort(function (a, b) { return b[1] - a[1]; });
    var maxCount = Math.max.apply(null, entries.map(function (e) { return e[1]; }));
    var minSize = 13;
    var maxSize = 28;

    container.innerHTML = entries.map(function (entry) {
      var tag = entry[0];
      var count = entry[1];
      var size = minSize + ((count / maxCount) * (maxSize - minSize));
      // Dominant carpeta color
      var carpetaCounts = tagCarpetas[tag];
      var dominant = Object.keys(carpetaCounts).reduce(function (a, b) {
        return carpetaCounts[a] > carpetaCounts[b] ? a : b;
      });
      var color = CARPETA_COLORS[dominant];
      return '<a href="/etiquetas/?tag=' + encodeURIComponent(tag) + '" style="font-size:' + size.toFixed(1) + 'px;color:' + color + ';" title="' + count + ' documento' + (count > 1 ? 's' : '') + '">' + escapeHtml(tag) + '</a>';
    }).join('');
  })();

  // ================================================
  // Archive Map (page distribution)
  // ================================================
  (function () {
    var mapContainer = document.getElementById('archive-map');
    if (!mapContainer) return;

    var sorted = documents.slice().sort(function (a, b) { return a.global_page_start - b.global_page_start; });

    mapContainer.innerHTML = sorted.map(function (doc) {
      var pct = (doc.page_count / TOTAL_PAGES) * 100;
      var minPct = Math.max(pct, 0.4);
      var color = CARPETA_COLORS[doc.carpeta];
      return '<div class="archive-map-segment" data-doc-id="' + escapeAttr(doc.id) + '" style="flex-basis:' + minPct + '%;background:' + color + ';"><div class="archive-map-tooltip">' + escapeHtml(doc.title) + '<br>' + doc.page_count + ' pág. (' + pct.toFixed(1) + '%)</div></div>';
    }).join('');

    mapContainer.querySelectorAll('.archive-map-segment[data-doc-id]').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () {
        window.location.href = '/documentos/ver/' + encodeURIComponent(el.dataset.docId) + '/';
      });
    });

    // Legend
    var legendEl = document.getElementById('archive-map-legend');
    if (legendEl) {
      legendEl.innerHTML = [1, 2, 3].map(function (c) {
        return '<span><span class="swatch" style="background:' + CARPETA_COLORS[c] + ';"></span>' + CARPETA_NAMES[c] + '</span>';
      }).join('');
    }
  })();

})();
