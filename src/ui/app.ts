/**
 * Application shell: mounted into #app. Toolbar, signature geometry canvas,
 * script editor drawer, terminal console, and the always-on learning dock with
 * a live per-checklist. Synchronous (the math engine is a pure in-memory
 * interpreter — no async runtime to boot).
 */

import { createSession, type Session } from '../engine/session';
import { checkGoal } from '../engine/checks';
import type { GoalSpec, Level, MatState, Snapshot } from '../engine/types';
import { countStatements, splitStatements } from '../engine/steps';
import { allLevels, getLevel, levelIndex, sequenceOfLevel, sequences } from '../levels/index';
import { BoardView } from './board';
import { TerminalView } from './terminal';
import { ScriptEditorView } from './editor';
import { escapeHtml, renderMarkdown, showModal, type ModalSpec } from './dialog';

const REPO_URL = 'https://github.com/alisadeghiaghili/learn-mlmath';
const COFFEE_URL = 'https://www.buymeacoffee.com/alisadeghil';
const OPTIM_URL = 'https://github.com/alisadeghiaghili/learn-optimization';
const PROGRESS_KEY = 'learn-mlmath-progress-v1';

interface UndoEntry {
  state: MatState;
  statementsUsed: number;
}

interface ProgressEntry {
  solved: boolean;
  bestStatements?: number;
}
type Progress = Record<string, ProgressEntry>;

export interface DockCheck {
  label: string;
  passed: boolean;
}

/** Rough statement count for golf. */
export function countStmts(source: string): number {
  return countStatements(source);
}

/** Evaluate a level's goal into one labeled row per check, for the dock. */
export function checkLevelGoal(
  goal: GoalSpec,
  snap: Snapshot,
  rt: MatState,
): { ok: boolean; results: DockCheck[] } {
  const overall = checkGoal(goal, snap, rt);
  if (goal.type === 'predicates') {
    const results = goal.predicates.map((p) => {
      const r = p(snap, rt);
      return { label: typeof r === 'string' ? r : 'Requirement met', passed: r === true };
    });
    return { ok: overall.ok, results };
  }
  return { ok: overall.ok, results: [{ label: overall.message, passed: overall.ok }] };
}

export class App {
  private root: HTMLElement;
  private session: Session;
  private level: Level | null = null;
  private board!: BoardView;
  private terminal!: TerminalView;
  private editor!: ScriptEditorView;
  private dockEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private undoStack: UndoEntry[] = [];
  private statementsUsed = 0;
  private levelCompleted = false;
  private showHint = false;
  private progress: Progress = loadProgress();
  private checkResults: DockCheck[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.session = createSession();
    this.mount();
    this.init();
  }

  /* —— Mounting & init —— */

  private init(): void {
    const params = new URLSearchParams(window.location.search);
    const savedLevel = safeGet(PROGRESS_KEY + '_last');
    const isSandboxParam = params.get('mode') === 'sandbox' || params.has('sandbox');
    const requested = params.get('level') || (!isSandboxParam && savedLevel && getLevel(savedLevel) ? savedLevel : null);

    if (requested && getLevel(requested)) {
      this.enterLevel(requested);
    } else if (!isSandboxParam && allLevels()[0]) {
      this.enterLevel(allLevels()[0]!.id);
    } else {
      this.enterSandbox();
    }
  }

