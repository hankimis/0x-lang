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
