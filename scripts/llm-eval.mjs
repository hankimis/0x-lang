#!/usr/bin/env node
/**
 * Verifiable codegen eval — the pivot experiment.
 *
 * Thesis (NOT "fewer tokens"): 0x is a *verifiable* LLM target. The compiler is
 * a checker, so a generate→compile→repair loop can drive apps to a passing state
 * that freeform React can't self-verify the same way.
 *
 * What it measures, per task, for 0x AND React:
 *   - first-try pass         (does round-0 output pass its checker?)
 *   - pass after ≤N repairs  (feed checker errors back, regenerate)
 *   - rounds to converge
 *   - output tokens
 *
 * Checkers (honest asymmetry — this is the whole point, and we flag it):
 *   - 0x:    compile() = parse + semantic validation (circular deps, types, …)
 *   - React: TypeScript transpile = SYNTACTIC check only. A React file can
 *            "pass" here and still be a broken app. 0x's bar is strictly higher,
 *            so React's pass-rate is OPTIMISTIC. Read results with that in mind.
 *
 * NOT wired: true grammar-constrained decoding (docs/grammar.ebnf → GBNF needs a
 * grammar-capable runtime like llama.cpp/vLLM). We approximate by injecting the
 * spec; constrained decoding would push 0x first-try toward ~100% syntactic.
 *
 * Run:  npm run build && ANTHROPIC_API_KEY=sk-... node scripts/llm-eval.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { encode } from 'gpt-tokenizer';
import { compile } from '../dist/compiler.js';
import { getLanguageSpec } from '../dist/generators/ai-bridge.js';
import tsmod from 'typescript';
const ts = tsmod.default || tsmod;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PROVIDER = OPENAI_KEY ? 'openai' : ANTHROPIC_KEY ? 'anthropic' : null;
const MODEL = process.env.MODEL || (PROVIDER === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-6');
const MAX_REPAIRS = Number(process.env.MAX_REPAIRS || 3);

const GRAMMAR = (() => {
  try { return readFileSync(join(root, 'docs/grammar.ebnf'), 'utf-8'); } catch { return ''; }
})();

const TASKS = [
  'A counter with increment, decrement, reset, and a doubled-value display.',
  'A todo list: add a todo, toggle complete, delete, and show a remaining count.',
  'A contact form with name/email/message fields and a submit button.',
  'A product grid with a few cards, each with an add-to-cart button and a cart total.',
  'A simple dashboard with three stat cards and a recent-activity list.',
];

if (!PROVIDER) {
  console.error('✗ No API key — set OPENAI_API_KEY or ANTHROPIC_API_KEY (this harness calls a live model).');
  console.error('  OPENAI_API_KEY=sk-... [MODEL=gpt-4o] [MAX_REPAIRS=3] node scripts/llm-eval.mjs');
  process.exit(1);
}

async function ask(system, user) {
  if (PROVIDER === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return j.choices[0].message.content || '';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 2048, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.content.map((c) => c.text || '').join('');
}
const strip = (s) => s.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim();
const tok = (s) => encode(s).length;

// ---- checkers: return { ok, error } ----
function checkOx(src) {
  try { compile(src, { target: 'react', sourceMap: false }); return { ok: true, error: '' }; }
  catch (e) { return { ok: false, error: e.message.split('\n').slice(0, 4).join('\n') }; }
}
function checkReact(code) {
  const out = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    fileName: 'c.tsx',
  });
  const diags = (out.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (!diags.length) return { ok: true, error: '' };
  return { ok: false, error: diags.slice(0, 4).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n') };
}

const OX_SYS = `You write 0x, a compact declarative UI language. Output ONLY 0x source — no prose, no markdown fences.\n\n${getLanguageSpec()}\n\n## Grammar (core)\n${GRAMMAR}`;
const REACT_SYS = 'You are a senior React+TypeScript engineer. Output ONLY a single self-contained .tsx component — no prose, no markdown fences.';

async function runLang(label, sysPrompt, genPrompt, checker, fixPromptFor) {
  let code = strip(await ask(sysPrompt, genPrompt));
  let res = checker(code);
  const firstTryOk = res.ok;
  let rounds = 0;
  while (!res.ok && rounds < MAX_REPAIRS) {
    rounds++;
    code = strip(await ask(sysPrompt, fixPromptFor(code, res.error)));
    res = checker(code);
  }
  return { label, firstTryOk, finalOk: res.ok, rounds, tokens: tok(code), lastError: res.error };
}

const rows = [];
for (const task of TASKS) {
  const ox = await runLang(
    '0x', OX_SYS,
    `Write a 0x page for: ${task}`,
    checkOx,
    (code, err) => `This 0x source failed to compile:\n\n${code}\n\nCompiler errors:\n${err}\n\nReturn corrected 0x source only.`
  );
  const react = await runLang(
    'react', REACT_SYS,
    `Write a production React (TypeScript) component for: ${task}`,
    checkReact,
    (code, err) => `This .tsx failed to type-check:\n\n${code}\n\nTypeScript errors:\n${err}\n\nReturn corrected .tsx only.`
  );
  rows.push({ task, ox, react });
  console.log(
    `• ${task.slice(0, 36).padEnd(36)}  0x[first ${ox.firstTryOk ? '✓' : '✗'} final ${ox.finalOk ? '✓' : '✗'} r${ox.rounds} ${ox.tokens}t]  react[first ${react.firstTryOk ? '✓' : '✗'} final ${react.finalOk ? '✓' : '✗'} r${react.rounds} ${react.tokens}t]`
  );
}

const sum = (sel) => rows.reduce((s, r) => s + sel(r), 0);
const rate = (sel) => `${sum((r) => (sel(r) ? 1 : 0))}/${rows.length}`;
console.log(`\n=== Summary (${MODEL}, ${rows.length} tasks, ≤${MAX_REPAIRS} repairs) ===`);
console.log(`first-try pass   — 0x ${rate((r) => r.ox.firstTryOk)}   react(syntactic) ${rate((r) => r.react.firstTryOk)}`);
console.log(`pass after repair— 0x ${rate((r) => r.ox.finalOk)}   react(syntactic) ${rate((r) => r.react.finalOk)}`);
console.log(`avg repair rounds— 0x ${(sum((r) => r.ox.rounds) / rows.length).toFixed(2)}   react ${(sum((r) => r.react.rounds) / rows.length).toFixed(2)}`);
console.log(`output tokens    — 0x ${sum((r) => r.ox.tokens)}   react ${sum((r) => r.react.tokens)}  (${(sum((r) => r.react.tokens) / sum((r) => r.ox.tokens)).toFixed(2)}× more in react)`);
console.log(`\n⚠️  React's checker is SYNTACTIC only — its pass-rate is optimistic vs 0x's parse+semantic bar. Interpret accordingly.`);
