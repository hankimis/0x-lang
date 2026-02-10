// 0x Tokenizer

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'COLOR'
  | 'HTTP_METHOD'
  | 'AT_KEYWORD'
  | 'STYLE_CLASS'
  | 'COMMENT'
  | 'INDENT'
  | 'DEDENT'
  | 'NEWLINE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  'app', 'page', 'component', 'state', 'derived', 'prop', 'type',
  'fn', 'async', 'layout', 'text', 'button', 'input', 'image',
  'link', 'toggle', 'select', 'if', 'elif', 'else', 'for', 'in',
  'show', 'hide', 'on', 'watch', 'check', 'requires', 'ensures',
  'api', 'store', 'use', 'js', 'style', 'import', 'from', 'return',
  'mount', 'destroy', 'await', 'true', 'false', 'null',
  'row', 'col', 'grid', 'stack', 'center', 'middle', 'between', 'end',
  'list', 'map', 'set',
  // Phase 1 advanced keywords
  'model', 'data', 'query', 'form', 'field', 'table', 'column',
  'submit', 'validate', 'permission',
  // Phase 2 advanced keywords
  'auth', 'login', 'signup', 'logout', 'guard', 'role',
  'chart', 'stat',
  'realtime', 'subscribe',
  'route', 'nav', 'redirect',
  'upload', 'preview',
  'toast', 'notify', 'modal', 'confirm',
  // Phase 3 high-level pattern keywords
  'crud', 'roles', 'can', 'cannot',
  'hero', 'features', 'pricing', 'faq', 'testimonials', 'footer',
  'search', 'filter',
  'social', 'profile',
  'pay', 'cart',
  'media', 'gallery',
  'notification',
  'animate', 'gesture', 'transition',
  'seo', 'a11y',
  'ai', 'automation', 'trigger', 'schedule',
  'dev', 'mock', 'seed',
  'emit',
  'responsive', 'mobile', 'desktop', 'tablet',
  'breadcrumb',
  'admin',
  'drawer', 'command',
  'stats',
  // Phase 4: Infrastructure keywords
  'deploy', 'env', 'docker', 'ci', 'domain', 'cdn', 'monitor', 'backup',
  // Phase 4: Backend/API keywords
  'endpoint', 'middleware', 'queue', 'cron', 'cache', 'migrate', 'webhook', 'storage',
  // Phase 4: Testing keywords
  'test', 'e2e', 'fixture', 'snapshot',
  // Phase 4: Error/State keywords
  'error', 'loading', 'offline', 'retry', 'log',
  // Phase 4: i18n keywords
  'i18n', 'locale', 'rtl',
]);

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

const DOUBLE_OPS: Record<string, boolean> = {
  '+=': true, '-=': true, '*=': true, '/=': true,
  '->': true, '=>': true,
  '==': true, '!=': true, '>=': true, '<=': true,
  '&&': true, '||': true,
};

const SINGLE_OPS = new Set(['+', '-', '*', '/', '%', '=', '>', '<', '!', '|']);
const PUNCTUATION = new Set([':', ',', '.', '(', ')', '[', ']', '{', '}', '?']);

export class TokenizerError extends Error {
  constructor(message: string, public line: number, public column: number) {
    super(`Line ${line}, Col ${column}: ${message}`);
    this.name = 'TokenizerError';
  }
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split('\n');
  const indentStack: number[] = [0]; // stack of indent levels
  let line = 0;

