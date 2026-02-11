// 0x → AI/LLM Bridge
// Provides language spec, prompt generation, and skeleton creation for AI agents

import { compile } from '../compiler.js';
import type { CompileTarget } from '../compiler.js';

/** Returns the 0x language specification as a structured reference for LLM system prompts */
export function getLanguageSpec(): string {
  return `# 0x Language Specification

## Overview
0x is a declarative, AI-first programming language that compiles to React, Vue, Svelte, Express.js, React Native, and Terraform.

## Basic Syntax

### Pages & Components
\`\`\`
page TodoApp:
  state todos: list[any] = []
  state input: str = ""

  layout vertical gap=16:
    text "Todo App" size=xl bold
    input input placeholder="Add todo"
    button "Add":
      todos.push({id: Date.now(), text: input})
      input = ""
    for todo in todos:
      layout horizontal:
        text todo.text
        button "Delete" -> todos = todos.filter(t => t.id != todo.id)
\`\`\`

### State & Derived
\`\`\`
state count: int = 0
state items: list[str] = []
derived total = items.length
derived filtered = items.filter(i => i.active)
\`\`\`

### Props
\`\`\`
component Card:
  prop title
  prop subtitle = "Default"
  layout vertical:
    text title size=lg bold
    text subtitle color=gray
\`\`\`

### Control Flow
\`\`\`
if condition:
  text "True"
else:
  text "False"

for item in items:
  text item.name

show when isVisible:
  text "Visible"
\`\`\`

### Events & Actions
\`\`\`
button "Click" -> count += 1

button "Save":
  await api.post("/save", data)
\`\`\`

### Lifecycle
\`\`\`
onMount:
  const data = await fetch("/api/data")

onDestroy:
  clearInterval(timer)

watch count:
  console.log("Count changed:", count)
\`\`\`

### API
\`\`\`
api userApi:
  base = "/api"
  get users = "/users"
  post createUser = "/users"
\`\`\`

### UI Elements
- \`layout\` — div/View container (horizontal, vertical, grid, wrap)
- \`text\` — text content with size, color, bold
- \`button\` — click handler with label
- \`input\` — text input with bind, placeholder
- \`image\` — image with src, alt, size
- \`link\` — anchor with href, label
- \`toggle\` — checkbox/switch with bind
- \`select\` — dropdown with options, bind
- \`modal\` — dialog with title, trigger
- \`table\` — data table with columns
- \`form\` — form with fields and validation
- \`chart\` — data visualization (bar, line, pie)
- \`upload\` — file upload handler

### Styles
\`\`\`
style card:
  padding = 16
  radius = 8
  shadow = "0 2px 4px rgba(0,0,0,0.1)"
  bg = "#fff"
\`\`\`

### Backend (Express Server Target)
\`\`\`
endpoint GET "/api/users":
  const users = await db.users.findAll()
  res.json(users)

middleware auth:
  if !req.headers.authorization:
    res.status(401).json({error: "Unauthorized"})
  next()

cron cleanup "0 3 * * *":
  await deleteExpiredSessions()

queue emailSender:
  await sendEmail(job.data)

webhook stripe "/webhooks/stripe":
  const event = req.body
  await processPayment(event)

cache sessions redis:
  ttl = 3600
\`\`\`

### Infrastructure (Terraform Target)
\`\`\`
deploy aws:
  region: "us-east-1"

storage files s3:
  bucket: "my-app-files"

env prod:
  DATABASE_URL = "postgres://..." secret
  API_KEY = "sk-..." secret

docker node:20-alpine:
  port: 3000

domain example.com:
  ssl: true
\`\`\`

## Compile Targets
| Target | Output | Use Case |
|--------|--------|----------|
| react | React JSX + hooks | Web frontend |
| vue | Vue 3 SFC | Web frontend |
| svelte | Svelte component | Web frontend |
| backend | Express.js server | API server |
| react-native | React Native | Mobile apps |
| terraform | Terraform HCL | Infrastructure |

## Key Principles
1. Indentation-based scoping (2 spaces)
2. State is reactive by default
3. Minimal boilerplate — no imports, no types needed
4. AI-optimized: 60-70% fewer tokens than equivalent JS/TS
`;
}

