#!/usr/bin/env node

// 0x MCP Server
// MCP server that lets AI agents use 0x to efficiently generate UI code

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { compile } from './compiler.js';

const MAX_SOURCE_LENGTH = 50_000; // 50KB max input

const LANG_SPEC = `# 0x Language Reference

0x is an intermediate language for AI agents to efficiently generate UI code.
React 500 tokens -> 0x 80 tokens = 85% token savings.

## Basic Structure
\`\`\`
page PageName:        # Page component
component CompName:   # Reusable component
app AppName:          # App root
\`\`\`

## State Management
\`\`\`
state count: int = 0          # State variable
derived doubled = count * 2   # Derived value (auto-computed)
prop title: str = "default"   # External prop
\`\`\`

## Type Declarations
\`\`\`
type Item = {id: int, text: str, done: bool}
state items: list[Item] = []
\`\`\`

## Functions
\`\`\`
fn add():
  items.push({id: Date.now(), text: input, done: false})
  input = ""

fn async fetchData():
  data = await api.getData()
\`\`\`

## Layout (auto flex/grid)
\`\`\`
layout col gap=16 padding=24:    # Vertical (flex-direction: column)
layout row gap=8 center:          # Horizontal (flex-direction: row)
layout grid cols=3 gap=16:        # Grid
\`\`\`

## UI Elements
\`\`\`
text "Title" size=2xl bold color=#333      # Text
text "{variable}" size=lg                   # Variable interpolation
button "Click" style=primary -> action()   # Button + action
button "Add" -> count += 1                 # Inline action
input binding placeholder="Enter..."       # Input (two-way binding)
toggle binding                              # Toggle/checkbox
select binding options=["a", "b", "c"]     # Select
image src width=100 height=100             # Image
link "Text" href="/path"                    # Link
\`\`\`

## Conditionals / Loops
\`\`\`
if condition:
  text "When true"
elif otherCondition:
  text "Other condition"
else:
  text "When false"

for item in items:
  text item.name

show isVisible:          # Conditional show
  text "Visible"

hide isHidden:           # Conditional hide
  text "Hidden"
\`\`\`

## Lifecycle
\`\`\`
on mount:
  data = await fetchData()

on destroy:
  cleanup()

watch variable:
  console.log("Changed", variable)
\`\`\`

## API
\`\`\`
api getData = GET "/api/data"
api postItem = POST "/api/items"
\`\`\`

## Styles
\`\`\`
style card:
  padding: 24
  radius: 12
  shadow: md
  bg: white
\`\`\`

## Size Units
xs=12px, sm=14px, md=16px, lg=20px, xl=24px, 2xl=32px, 3xl=40px

## Button Styles
style=primary (blue), style=danger (red), style=ghost (transparent)

## Complete Example — Todo App
\`\`\`
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

  layout col gap=16 padding=24:
    text "Todo ({remaining} remaining)" size=2xl bold

    layout row gap=8:
      input input placeholder="Enter a todo item"
      button "Add" style=primary -> add()

    for item in items:
      layout row gap=8 center:
        toggle item.done
        text item.text
        button "Delete" style=danger -> remove(item.id)

    if items.length == 0:
      text "No items yet" color=#999 center
\`\`\`
`;

const server = new McpServer({
  name: '0x',
  version: '0.1.0',
});

// Tool 1: Compile 0x code
server.tool(
  '0x_compile',
  `Compiles 0x code to React/Vue/Svelte.
0x is an intermediate language that expresses UI code with 80% fewer tokens.
Generate code in 0x first, then compile with this tool to drastically reduce token cost.`,
  {
    source: z.string().max(MAX_SOURCE_LENGTH).describe('0x source code'),
    target: z.enum(['react', 'vue', 'svelte']).describe('Target framework'),
  },
  async ({ source, target }) => {
    try {
      const result = compile(source, { target, validate: true });

      const srcTokens = source.split(/\s+/).filter(Boolean).length;
      const outTokens = result.tokenCount;
      const savings = outTokens > 0 ? Math.round((1 - srcTokens / outTokens) * 100) : 0;

      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `// Compiled to ${target.charAt(0).toUpperCase() + target.slice(1)} (${result.lineCount} lines)`,
              `// 0x: ${srcTokens} tokens -> ${target}: ${outTokens} tokens (${savings}% fewer input tokens)`,
              '',
              result.code,
            ].join('\n'),
          },
        ],
      };
    } catch (e: any) {
      return {
        content: [{ type: 'text' as const, text: `Compilation error: ${e.message}` }],
        isError: true,
      };
    }
  },
);

// Tool 2: 0x language reference
server.tool(
  '0x_reference',
  `Returns the 0x language syntax reference.
When generating UI code, check this reference first, write in 0x, then compile with 0x_compile.
Using 0x can reduce token usage by 85%.`,
  {},
  async () => {
    return {
      content: [{ type: 'text' as const, text: LANG_SPEC }],
    };
  },
);

