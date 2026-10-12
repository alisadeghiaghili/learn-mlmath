/**
 * The signature board canvas: a 2-D coordinate frame that every series renders
 * into. It draws the projection of a `VizState` — named vector arrows, a
 * projection helper (a dropped perpendicular), and a unit-square deformation
 * for linear maps. Hand-rolled SVG, square aspect (so geometry is honest),
 * with a draw-in animation on the primary elements.
 */

import type { VizState } from '../engine/types';

const COLORS = {
  grid: '#1B2530',
  axis: '#3A4B5A',
  teal: '#5BC4B0',
  amber: '#F0A050',
  coral: '#F07070',
  violet: '#B48CF0',
  muted: '#8FA0A8',
};

const ARROW_COLORS = [COLORS.teal, COLORS.amber, COLORS.coral, COLORS.violet];

interface Pt {
  x: number;
  y: number;
}

/** Convert a math point to screen px given the window half-extent. */
function makeMapper(H: number, size: number) {
  const s = size / (2 * H);
  return (x: number, y: number): Pt => ({ x: size / 2 + x * s, y: size / 2 - y * s });
}

export function renderScene(svg: SVGSVGElement, viz: VizState): void {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Determine the square window from every point the viz references.
  let maxAbs = 2;
  for (const a of viz.arrows) {
    maxAbs = Math.max(maxAbs, Math.abs(a.x), Math.abs(a.y));
  }
  if (viz.grid) {
    maxAbs = Math.max(maxAbs, Math.abs(viz.grid.ex[0]), Math.abs(viz.grid.ex[1]), Math.abs(viz.grid.ey[0]), Math.abs(viz.grid.ey[1]));
  }
  if (viz.projection) {
    maxAbs = Math.max(
      maxAbs,
      Math.abs(viz.projection.from[0]),
      Math.abs(viz.projection.from[1]),
      Math.abs(viz.projection.foot[0]),
      Math.abs(viz.projection.foot[1]),
    );
  }
  const H = Math.max(2, Math.ceil(maxAbs * 1.2));
  const size = 600; // square viewBox in "px"
  const toP = makeMapper(H, size);

  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  // defs: arrowheads per colour
  const defs = el('defs');
  for (const c of [...ARROW_COLORS, COLORS.coral]) {
    const m = el('marker', {
      id: `ah-${c.replace('#', '')}`,
      viewBox: '0 0 10 10',
      refX: '8',
      refY: '5',
      markerWidth: '7',
      markerHeight: '7',
      orient: 'auto-start-reverse',
    });
    m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: c }));
    defs.appendChild(m);
  }
  svg.appendChild(defs);

  // grid lines (unit spacing within the window)
  const gridG = el('g', { class: 'scene-grid' });
  for (let i = -H; i <= H; i++) {
    const a = toP(i, -H);
    const b = toP(i, H);
    gridG.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: i === 0 ? COLORS.axis : COLORS.grid, 'stroke-width': i === 0 ? 1.5 : 1 }));
    const c = toP(-H, i);
    const d = toP(H, i);
    gridG.appendChild(el('line', { x1: c.x, y1: c.y, x2: d.x, y2: d.y, stroke: i === 0 ? COLORS.axis : COLORS.grid, 'stroke-width': i === 0 ? 1.5 : 1 }));
  }
  // axis tick labels (unit numbers on the axes, sparse)
  const step = H > 6 ? 2 : 1;
  for (let i = -H; i <= H; i += step) {
    if (i === 0) continue;
    const px = toP(i, 0);
    const py = toP(0, i);
    addText(gridG, px.x, px.y + 14, String(i), COLORS.muted, 11, 'middle', 'hanging');
    addText(gridG, py.x - 8, py.y, String(i), COLORS.muted, 11, 'end', 'middle');
  }
  svg.appendChild(gridG);

  // unit-square deformation (matrices) — reference square + its image
  if (viz.grid) {
    const { ex, ey } = viz.grid;
    const O = toP(0, 0);
    const e1 = toP(ex[0], ex[1]);
    const e2 = toP(ey[0], ey[1]);
    const e12 = toP(ex[0] + ey[0], ex[1] + ey[1]);
    const r = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');
    // original unit square (dashed, muted)
    svg.appendChild(el('polygon', { points: r([toP(0, 0), toP(1, 0), toP(1, 1), toP(0, 1)]), fill: 'none', stroke: COLORS.muted, 'stroke-dasharray': '4 4', 'stroke-width': 1, opacity: '0.7' }));
    // image square (teal fill)
    svg.appendChild(el('polygon', { points: r([O, e1, e12, e2]), fill: COLORS.teal, 'fill-opacity': '0.12', stroke: COLORS.teal, 'stroke-width': 1.5 }));
    // image axis arrows
    drawArrow(svg, O, e1, COLORS.amber, 2);
    drawArrow(svg, O, e2, COLORS.amber, 2);
    addText(svg, O.x + 6, O.y - 8, viz.grid.label, COLORS.amber, 12, 'start', 'auto', 'IBM Plex Mono, monospace');
  }

  // projection helper: a dropped perpendicular from `from` to `foot`
  if (viz.projection) {
    const from = toP(viz.projection.from[0], viz.projection.from[1]);
    const foot = toP(viz.projection.foot[0], viz.projection.foot[1]);
    const O = toP(0, 0);
    // perpendicular connector
    svg.appendChild(el('line', { x1: from.x, y1: from.y, x2: foot.x, y2: foot.y, stroke: COLORS.coral, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', 'stroke-opacity': '0.8' }));
    // the projected vector (origin → foot), coral
    drawArrow(svg, O, foot, COLORS.coral, 2.4, true);
    // foot marker
    svg.appendChild(el('circle', { cx: foot.x, cy: foot.y, r: 3.5, fill: COLORS.coral }));
  }

  // vector arrows
  const O = toP(0, 0);
  viz.arrows.forEach((a, i) => {
    const color = ARROW_COLORS[i % ARROW_COLORS.length]!;
    const tip = toP(a.x, a.y);
    if (a.x !== 0 || a.y !== 0) drawArrow(svg, O, tip, color, 2);
    addText(svg, tip.x + 8, tip.y - 8, a.name, color, 15, 'start', 'auto', 'IBM Plex Mono, monospace');
  });

  // origin marker
  svg.appendChild(el('circle', { cx: O.x, cy: O.y, r: 2.5, fill: COLORS.muted }));
}

function drawArrow(svg: SVGSVGElement, from: Pt, to: Pt, color: string, width: number, animate = false): void {
  const marker = `url(#ah-${color.replace('#', '')})`;
  const line = el('line', {
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y,
    stroke: color,
    'stroke-width': width,
    'marker-end': marker,
    'stroke-linecap': 'round',
  });
  if (animate) {
    try {
      const len = Math.hypot(to.x - from.x, to.y - from.y);
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 380, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' });
    } catch {
      // animation is best-effort
    }
  }
  svg.appendChild(line);
}

function el(tag: string, attrs?: Record<string, string | number>): SVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function addText(parent: SVGElement, x: number, y: number, text: string, fill: string, size: number, anchor: string, baseline: string, family = 'IBM Plex Sans, sans-serif'): void {
  const t = el('text', {
    x,
    y,
    fill,
    'font-size': size,
    'text-anchor': anchor,
    'dominant-baseline': baseline,
    'font-family': family,
  });
  t.textContent = text;
  parent.appendChild(t);
}
