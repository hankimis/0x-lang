// debug-inspect.mjs — Inspect actual generated code for quality issues
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

// 1. State assignment in button
inspect('Button state assignment', `
page Test:
  state count: int = 0
  state name: str = "hello"
  fn increment():
    count += 1
  layout col:
    text "Count: {count}"
    button "+" -> increment()
    button "Reset" -> count = 0
`);

// 2. Derived with filter/map
inspect('Derived with .filter and .map', `
page Test:
  state items: list[str] = ["apple", "banana", "cherry"]
  state search: str = ""
  derived filtered = items.filter(x => x.includes(search))
  derived count = filtered.length
  layout col:
    text "Found: {count}"
    for item in filtered:
      text item
`);

// 3. Ternary in text
inspect('Ternary expression in text', `
page Test:
  state loggedIn: bool = false
  layout col:
    text loggedIn ? "Welcome" : "Please login"
`);

// 4. Nested state object assignment
inspect('Nested object state', `
page Test:
  state user: {name: str, age: int} = {name: "Alice", age: 25}
  fn updateName():
    user.name = "Bob"
  layout col:
    text "Name: {user.name}"
    button "Update" -> updateName()
`);

// 5. Watch with async
inspect('Watch with async', `
page Test:
  state query: str = ""
  state results: list[str] = []
  watch query:
    results = await searchApi(query)
  layout col:
    input query placeholder="Search..."
    for r in results:
      text r
`);

// 6. Multiple buttons with different actions
inspect('Multiple button actions', `
page Test:
  state items: list[str] = ["a", "b", "c"]
  fn addItem():
    items.push("new")
  fn clearItems():
    items = []
  layout col:
    button "Add" -> addItem()
    button "Clear" -> clearItems()
    for item in items:
      text item
`);

// 7. If/else in layout
inspect('If/else conditional', `
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

// 8. For loop with index
inspect('For loop with index', `
page Test:
  state items: list[str] = ["A", "B", "C"]
  layout col:
    for item, idx in items:
      text "{idx}: {item}"
`);

// 9. Style props on text
inspect('Text with styles', `
page Test:
  layout col:
    text "Bold" bold
    text "Italic" italic
    text "Large" size=xl
    text "Colored" color="#ff0000"
`);

// 10. Form with validation
inspect('Form with fields', `
page Test:
  fn handleSubmit():
    data = 1
  form myForm:
    field username: str
    field email: str
    submit "Submit" -> handleSubmit()
  layout col:
    text "Form page"
`);

// 11. Modal with trigger
inspect('Modal with trigger', `
page Test:
  layout col:
    modal settings trigger="Open Settings":
      text "Settings content"
      button "Save" -> close()
`);

// 12. Template expressions with member access
inspect('Template with member access', `
page Test:
  state user: {name: str, score: int} = {name: "Test", score: 100}
  layout col:
    text "User: {user.name}, Score: {user.score}"
`);

// 13. on destroy lifecycle
inspect('On destroy lifecycle', `
page Test:
  state timer: int = 0
  on mount:
    timer = setInterval(() => tick(), 1000)
  on destroy:
    clearInterval(timer)
  layout col:
    text "Timer"
`);

// 14. Props and component
inspect('Component with props', `
component Card:
  prop title: str = "Default"
  prop color: str = "blue"
  layout col:
    text title
`);

// 15. Complex expressions
inspect('Complex expressions', `
page Test:
  state a: int = 10
  state b: int = 20
  derived sum = a + b
  derived product = a * b
  derived isEqual = a == b
  layout col:
    text "Sum: {sum}"
    text "Product: {product}"
`);
