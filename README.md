<p align="center">
  <img src="website/assets/logo.svg" alt="0x Logo" width="120" height="120" />
</p>

<h1 align="center">0x</h1>
<p align="center"><strong>The AI-First Programming Language</strong></p>

<p align="center">
  18 lines of 0x replaces 96 lines of React.<br/>
  <strong>80% less code. Zero ambiguity. Multi-target output.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/0x-lang"><img src="https://img.shields.io/npm/v/0x-lang.svg?style=flat-square&color=FF4D4D" alt="npm version" /></a>
  <a href="https://github.com/hankimis/0x-lang/actions"><img src="https://img.shields.io/github/actions/workflow/status/user/0x-lang/ci.yml?style=flat-square" alt="CI" /></a>
  <a href="https://opensource.org/licenses/ISC"><img src="https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square" alt="License" /></a>
</p>

---

## Why 0x?

AI models spend most of their tokens generating boilerplate — `useState`, `useCallback`, JSX wrappers, CSS-in-JS. **0x eliminates that entirely.**

| | 0x | Production React | Savings |
|---|---|---|---|
| **Counter App** | 18 lines | 96 lines | **81%** |
| **Todo App** | 24 lines | 136 lines | **82%** |
| **Dashboard** | 37 lines | ~185 lines | **80%** |
| **Chat App** | 31 lines | ~155 lines | **80%** |
| **E-commerce** | 44 lines | ~210 lines | **79%** |

> Compared against production TypeScript React with full inline styling, types, and component structure.

0x is a **declarative, indentation-based language** that compiles to production-ready React JSX, Vue 3 SFC, and Svelte 5 components. It's designed specifically for AI agents to generate UI code faster, cheaper, and more accurately.

## Quick Start

```bash
# Install globally
npm install -g 0x-lang

# Or use directly with npx
npx 0x-lang build app.ai --target react
```

### Initialize a New Project

```bash
npx 0x-lang init my-app
cd my-app
```

This creates a project with example `.ai` files and a ready-to-use build configuration.

### Your First 0x Program

Create `counter.ai`:

```python
page Counter:
  state count: int = 0
  derived doubled = count * 2

  fn increment():
    count += 1

  fn decrement():
    count -= 1

  layout col gap=16 padding=24 center:
    text "Counter" size=2xl bold
    text "{count}" size=3xl bold color=#333
    text "Doubled: {doubled}" size=lg color=#666

    layout row gap=8:
      button "-1" style=danger -> decrement()
      button "Reset" -> count = 0
      button "+1" style=primary -> increment()
```

### Compile

```bash
# To React
0x build counter.ai --target react

# To Vue 3
0x build counter.ai --target vue

# To Svelte 5
0x build counter.ai --target svelte

# All targets at once
0x build counter.ai --target react,vue,svelte
```

### Watch Mode

```bash
0x dev counter.ai --target react
```

## Language Reference

### Structure

```python
page PageName:          # Page component (has routing)
component CompName:     # Reusable component
app AppName:            # App root
```

### State Management

```python
state count: int = 0              # Reactive state
derived doubled = count * 2       # Auto-computed derived value
prop title: str = "default"       # External property
```

### Types

```python
type Item = {id: int, text: str, done: bool}
state items: list[Item] = []
```

### Functions

```python
fn add():
  items.push({id: Date.now(), text: input, done: false})
  input = ""

async fn fetchData():
  data = await api.getData()
```

### Layout

```python
layout col gap=16 padding=24:     # Vertical flex
layout row gap=8 center:           # Horizontal flex
layout grid cols=3 gap=16:         # CSS Grid
```

### UI Elements

```python
text "Hello" size=2xl bold color=#333       # Text
text "{variable}" size=lg                    # Interpolation
button "Click" style=primary -> action()    # Button + action
input binding placeholder="Type..."         # Two-way binding
toggle binding                               # Toggle switch
select binding options=["a", "b", "c"]      # Select dropdown
image src width=100 height=100              # Image
link "Text" href="/path"                     # Link
```

### Control Flow

```python
if condition:
  text "True"
elif other:
  text "Other"
else:
  text "False"

for item in items:
  text item.name

show isVisible:     # Conditional display
hide isHidden:      # Conditional hide
```

### Lifecycle & Watchers

```python
on mount:
  data = await fetchData()

on destroy:
  cleanup()

watch variable:
  console.log("Changed")
```

### API & Validation

```python
api getData = GET "/api/data"
api postItem = POST "/api/items"

check items.length <= 100 "Max 100 items allowed"
```

## Real-World Example: Todo App

