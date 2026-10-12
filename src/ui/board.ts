/**
 * Tabbed board: the signature 2-D geometry canvas plus a live readout strip
 * (scalar/vector values the learner has bound). The canvas is a persistent
 * `<svg>` that `renderScene` clears and redraws on every state change, so the
 * draw-in animation keeps firing without the tab being rebuilt.
 */

import type { VizState } from '../engine/types';
import { escapeHtml } from './dialog';
import { renderScene } from './scene';

export class BoardView {
  private root: HTMLElement;
  private canvas!: SVGSVGElement;
  private readoutBody!: HTMLElement;
  private viz: VizState = { arrows: [], projection: null, grid: null, readouts: {} };

  constructor(root: HTMLElement) {
    this.root = root;
    this.render();
  }

  get canvasEl(): SVGSVGElement {
    return this.canvas;
  }

  /** Redraw the canvas and the readout strip from a fresh viz projection. */
  setViz(viz: VizState): void {
    this.viz = viz;
    renderScene(this.canvas, viz);
    this.renderReadouts();
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="board-header">
        <div class="board-tabs" role="tablist">
          <div class="board-tab is-active" role="tab" aria-selected="true">
            <span>Geometry</span>
            <span class="tab-badge">vectors · maps</span>
          </div>
        </div>
      </div>
      <div class="board-body">
        <div class="board-pane is-active" data-pane="geometry">
          <div class="canvas-wrap"><svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg></div>
        </div>
        <div class="readout-strip" id="readout-strip"></div>
      </div>
    `;
    this.canvas = this.root.querySelector('#canvas')!;
    this.readoutBody = this.root.querySelector('#readout-strip')!;
    this.renderReadouts();
  }

  private renderReadouts(): void {
    const entries = Object.entries(this.viz.readouts);
    if (!entries.length) {
      this.readoutBody.innerHTML =
        '<div class="readout-empty"><p>Bind a vector with <code>a = [1, 2]</code> to see it drawn. Use <code>dot</code>, <code>norm</code>, <code>proj</code> as you go.</p></div>';
      return;
    }
    const chips = entries
      .map(([k, v]) => `<span class="readout-chip" dir="ltr"><span class="rk">${escapeHtml(k)}</span>=${escapeHtml(v)}</span>`)
      .join('');
    this.readoutBody.innerHTML = `<div class="readout-chips">${chips}</div>`;
  }
}
