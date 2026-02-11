// 0x LSP — Context-Aware Completions

import { CompletionItem, CompletionItemKind, Position } from 'vscode-languageserver';
import { parse } from '../parser.js';
import type { ASTNode } from '../ast.js';

// Top-level keywords (things that start a block)
const TOP_LEVEL_KEYWORDS = [
  'page', 'component', 'app', 'model', 'auth', 'route', 'role',
  'deploy', 'env', 'docker', 'import', 'use', 'js', 'raw',
  'test', 'e2e', 'endpoint', 'middleware', 'queue', 'cron',
  'i18n', 'locale',
];

// Keywords valid inside a component/page/app body
const BODY_KEYWORDS = [
  'state', 'derived', 'prop', 'fn', 'async',
  'on mount', 'on destroy', 'watch',
  'api', 'store', 'data', 'form',
  'realtime',
  'layout', 'row', 'col', 'grid', 'stack',
  'text', 'button', 'input', 'image', 'link',
  'toggle', 'select', 'table', 'chart',
  'modal', 'toast', 'drawer', 'confirm', 'command',
  'nav', 'hero', 'features', 'pricing', 'faq', 'footer',
  'admin', 'crud', 'upload', 'search', 'filter',
  'if', 'for', 'show', 'hide',
  'style', 'check',
  'animate', 'gesture',
  'seo', 'a11y',
  'stat', 'progress', 'divider', 'breadcrumb',
  'emit', 'responsive',
  'error', 'loading', 'offline', 'retry', 'log',
];

// Type keywords (after "state X:" or "prop X:")
const TYPE_KEYWORDS = [
  'int', 'str', 'bool', 'float', 'list', 'map',
  'datetime', 'optional', 'set', 'any',
];

function isInsideBlock(source: string, position: Position): boolean {
  const lines = source.split('\n');
  // Check if the current line or recent lines are indented
  const currentLine = lines[position.line] || '';
  const trimmed = currentLine.trimStart();
  const indent = currentLine.length - trimmed.length;

  // If we're indented, we're likely inside a block
  if (indent > 0) return true;

  // Also check if the previous non-empty line ended with ":" or was a block opener
  for (let i = position.line - 1; i >= 0; i--) {
    const prevLine = lines[i]?.trim();
    if (!prevLine) continue;
    if (prevLine.endsWith(':') || prevLine.match(/^(page|component|app)\s+/)) {
      return true;
    }
    break;
  }
  return false;
}

function isAfterTypeColon(source: string, position: Position): boolean {
  const lines = source.split('\n');
  const currentLine = lines[position.line] || '';
  const beforeCursor = currentLine.substring(0, position.character);
  // Match patterns like "state count:" or "prop title:"
  return /^\s*(state|prop)\s+\w+\s*:\s*$/.test(beforeCursor);
}

function extractDeclaredNames(source: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  try {
    const ast = parse(source);
    for (const node of ast) {
      if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
        for (const child of node.body) {
          if (child.type === 'StateDecl') {
            items.push({
              label: child.name,
              kind: CompletionItemKind.Variable,
              detail: 'state variable',
            });
          } else if (child.type === 'DerivedDecl') {
            items.push({
              label: child.name,
              kind: CompletionItemKind.Variable,
              detail: 'derived value',
            });
          } else if (child.type === 'PropDecl') {
            items.push({
              label: child.name,
              kind: CompletionItemKind.Property,
              detail: 'prop',
            });
          } else if (child.type === 'FnDecl') {
            items.push({
              label: child.name,
              kind: CompletionItemKind.Function,
              detail: 'function',
            });
          }
        }
      }
    }
  } catch {
    // Parse failed — that's fine, just return what we have
  }
  return items;
}

export function getCompletions(source: string, position: Position): CompletionItem[] {
  const items: CompletionItem[] = [];

  // Check context
  if (isAfterTypeColon(source, position)) {
    for (const kw of TYPE_KEYWORDS) {
      items.push({
        label: kw,
        kind: CompletionItemKind.Keyword,
        detail: 'type',
      });
    }
    return items;
  }

  if (isInsideBlock(source, position)) {
    for (const kw of BODY_KEYWORDS) {
      items.push({
        label: kw,
        kind: CompletionItemKind.Keyword,
      });
    }
  } else {
    for (const kw of TOP_LEVEL_KEYWORDS) {
      items.push({
        label: kw,
        kind: CompletionItemKind.Keyword,
      });
    }
  }

  // Also add declared identifiers
  items.push(...extractDeclaredNames(source));

  return items;
}
