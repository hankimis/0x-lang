// Constrained decoding for 0x via a JSON-schema AST.
//
// WHY NOT GBNF: 0x is indentation-sensitive (INDENT/DEDENT). A context-free GBNF
// grammar cannot count indentation, so it can't fully constrain 0x. The right
// tool is to constrain the model to a JSON *AST* (schema-guaranteed) and render
// canonical 0x ourselves — indentation correct by construction.
//
// NOTE ON SCHEMA WEIGHT: an earlier version modeled function bodies as a fully
// recursive statement AST. Under OpenAI strict mode (every field required, all
// nullable) that ballooned the JSON until it truncated mid-output ("unterminated
// string"). Lesson: keep the constrained schema LEAN. Bodies are statement
// strings; we canonicalize the few forms 0x's parser lacks (spread, // comments,
// multi-statement lines) in the renderer.

const ENUM_TYPE = ['int', 'str', 'bool', 'float', 'list[any]', 'any'];
const ENUM_SIZE = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
const ENUM_DIR = ['row', 'col'];
const ENUM_STYLE = ['primary', 'danger', 'ghost', 'default'];

const nodeDef = {
  type: 'object', additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['text', 'button', 'input', 'layout'] },
    value: { type: ['string', 'null'] },
    size: { type: ['string', 'null'], enum: [...ENUM_SIZE, null] },
    bold: { type: ['boolean', 'null'] },
    color: { type: ['string', 'null'] },
    label: { type: ['string', 'null'] },
    style: { type: ['string', 'null'], enum: [...ENUM_STYLE, null] },
    action: { type: ['string', 'null'] },
    model: { type: ['string', 'null'] },
    placeholder: { type: ['string', 'null'] },
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
    type: 'object', additionalProperties: false,
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
          properties: {
            name: { type: 'string' },
            params: { type: 'array', items: { type: 'string' } },
            // one simple 0x statement per entry (assignment or call)
            body: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'params', 'body'],
        },
      },
      view: { type: 'array', items: { $ref: '#/$defs/node' } },
    },
    required: ['page', 'state', 'derived', 'functions', 'view'],
  },
};

// ---- expression canonicalization (leaf strings) ----
// 0x's expression parser lacks JS spread; rewrite the common array-spread forms.
function expr(s) {
  let x = String(s ?? '').replace(/\/\/.*$/, '').trim().replace(/;+$/, '');
  x = x.replace(/!==/g, '!=').replace(/===/g, '=='); // 0x has ==/!= only, not strict eq
  x = x.replace(/^\[\s*\.\.\.([A-Za-z_$][\w$]*)\s*,\s*([\s\S]+)\]$/, '$1.concat([$2])'); // [...X, y] -> X.concat([y])
  x = x.replace(/^\[\s*\.\.\.([A-Za-z_$][\w$]*)\s*\]$/, '$1.slice()'); // [...X] -> X.slice()
  return x;
}

// 0x is one-statement-per-line, `#` comments (not `//`), no `;`. Canonicalize.
function sanitizeBody(lines) {
  const out = [];
  for (const raw of lines || []) {
    let s = String(raw).replace(/\/\/.*$/, '').trim(); // drop // comments
    if (!s) continue;
    for (let part of s.split(';')) { part = expr(part); if (part) out.push(part); }
  }
  return out;
}

// page names must be a single identifier; models sometimes return "Contact Form"
const toIdent = (s) =>
  ((s || 'App').replace(/[^A-Za-z0-9_]+/g, ' ').trim().split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') || 'App');

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
    if (node.action) s += ` -> ${expr(node.action)}`;
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

export function renderOx(ast) {
  const L = [`page ${toIdent(ast.page)}:`];
  for (const s of ast.state || []) L.push(`  state ${s.name}: ${s.type} = ${expr(s.init)}`);
  for (const d of ast.derived || []) L.push(`  derived ${d.name} = ${expr(d.expr)}`);
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
