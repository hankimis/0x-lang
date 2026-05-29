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

**Result (gpt-4o):** first-try compile **1/5 (naive) → 5/5** on the original tasks,
**7/8** on a fresh 8-task set. The jump came from real compiler work, not prompt
tricks — every residual failure pointed at 0x's expression grammar being narrower
than JS, so we widened it:

- **Spread, desugared in the parser:** `[...xs, y]` → `xs.concat([y])`,
  `{...o, k: v}` → `Object.assign({}, o, {k: v})`. Lowers to existing AST nodes,
  so no generator changes. (This unblocked the "toggle item in a list" task.)
- **`===`/`!==`** normalized to `==`/`!=` in the tokenizer.
- **Two lexer fixes:** `arr[i].prop` and the third dot of `...` were mis-lexed as
  CSS style-classes. Both one-liners. **All 303 tests still pass.**

The renderer no longer rewrites expressions — the 5/5 is the compiler's. We did NOT
chase the 8th task (a new minor view gap); forcing it would be overfitting.

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
