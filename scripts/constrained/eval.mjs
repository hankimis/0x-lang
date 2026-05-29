#!/usr/bin/env node
/**
 * Constrained-decoding eval — the fix for the 1/5 first-try problem (EVAL.md).
 *
 * Naive prompting: model emits 0x text → 1/5 first-try compile (syntax errors).
 * Constrained:     model emits a schema-GUARANTEED JSON AST (OpenAI structured
 *                  outputs, strict) → we render canonical 0x → compile.
 *                  Structural syntax errors are impossible by construction.
 *
 * Run:  npm run build && OPENAI_API_KEY=sk-... node scripts/constrained/eval.mjs
 */
import { encode } from 'gpt-tokenizer';
import { compile } from '../../dist/compiler.js';
import { OX_SCHEMA, renderOx } from './schema.mjs';

const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.MODEL || 'gpt-4o';
if (!KEY) { console.error('✗ OPENAI_API_KEY required (structured outputs).'); process.exit(1); }

const TASKS = [
  'A counter with increment, decrement, reset, and a doubled-value display.',
  'A todo list: add a todo, toggle complete, delete, and show a remaining count.',
  'A contact form with name/email/message fields and a submit button.',
  'A product grid with a few cards, each with an add-to-cart button and a cart total.',
  'A simple dashboard with three stat cards and a recent-activity list.',
  'A settings panel with several toggle switches and a save button.',
  'A shopping cart: list line items with quantities, update quantity, and a running total.',
  'A tabbed profile page with an editable bio field and a follower count.',
];

const SYS =
  'You design small UI apps as a structured AST for the 0x language. ' +
  'Use state for mutable values, derived for computed values, functions for actions, ' +
  'and view for the UI tree. Reference state by name in text via "{name}". ' +
  'Each function body entry is ONE simple statement string — an assignment or a call ' +
  '(e.g. "count += 1", "items.push({id: Date.now(), text: input})", "items = items.filter(i => !i.done)"). ' +
  'To add to a list, use "list.push(item)". To remove, "list = list.filter(...)". ' +
  'Do NOT use JS spread (...), if/for blocks, semicolons, // comments, or multi-statement lines; ' +
  'use a ternary inside an assignment for conditionals.';

async function genAst(task) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'system', content: SYS }, { role: 'user', content: `Design: ${task}` }],
      response_format: { type: 'json_schema', json_schema: OX_SCHEMA },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  return JSON.parse(j.choices[0].message.content);
}

const rows = [];
for (const task of TASKS) {
  let ok = false, err = '', src = '', tokens = 0;
  try {
    const ast = await genAst(task);
    src = renderOx(ast);
    tokens = encode(src).length;
    compile(src, { target: 'react', sourceMap: false });
    ok = true;
  } catch (e) {
    err = e.message.split('\n')[0];
  }
  rows.push({ task, ok, tokens, err });
  console.log(`• ${task.slice(0, 40).padEnd(40)} ${ok ? '✓' : '✗'} ${tokens ? tokens + 't' : ''} ${err}`);
}

const pass = rows.filter((r) => r.ok).length;
const toks = rows.reduce((s, r) => s + r.tokens, 0);
console.log(`\n=== Constrained (JSON-schema AST → 0x), ${MODEL}, ${rows.length} tasks ===`);
console.log(`first-try compile: ${pass}/${rows.length}   (naive prompting was 1/5 — see EVAL.md)`);
console.log(`output tokens (0x): ${toks}`);
console.log(`\nNote: structural validity is guaranteed by the schema+renderer; remaining failures (if any)`);
console.log(`are semantic (e.g. an expression referencing an undefined name), which the validator catches.`);
