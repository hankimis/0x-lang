# 0x MCP Server

MCP server that lets AI agents compile 0x to React/Vue/Svelte with 80% fewer tokens.

[![npm](https://img.shields.io/npm/v/0x-lang-mcp-server)](https://www.npmjs.com/package/0x-lang-mcp-server)
[![Smithery](https://smithery.ai/badge/0x)](https://smithery.ai/server/0x)

## Install

```bash
npm install -g 0x-lang-mcp-server
```

Or run directly with npx:

```bash
npx 0x-lang-mcp-server
```

## Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "0x": {
      "command": "npx",
      "args": ["-y", "0x-lang-mcp-server"]
    }
  }
}
```

## Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "0x": {
      "command": "npx",
      "args": ["-y", "0x-lang-mcp-server"]
    }
  }
}
```

## Smithery

```bash
npx @smithery/cli install 0x
```

## Tools

| Tool | Description |
|------|-------------|
| `0x_compile` | Compile 0x source to React/Vue/Svelte |
| `0x_reference` | Get 0x language syntax reference |
| `0x_examples` | Browse example code (counter, todo, chat, dashboard, ecommerce) |

## How It Works

```
User: "Build me a todo app"
AI: [calls 0x_reference → writes 0x code → calls 0x_compile → returns React code]
User: Gets production-ready React code
```

The user never sees 0x. The AI generates 80 tokens of 0x internally, and the compiler outputs 200 lines of React/Vue/Svelte.
