// Shared utilities for all code generators

import type { Expression } from '../ast.js';

// ── Known prop sets per UI element ─────────────────────

export const KNOWN_LAYOUT_PROPS = new Set([
  'gap', 'padding', 'margin', 'maxWidth', 'height', 'width', 'bg',
  'gradient', 'center', 'middle', 'between', 'end', 'grow', 'scroll',
  'radius', 'shadow', 'cols', 'class', 'border', 'wrap',
]);

export const KNOWN_TEXT_PROPS = new Set([
  'size', 'bold', 'italic', 'underline', 'color', 'bg', 'gradient',
  'center', 'end', 'strike', 'badge', 'tooltip', 'class',
]);

export const KNOWN_BUTTON_PROPS = new Set([
  'style', 'disabled', 'size', 'class',
]);

export const KNOWN_INPUT_PROPS = new Set([
  'placeholder', 'type', '@keypress', 'class',
]);

export const KNOWN_IMAGE_PROPS = new Set([
  'width', 'height', 'alt', 'round', 'radius', 'size', 'class',
]);

export const KNOWN_LINK_PROPS = new Set([
  'class', 'href',
]);

export const KNOWN_TOGGLE_PROPS = new Set([
  'class',
]);

export const KNOWN_SELECT_PROPS = new Set([
  'class', 'options',
]);

export const KNOWN_MODAL_PROPS = new Set([
  'class',
]);

/**
 * Extract passthrough (unknown) props as HTML attribute strings.
 * For React: key={value}, for Vue/Svelte: key="value" or :key="value"
 */
export function getPassthroughProps(
  props: Record<string, Expression>,
  known: Set<string>,
  exprToStr: (e: Expression) => string,
  mode: 'react' | 'vue' | 'svelte' = 'react',
): string {
  const attrs: string[] = [];

  for (const [key, val] of Object.entries(props)) {
    if (known.has(key)) continue;
    const v = exprToStr(val);
    const isStatic = val.kind === 'string';
    const isBool = val.kind === 'boolean';

    if (mode === 'react') {
      if (isBool) {
        attrs.push(key);
      } else if (isStatic) {
        attrs.push(`${key}=${v.startsWith("'") ? `"${unquote(v)}"` : v}`);
      } else {
        attrs.push(`${key}={${v}}`);
      }
    } else {
      // Vue / Svelte
      if (isBool) {
        attrs.push(key);
      } else if (isStatic) {
        attrs.push(`${key}="${unquote(v)}"`);
      } else {
        const prefix = mode === 'vue' ? ':' : '';
        attrs.push(`${prefix}${key}="${v}"`);
      }
    }
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

// ── Error suggestion utilities ─────────────────────────

/** Levenshtein distance between two strings */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
}

/** Find closest keyword match (max distance 2) */
export function suggestKeyword(input: string, keywords: string[]): string | null {
  let best: string | null = null;
  let bestDist = 3; // threshold
  const lower = input.toLowerCase();
  for (const kw of keywords) {
    const d = levenshtein(lower, kw);
    if (d < bestDist) {
      bestDist = d;
      best = kw;
    }
  }
  return best;
}

/** Hard-coded common mistakes with specific hints */
export const COMMON_MISTAKES: Record<string, string> = {
  'onMount': "Use 'on mount:' (two separate words)",
  'onDestroy': "Use 'on destroy:' (two separate words)",
  'onClick': "Use button action: button \"Click\" -> action()",
  'onChange': "Use input binding: input varName",
  'onSubmit': "Use form submit: form onSubmit -> action()",
  'className': "Use 'class' prop: layout col class=\"...\":",
  'elif': "0x uses 'else:' followed by 'if:', not 'elif:'",
  'var': "Use 'state name: type = value' for reactive state, or 'let'/'const' for local variables",
  'function': "Use 'fn name():' to declare functions in 0x",
  'div': "Use 'layout row/col:' instead of 'div'",
  'span': "Use 'text \"content\"' instead of 'span'",
  'img': "Use 'image \"src\"' instead of 'img'",
  'a': "Use 'link \"text\" href=\"url\"' instead of 'a'",
};

export const SIZE_MAP: Record<string, string> = {
  'xs': '12px', 'sm': '14px', 'md': '16px', 'lg': '20px',
  'xl': '24px', '2xl': '32px', '3xl': '40px',
};

export function unquote(s: string): string {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  return s;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function addPx(v: string): string {
  if (/\d$/.test(v)) return `${v}px`;
  return v;
}

/**
 * Convert 0x gradient shorthand to CSS linear-gradient.
 * Supported formats:
 *   "from #667eea to #764ba2"           → linear-gradient(135deg, #667eea, #764ba2)
 *   "from #f00 via #0f0 to #00f"        → linear-gradient(135deg, #f00, #0f0, #00f)
 *   "to right from #f00 to #00f"        → linear-gradient(to right, #f00, #00f)
 *   "45deg from #f00 to #00f"           → linear-gradient(45deg, #f00, #00f)
 *   Raw CSS value (already has "linear-gradient" or "radial-gradient") → pass through
 */
export function parseGradient(raw: string): string {
  const v = unquote(raw).trim();

  // Already a CSS gradient — pass through
  if (v.includes('gradient(')) return v;

  // Parse direction
  let direction = '135deg';
  let rest = v;

  // "to right", "to bottom left", etc.
  const toDir = rest.match(/^to\s+(right|left|top|bottom)(\s+(right|left|top|bottom))?\s+/i);
  if (toDir) {
    direction = toDir[0].trim();
    rest = rest.slice(toDir[0].length);
  } else {
    // "45deg", "90deg", etc.
    const degMatch = rest.match(/^(\d+)deg\s+/);
    if (degMatch) {
      direction = `${degMatch[1]}deg`;
      rest = rest.slice(degMatch[0].length);
    }
  }

  // Parse color stops: "from X via Y to Z"
  const colors: string[] = [];
  const fromMatch = rest.match(/^from\s+(#[\da-fA-F]{3,8}|\w+)/);
  if (fromMatch) {
    colors.push(fromMatch[1]);
    rest = rest.slice(fromMatch[0].length).trim();
  }

  // Multiple "via" stops
  let viaMatch = rest.match(/^via\s+(#[\da-fA-F]{3,8}|\w+)/);
  while (viaMatch) {
    colors.push(viaMatch[1]);
    rest = rest.slice(viaMatch[0].length).trim();
    viaMatch = rest.match(/^via\s+(#[\da-fA-F]{3,8}|\w+)/);
  }

  const toMatch = rest.match(/^to\s+(#[\da-fA-F]{3,8}|\w+)/);
  if (toMatch) {
    colors.push(toMatch[1]);
  }

  if (colors.length >= 2) {
    return `linear-gradient(${direction}, ${colors.join(', ')})`;
  }

  // Fallback: treat as raw value
  return v;
}