  private mount(): void {
    this.root.innerHTML = `
      <div class="app-main">
        <header class="toolbar">
          <a class="brand" href="./" aria-label="learn-mlmath home">
            <span class="brand-logo" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 21 L21 21 L21 3" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="12" y1="21" x2="19" y2="9" stroke="var(--vectors)" stroke-width="2.4"/><circle cx="19" cy="9" r="2.4" fill="var(--vectors)"/></svg></span>
            <span class="brand-text">learn<span class="brand-accent">-</span>mlmath</span>
          </a>
          <div class="level-title" id="level-title"></div>
          <div class="toolbar-actions">
            <button type="button" class="nav-toggle" data-action="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="nav-drawer">
              <span class="nav-bars" aria-hidden="true"></span>
            </button>
            <div class="nav-drawer" id="nav-drawer">
              <button type="button" data-action="levels">Levels</button>
              <button type="button" data-action="lesson">Lesson</button>
              <button type="button" data-action="goal">Guide</button>
              <button type="button" data-action="hint">Hint</button>
              <button type="button" data-action="solution">Solution</button>
              <button type="button" data-action="undo">Undo</button>
              <button type="button" data-action="reset">Reset</button>
              <button type="button" data-action="sandbox" class="ghost">Sandbox</button>
              <button type="button" data-action="references" class="ghost">References</button>
              <button type="button" class="help-btn" data-action="help" title="Help" aria-label="Help">?</button>
            </div>
            <a class="tb-link gh" href="${REPO_URL}" target="_blank" rel="noopener noreferrer" title="GitHub repository" aria-label="GitHub repository">
              <svg class="gh-mark" viewBox="0 0 16 16" width="18" height="18"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
            </a>
            <a class="tb-link support" href="${COFFEE_URL}" target="_blank" rel="noopener noreferrer" title="Buy me a coffee" aria-label="Buy me a coffee">☕</a>
          </div>
        </header>
        <div class="board-wrap" id="board-wrap"></div>
        <div class="editor-drawer" id="editor-drawer"></div>
        <div class="terminal" id="terminal"></div>
      </div>
      <aside class="dock" id="dock" aria-label="Learning guide"></aside>
    `;

    this.titleEl = this.root.querySelector('#level-title')!;
    this.dockEl = this.root.querySelector('#dock')!;
    this.board = new BoardView(this.root.querySelector('#board-wrap')!);
    this.editor = new ScriptEditorView(this.root.querySelector('#editor-drawer')!, (code) => this.executeCode(code));
    this.terminal = new TerminalView(this.root.querySelector('#terminal')!, (cmd) => this.handleCommand(cmd), () => this.editor.toggle());

    this.wireToolbar();
    this.updateTitle();
    this.renderDock();
  }

