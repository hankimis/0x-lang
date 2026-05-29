# Constrained decoding for 0x

The eval (`../llm-eval.mjs`, see `../../EVAL.md`) found that naive prompting makes
gpt-4o emit valid 0x only **1/5** first-try — the failures are all **syntax**
errors, because the model has never seen 0x. This folder makes 0x a *constrained*
target so the model can't emit invalid structure.

## Two approaches

### 1. JSON-schema AST  ✅ (the one that works) — `schema.mjs` + `eval.mjs`
Constrain the model to a schema-**guaranteed** JSON AST (OpenAI structured outputs,
`strict: true`), then render canonical 0x ourselves. Indentation is correct by
construction, so all structural syntax errors vanish.

```bash
npm run build
OPENAI_API_KEY=sk-... node scripts/constrained/eval.mjs
```

**Result (gpt-4o, 5 tasks):** first-try compile **1/5 (naive) → 3/5 (constrained)**.

The residual failures are NOT structural — they're 0x **expression-grammar**
limits the model trips on (JS spread `...`, `if(){}` on a line, `;`, `//`, `!==`).
0x's expression/statement syntax is a strict, JS-divergent subset.

**Path to ~5/5 (clear, actionable):**
- Model function bodies as a recursive *statement* AST too (currently flat strings) — close the last nesting gap.
- Broaden 0x's expression parser toward JS (spread, ternary, etc.) so common idioms parse.

### 2. GBNF (line-level) — `0x.gbnf`  ⚠️ partial
Grammar-constrained sampling for llama.cpp / vLLM. **Honest limitation:** 0x is
indentation-sensitive; GBNF is context-free and can't count indentation, so it
constrains per-line tokens but not nesting. Useful with a local model, but the
JSON-schema-AST path is structurally complete and is the recommended approach.

```bash
brew install llama.cpp
llama-server -hf <some-gguf-model>     # e.g. a small coder model
# POST /completion with {"prompt": "...", "grammar": "<0x.gbnf contents>"}
```

## The takeaway

0x-as-a-verifiable-LLM-target is **real but proportional to how completely you
model its AST**. Structure → solved by constraint. The remaining gap is 0x's own
expression grammar being narrower than the JS the model defaults to — a compiler
broadening task, not a prompting one.
