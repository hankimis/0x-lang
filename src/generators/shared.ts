// Shared utilities for all code generators

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
