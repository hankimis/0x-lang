# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.23] - 2026-02-11

### Added

- **LSP/IDE Support** — Full Language Server Protocol implementation
  - Real-time diagnostics (parse + validation errors as you type)
  - Context-aware keyword and identifier autocomplete
  - Hover documentation for keywords, variables, and types
  - Go-to-definition for state, fn, prop, derived declarations
  - Document symbols/outline (page, component, state, fn)
  - `0x-lsp --stdio` CLI command for any LSP-compatible editor
- **VSCode Extension** — First-class 0x IDE experience
  - TextMate grammar for syntax highlighting (73+ keywords)
  - Language configuration (bracket matching, comment toggling, indentation)
  - Integrated LSP client with all features above

### Changed

- **Vue/Svelte Feature Parity** — 8 features previously React-only now fully work in Vue 3 and Svelte 5:
  - `store` — localStorage persistence with reactive sync (Vue: `ref` + `watch`, Svelte: `$state` + `$effect`)
  - `data` — Async data fetching with loading/error states (Vue: `ref` + `onMounted`, Svelte: `$state` + `onMount`)
  - `form` — Form state, field validation, submit handlers with error tracking
  - `realtime` — WebSocket connections with event handlers and auto-cleanup
  - `auth` — Authentication with login/signup/logout/guards (Vue: `provide`/`inject`, Svelte: `setContext`/`getContext`)
  - `route` — Route configuration (Vue: vue-router, Svelte: SvelteKit)
  - `model` — CRUD API generation with framework-specific composables/stores
- Package.json: added `0x-lsp` bin, `./lsp` export, IDE keywords

### Examples

- `blog.ai` — Blog with posts, CRUD, PostCard component
- `crm.ai` — CRM dashboard with search, stats, customer list
- `saas-landing.ai` — Landing page with hero, features, pricing, footer
- `kanban.ai` — Kanban board with 3 columns, TaskCard component
- `admin.ai` — Admin panel with sidebar, user table, tabs

## [1.0.0] - 2025-02-10

### Added

- **Compiler pipeline**: Tokenizer → Parser → Validator → Generators
- **React JSX generator** — full-featured output with hooks, memoization, and styling
- **Vue 3 SFC generator** — Single File Component output with Composition API
- **Svelte 5 generator** — Svelte 5 runes-compatible output
- **CLI** (`0x build`, `0x dev`, `0x bench`, `0x init`)
- **MCP server** for Claude and Cursor IDE integration
- **Browser playground** — interactive editor with live compilation
- **Validation** — circular dependency detection, unused state warnings, type checks
- **Watch mode** — auto-recompile on file changes

### Language Features

- `page`, `component`, `app` top-level declarations
- `state`, `derived`, `prop` reactive primitives
- `type` custom type definitions
- `fn`, `async fn` function declarations
- `layout col|row|grid|stack` with gap, padding, center, etc.
- `text`, `button`, `input`, `toggle`, `select`, `image`, `link` UI elements
- `if/elif/else`, `for`, `show/hide` control flow
- `on mount`, `on destroy`, `watch` lifecycle hooks
- `api` HTTP declarations
- `check` runtime validation assertions
- `style` custom style blocks

### Examples

- `counter.ai` — Counter with state and derived values
- `todo.ai` — Todo app with list state and filtering
- `dashboard.ai` — Data dashboard with async API calls
- `chat.ai` — Messaging app with event handling
- `ecommerce.ai` — E-commerce with cart and search
