/* =============================================
   Statistics page — Charts, tag cloud, archive map
   ============================================= */

(async function () {
  const [documents, carpetas, themes, humanRightsMatrix] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/carpetas.json'),
    loadJSON('/data/themes.json'),
    loadJSON('/data/human-rights-matrix.json')
  ]);

  const TOTAL_PAGES = documents.reduce((s, d) => s + d.page_count, 0);
  const docsById = {};
  documents.forEach(function (doc) { docsById[doc.id] = doc; });

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

  function countMatrixValues(key) {
    var counts = {};
    humanRightsMatrix.forEach(function (entry) {
      (entry[key] || []).forEach(function (value) {
        counts[value] = (counts[value] || 0) + 1;
      });
    });
    return counts;
  }

  function pagesForMatrixValue(key, value) {
    return humanRightsMatrix.reduce(function (sum, entry) {
      if ((entry[key] || []).indexOf(value) !== -1) {
        var doc = docsById[entry.doc_id];
        return sum + (doc ? doc.page_count : 0);
      }
      return sum;
    }, 0);
  }

  function allDocsForMatrixValue(key, value) {
    return humanRightsMatrix
      .filter(function (entry) { return (entry[key] || []).indexOf(value) !== -1; })
      .map(function (entry) { return docsById[entry.doc_id]; })
      .filter(Boolean)
      .sort(function (a, b) {
        if (a.date === b.date) return a.number - b.number;
        return a.date < b.date ? -1 : 1;
      });
  }

  function docsMatchingTerms(terms, year) {
    return documents.filter(function (doc) {
      if (typeof year === 'number' && doc.year !== year) return false;
      var text = [doc.title, doc.description, (doc.tags || []).join(' ')].join(' ').toLowerCase();
      return terms.some(function (term) { return text.indexOf(term) !== -1; });
    }).sort(function (a, b) {
      if (a.date === b.date) return a.number - b.number;
      return a.date < b.date ? -1 : 1;
    });
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
  // Human Rights KPIs
  // ================================================
  (function () {
    var container = document.getElementById('hr-kpi-row');
    if (!container) return;

    var profilingDocs = humanRightsMatrix.filter(function (entry) {
      return entry.repressive_functions.indexOf('ideological_profiling') !== -1;
    }).length;
    var mediaDocs = humanRightsMatrix.filter(function (entry) {
      return entry.repressive_functions.indexOf('media_monitoring') !== -1;
    }).length;
    var regionalDocs = humanRightsMatrix.filter(function (entry) {
      return entry.repressive_functions.indexOf('regional_deployment') !== -1;
    }).length;
    var concealmentDocs = humanRightsMatrix.filter(function (entry) {
      return entry.repressive_functions.indexOf('personnel_concealment') !== -1;
    }).length;
    var highRelevanceDocs = humanRightsMatrix.filter(function (entry) {
      return entry.hr_relevance === 'high';
    }).length;

    var kpis = [
      { value: profilingDocs, label: 'Docs con perfilado ideológico' },
      { value: mediaDocs, label: 'Docs sobre publicaciones y medios' },
      { value: regionalDocs, label: 'Docs sobre despliegue territorial' },
      { value: concealmentDocs, label: 'Docs sobre encubrimiento institucional' },
      { value: highRelevanceDocs + '/' + documents.length, label: 'Relevancia alta en DD.HH.' }
    ];

    container.innerHTML = kpis.map(function (k) {
      return '<div class="kpi-card"><div class="kpi-value">' + k.value + '</div><div class="kpi-label">' + k.label + '</div></div>';
    }).join('');
  })();

  // ================================================
  // Human Rights Chart 1: Repressive functions
  // ================================================
  (function () {
    var canvas = document.getElementById('chart-hr-functions');
    if (!canvas) return;

    var labelMap = {
      organizational_control: 'Control organizacional',
      personnel_concealment: 'Encubrimiento de personal',
      regional_deployment: 'Despliegue regional',
      ideological_profiling: 'Perfilado ideológico',
      media_monitoring: 'Control de medios',
      foreign_intelligence: 'Inteligencia exterior',
      counter_subversion: 'Contrasubversión',
      interagency_coordination: 'Coordinación interagencial'
    };
    var colorMap = {
      organizational_control: '#5B3A29',
      personnel_concealment: '#EF6C00',
      regional_deployment: '#2E7D33',
      ideological_profiling: '#C62828',
      media_monitoring: '#8E1B1B',
      foreign_intelligence: '#75AADB',
      counter_subversion: '#6A1B9A',
      interagency_coordination: '#455A64'
    };

    var counts = countMatrixValues('repressive_functions');
    var sortedKeys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sortedKeys.map(function (key) { return labelMap[key] || key; }),
        datasets: [{
          data: sortedKeys.map(function (key) { return counts[key]; }),
          backgroundColor: sortedKeys.map(function (key) { return colorMap[key] || '#75AADB'; })
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
                var key = sortedKeys[ctx.dataIndex];
                var pages = pagesForMatrixValue('repressive_functions', key);
                return ctx.raw + ' documentos, ' + pages + ' páginas';
              },
              afterBody: function (items) {
                var key = sortedKeys[items[0].dataIndex];
                return allDocsForMatrixValue('repressive_functions', key).map(function (doc) {
                  return '• Doc ' + doc.number + ': ' + doc.title;
                });
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

    var topKey = sortedKeys[0];
    setInsight(
      'insight-hr-functions',
      (labelMap[topKey] || topKey) + ' aparece en ' + counts[topKey] + ' documentos y concentra ' +
      pagesForMatrixValue('repressive_functions', topKey) + ' páginas. La serie muestra que la represión no fue solo operativa: también fue normativa y burocrática.'
    );
  })();

  // ================================================
  // Human Rights Chart 2: Affected groups
  // ================================================
  (function () {
    var canvas = document.getElementById('chart-hr-groups');
    if (!canvas) return;

    var labelMap = {
      intelligence_personnel: 'Personal de inteligencia',
      persons: 'Personas',
      organizations: 'Organizaciones',
      political_social_actors: 'Actores políticos y sociales',
      publications: 'Publicaciones',
      media: 'Medios de comunicación',
      cultural_actors: 'Actores culturales',
      regional_delegations: 'Delegaciones regionales',
      foreign_targets: 'Sujetos u objetivos exteriores'
    };
    var colorMap = {
      intelligence_personnel: '#5B3A29',
      persons: '#C62828',
      organizations: '#B71C1C',
      political_social_actors: '#8E1B1B',
      publications: '#2E7D33',
      media: '#1B5E20',
      cultural_actors: '#75AADB',
      regional_delegations: '#546E7A',
      foreign_targets: '#3949AB'
    };

    var counts = countMatrixValues('affected_groups');
    var sortedKeys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sortedKeys.map(function (key) { return labelMap[key] || key; }),
        datasets: [{
          data: sortedKeys.map(function (key) { return counts[key]; }),
          backgroundColor: sortedKeys.map(function (key) { return colorMap[key] || '#75AADB'; })
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
                var key = sortedKeys[ctx.dataIndex];
                var pages = pagesForMatrixValue('affected_groups', key);
                return ctx.raw + ' documentos, ' + pages + ' páginas';
              },
              afterBody: function (items) {
                var key = sortedKeys[items[0].dataIndex];
                return allDocsForMatrixValue('affected_groups', key).map(function (doc) {
                  return '• Doc ' + doc.number + ': ' + doc.title;
                });
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

    var topKey = sortedKeys[0];
    var mediaTotal = (counts.media || 0) + (counts.publications || 0);
    setInsight(
      'insight-hr-groups',
      (labelMap[topKey] || topKey) + ' son el universo más recurrente del archivo, pero ' +
      mediaTotal + ' documentos también alcanzan publicaciones o medios. La vigilancia se proyecta sobre ciudadanía, organizaciones y circuitos de producción cultural.'
    );
  })();

  // ================================================
  // Human Rights Chart 3: Rights impacted
  // ================================================
  (function () {
    var canvas = document.getElementById('chart-hr-rights');
    if (!canvas) return;

    var labelMap = {
      privacy: 'Privacidad',
      expression: 'Libertad de expresión',
      association: 'Libertad de asociación',
      equality_non_discrimination: 'Igualdad y no discriminación',
      due_process: 'Debido proceso',
      judicial_oversight: 'Control judicial'
    };
    var colorMap = {
      privacy: '#C62828',
      expression: '#2E7D33',
      association: '#1565C0',
      equality_non_discrimination: '#6A1B9A',
      due_process: '#EF6C00',
      judicial_oversight: '#455A64'
    };

    var counts = countMatrixValues('rights_impacted');
    var sortedKeys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sortedKeys.map(function (key) { return labelMap[key] || key; }),
        datasets: [{
          data: sortedKeys.map(function (key) { return counts[key]; }),
          backgroundColor: sortedKeys.map(function (key) { return colorMap[key] || '#75AADB'; })
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
                var key = sortedKeys[ctx.dataIndex];
                var pages = pagesForMatrixValue('rights_impacted', key);
                return ctx.raw + ' documentos, ' + pages + ' páginas';
              },
              afterBody: function (items) {
                var key = sortedKeys[items[0].dataIndex];
                return allDocsForMatrixValue('rights_impacted', key).map(function (doc) {
                  return '• Doc ' + doc.number + ': ' + doc.title;
                });
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

    var topTwo = sortedKeys.slice(0, 2).map(function (key) { return labelMap[key] || key; });
    setInsight(
      'insight-hr-rights',
      topTwo.join(' y ') + ' aparecen como los derechos más comprometidos. El patrón dominante combina vigilancia sin control judicial, clasificación ideológica y afectación de libertades públicas.'
    );
  })();

  // ================================================
  // Human Rights Chart 4: Repressive vocabulary over time
  // ================================================
  (function () {
    var canvas = document.getElementById('chart-hr-vocabulary');
    if (!canvas) return;

    var years = [];
    for (var y = 1973; y <= 1983; y++) years.push(y);

    var vocabularySeries = [
      {
        label: 'Encubrimiento',
        color: '#EF6C00',
        terms: ['encubrimiento', 'siglas', 'codificación', 'sistema numérico']
      },
      {
        label: 'Delegaciones',
        color: '#2E7D33',
        terms: ['delegaciones', 'delegaciones regionales', 'delegaciones provinciales', 'delegación provincial', 'rosario', 'mendoza']
      },
      {
        label: 'Contrasubversión',
        color: '#6A1B9A',
        terms: ['contrasubversión']
      },
      {
        label: 'Calificación ideológica',
        color: '#C62828',
        terms: ['calificación ideológica', 'antecedentes ideológicos', 'fórmulas', 'corrientes ideológicas']
      },
      {
        label: 'Comunicación social',
        color: '#1565C0',
        terms: ['comunicación social', 'asesoría literaria', 'publicaciones', 'medios de difusión', 'material bibliográfico']
      }
    ];

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: years,
        datasets: vocabularySeries.map(function (series) {
          return {
            label: series.label,
            data: years.map(function (year) {
              return docsMatchingTerms(series.terms, year).length;
            }),
            borderColor: series.color,
            backgroundColor: series.color,
            pointBackgroundColor: series.color,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
            tension: 0.25,
            fill: false
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: true
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ': ' + ctx.raw + ' documento' + (ctx.raw !== 1 ? 's' : '');
              },
              afterBody: function (items) {
                var item = items[0];
                var year = parseInt(item.label, 10);
                var series = vocabularySeries[item.datasetIndex];
                return docsMatchingTerms(series.terms, year).map(function (doc) {
                  return '• Doc ' + doc.number + ': ' + doc.title;
                });
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    setInsight(
      'insight-hr-vocabulary',
      'El lenguaje del archivo se desplaza desde encubrimiento y delegaciones hacia calificación ideológica, contrasubversión y comunicación social, mostrando un aparato cada vez más orientado al control político e ideológico.'
    );
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
