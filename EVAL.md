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
| Constrained (JSON-schema AST → render) | **3 / 5** |

The improvement is real and it isolates the remaining problem precisely: the
residual failures are **never structural** anymore — they're 0x **expression-grammar**
limits the model trips on (JS spread `...`, `if(){}` on one line, `;`, `//`, `!==`).
0x's expression/statement syntax is a strict, JS-divergent subset.

**Why GBNF wasn't the answer:** 0x is indentation-sensitive; a context-free GBNF
can't count indentation, so it can't fully constrain 0x. JSON-schema-AST sidesteps
this (see `scripts/constrained/README.md`).

**Path to ~5/5 (actionable):** model function bodies as a recursive statement AST
too (not flat strings), and broaden 0x's expression parser toward JS. I.e.,
0x-as-verifiable-target works *in proportion to how completely you model its AST*.

## Honest limitations

- n = 5 tasks, one model (gpt-4o), few runs. Indicative, not conclusive.
- React baseline uses a syntactic checker only; a render/behavior gate would lower its real pass-rate.
- The AST schema models page/state/derived/view fully but function bodies as strings — that's where the residual failures concentrate.
