// 0x LSP — Hover Information

import { Hover, Position, MarkupKind } from 'vscode-languageserver';
import { parse } from '../parser.js';

// Keyword documentation map
const KEYWORD_DOCS: Record<string, string> = {
  page: 'Page component declaration. Entry point for a route.',
  component: 'Reusable component declaration.',
  app: 'Top-level application declaration. Wraps all pages.',
  state: 'Reactive state variable. Compiles to `useState` (React), `ref` (Vue), `$state` (Svelte).',
  derived: 'Computed value. Compiles to `useMemo` (React), `computed` (Vue), `$derived` (Svelte).',
  prop: 'Component property (input from parent).',
  fn: 'Function declaration.',
  layout: 'Flex/grid layout container. Use `row`, `col`, or `grid`.',
  row: 'Horizontal flex layout (shorthand for `layout row`).',
  col: 'Vertical flex layout (shorthand for `layout col`).',
  grid: 'CSS grid layout.',
  stack: 'Stack layout (overlapping children).',
  text: 'Text element. Renders a `<p>`, `<span>`, or heading tag.',
  button: 'Button element with click handler.',
  input: 'Input field with two-way binding.',
  image: 'Image element with src and alt.',
  link: 'Anchor/link element.',
  toggle: 'Toggle switch / checkbox.',
  select: 'Dropdown select element.',
  table: 'Data table with columns.',
  chart: 'Chart visualization (bar, line, pie, etc.).',
  modal: 'Modal dialog overlay.',
  toast: 'Toast notification.',
  nav: 'Navigation bar component.',
  form: 'Form with fields, validation, and submit handler.',
  model: 'Data model declaration with typed fields.',
  auth: 'Authentication configuration (login, signup, logout, guard).',
  route: 'Route declaration for navigation.',
  role: 'Role-based access control.',
  style: 'Scoped style block for custom CSS properties.',
  import: 'Import external JavaScript module.',
  use: 'Import a 0x component from another file.',
  api: 'API endpoint binding (GET, POST, PUT, DELETE).',
  store: 'Global store variable (shared across components).',
  data: 'Data fetching declaration.',
  watch: 'Watch a state variable for changes and run side effects.',
  check: 'Runtime assertion / validation contract.',
  'on mount': 'Lifecycle hook: runs after component mounts.',
  'on destroy': 'Lifecycle hook: runs before component unmounts.',
  if: 'Conditional rendering block.',
  for: 'List rendering — iterates over a collection.',
  show: 'Conditionally show an element (CSS display toggle).',
  hide: 'Conditionally hide an element.',
  emit: 'Emit a custom event to parent component.',
  animate: 'Animation declaration (enter, exit, transition).',
  seo: 'SEO metadata (title, description, og tags).',
  a11y: 'Accessibility attributes.',
  hero: 'Hero section UI pattern.',
  features: 'Features grid section.',
  pricing: 'Pricing table section.',
  faq: 'FAQ accordion section.',
  footer: 'Footer section.',
  admin: 'Admin dashboard scaffold.',
  deploy: 'Deployment configuration.',
  env: 'Environment variable declaration.',
  docker: 'Docker container configuration.',
  realtime: 'Real-time data subscription (WebSocket).',
  crud: 'CRUD scaffold — generates list, create, edit, delete views.',
  upload: 'File upload component.',
  search: 'Search input with filtering.',
  responsive: 'Responsive breakpoint wrapper.',
  async: 'Async function modifier.',
};

function getWordAtPosition(source: string, position: Position): string {
  const lines = source.split('\n');
  const line = lines[position.line] || '';
  const before = line.substring(0, position.character);
  const after = line.substring(position.character);

  const wordBefore = before.match(/[\w]+$/) || [''];
  const wordAfter = after.match(/^[\w]+/) || [''];
  return wordBefore[0] + wordAfter[0];
}

export function getHoverInfo(source: string, position: Position): Hover | null {
  const word = getWordAtPosition(source, position);
  if (!word) return null;

  // Check for "on mount" / "on destroy" compound keywords
  const lines = source.split('\n');
  const line = lines[position.line] || '';
  if (word === 'on' || word === 'mount' || word === 'destroy') {
    if (/\bon\s+mount\b/.test(line)) {
      const doc = KEYWORD_DOCS['on mount'];
      if (doc) {
        return { contents: { kind: MarkupKind.Markdown, value: `**on mount**\n\n${doc}` } };
      }
    }
    if (/\bon\s+destroy\b/.test(line)) {
      const doc = KEYWORD_DOCS['on destroy'];
      if (doc) {
        return { contents: { kind: MarkupKind.Markdown, value: `**on destroy**\n\n${doc}` } };
      }
    }
  }

  // Check keyword docs
  const doc = KEYWORD_DOCS[word];
  if (doc) {
    return { contents: { kind: MarkupKind.Markdown, value: `**${word}**\n\n${doc}` } };
  }

  // Try to find the identifier in parsed AST
  try {
    const ast = parse(source);
    for (const node of ast) {
      if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
        for (const child of node.body) {
          if (child.type === 'StateDecl' && child.name === word) {
            const typeStr = child.valueType ? `: ${JSON.stringify(child.valueType)}` : '';
            return {
              contents: {
                kind: MarkupKind.Markdown,
                value: `**state** \`${word}\`${typeStr}\n\nReactive state variable declared in \`${node.name}\`.`,
              },
            };
          }
          if (child.type === 'DerivedDecl' && child.name === word) {
            return {
              contents: {
                kind: MarkupKind.Markdown,
                value: `**derived** \`${word}\`\n\nComputed value declared in \`${node.name}\`.`,
              },
            };
          }
          if (child.type === 'PropDecl' && child.name === word) {
            return {
              contents: {
                kind: MarkupKind.Markdown,
                value: `**prop** \`${word}\`\n\nComponent property declared in \`${node.name}\`.`,
              },
            };
          }
          if (child.type === 'FnDecl' && child.name === word) {
            const params = child.params.map(p => p.name).join(', ');
            return {
              contents: {
                kind: MarkupKind.Markdown,
                value: `**fn** \`${word}(${params})\`\n\nFunction declared in \`${node.name}\`.`,
              },
            };
          }
        }
      }
    }
  } catch {
    // Parse failed — no hover for identifiers
  }

  return null;
}