/** Generate a structured LLM prompt for creating 0x code from a natural language description */
export function generatePrompt(description: string, target: CompileTarget = 'react'): string {
  return `You are a 0x language expert. Generate 0x code for the following requirement.

## Target
Compile target: ${target}

## Requirement
${description}

## Rules
1. Use valid 0x syntax (indentation-based, 2 spaces)
2. Use state for reactive data, derived for computed values
3. Use layout, text, button, input for UI elements
4. Use endpoint, middleware, cron for backend logic
5. Use deploy, storage, env for infrastructure
6. Keep it minimal — 0x is designed to be concise

## Output
Return ONLY valid 0x code, no explanations.`;
}

/** Generate a 0x code skeleton from a feature description */
export function compileFromDescription(description: string): string {
  const lower = description.toLowerCase();
  const lines: string[] = [];

  // Detect intent
  const isBackend = /api|server|endpoint|backend|auth|database|queue|cron/.test(lower);
  const isMobile = /mobile|app|native|ios|android/.test(lower);
  const isInfra = /deploy|infra|docker|cloud|storage|cdn/.test(lower);

  if (isBackend) {
    lines.push(`// 0x Backend — ${description}`);
    lines.push('');
    if (/auth/.test(lower)) {
      lines.push('middleware auth:');
      lines.push('  if !req.headers.authorization:');
      lines.push('    res.status(401).json({error: "Unauthorized"})');
      lines.push('  next()');
      lines.push('');
    }
    if (/user|crud/.test(lower)) {
      lines.push('endpoint GET "/api/users":');
      lines.push('  const users = await db.users.findAll()');
      lines.push('  res.json(users)');
      lines.push('');
      lines.push('endpoint POST "/api/users":');
      lines.push('  const user = await db.users.create(req.body)');
      lines.push('  res.status(201).json(user)');
      lines.push('');
    }
    if (/queue|job|background/.test(lower)) {
      lines.push('queue worker:');
      lines.push('  await processJob(job.data)');
      lines.push('');
    }
  } else if (isInfra) {
    lines.push(`// 0x Infrastructure — ${description}`);
    lines.push('');
    if (/aws|deploy/.test(lower)) {
      lines.push('deploy aws:');
      lines.push('  region: "us-east-1"');
      lines.push('');
    }
    if (/docker/.test(lower)) {
      lines.push('docker node:20-alpine:');
      lines.push('  port: 3000');
      lines.push('');
    }
    if (/storage|s3/.test(lower)) {
      lines.push('storage files s3:');
      lines.push('  bucket: "my-app-files"');
      lines.push('');
    }
  } else {
    // Default: UI page
    const pageName = extractPageName(description);
    lines.push(`page ${pageName}:`);
    lines.push('  state loading: bool = true');
    lines.push('  state data: list[any] = []');
    lines.push('');
    lines.push('  onMount:');
    lines.push('    const res = await fetch("/api/data")');
    lines.push('    data = await res.json()');
    lines.push('    loading = false');
    lines.push('');
    lines.push('  layout vertical gap=16 padding=24:');
    lines.push(`    text "${pageName}" size=xl bold`);
    if (/list|table|grid/.test(lower)) {
      lines.push('    for item in data:');
      lines.push('      layout horizontal gap=8:');
      lines.push('        text item.name');
    }
    if (/form|input|create/.test(lower)) {
      lines.push('    input bind=newItem placeholder="Enter value"');
      lines.push('    button "Submit":');
      lines.push('      await api.post("/data", {name: newItem})');
    }
  }

  return lines.join('\n');
}

function extractPageName(desc: string): string {
  const words = desc.split(/\s+/).filter(w => w.length > 2 && /^[A-Za-z]+$/.test(w));
  if (words.length > 0) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1) + 'Page';
  }
  return 'MyPage';
}
