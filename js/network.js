/* =============================================
   Network graph — D3.js force-directed
   Documents as nodes, shared tags/themes as edges
   ============================================= */

(async function () {
  const [documents, themes] = await Promise.all([
    loadJSON('/data/documents.json'),
    loadJSON('/data/themes.json')
  ]);

  const container = document.getElementById('network-container');
  if (!container) return;

  const tooltip = document.getElementById('network-tooltip');
  const width = container.clientWidth;
  const height = 500;
  const pad = 30;

  const CARPETA_COLORS = {
    1: '#5B3A29',
    2: '#2E7D33',
    3: '#C62828'
  };

  // Build nodes
  const nodes = documents.map(d => ({
    id: d.id,
    title: d.title,
    carpeta: d.carpeta,
    pages: d.page_count,
    year: d.year,
    tags: d.tags,
    radius: Math.max(6, Math.sqrt(d.page_count) * 1.5)
  }));

  // Build edges — shared tags + themes
  const links = [];
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const a = documents[i];
      const b = documents[j];
      let weight = 0;

      // Shared tags
      a.tags.forEach(t => { if (b.tags.includes(t)) weight++; });

      // Shared themes
      themes.forEach(theme => {
        if (theme.doc_ids.includes(a.id) && theme.doc_ids.includes(b.id)) weight += 2;
      });

      if (weight >= 2) {
        links.push({ source: a.id, target: b.id, weight });
      }
    }
  }

  // Clear loading
  container.innerHTML = '';
  if (tooltip) container.appendChild(tooltip);

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .style('overflow', 'visible');

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => 100 / Math.sqrt(d.weight)))
    .force('charge', d3.forceManyBody().strength(-120))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.radius + 3))
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.08));

  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', '#ddd')
    .attr('stroke-width', d => Math.min(d.weight, 5))
    .attr('stroke-opacity', 0.6);

  const node = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => CARPETA_COLORS[d.carpeta])
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  const label = svg.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text(d => 'Doc ' + documents.find(x => x.id === d.id).number)
    .attr('font-size', 10)
    .attr('fill', '#666')
    .attr('text-anchor', 'middle')
    .attr('dy', d => d.radius + 12)
    .style('pointer-events', 'none');

  // Hover interactions
  node.on('mouseover', function (event, d) {
    // Highlight connected
    const connected = new Set();
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      if (sid === d.id) connected.add(tid);
      if (tid === d.id) connected.add(sid);
    });

    node.attr('opacity', n => n.id === d.id || connected.has(n.id) ? 1 : 0.15);
    link.attr('stroke-opacity', l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      return sid === d.id || tid === d.id ? 0.8 : 0.05;
    });
    label.attr('opacity', n => n.id === d.id || connected.has(n.id) ? 1 : 0.15);

    if (tooltip) {
      tooltip.style.display = 'block';
      tooltip.innerHTML = `<strong>${escapeHtml(d.title)}</strong><br>${d.pages} páginas · ${d.year}`;
    }
  })
  .on('mousemove', function (event) {
    if (tooltip) {
      const rect = container.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
      tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
    }
  })
  .on('mouseout', function () {
    node.attr('opacity', 1);
    link.attr('stroke-opacity', 0.6);
    label.attr('opacity', 1);
    if (tooltip) tooltip.style.display = 'none';
  })
  .on('click', function (event, d) {
    window.location.href = '/documentos/ver/?id=' + encodeURIComponent(d.id);
  });

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => d.x = Math.max(d.radius + pad, Math.min(width - d.radius - pad, d.x)))
      .attr('cy', d => d.y = Math.max(d.radius + pad, Math.min(height - d.radius - pad - 12, d.y)));

    label
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

})();
