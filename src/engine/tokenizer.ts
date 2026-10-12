/**
 * Tokenizer for the small math DSL: numbers, identifiers, operators, and
 * punctuation. Numbers accept an optional sign, so `-3` is a single negative
 * number token (unary minus in an expression is handled by the parser).
 */

import type { Tok } from './types';

const PUNCT = '+-*/()=,[]';

export function tokenize(source: string): Tok[] {
  const toks: Tok[] = [];
  const n = source.length;
  let i = 0;

  const isDigit = (c: string): boolean => c >= '0' && c <= '9';
  const isAlpha = (c: string): boolean => /[A-Za-z_]/.test(c);
  const isWordChar = (c: string): boolean => /[A-Za-z0-9_]/.test(c);

  while (i < n) {
    const c = source[i]!;

    // skip whitespace
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }

    // number: optional sign, digits, optional fraction
    if (isDigit(c) || ((c === '-' || c === '+') && isDigit(source[i + 1] ?? ''))) {
      let j = i + 1;
      let seenDot = false;
      while (j < n && (isDigit(source[j]!) || (source[j] === '.' && !seenDot))) {
        if (source[j] === '.') seenDot = true;
        j++;
      }
      const text = source.slice(i, j);
      toks.push({ t: 'num', v: parseFloat(text) });
      i = j;
      continue;
    }

    // identifier: letter/underscore followed by word chars
    if (isAlpha(c)) {
      let j = i + 1;
      while (j < n && isWordChar(source[j]!)) j++;
      toks.push({ t: 'name', v: source.slice(i, j) });
      i = j;
      continue;
    }

    // operator / punctuation
    if (PUNCT.includes(c)) {
      toks.push({ t: 'op', v: c });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${c}' at position ${i}`);
  }

  toks.push({ t: 'end' });
  return toks;
}