```python
page Todo:
  type Item = {id: int, text: str, done: bool}

  state items: list[Item] = []
  state input: str = ""
  derived remaining = items.filter(i => !i.done).length

  fn add():
    if input.trim() != "":
      items.push({id: Date.now(), text: input, done: false})
      input = ""

  fn remove(id: int):
    items = items.filter(i => i.id != id)

  layout col gap=16 padding=24 maxWidth=600 margin=auto:
    text "Todo ({remaining} remaining)" size=2xl bold

    layout row gap=8:
      input input placeholder="What needs to be done?"
      button "Add" style=primary -> add()

    for item in items:
      layout row gap=8 center:
        toggle item.done
        text item.text strike={item.done}
        button "Delete" style=danger size=sm -> remove(item.id)

    if items.length == 0:
      text "Nothing to do" color=#999 center
```

This compiles to a full React component with `useState`, `useMemo`, `useCallback`, JSX, and styling — **80% less code** than writing React directly.

## Benchmarks

Run benchmarks yourself:

```bash
0x bench examples/counter.ai
0x bench examples/todo.ai
```

| Example | 0x Lines | React Lines | Savings |
|---------|----------|-------------|---------|
| Counter | 18 | 96 | **81%** |
| Todo | 24 | 136 | **82%** |
| Dashboard | 37 | ~185 | **80%** |
| Chat | 31 | ~155 | **80%** |
| E-commerce | 44 | ~210 | **79%** |

> Lines of code compared against production TypeScript React with full inline styling and component structure.

## MCP Integration (Claude / Cursor)

0x includes an [MCP server](mcp-server/) for seamless integration with Claude and Cursor IDE. AI agents can compile 0x code directly within their workflow.

```bash
cd mcp-server
npm install
npm start
```

See [mcp-server/README.md](mcp-server/README.md) for setup details.

## Programmatic API

```typescript
import { compile } from '0x-lang';

const source = `
page Hello:
  state name: str = "World"
  layout col:
    text "Hello, {name}!" size=2xl bold
`;

const result = compile(source, { target: 'react' });
console.log(result.code);       // React JSX output
console.log(result.tokenCount); // Token count
console.log(result.lineCount);  // Line count
```

### Individual Pipeline Steps

```typescript
import { tokenize, parse, validate, generateReact, generateVue, generateSvelte } from '0x-lang';

const tokens = tokenize(source);
const ast = parse(source);
const validation = validate(ast);
const react = generateReact(ast);
const vue = generateVue(ast);
const svelte = generateSvelte(ast);
```

## CLI Reference

```
0x build <file.ai> --target <target> [--output <dir>]
0x dev <file.ai> --target <target>
0x bench <file.ai>
0x init [project-name]

Options:
  --target, -t    Target: react, vue, svelte (comma-separated)
  --output, -o    Output directory (default: ./dist/)
  --help, -h      Show help
```

## Architecture

```
Source (.ai) → Tokenizer → Parser → AST → Validator → Generator → Output
                                                        ├── React JSX
                                                        ├── Vue 3 SFC
                                                        └── Svelte 5
```

The compiler follows a clean pipeline architecture:

1. **Tokenizer** — Lexical analysis with indentation-aware token generation
2. **Parser** — Recursive descent parser producing a typed AST
3. **Validator** — Static analysis (circular deps, unused state, type checks)
4. **Generators** — Target-specific code generation (React/Vue/Svelte)

## AI & Vibe Coding

0x is purpose-built for AI-assisted development ("vibe coding"). When AI agents use 0x instead of writing raw React/Vue/Svelte:

- **80% fewer tokens** — AI generates less code, reducing cost and latency
- **Zero structural decisions** — No hallucination-prone choices (hooks vs classes, CSS-in-JS vs Tailwind, etc.)
- **Multi-framework output** — One generation covers React, Vue, AND Svelte users
- **MCP integration** — Claude and Cursor can compile 0x directly via the built-in MCP server
- **Deterministic output** — Same 0x input always produces the same framework output

If you're building AI coding tools, agents, or workflows — consider using 0x as the intermediate representation for UI code generation.

```typescript
// AI agent workflow example
import { compile } from '0x-lang/compiler';

const aiGeneratedCode = `
page Dashboard:
  state metrics: list[object] = []

  on mount:
    metrics = await api.getMetrics()

  layout col gap=24 padding=32:
    text "Dashboard" size=3xl bold
    layout grid cols=3 gap=16:
      each metrics as m:
        layout col padding=20 bg=white rounded=lg shadow:
          text "{m.label}" size=sm color=gray
          text "{m.value}" size=2xl bold
`;

// Compile to any framework
const react = compile(aiGeneratedCode, { target: 'react' });
const vue = compile(aiGeneratedCode, { target: 'vue' });
const svelte = compile(aiGeneratedCode, { target: 'svelte' });
```

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Clone the repo
git clone https://github.com/hankimis/0x-lang.git
cd 0x-lang

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## License

[ISC](LICENSE) — Free for personal and commercial use.

---

<p align="center">
  <strong>0x</strong> — Write less. Compile more. Ship everywhere.<br/>
  <a href="https://0xlang.com">Website</a> · <a href="https://github.com/hankimis/0x-lang">GitHub</a> · <a href="https://www.npmjs.com/package/0x-lang">npm</a>
</p>
