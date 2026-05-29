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

**Result (gpt-4o, 5 tasks):** first-try compile **1/5 (naive) → 3/5 (raw constrained)
→ 4/5 (+ canonicalization + a tokenizer fix)**.

Canonicalization (general, in the renderer — any model emits these): array spread
`[...xs, y]` → `xs.concat([y])`, `===`/`!==` → `==`/`!=`, strip `//` and `;`.
The eval also surfaced a real compiler bug — `arr[i].prop` lexed `.prop` as a CSS
style-class — fixed in `src/tokenizer.ts` (303 tests still pass).

**Honest ceiling:** the residual 1/5 is the "toggle item in a list" task, which
fails a *different* way each run (object spread, arrow member-assignment, …)
because immutable list updates hit 0x's narrow expression grammar. At n=5 this is
noise; forcing 5/5 with task hacks would be overfitting.

**Path to a real 5/5 (compiler work, not prompt tricks):** broaden 0x's expression
parser (object spread, member-target assignment in arrows) and re-measure at n≥20.

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
