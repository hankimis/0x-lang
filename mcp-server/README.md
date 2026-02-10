# 0x MCP Server

AI 에이전트가 내부적으로 0x를 사용하여 React/Vue/Svelte 코드를 효율적으로 생성하는 MCP 서버.

## 설치

```bash
cd mcp-server
npm install
npm run build
```

## Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "0x": {
      "command": "node",
      "args": ["/Users/hankim/AILANG/mcp-server/dist/index.js"]
    }
  }
}
```

## Cursor 설정

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "0x": {
      "command": "node",
      "args": ["/Users/hankim/AILANG/mcp-server/dist/index.js"]
    }
  }
}
```

## 제공 도구

| 도구 | 설명 |
|------|------|
| `0x_compile` | 0x 소스를 React/Vue/Svelte로 컴파일 |
| `0x_reference` | 0x 문법 레퍼런스 조회 |
| `0x_examples` | 예제 코드 조회 (counter, todo, chat, dashboard, ecommerce) |

## 사용 흐름

```
사용자: "투두앱 만들어줘"
AI: [0x_reference 호출 → 0x 코드 작성 → 0x_compile 호출 → React 코드 반환]
사용자: 완성된 React 코드를 받음
```

사용자는 0x의 존재를 모름. AI가 내부적으로 80토큰만 생성하고 컴파일러가 200줄 React를 만들어냄.
