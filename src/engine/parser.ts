/**
 * Recursive-descent parser for the math DSL.
 *
 * Grammar (Python-like precedence):
 *   expr   := term (('+' | '-') term)*
 *   term   := factor (('*' | '/') factor)*
 *   factor := ('-' factor) | primary
 *   primary:= number | list | name ('(' arg (',' arg)* ')')?
 *   index  := primary '[' expr ']'
 *   list   := '[' (expr (',' expr)* ','?)? ']'
 *
 * Indexing: `a[0]` on a vector yields a scalar; `M[1]` on a matrix yields a row.
 *
 * Statements: `name = expr`, `print(expr)`, or a bare `expr`.
 */

import type { Expr, Stmt, Tok } from './types';

class Parser {
  private toks: Tok[];
  private pos = 0;

  constructor(toks: Tok[]) {
    this.toks = toks;
  }

  private peek(): Tok {
    return this.toks[this.pos]!;
  }
  private peekAt(off: number): Tok | undefined {
    return this.toks[this.pos + off];
  }
  private next(): Tok {
    const t = this.toks[this.pos]!;
    this.pos++;
    return t;
  }
  private expectOp(v: string): void {
    const t = this.next();
    if (t.t !== 'op' || t.v !== v) throw new Error(`Expected '${v}', got '${tokText(t)}'`);
  }
  /** True if the token at `peek()` (or `t`) is the punctuation `v`. */
  private isOp(t: Tok | undefined, v: string): boolean {
    return !!t && t.t === 'op' && t.v === v;
  }

  parseProgram(): Stmt[] {
    const stmts: Stmt[] = [];
    while (this.peek().t !== 'end') {
      stmts.push(this.parseStatement());
    }
    return stmts;
  }

  private parseStatement(): Stmt {
    const t = this.peek();
    // assignment: name = expr
    if (t.t === 'name' && this.isOp(this.peekAt(1), '=')) {
      const name = t.v;
      this.next(); // name
      this.next(); // '='
      return { t: 'assign', name, expr: this.parseExpr() };
    }
    // print(expr)
    if (t.t === 'name' && t.v === 'print' && this.isOp(this.peekAt(1), '(')) {
      this.next(); // print
      this.expectOp('(');
      const arg = this.parseExpr();
      this.expectOp(')');
      return { t: 'print', expr: arg };
    }
    return { t: 'expr', expr: this.parseExpr() };
  }

  private parseExpr(): Expr {
    let left = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.next();
        const right = this.parseTerm();
        left = { t: 'bin', op: t.v, l: left, r: right };
        continue;
      }
      return left;
    }
  }

  private parseTerm(): Expr {
    let left = this.parseFactor();
    for (;;) {
      const t = this.peek();
      if (t.t === 'op' && (t.v === '*' || t.v === '/')) {
        this.next();
        const right = this.parseFactor();
        left = { t: 'bin', op: t.v, l: left, r: right };
        continue;
      }
      return left;
    }
  }

  private parseFactor(): Expr {
    const t = this.peek();
    if (t.t === 'op' && t.v === '-') {
      this.next();
      return { t: 'un', op: '-', e: this.parseFactor() };
    }
    return this.parsePrimaryOrIndex();
  }

  /**
   * A primary followed by an optional subscript `x[i]`. The base is parsed
   * first (numbers, lists, names, calls), then we look for `[` and index it.
   */
  private parsePrimaryOrIndex(): Expr {
    const base = this.parsePrimary();
    if (this.isOp(this.peek(), '[')) {
      this.next(); // '['
      const i = this.parseExpr();
      this.expectOp(']');
      return { t: 'index', base, i };
    }
    return base;
  }

  private parsePrimary(): Expr {
    const t = this.next();
    if (t.t === 'num') return { t: 'num', v: t.v };

    if (this.isOp(t, '[')) return this.parseList();

    if (t.t === 'name') {
      // function call?
      if (this.isOp(this.peek(), '(')) {
        this.next(); // '('
        const args: Expr[] = [];
        if (!this.isOp(this.peek(), ')')) {
          args.push(this.parseExpr());
          while (this.isOp(this.peek(), ',')) {
            this.next();
            args.push(this.parseExpr());
          }
        }
        this.expectOp(')');
        return { t: 'call', name: t.v, args };
      }
      return { t: 'ident', name: t.v };
    }

    throw new Error(`Unexpected token '${tokText(t)}'`);
  }

  private parseList(): Expr {
    // consume '[' (already matched in parsePrimary)
    const items: Expr[] = [];
    if (!this.isOp(this.peek(), ']')) {
      items.push(this.parseExpr());
      while (this.isOp(this.peek(), ',')) {
        this.next();
        if (this.isOp(this.peek(), ']')) break;
        items.push(this.parseExpr());
      }
    }
    this.expectOp(']');
    return { t: 'list', items };
  }
}

function tokText(t: Tok): string {
  if (t.t === 'end') return '<end>';
  return String(t.v);
}

export function parse(tokens: Tok[]): Stmt[] {
  return new Parser(tokens).parseProgram();
}