// Tool 3: Example code listing
server.tool(
  '0x_examples',
  'Returns 0x example code. Use as reference.',
  {
    example: z.enum(['counter', 'todo', 'chat', 'dashboard', 'ecommerce']).optional()
      .describe('Example name (omit for full list)'),
  },
  async ({ example }) => {
    const examples: Record<string, string> = {
      counter: `page Counter:
  state count: int = 0
  derived doubled = count * 2

  fn increment():
    count += 1

  fn decrement():
    count -= 1

  fn reset():
    count = 0

  layout col gap=16 padding=24 center:
    text "Counter" size=2xl bold
    text "{count}" size=3xl bold color=#333
    text "Double: {doubled}" size=lg color=#666
    layout row gap=8:
      button "-1" style=danger -> decrement()
      button "Reset" -> reset()
      button "+1" style=primary -> increment()`,

      todo: `page Todo:
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

  layout col gap=16 padding=24:
    text "Todo ({remaining} remaining)" size=2xl bold
    layout row gap=8:
      input input placeholder="Enter a todo item"
      button "Add" style=primary -> add()
    for item in items:
      layout row gap=8 center:
        toggle item.done
        text item.text
        button "Delete" style=danger -> remove(item.id)
    if items.length == 0:
      text "No items yet" color=#999 center`,

      chat: `page Chat:
  type Message = {id: int, text: str, sender: str, time: datetime}
  state messages: list[Message] = []
  state input: str = ""
  state username: str = "Me"

  fn send():
    if input.trim() != "":
      messages.push({id: Date.now(), text: input, sender: username, time: now()})
      input = ""

  layout col height=100vh:
    layout row center padding=16 bg=#075e54:
      text "Chat" size=lg bold color=white
    layout col gap=8 padding=16 scroll=y grow=1:
      for msg in messages:
        layout row:
          layout col padding=12 radius=12 maxWidth="70%" shadow=sm:
            text msg.text
            text msg.time.format("HH:mm") size=xs color=#999 end
    layout row gap=8 padding=16 bg=#f0f0f0:
      input input placeholder="Type a message..."
      button "Send" style=primary -> send()`,

      dashboard: `page Dashboard:
  type Metric = {label: str, value: float, change: float}
  state metrics: list[Metric] = []
  state period: str = "week"
  state loading: bool = true

  api getMetrics = GET "/api/metrics"

  on mount:
    metrics = await getMetrics(period: period)
    loading = false

  watch period:
    loading = true
    metrics = await getMetrics(period: period)
    loading = false

  layout col gap=24 padding=32:
    layout row between center:
      text "Dashboard" size=3xl bold
      select period options=["day", "week", "month", "year"]
    if loading:
      text "Loading..." center
    else:
      layout grid cols=3 gap=16:
        for metric in metrics:
          component MetricCard(metric)`,

      ecommerce: `page Shop:
  type Product = {id: int, name: str, price: float, image: str}
  type CartItem = {product: Product, qty: int}
  state products: list[Product] = []
  state cart: list[CartItem] = []
  state search: str = ""

  derived filteredProducts = products.filter(p => p.name.includes(search))
  derived cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  derived cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  fn addToCart(product: Product):
    cart.push({product: product, qty: 1})

  layout col gap=24 padding=32:
    layout row between center:
      text "Shop" size=3xl bold
      text "Cart ({cartCount}) \${cartTotal}" size=lg bold color=#e74c3c
    input search placeholder="Search products..."
    layout grid cols=3 gap=16:
      for product in filteredProducts:
        layout col gap=8 padding=16 radius=12 shadow=md bg=white:
          image product.image
          text product.name size=lg bold
          text "\${product.price}" color=#e74c3c
          button "Add to cart" style=primary -> addToCart(product)`,
    };

    if (example) {
      return {
        content: [{ type: 'text' as const, text: examples[example] || 'Example not found.' }],
      };
    }

    const list = Object.entries(examples)
      .map(([name, code]) => {
        const lines = code.split('\n').length;
        const tokens = code.split(/\s+/).filter(Boolean).length;
        return `- **${name}**: ${lines} lines, ${tokens} tokens`;
      })
      .join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `# 0x Examples\n\n${list}\n\nSpecify the example parameter to view a specific example.`,
      }],
    };
  },
);

// Resource: 0x spec document
server.resource(
  '0x-spec',
  '0x://spec',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'text/markdown',
      text: LANG_SPEC,
    }],
  }),
);

// Prompt: UI code generation
server.prompt(
  'generate-ui',
  'Prompt to convert natural language descriptions into 0x code',
  { description: z.string().describe('Description of the UI to build') },
  ({ description }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Please write the following UI in 0x code. Use 0x syntax to keep it as concise as possible.

Requirements: ${description}

After writing the 0x code, use the 0x_compile tool to compile it to your desired framework.`,
      },
    }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