  for (line = 0; line < lines.length; line++) {
    const rawLine = lines[line];
    const lineNum = line + 1;

    // Skip completely empty lines
    if (rawLine.trim() === '') {
      tokens.push({ type: 'NEWLINE', value: '\n', line: lineNum, column: 1 });
      continue;
    }

    // Check if line is only a comment — still process indent/dedent
    const trimmed = rawLine.trimStart();
    if (trimmed.startsWith('//')) {
      // Calculate indentation first
      let commentIndent = 0;
      for (let i = 0; i < rawLine.length; i++) {
        if (rawLine[i] === ' ') commentIndent++;
        else if (rawLine[i] === '\t') commentIndent += 2;
        else break;
      }
      const currentCommentIndent = indentStack[indentStack.length - 1];
      if (commentIndent > currentCommentIndent) {
        indentStack.push(commentIndent);
        tokens.push({ type: 'INDENT', value: '', line: lineNum, column: 1 });
      } else if (commentIndent < currentCommentIndent) {
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > commentIndent) {
          indentStack.pop();
          tokens.push({ type: 'DEDENT', value: '', line: lineNum, column: 1 });
        }
      }

      const commentText = trimmed.slice(2).trim();
      tokens.push({ type: 'COMMENT', value: commentText, line: lineNum, column: rawLine.indexOf('//') + 1 });
      tokens.push({ type: 'NEWLINE', value: '\n', line: lineNum, column: rawLine.length + 1 });
      continue;
    }

    // Calculate indentation (spaces)
    let indent = 0;
    for (let i = 0; i < rawLine.length; i++) {
      if (rawLine[i] === ' ') indent++;
      else if (rawLine[i] === '\t') indent += 2; // treat tab as 2 spaces
      else break;
    }

