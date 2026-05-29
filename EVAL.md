# 0x as a Verifiable LLM Codegen Target — Eval

> Produced by `scripts/llm-eval.mjs`. Run: gpt-4o, 5 tasks, ≤3 repair rounds, 2026-05.
> Reproduce: `OPENAI_API_KEY=… node scripts/llm-eval.mjs` (or `ANTHROPIC_API_KEY`).

## Thesis under test

Not "fewer tokens" — that's settled (0x emits **2.7× fewer tokens** than the React it replaces). The real question: **is 0x a target an LLM can hit reliably?** The compiler is a checker, so we test a generate→compile→repair loop and compare against React (TypeScript syntactic check).

## Results (gpt-4o, prompt-injected spec + grammar)

| Metric | 0x | React* |
|---|---:|---:|
| First-try pass | **1 / 5** (20%) | 5 / 5 (100%) |
| Pass after ≤3 repairs | **2 / 5** (40%) | 5 / 5 |
| Avg repair rounds | 2.20 | 0.00 |
| Output tokens (total) | 758 | 2070 (**2.73×**) |

\* React's checker is **syntactic only** (TS transpile). Its pass-rate is optimistic — a file can pass and still be a broken app. 0x's bar (parse + semantic validation) is strictly higher.

## The decisive finding

Every 0x failure was a **SYNTAX error**, not a semantic one (verified by classifying compiler output):

```
[SYNTAX] todo list      → Expected UI element, got ':'  (near: button Add Task :)
[SYNTAX] product grid   → Unexpected NEWLINE            (near: = [ {)
[SYNTAX] dashboard       → Expected '[', got ']'         (near: [map] = [)
```

The model knows *what* it wants; it just doesn't know 0x's surface syntax (zero training data). **Familiarity beats compactness** — exactly as the cold analysis predicted. The repair loop alone is too weak (only 1→2 of 5).

## Why this is a *positive* result for the next step

Syntax errors are precisely what **grammar-constrained decoding** eliminates by construction. If the decoder can only emit strings the grammar accepts (`docs/grammar.ebnf` → GBNF), first-try **syntactic** validity goes to ~100%, leaving only semantic repair — where the compiler's validator and good error messages actually help.

So the honest chain is:
1. 0x is token-efficient (2.7×) ✅
2. But naive prompting makes LLMs fail on 0x syntax (1/5) ❌
3. Failures are 100% syntactic ✅ (measured)
4. → Constrained decoding should remove them → **this is the experiment that decides whether 0x's verifiability thesis holds.** Not yet run (needs a grammar-capable runtime; see `scripts/constrained/`).

## Constrained decoding — the fix, measured

We then *enforced* structure instead of prompting for it: constrain gpt-4o to a
schema-guaranteed JSON AST (OpenAI structured outputs, `strict`) and render
canonical 0x ourselves (`scripts/constrained/`). Indentation is correct by
construction.

| Approach | First-try compile |
|---|---:|
| Naive prompting (spec + grammar in prompt) | **1 / 5** |
| Constrained (JSON-schema AST → render) | 3 / 5 |
| + JS-idiom canonicalization (renderer) | 4 / 5 |
| **+ native compiler support (spread, `===`, lexing)** | **5 / 5** |
| Robustness check on a fresh 8-task set | **7 / 8** |

We then did the honest version of "broaden the expression parser" — **in the
compiler, not the prompt** — because every residual failure pointed there:

- **JS spread, desugared in the parser:** `[...xs, y]` → `xs.concat([y])`,
  `{...o, k: v}` → `Object.assign({}, o, {k: v})`. No generator changes — it
  lowers to existing AST nodes. This is what unblocked the "toggle item in a
  list" task (`items.map(i => i.id === id ? {...i, done: !i.done} : i)`).
- **Strict equality** `===`/`!==` normalized to `==`/`!=` in the tokenizer.
- **Two lexer bugs fixed:** `arr[i].prop` mis-lexed `.prop` as a CSS style-class
  (`]` wasn't a word char); and the third dot of `...` was lexed as `.class`
  (a dot right after a dot is never a style class). Both one-liners.

All **303 tests still pass**. The renderer no longer rewrites expressions — the
5/5 reflects the *compiler*, not a bridge hack.

**Why GBNF wasn't the answer:** 0x is indentation-sensitive; a context-free GBNF
can't count indentation, so it can't fully constrain 0x. JSON-schema-AST sidesteps
this (see `scripts/constrained/README.md`).

### Honest about the 7/8

Expanding to a fresh 8-task set (cart, settings, profile, …) gives 7/8 — the spread
/eq fixes generalize. The one miss is a *new, different* minor view-level gap, not
the old expression issues. We did **not** chase it: forcing 8/8 with task-specific
hacks would be overfitting. The result is the 5× lift (1/5 → 5/5) from real,
test-passing compiler work, holding up at 7/8 on unseen tasks.

## Honest limitations

- n = 5 tasks, one model (gpt-4o), few runs. Indicative, not conclusive.
- React baseline uses a syntactic checker only; a render/behavior gate would lower its real pass-rate.
- The AST schema models page/state/derived/view fully but function bodies as strings — that's where the residual failures concentrate.