  private wireToolbar(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'nav-toggle') {
          this.toggleNav();
          return;
        }
        this.closeNav();
        if (action === 'levels') this.openLevels();
        if (action === 'lesson') this.openLesson();
        if (action === 'goal') this.focusGuide();
        if (action === 'hint') this.triggerHint();
        if (action === 'solution') this.showSolution();
        if (action === 'undo') this.undo();
        if (action === 'reset') this.reset();
        if (action === 'sandbox') this.enterSandbox();
        if (action === 'references') this.openReferences();
        if (action === 'help') this.openHelp();
        this.terminal.focus();
      });
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.nav-drawer') && !target.closest('[data-action="nav-toggle"]')) {
        this.closeNav();
      }
    });

    this.dockEl.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('.g-step-cmd');
      if (target?.dataset.cmd) {
        this.terminal.setInput(target.dataset.cmd);
      }
    });
  }

  private toggleNav(): void {
    const drawer = this.root.querySelector<HTMLElement>('#nav-drawer');
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="nav-toggle"]');
    if (!drawer || !btn) return;
    const open = drawer.hasAttribute('hidden');
    if (open) {
      drawer.removeAttribute('hidden');
      drawer.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      drawer.setAttribute('hidden', '');
      drawer.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  private closeNav(): void {
    const drawer = this.root.querySelector<HTMLElement>('#nav-drawer');
    const btn = this.root.querySelector<HTMLButtonElement>('[data-action="nav-toggle"]');
    drawer?.setAttribute('hidden', '');
    drawer?.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
  }

  /* —— Level / sandbox flow —— */

  enterLevel(id: string, opts?: { openLesson?: boolean }): void {
    const level = getLevel(id);
    if (!level) return;
    this.level = level;
    this.showHint = false;
    this.statementsUsed = 0;
    this.levelCompleted = false;
    this.undoStack = [];
    this.terminal.clear();
    this.terminal.push('meta', `Level: ${level.name}  ·  ${level.eli}`);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('level', id);
      url.searchParams.delete('mode');
      url.searchParams.delete('sandbox');
      window.history.replaceState({}, '', url.toString());
      safeSet(PROGRESS_KEY + '_last', id);
    } catch {
      // ignore
    }

    this.session.reset();
    if (level.start.trim()) {
      try {
        this.session.run(level.start);
      } catch (err) {
        this.terminal.push('err', err instanceof Error ? err.message : String(err));
      }
    }

    const solution = level.solution ?? level.brief;
    const setupLines = splitStatements(level.start);
    const goalLines = splitStatements(solution);
    this.terminal.setExtraCompletions([...goalLines, ...setupLines]);
    this.terminal.setHint(goalLines[0] ?? null);

    this.board.setViz(this.session.state.viz);
    this.refreshDock();
    this.updateTitle();

    if (opts?.openLesson) this.openLesson();
  }

  enterSandbox(): void {
    this.level = null;
    this.showHint = false;
    this.statementsUsed = 0;
    this.levelCompleted = false;
    this.undoStack = [];
    this.terminal.clear();
    this.terminal.push('meta', 'learn-mlmath sandbox. Type math statements, or `help`.');
    this.terminal.setExtraCompletions([]);
    this.terminal.setHint(null);

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('level');
      url.searchParams.set('mode', 'sandbox');
      window.history.replaceState({}, '', url.toString());
      safeSet(PROGRESS_KEY + '_last', '');
    } catch {
      // ignore
    }

    this.session.reset();
    this.board.setViz(this.session.state.viz);
    this.renderDock();
    this.updateTitle();
  }

  private updateTitle(): void {
    if (this.level) {
      const idx = levelIndex(this.level.id) + 1;
      this.titleEl.textContent = `Level ${idx} · ${this.level.name}`;
    } else {
      this.titleEl.textContent = 'Sandbox';
    }
  }

  /* —— Board rendering —— */

  private renderBoard(): void {
    this.board.setViz(this.session.state.viz);
  }

  /* —— Execution & verification —— */

  private executeCode(raw: string): void {
    const source = raw.replace(/\s+$/, '');
    if (!source.trim()) return;

    if (this.isMeta(source.trim())) {
      this.runMeta(source.trim());
      return;
    }

    this.terminal.push('cmd', `>>> ${source.replace(/\n/g, '\n... ')}`);
    this.undoStack.push({ state: structuredClone(this.session.state), statementsUsed: this.statementsUsed });

    try {
      const before = this.session.state.stdout.length;
      this.session.run(source);
      const newOut = this.session.state.stdout.slice(before);
      for (const line of newOut) this.terminal.push('out', line);
      this.statementsUsed += countStatements(source);
    } catch (err) {
      this.terminal.push('err', err instanceof Error ? err.message : String(err));
    }

    this.renderBoard();
    if (this.level) this.checkVerification(source);
  }

  private checkVerification(_lastCode: string): void {
    if (!this.level) return;
    const snap = this.session.snapshot();
    const verdict = checkLevelGoal(this.level.goal, snap, this.session.state);
    this.renderDock(verdict.results);

    if (!verdict.ok) {
      const solutionCmds = splitStatements(this.level.solution ?? this.level.brief);
      const nextIdx = verdict.results.findIndex((r) => !r.passed);
      if (nextIdx !== -1) {
        const cmd = solutionCmds[Math.min(nextIdx, solutionCmds.length - 1)] ?? this.level.brief;
        this.terminal.setHint(cmd.split('\n')[0] ?? null);
      }
      return;
    }

    this.terminal.setHint(null);
    this.onLevelClear();
  }

  private onLevelClear(): void {
    if (!this.level || this.levelCompleted) return;
    this.levelCompleted = true;
    const level = this.level;
    const used = this.statementsUsed;
    const par = level.par;
    const prev = this.progress[level.id];
    this.progress[level.id] = {
      solved: true,
      bestStatements: Math.min(prev?.bestStatements ?? used, used),
    };
    saveProgress(this.progress);

    const golf = used <= par ? 'on par' : `${used} statements (par ${par})`;
    this.terminal.push('ok', `Level complete — ${golf}.`);

    const next = allLevels()[levelIndex(level.id) + 1];
    const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)]!;
    const bodyHtml = `
      <div class="celebrate" aria-live="polite">
        <div class="celebrate-visual" aria-hidden="true">
          <div class="celebrate-ring"></div>
          <div class="celebrate-star">★</div>
        </div>
        <div class="celebrate-badge">Level clear</div>
        <h3 class="celebrate-title">${escapeHtml(level.name)}</h3>
        <p class="celebrate-sub"><code>${escapeHtml(level.id)}</code> · ${level.eli}</p>
        <p class="celebrate-cheer">${escapeHtml(cheer)}</p>
        <div class="celebrate-stats">${used} statement${used === 1 ? '' : 's'} · par ${par}</div>
        ${
          next
            ? `<div class="celebrate-next">Up next: **${escapeHtml(next.name)}**</div>`
            : `<div class="celebrate-next">You reached the end of this pack.</div>`
        }
      </div>
    `;

    const actions: ModalSpec['actions'] = [{ label: 'Keep going', className: 'ghost', onClick: () => this.terminal.focus() }];
    if (next) {
      actions.push({ label: `Next: ${next.name}`, className: 'primary', onClick: () => this.enterLevel(next.id, { openLesson: true }) });
    } else {
      actions.push({ label: 'Browse levels', className: 'primary', onClick: () => this.openLevels() });
    }

    showModal({ title: 'Level complete', bodyHtml, actions });
  }

  /* —— Dock —— */

  private refreshDock(): void {
    if (!this.level) {
      this.renderDock();
      return;
    }
    const snap = this.session.snapshot();
    const verdict = checkLevelGoal(this.level.goal, snap, this.session.state);
    this.renderDock(verdict.results);
  }

  private renderDock(checkResults?: DockCheck[]): void {
    if (!this.level) {
      this.dockEl.innerHTML = `
        <h2>Sandbox</h2>
        <p class="objective">Type math to draw vectors and maps. Bind a vector with <code>a = [1, 2]</code>; it appears as an arrow on the board.</p>
        <div class="learning-box">
          <div class="next-title">Start here</div>
          <ul>
            <li><code>a = [1, 2]</code> — a vector, drawn as an arrow</li>
            <li><code>print(dot(a, a))</code> — inner product</li>
            <li><code>print(norm(a))</code> — length of the vector</li>
            <li><code>p = proj(a, b)</code> — projection of a onto b</li>
          </ul>
        </div>
        <ul class="goal-list">
          <li class="met"><div class="g-label">No active level</div><div class="g-detail">Pick a level from the menu to start checking goals.</div></li>
        </ul>
      `;
      return;
    }

    const level = this.level;
    const solutionCmds = splitStatements(level.solution ?? level.brief);
    const checks = checkResults ?? this.checkResults ?? [];
    const solved = checks.length > 0 && checks.every((c) => c.passed);
    const currentId = checks.findIndex((c) => !c.passed);

    const items = checks
      .map((c, i) => {
        const done = c.passed;
        const isCurrent = !solved && !done && i === currentId;
        const cmd = solutionCmds[i] ?? solutionCmds[0] ?? level.brief;
        const firstCmdLine = cmd.split('\n')[0] ?? cmd;
        return `<li class="${done ? 'met' : ''}${isCurrent ? ' current' : ''}">
        <div class="g-label" dir="ltr">${done ? '✓' : isCurrent ? '▶' : '○'} <code class="g-step-cmd" data-cmd="${escapeHtml(firstCmdLine)}" title="Click to fill into terminal">${escapeHtml(firstCmdLine)}</code>${
          isCurrent ? ' <span class="chip current-chip">now</span>' : ''
        }</div>
        <div class="g-detail" dir="ltr">${escapeHtml(c.label)}</div>
      </li>`;
      })
      .join('');

    const firstNext = currentId !== -1 ? solutionCmds[currentId]?.split('\n')[0] : solutionCmds[0]?.split('\n')[0];
    const nextBlock = solved
      ? `<div class="next-box met">All checks passed.</div>`
      : `<div class="next-box">
          <div class="next-title">Next</div>
          <div class="next-row">
            <span class="g-label">try</span>
            ${firstNext ? `<code class="g-cmd g-step-cmd" data-cmd="${escapeHtml(firstNext)}" dir="ltr" title="Click to fill into terminal">${escapeHtml(firstNext)}</code>` : ''}
          </div>
        </div>`;

    this.checkResults = checks;
    this.dockEl.innerHTML = `
      <h2>${escapeHtml(level.name)}</h2>
      <div class="eli-badge" title="ELI band — how far this level ramps">${escapeHtml(level.eli)}</div>
      <p class="objective">${renderMarkdown(level.brief)}</p>
      <div class="par-note">${this.bestNote(level)}</div>
      ${nextBlock}
      <ul class="goal-list">${items}</ul>
      ${this.showHint ? `<div class="par-note"><strong>Hint:</strong> ${renderMarkdown(level.hint)}</div>` : ''}
    `;
  }

  private bestNote(level: Level): string {
    const prog = this.progress[level.id];
    if (prog?.bestStatements !== undefined) {
      return `Best: ${prog.bestStatements} statement${prog.bestStatements === 1 ? '' : 's'} · par ${level.par}`;
    }
    return `Par ${level.par} statement${level.par === 1 ? '' : 's'}`;
  }

  /* —— Meta commands —— */

  private isMeta(source: string): boolean {
    return /^(help|levels|lesson|level|goal|hint|solution|undo|reset|sandbox|script|clear|golf)\b/.test(source);
  }

  private runMeta(source: string): void {
    const [cmd, ...rest] = source.split(/\s+/);
    switch (cmd) {
      case 'help':
        this.openHelp();
        return;
      case 'levels':
        this.openLevels();
        return;
      case 'lesson':
        this.openLesson();
        return;
      case 'level': {
        const id = rest[0];
        if (!id) {
          this.terminal.push('meta', 'Usage: level <id>');
          return;
        }
        if (getLevel(id)) this.enterLevel(id);
        else this.terminal.push('err', `Unknown level: ${id}`);
        return;
      }
      case 'goal':
      case 'guide':
      case 'steps':
      case 'next':
        this.focusGuide();
        this.terminal.push('meta', 'The live guide is on the right.');
        return;
      case 'hint':
        this.triggerHint();
        return;
      case 'solution':
        this.showSolution();
        return;
      case 'undo':
        this.undo();
        return;
      case 'reset':
        this.reset();
        return;
      case 'sandbox':
        this.enterSandbox();
        return;
      case 'script':
      case 'editor':
        this.editor.toggle();
        return;
      case 'clear':
        this.terminal.clear();
        return;
      case 'golf':
        if (this.level) this.terminal.push('meta', `statements: ${this.statementsUsed} · par: ${this.level.par}`);
        return;
      default:
        this.terminal.push('err', `Unknown command: ${cmd}`);
    }
  }

  private triggerHint(): void {
    if (!this.level) {
      this.terminal.push('meta', 'Hints are available in levels mode.');
      return;
    }
    this.showHint = true;
    this.renderDock(this.checkResults);
    this.terminal.push('meta', `Hint: ${this.level.hint}`);
  }

  private showSolution(): void {
    if (!this.level) return;
    this.terminal.push('meta', `Solution:\n${this.level.solution ?? ''}`);
  }

  private focusGuide(): void {
    this.dockEl.classList.remove('dock-pulse');
    void this.dockEl.offsetWidth;
    this.dockEl.classList.add('dock-pulse');
    this.dockEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) {
      this.terminal.push('meta', 'Nothing to undo.');
      return;
    }
    const state = this.session.state;
    state.bindings = prev.state.bindings;
    state.bindingOrder = prev.state.bindingOrder;
    state.stdout = prev.state.stdout;
    state.errors = prev.state.errors;
    state.viz = prev.state.viz;
    state.history = prev.state.history;
    this.statementsUsed = prev.statementsUsed;
    this.levelCompleted = false;
    this.terminal.push('meta', 'Undid last statement.');
    this.renderBoard();
    this.refreshDock();
  }

  private reset(): void {
    if (this.level) this.enterLevel(this.level.id);
    else this.enterSandbox();
    this.terminal.push('meta', 'Environment reset.');
  }

  handleCommand(cmd: string): void {
    this.executeCode(cmd);
  }

  /* —— Modals —— */

  private openLevels(): void {
    const body = sequences
      .map((s) => {
        const rows = s.levels
          .map((l) => {
            const p = this.progress[l.id];
            const solved = Boolean(p?.solved);
            const active = this.level?.id === l.id;
            return `<button type="button" class="level-row ${solved ? 'solved' : ''}${active ? ' active' : ''}" data-level="${l.id}">
              <span class="id">${escapeHtml(l.id)}</span>
              <span class="name">${escapeHtml(l.name)}</span>
              <span class="eli-mini">${escapeHtml(l.eli)}</span>
              <span class="chip ${solved ? 'ok' : ''}">${solved ? `✓ ${p?.bestStatements ?? l.par}` : l.par}</span>
            </button>`;
          })
          .join('');
        return `<div class="series-block"><h3>${escapeHtml(s.title)}</h3><div class="level-list">${rows}</div></div>`;
      })
      .join('');

    const modal = showModal({
      title: 'Levels',
      bodyHtml: `<p>Pick a challenge. Each level drives the board to a target state.</p>
        <div class="legend-box">
          <div class="next-title">How to read</div>
          <ul class="legend-list">
            <li><span class="eli-mini">eli10</span> the ELI band the level teaches on</li>
            <li><span class="chip">N</span> par (ideal statements)</li>
            <li><span class="chip ok">✓ N</span> solved, best statements</li>
          </ul>
        </div>
        ${body}`,
      actions: [{ label: 'Close', className: 'ghost', onClick: () => undefined }],
    });

    modal.el.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.level;
        modal.close();
        if (id) this.enterLevel(id, { openLesson: true });
      });
    });
  }

  private openLesson(): void {
    if (!this.level) {
      this.openWelcome();
      return;
    }
    const seq = sequenceOfLevel(this.level.id);
    const levelLesson = renderMarkdown(this.level.lesson ?? this.level.brief);
    const deep = seq?.deepLesson ? `<hr class="lesson-sep"/><h3>Deep dive · ${escapeHtml(seq.title)}</h3>${renderMarkdown(seq.deepLesson)}` : '';
    showModal({
      title: this.level.name,
      bodyHtml: `<div class="eli-badge">${escapeHtml(this.level.eli)}</div>${levelLesson}${deep}`,
      actions: [{ label: 'Close', className: 'primary', onClick: () => this.terminal.focus() }],
      onDismiss: () => this.terminal.focus(),
    });
  }

  private openHelp(): void {
    showModal({
      title: 'Help',
      bodyHtml: renderMarkdown(`
### Command Reference

| Command | Effect |
|---|---|
| \`levels\` | Open the level catalog |
| \`lesson\` | Explain the current level + the series deep dive |
| \`hint\` | Reveal the level hint |
| \`solution\` | Show the target solution |
| \`undo\` | Remove the last statement |
| \`reset\` | Clear the environment |
| \`sandbox\` | Enter open sandbox mode |
| \`clear\` | Clear the console log |
| \`script\` | Toggle the multi-line script editor |

### Math you can type
- Vectors: \`a = [1, 2]\` (2-D, drawn as an arrow) or 3-D \`[1, 2, 3]\`
- Combine: \`a + b\`, \`a - b\`, \`3 * a\`
- Builtins: \`dot(a, b)\`, \`norm(a)\`, \`len(a)\`, \`cross(a, b)\`
- Projection: \`p = proj(a, b)\` — a onto b (a perpendicular is drawn)
- Matrices: \`M = [[2, 1], [1, 3]]\`, map \`v = M * a\` (the unit square deforms)
- \`det(M)\`, \`transpose(M)\`, \`matmul(A, B)\`
- Analyze: \`trace(M)\`, \`rank(M)\`, \`inv(M)\` (undo the map), \`sum(v)\`
- Eigen: \`eigenvalues(M)\`, \`eigenvectors(M)\` — the directions a map only stretches
- Indexing: \`a[0]\` is a component; \`M[1]\` is the second row

- **Tab** cycles autocomplete · **Ctrl/Cmd+Enter** runs the script editor line.
`),
      actions: [{ label: 'Close', onClick: () => undefined }],
    });
  }

  private openReferences(): void {
    showModal({
      title: 'References & next steps',
      bodyHtml: renderMarkdown(`
### Books this course is built from
- **Deisenroth, Faisal, Ong** — *Mathematics for Machine Learning* (linear algebra, calculus, decompositions)
- **Gilbert Strang** — *Linear Algebra and Learning from Data* (matrices as maps, SVD → PCA)
- **Goodfellow et al.** — *Deep Learning*, Ch. 2–4 & 8 (linear algebra, matrix calculus, optimization)
- **Sola** — *Matrix Calculus for Computer Science* (free; the autodiff/chain-rule core)
- **3Blue1Brown** — *Essence of Linear Algebra* (the visual intuition behind the board)

### Where this course stops
- **Loss optimization** is a *first nail* here (a single gradient-descent step). The full machinery — line search, momentum, Newton, convexity, and MILP/OR-Tools — lives in [**learn-optimization**](${OPTIM_URL}).
- **Probability & distributions** → *learn-mlstats*.
- **Running backprop on a network** → *learn-dl* (we cover the math here).

### Get real
This sandbox is a teaching interpreter. When you want the real thing:
\`\`\`bash
pip install numpy
\`\`\`
Everything you type here maps onto NumPy: \`dot(a, b)\` = \`a @ b\`, \`norm(a)\` = \`np.linalg.norm(a)\`.
`),
      actions: [{ label: 'Close', className: 'primary', onClick: () => this.terminal.focus() }],
      onDismiss: () => this.terminal.focus(),
    });
  }

  private openWelcome(): void {
    showModal({
      title: 'Welcome to learn-mlmath',
      bodyHtml: renderMarkdown(`
See the mathematics of machine learning — made visible.

- **Geometry board** — vectors are arrows, matrices deform the unit square, projections drop a perpendicular.
- **Dock** — the always-on guide with a live per-check checklist.
- **Deep dive** — every series carries a lesson that ramps **ELI5 → ELI-PHD**, so it works for a complete beginner *and* a practitioner.

There are **${allLevels().length} levels** across ${sequences.length} series — vectors, spaces, matrices, decompositions, calculus, and the first nail of loss optimization.
`),
      actions: [
        { label: 'Sandbox', className: 'ghost', onClick: () => undefined },
        { label: 'Open levels', className: 'primary', onClick: () => this.openLevels() },
      ],
    });
  }
}

/* —— helpers —— */

const CHEERS = [
  'That geometry now makes sense.',
  'The vector picture is clicking.',
  'You traced the projection.',
  'Nice — the map behaves as you expected.',
  'The inner product lands where it should.',
];

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / private mode
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
