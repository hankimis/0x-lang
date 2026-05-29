// debug-inspect2.mjs — Round 2: Deeper inspection for codegen quality
import { compile } from './dist/index.js';

function inspect(name, code) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(70));
  for (const target of ['react', 'vue', 'svelte']) {
    try {
      const result = compile(code.trim(), { target, validate: false });
      console.log(`\n--- ${target.toUpperCase()} ---`);
      console.log(result.code);
    } catch (e) {
      console.log(`\n--- ${target.toUpperCase()} ERROR ---`);
      console.log(e.message);
    }
  }
}

// 1. Nested if/else (known React JSX issue)
inspect('Nested if/else in layout', `
page Test:
  state loading: bool = true
  state error: str = ""
  layout col:
    if loading:
      text "Loading..."
    else:
      if error != "":
        text "Error: {error}"
      else:
        text "Data loaded!"
`);

// 2. Deep nesting: if/elif/else
inspect('If/elif/else chain', `
page Test:
  state status: str = "idle"
  layout col:
    if status == "loading":
      text "Loading..."
    elif status == "error":
      text "Error"
    elif status == "success":
      text "Success!"
    else:
      text "Idle"
`);

// 3. For loop inside if block
inspect('For inside if', `
page Test:
  state loggedIn: bool = false
  state items: list[str] = ["a", "b", "c"]
  layout col:
    if loggedIn:
      for item in items:
        text item
    else:
      text "Please login"
`);

// 4. Input with two-way binding + event
inspect('Input with keypress handler', `
page Test:
  state query: str = ""
  fn handleSearch():
    result = search(query)
  layout col:
    input query placeholder="Search..."
    button "Search" -> handleSearch()
`);

// 5. Multiple state assignments in one function
inspect('Multi-state update in function', `
page Test:
  state x: int = 0
  state y: int = 0
  state z: int = 0
  fn reset():
    x = 0
    y = 0
    z = 0
  fn incrementAll():
    x += 1
    y += 2
    z += 3
  layout col:
    text "x={x}, y={y}, z={z}"
    button "Reset" -> reset()
    button "Inc" -> incrementAll()
`);

// 6. Conditional rendering with show/hide
inspect('Show/hide blocks', `
page Test:
  state expanded: bool = false
  layout col:
    button "Toggle" -> expanded = !expanded
    show expanded:
      text "This is visible"
    hide expanded:
      text "This is hidden"
`);

// 7. Select with dynamic options
inspect('Select with options', `
page Test:
  state color: str = "red"
  state colors: list[str] = ["red", "green", "blue"]
  layout col:
    select color options=colors
    text "Selected: {color}"
`);

// 8. Complex template with multiple interpolations
inspect('Complex template string', `
page Test:
  state firstName: str = "John"
  state lastName: str = "Doe"
  state age: int = 30
  layout col:
    text "Name: {firstName} {lastName}, Age: {age}"
`);

// 9. Nested layout with many props
inspect('Nested layout complexity', `
page Test:
  layout col gap=24 padding=20:
    layout row between center:
      text "Header" bold size=xl
      button "Action" style=primary
    layout col gap=8:
      text "Item 1"
      text "Item 2"
      text "Item 3"
`);

// 10. Image with dynamic src
inspect('Dynamic image source', `
page Test:
  state avatar: str = "https://example.com/pic.jpg"
  layout col:
    image avatar
    text "Profile photo"
`);

// 11. Link with dynamic href
inspect('Dynamic link', `
page Test:
  state url: str = "https://example.com"
  layout col:
    link "Visit" href=url
`);

// 12. Toggle switch
inspect('Toggle binding', `
page Test:
  state darkMode: bool = false
  layout col:
    toggle darkMode
    text darkMode ? "Dark" : "Light"
`);

// 13. Async function declaration
inspect('Async function', `
page Test:
  state data: list[str] = []
  async fn loadData():
    data = await fetchApi("/data")
  layout col:
    button "Load" -> loadData()
    for item in data:
      text item
`);

// 14. Multiple watch blocks
inspect('Multiple watchers', `
page Test:
  state width: int = 100
  state height: int = 100
  state area: int = 0
  watch width:
    area = width * height
  watch height:
    area = width * height
  layout col:
    text "Area: {area}"
`);

// 15. Button with inline statement body
inspect('Button with statement body', `
page Test:
  state count: int = 0
  state log: list[str] = []
  layout col:
    text "{count}"
    button "Add" -> [count += 1, log.push("added")]
`);

// 16. Style class usage
inspect('Style class', `
page Test:
  style card:
    padding: 20
    radius: 12
    shadow: md
    bg: "#fff"
  layout col .card:
    text "Styled card"
`);

// 17. Gradient background
inspect('Gradient layout', `
page Test:
  layout col gradient="from #667eea to #764ba2":
    text "Gradient" color="#fff"
`);

// 18. Grid layout
inspect('Grid layout', `
page Test:
  layout grid cols=3 gap=16:
    text "A"
    text "B"
    text "C"
    text "D"
    text "E"
    text "F"
`);

// 19. Deeply nested state object
inspect('Deeply nested state update', `
page Test:
  state config: {theme: {primary: str, secondary: str}} = {theme: {primary: "#000", secondary: "#fff"}}
  fn updateTheme():
    config.theme.primary = "#333"
  layout col:
    text "Primary: {config.theme.primary}"
    button "Update" -> updateTheme()
`);

// 20. Nav component
inspect('Nav component', `
page Test:
  layout col:
    nav:
      "Home" -> "/"
      "About" -> "/about"
      "Contact" -> "/contact"
    text "Page content"
`);
