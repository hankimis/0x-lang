# Contributing to 0x

Thank you for your interest in contributing to 0x! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/user/0x-lang.git
cd 0x-lang
npm install
npm run build
npm test
```

### Project Structure

```
src/
├── tokenizer.ts          # Lexical analysis (indent/dedent handling)
├── parser.ts             # Recursive descent parser → AST
├── ast.ts                # AST node type definitions
├── validator.ts          # Static analysis (circular deps, unused state)
├── compiler.ts           # High-level compile() orchestrator
├── cli.ts                # CLI entry point (build/dev/bench)
├── init.ts               # Project scaffolding (0x init)
├── index.ts              # Public API exports
└── generators/
    ├── react.ts          # React JSX code generation
    ├── vue.ts            # Vue 3 SFC code generation
    └── svelte.ts         # Svelte 5 code generation

tests/                    # Vitest test suite
examples/                 # Example .ai programs
mcp-server/               # MCP server for Claude/Cursor
playground/               # Browser-based playground
website/                  # Landing page
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run a specific test file
npx vitest run tests/parser.test.ts
```

### Building

```bash
npm run build
```

### Testing Changes Locally

```bash
# Compile an example
node --loader ts-node/esm src/cli.ts build examples/counter.ai --target react

# Or after building
node dist/cli.js build examples/counter.ai --target react
```

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/user/0x-lang/issues) first
2. Include a minimal `.ai` file that reproduces the issue
3. Include the expected output vs actual output
4. Include your Node.js version and OS

### Suggesting Features

Open an issue with the `enhancement` label. Include:
- What problem does it solve?
- Example `.ai` syntax for the feature
- Expected compiled output

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add or update tests
5. Ensure all tests pass: `npm test`
6. Commit with a clear message: `git commit -m "Add support for X"`
7. Push: `git push origin feature/my-feature`
8. Open a Pull Request

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Add tests for new functionality
- Update examples if the syntax changes
- Follow the existing code style (TypeScript strict mode)
- Do not include generated files (`dist/`) in commits

## Code Style

- TypeScript with `strict: true`
- ES modules (`.js` extensions in imports)
- No external runtime dependencies (zero-dep compiler)
- Descriptive variable names, minimal comments
- Tests mirror source structure

## Areas for Contribution

### Good First Issues

- Improve error messages with better source locations
- Add more example `.ai` programs
- Improve documentation

### Medium

- Enhance Vue 3 SFC generator (currently basic)
- Enhance Svelte 5 generator (currently basic)
- Add CSS custom style block support
- Improve playground with more features

### Advanced

- Add new target generators (e.g., SolidJS, Angular)
- LSP (Language Server Protocol) for IDE support
- Source maps for debugging
- Incremental compilation

## Code of Conduct

Be respectful and constructive. We're building something together.

## License

By contributing, you agree that your contributions will be licensed under the [ISC License](LICENSE).
