// Constrained decoding for 0x via a JSON-schema AST.
//
// WHY NOT GBNF: 0x is indentation-sensitive (INDENT/DEDENT). A context-free GBNF
// grammar cannot count indentation, so it can't fully constrain 0x. The right
// tool is to constrain the model to a JSON *AST* (schema-guaranteed) and render
// canonical 0x ourselves — indentation correct by construction. This sidesteps
// the exact syntax errors naive prompting produced (see EVAL.md).
//
// scripts/constrained/0x.gbnf keeps a line-level GBNF for runtimes that want it,
// but JSON-schema-AST is the approach that actually fixes first-try validity.

const ENUM_TYPE = ['int', 'str', 'bool', 'float', 'list[any]', 'any'];
const ENUM_SIZE = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
const ENUM_DIR = ['row', 'col'];
const ENUM_STYLE = ['primary', 'danger', 'ghost', 'default'];

// OpenAI strict structured-output schema: every property required,
// additionalProperties:false, optionals expressed as nullable.
const nodeDef = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['text', 'button', 'input', 'layout'] },
    // text
    value: { type: ['string', 'null'] },
    size: { type: ['string', 'null'], enum: [...ENUM_SIZE, null] },
    bold: { type: ['boolean', 'null'] },
    color: { type: ['string', 'null'] },
    // button
    label: { type: ['string', 'null'] },
    style: { type: ['string', 'null'], enum: [...ENUM_STYLE, null] },
    action: { type: ['string', 'null'] },
    // input
    model: { type: ['string', 'null'] },
    placeholder: { type: ['string', 'null'] },
    // layout
    dir: { type: ['string', 'null'], enum: [...ENUM_DIR, null] },
    gap: { type: ['integer', 'null'] },
    padding: { type: ['integer', 'null'] },
    center: { type: ['boolean', 'null'] },
    children: { type: ['array', 'null'], items: { $ref: '#/$defs/node' } },
  },
  required: ['kind', 'value', 'size', 'bold', 'color', 'label', 'style', 'action', 'model', 'placeholder', 'dir', 'gap', 'padding', 'center', 'children'],
};

export const OX_SCHEMA = {
  name: 'ox_page',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    $defs: { node: nodeDef },
    properties: {
      page: { type: 'string' },
      state: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, type: { type: 'string', enum: ENUM_TYPE }, init: { type: 'string' } },
          required: ['name', 'type', 'init'],
        },
      },
      derived: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, expr: { type: 'string' } },
          required: ['name', 'expr'],
        },
      },
      functions: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, params: { type: 'array', items: { type: 'string' } }, body: { type: 'array', items: { type: 'string' } } },
          required: ['name', 'params', 'body'],
        },
      },
      view: { type: 'array', items: { $ref: '#/$defs/node' } },
    },
    required: ['page', 'state', 'derived', 'functions', 'view'],
  },
};

// ---- renderer: AST → canonical 0x (indentation correct by construction) ----
const pad = (n) => '  '.repeat(n);

function renderNode(node, depth) {
  const i = pad(depth);
  if (node.kind === 'text') {
    let s = `${i}text "${node.value ?? ''}"`;
    if (node.size) s += ` size=${node.size}`;
    if (node.bold) s += ` bold`;
    if (node.color) s += ` color=${node.color}`;
    return s;
  }
  if (node.kind === 'button') {
    let s = `${i}button "${node.label ?? ''}"`;
    if (node.style && node.style !== 'default') s += ` style=${node.style}`;
    if (node.action) s += ` -> ${node.action}`;
    return s;
  }
  if (node.kind === 'input') {
    let s = `${i}input ${node.model ?? 'value'}`;
    if (node.placeholder) s += ` placeholder="${node.placeholder}"`;
    return s;
  }
  if (node.kind === 'layout') {
    let head = `${i}layout ${node.dir || 'col'}`;
    if (node.gap != null) head += ` gap=${node.gap}`;
    if (node.padding != null) head += ` padding=${node.padding}`;
    if (node.center) head += ` center`;
    head += ':';
    const kids = (node.children || []).map((c) => renderNode(c, depth + 1)).join('\n');
    return kids ? `${head}\n${kids}` : head;
  }
  return `${i}text ""`;
}

// 0x is one-statement-per-line, uses `#` comments (not `//`), and no `;`.
// Models emit JS-ish bodies; canonicalize them so structural validity holds.
function sanitizeBody(lines) {
  const out = [];
  for (const raw of lines || []) {
    let s = String(raw).replace(/\/\/.*$/, '').trim(); // drop // comments
    if (!s) continue;
    for (let part of s.split(';')) { part = part.trim(); if (part) out.push(part); }
  }
  return out;
}

// page names must be a single identifier; models sometimes return "Contact Form"
const toIdent = (s) =>
  ((s || 'App').replace(/[^A-Za-z0-9_]+/g, ' ').trim().split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') || 'App');

export function renderOx(ast) {
  const L = [`page ${toIdent(ast.page)}:`];
  for (const s of ast.state || []) L.push(`  state ${s.name}: ${s.type} = ${s.init}`);
  for (const d of ast.derived || []) L.push(`  derived ${d.name} = ${d.expr}`);
  for (const f of ast.functions || []) {
    L.push('');
    L.push(`  fn ${f.name}(${(f.params || []).join(', ')}):`);
    const body = sanitizeBody(f.body);
    if (!body.length) body.push('return');
    for (const line of body) L.push(`    ${line}`);
  }
  if ((ast.view || []).length) {
    L.push('');
    for (const n of ast.view) L.push(renderNode(n, 1));
  }
  return L.join('\n') + '\n';
}
