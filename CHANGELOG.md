# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
