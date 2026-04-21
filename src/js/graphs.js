/* ── SVG helpers ─────────────────────────────────────────────── */
const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, text = '') {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text) e.textContent = text;
  return e;
}

function formatXP(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} kB`;
  return `${n} B`;
}

/* ── 1. XP progress line chart ───────────────────────────────── */
export function renderXPLineChart(container, transactions) {
  const W = 520, H = 280, PAD = { top: 30, right: 20, bottom: 50, left: 60 };
  const IW = W - PAD.left - PAD.right;
  const IH = H - PAD.top - PAD.bottom;

  // cumulative XP over time
  let cumulative = 0;
  const points = transactions.map(t => {
    cumulative += t.amount;
    return { date: new Date(t.createdAt), xp: cumulative, name: t.object?.name || t.path };
  });

  if (points.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);padding:1rem">No XP data</p>'; return; }

  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();
  const maxXP   = points[points.length - 1].xp;

  const xScale = d => PAD.left + ((d.getTime() - minDate) / (maxDate - minDate || 1)) * IW;
  const yScale = v => PAD.top + IH - (v / maxXP) * IH;

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'XP over time' });

  // gradient def
  const defs = el('defs');
  const grad = el('linearGradient', { id: 'xpGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.appendChild(el('stop', { offset: '0%', 'stop-color': '#58a6ff', 'stop-opacity': '0.6' }));
  grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#58a6ff', 'stop-opacity': '0' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  // title
  svg.appendChild(el('text', { x: PAD.left, y: 18, class: 'graph-title' }, 'XP Progression'));

  // axes
  svg.appendChild(el('line', { class: 'axis-line', x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: PAD.top + IH }));
  svg.appendChild(el('line', { class: 'axis-line', x1: PAD.left, y1: PAD.top + IH, x2: PAD.left + IW, y2: PAD.top + IH }));

  // Y ticks
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = (maxXP * i) / yTicks;
    const y   = yScale(val);
    svg.appendChild(el('line', { class: 'axis-line', x1: PAD.left - 4, y1: y, x2: PAD.left, y2: y, 'stroke-opacity': '.5' }));
    svg.appendChild(el('text', { class: 'axis-label', x: PAD.left - 7, y: y + 4, 'text-anchor': 'end' }, formatXP(val)));
  }

  // X ticks (year labels)
  const years = [...new Set(points.map(p => p.date.getFullYear()))];
  years.forEach(yr => {
    const d = new Date(yr, 0, 1);
    const x = xScale(d);
    if (x < PAD.left || x > PAD.left + IW) return;
    svg.appendChild(el('line', { class: 'axis-line', x1: x, y1: PAD.top + IH, x2: x, y2: PAD.top + IH + 5, 'stroke-opacity': '.5' }));
    svg.appendChild(el('text', { class: 'axis-label', x, y: PAD.top + IH + 16, 'text-anchor': 'middle' }, yr));
  });

  // area path
  let areaD = `M ${xScale(points[0].date)},${PAD.top + IH}`;
  points.forEach(p => { areaD += ` L ${xScale(p.date)},${yScale(p.xp)}`; });
  areaD += ` L ${xScale(points[points.length - 1].date)},${PAD.top + IH} Z`;
  svg.appendChild(el('path', { d: areaD, class: 'xp-area' }));

  // line path
  let lineD = `M ${xScale(points[0].date)},${yScale(points[0].xp)}`;
  points.slice(1).forEach(p => { lineD += ` L ${xScale(p.date)},${yScale(p.xp)}`; });
  svg.appendChild(el('path', { d: lineD, class: 'xp-line' }));

  // interactive dots
  const tooltip = createTooltip(container);
  points.forEach(p => {
    const cx = xScale(p.date);
    const cy = yScale(p.xp);
    const circle = el('circle', { cx, cy, r: 4, class: 'xp-dot', style: 'cursor:pointer', opacity: '0' });
    circle.addEventListener('mouseenter', e => {
      showTooltip(tooltip, e, `${p.name}\n${formatXP(p.xp)} total\n${p.date.toLocaleDateString()}`);
      circle.setAttribute('opacity', '1');
    });
    circle.addEventListener('mouseleave', () => { hideTooltip(tooltip); circle.setAttribute('opacity', '0'); });
    svg.appendChild(circle);
  });

  container.innerHTML = '';
  container.style.position = 'relative';
  container.appendChild(svg);
  container.appendChild(tooltip);
}

/* ── 2. Top projects bar chart ───────────────────────────────── */
export function renderXPBarChart(container, transactions) {
  const W = 520, H = 300, PAD = { top: 30, right: 20, bottom: 100, left: 65 };
  const IW = W - PAD.left - PAD.right;
  const IH = H - PAD.top - PAD.bottom;

  // aggregate by project name
  const map = new Map();
  for (const t of transactions) {
    const name = t.object?.name || t.path.split('/').pop();
    map.set(name, (map.get(name) || 0) + t.amount);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (sorted.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);padding:1rem">No data</p>'; return; }

  const maxVal  = sorted[0][1];
  const barW    = IW / sorted.length;
  const barPad  = barW * 0.22;

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'XP by project' });

  svg.appendChild(el('text', { x: PAD.left, y: 18, class: 'graph-title' }, 'Top Projects by XP'));

  // axes
  svg.appendChild(el('line', { class: 'axis-line', x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: PAD.top + IH }));
  svg.appendChild(el('line', { class: 'axis-line', x1: PAD.left, y1: PAD.top + IH, x2: PAD.left + IW, y2: PAD.top + IH }));

  // Y ticks
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal * i) / 4;
    const y   = PAD.top + IH - (val / maxVal) * IH;
    svg.appendChild(el('line', { class: 'axis-line', x1: PAD.left - 4, y1: y, x2: PAD.left, y2: y, 'stroke-opacity': '.5' }));
    svg.appendChild(el('text', { class: 'axis-label', x: PAD.left - 7, y: y + 4, 'text-anchor': 'end' }, formatXP(val)));
  }

  const tooltip = createTooltip(container);

  sorted.forEach(([name, xp], i) => {
    const bh = (xp / maxVal) * IH;
    const bx = PAD.left + i * barW + barPad;
    const by = PAD.top + IH - bh;
    const bw = barW - barPad * 2;

    const rect = el('rect', {
      x: bx, y: by, width: bw, height: bh,
      rx: 3,
      class: 'bar-pass',
      style: 'cursor:pointer; transition: opacity .15s',
    });
    rect.addEventListener('mouseenter', e => showTooltip(tooltip, e, `${name}\n${formatXP(xp)}`));
    rect.addEventListener('mouseleave', () => hideTooltip(tooltip));
    svg.appendChild(rect);

    // rotated label
    const lx = bx + bw / 2;
    const ly = PAD.top + IH + 8;
    const txt = el('text', {
      class: 'axis-label',
      transform: `rotate(-40, ${lx}, ${ly})`,
      x: lx, y: ly,
      'text-anchor': 'end',
    }, name.length > 14 ? name.slice(0, 13) + '…' : name);
    svg.appendChild(txt);
  });

  container.innerHTML = '';
  container.style.position = 'relative';
  container.appendChild(svg);
  container.appendChild(tooltip);
}

/* ── 3. Pass / Fail donut ────────────────────────────────────── */
export function renderPassFailDonut(container, results) {
  const projects = results.filter(r => r.object?.type === 'project');
  const pass = projects.filter(r => r.grade >= 1).length;
  const fail = projects.filter(r => r.grade < 1).length;
  const total = pass + fail;

  if (total === 0) { container.innerHTML = '<p style="color:var(--text-muted);padding:1rem">No result data</p>'; return; }

  const W = 260, H = 260, CX = 130, CY = 140, R = 90, STROKE = 28;
  const passAngle = (pass / total) * 2 * Math.PI;

  function arcPath(startAngle, endAngle, r) {
    const x1 = CX + r * Math.cos(startAngle - Math.PI / 2);
    const y1 = CY + r * Math.sin(startAngle - Math.PI / 2);
    const x2 = CX + r * Math.cos(endAngle - Math.PI / 2);
    const y2 = CY + r * Math.sin(endAngle - Math.PI / 2);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Pass/Fail ratio' });

  svg.appendChild(el('text', { x: W / 2, y: 18, class: 'graph-title', 'text-anchor': 'middle' }, 'Projects Pass / Fail'));

  // bg circle
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--surface-2)', 'stroke-width': STROKE }));

  // fail arc (full)
  if (fail > 0) {
    const p = el('path', {
      d: arcPath(passAngle, 2 * Math.PI, R),
      fill: 'none', stroke: 'var(--danger)', 'stroke-width': STROKE, 'stroke-linecap': 'round', opacity: '.8',
    });
    svg.appendChild(p);
  }

  // pass arc
  if (pass > 0) {
    const p = el('path', {
      d: arcPath(0, passAngle, R),
      fill: 'none', stroke: 'var(--accent-2)', 'stroke-width': STROKE, 'stroke-linecap': 'round',
    });
    svg.appendChild(p);
  }

  // center text
  svg.appendChild(el('text', { x: CX, y: CY - 6, 'text-anchor': 'middle', fill: 'var(--text)', 'font-size': '22', 'font-weight': '700', 'font-family': 'var(--font)' }, `${Math.round((pass / total) * 100)}%`));
  svg.appendChild(el('text', { x: CX, y: CY + 14, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': '11', 'font-family': 'var(--font)' }, 'pass rate'));

  // legend
  const legend = [
    { label: `Pass (${pass})`, color: 'var(--accent-2)' },
    { label: `Fail (${fail})`, color: 'var(--danger)' },
  ];
  legend.forEach(({ label, color }, i) => {
    const lx = CX - 50;
    const ly = CY + R + 22 + i * 18;
    svg.appendChild(el('rect', { x: lx, y: ly - 9, width: 12, height: 12, rx: 2, fill: color }));
    svg.appendChild(el('text', { x: lx + 17, y: ly, class: 'axis-label', 'font-size': '12' }, label));
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ── Tooltip helpers ─────────────────────────────────────────── */
function createTooltip(parent) {
  const d = document.createElement('div');
  d.className = 'graph-tooltip';
  d.style.position = 'absolute';
  return d;
}

function showTooltip(tooltip, event, text) {
  tooltip.style.opacity = '1';
  tooltip.innerHTML = text.split('\n').join('<br>');
  const rect = tooltip.parentElement.getBoundingClientRect();
  tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
  tooltip.style.top  = (event.clientY - rect.top  - 10) + 'px';
}

function hideTooltip(tooltip) {
  tooltip.style.opacity = '0';
}