    // Emit INDENT/DEDENT tokens
    const currentIndent = indentStack[indentStack.length - 1];
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push({ type: 'INDENT', value: '', line: lineNum, column: 1 });
    } else if (indent < currentIndent) {
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
        indentStack.pop();
        tokens.push({ type: 'DEDENT', value: '', line: lineNum, column: 1 });
      }
    }

    // Tokenize the line content
    let col = indent;
    const lineContent = rawLine;
    while (col < lineContent.length) {
      const ch = lineContent[col];
      const colNum = col + 1; // 1-based

      // Skip whitespace
      if (ch === ' ' || ch === '\t') {
        col++;
        continue;
      }

      // Comment (rest of line)
      if (ch === '/' && col + 1 < lineContent.length && lineContent[col + 1] === '/') {
        const commentText = lineContent.slice(col + 2).trim();
        tokens.push({ type: 'COMMENT', value: commentText, line: lineNum, column: colNum });
        break; // rest of line is comment
      }

      // Color literal (#xxx or #xxxxxx)
      if (ch === '#') {
        let hex = '#';
        let j = col + 1;
        while (j < lineContent.length && /[0-9a-fA-F]/.test(lineContent[j])) {
          hex += lineContent[j];
          j++;
        }
        if (hex.length > 1) {
          tokens.push({ type: 'COLOR', value: hex, line: lineNum, column: colNum });
          col = j;
          continue;
        }
      }

      // Style class (.name) — only when preceded by whitespace (not after identifier)
      if (ch === '.' && col + 1 < lineContent.length && /[a-zA-Z_]/.test(lineContent[col + 1])) {
        // Check if previous non-whitespace char was part of an identifier/number
        const prevChar = col > 0 ? lineContent[col - 1] : ' ';
        const prevIsWord = /[a-zA-Z0-9_)]/.test(prevChar);
        if (!prevIsWord) {
          let cls = '.';
          let j = col + 1;
          while (j < lineContent.length && /[a-zA-Z0-9_-]/.test(lineContent[j])) {
            cls += lineContent[j];
            j++;
          }
          tokens.push({ type: 'STYLE_CLASS', value: cls, line: lineNum, column: colNum });
          col = j;
          continue;
        }
        // Otherwise treat as punctuation '.'
      }

      // @ keyword
      if (ch === '@') {
        let name = '';
        let j = col + 1;
        while (j < lineContent.length && /[a-zA-Z0-9_]/.test(lineContent[j])) {
          name += lineContent[j];
          j++;
        }
        tokens.push({ type: 'AT_KEYWORD', value: name, line: lineNum, column: colNum });
        col = j;
        continue;
      }

      // String literal
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let str = '';
        let j = col + 1;
        let closed = false;
        while (j < lineContent.length) {
          if (lineContent[j] === '\\' && j + 1 < lineContent.length) {
            const escaped = lineContent[j + 1];
            if (escaped === quote) str += quote;
            else if (escaped === 'n') str += '\n';
            else if (escaped === 't') str += '\t';
            else if (escaped === '\\') str += '\\';
            else str += escaped;
            j += 2;
          } else if (lineContent[j] === quote) {
            closed = true;
            j++;
            break;
          } else {
            str += lineContent[j];
            j++;
          }
        }
        if (!closed) {
          throw new TokenizerError(`Unterminated string literal`, lineNum, colNum);
        }
        tokens.push({ type: 'STRING', value: str, line: lineNum, column: colNum });
        col = j;
        continue;
      }

      // Number literal (or identifier starting with digit like 2xl, 3xl)
      if (/[0-9]/.test(ch)) {
        let num = '';
        let j = col;
        while (j < lineContent.length && /[0-9]/.test(lineContent[j])) {
          num += lineContent[j];
          j++;
        }
        // If digits are immediately followed by a letter, treat as identifier (e.g., 2xl, 3xl)
        if (j < lineContent.length && /[a-zA-Z_]/.test(lineContent[j])) {
          while (j < lineContent.length && /[a-zA-Z0-9_]/.test(lineContent[j])) {
            num += lineContent[j];
            j++;
          }
          tokens.push({ type: 'IDENTIFIER', value: num, line: lineNum, column: colNum });
          col = j;
          continue;
        }
        if (j < lineContent.length && lineContent[j] === '.' && j + 1 < lineContent.length && /[0-9]/.test(lineContent[j + 1])) {
          num += '.';
          j++;
          while (j < lineContent.length && /[0-9]/.test(lineContent[j])) {
            num += lineContent[j];
            j++;
          }
        }
        tokens.push({ type: 'NUMBER', value: num, line: lineNum, column: colNum });
        col = j;
        continue;
      }

      // Two-char operators
      if (col + 1 < lineContent.length) {
        const twoChar = lineContent.slice(col, col + 2);
        if (DOUBLE_OPS[twoChar]) {
          tokens.push({ type: 'OPERATOR', value: twoChar, line: lineNum, column: colNum });
          col += 2;
          continue;
        }
      }

      // Single-char operators
      if (SINGLE_OPS.has(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch, line: lineNum, column: colNum });
        col++;
        continue;
      }

      // Punctuation
      if (PUNCTUATION.has(ch)) {
        tokens.push({ type: 'PUNCTUATION', value: ch, line: lineNum, column: colNum });
        col++;
        continue;
      }

      // Identifier or keyword (supports Unicode letters for i18n identifiers)
      if (/[a-zA-Z_\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF]/.test(ch)) {
        let word = '';
        let j = col;
        while (j < lineContent.length && /[a-zA-Z0-9_\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF]/.test(lineContent[j])) {
          word += lineContent[j];
          j++;
        }
        if (HTTP_METHODS.has(word)) {
          tokens.push({ type: 'HTTP_METHOD', value: word, line: lineNum, column: colNum });
        } else if (KEYWORDS.has(word)) {
          tokens.push({ type: 'KEYWORD', value: word, line: lineNum, column: colNum });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: word, line: lineNum, column: colNum });
        }
        col = j;
        continue;
      }

      // Unknown character — emit error token
      tokens.push({ type: 'ERROR' as any, value: ch, line: lineNum, column: col + 1 });
      col++;
    }

    tokens.push({ type: 'NEWLINE', value: '\n', line: lineNum, column: rawLine.length + 1 });
  }

  // Close remaining indentation levels
  const lastLineNum = lines.length;
  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'DEDENT', value: '', line: lastLineNum, column: 1 });
  }

  tokens.push({ type: 'EOF', value: '', line: lastLineNum + 1, column: 1 });
  return tokens;
}
