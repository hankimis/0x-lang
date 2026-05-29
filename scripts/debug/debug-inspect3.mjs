// debug-inspect3.mjs — Round 3: Diverse edge cases & real-world patterns
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

// 1. Component with props (not page)
inspect('Component with props', `
component Card:
  prop title: str
  prop subtitle: str = "Default"
  layout col gap=16 padding=20 radius=12 shadow=md:
    text title bold size=lg
    text subtitle color="#666"
`);

// 2. Nested for loops
inspect('Nested for loops', `
page Test:
  state categories: list[{name: str, items: list[str]}] = []
  layout col gap=16:
    for cat in categories:
      text cat.name bold
      for item in cat.items:
        text "  - {item}"
`);

// 3. For loop with index
inspect('For loop with index', `
page Test:
  state items: list[str] = ["a", "b", "c"]
  layout col:
    for item, idx in items:
      text "{idx}: {item}"
`);

// 4. Complex ternary in text
inspect('Ternary in text content', `
page Test:
  state count: int = 0
  layout col:
    text count == 0 ? "Empty" : count == 1 ? "One item" : "{count} items"
`);

// 5. Multiple event handlers
inspect('Multiple buttons with different actions', `
page Test:
  state count: int = 0
  state name: str = "World"
  fn increment():
    count += 1
  fn decrement():
    count -= 1
  fn reset():
    count = 0
    name = "World"
  layout col gap=8:
    text "Count: {count}"
    layout row gap=8:
      button "+" -> increment()
      button "-" -> decrement()
      button "Reset" -> reset()
`);

// 6. Form with multiple inputs
inspect('Form pattern', `
page Test:
  state email: str = ""
  state password: str = ""
  state remember: bool = false
  fn handleLogin():
    result = login(email, password)
  layout col gap=16 padding=24:
    text "Login" bold size=xl
    input email placeholder="Email" type="email"
    input password placeholder="Password" type="password"
    toggle remember
    text "Remember me"
    button "Sign In" style=primary -> handleLogin()
`);

// 7. List operations in functions (filter, map)
inspect('List filter and map', `
page Test:
  state todos: list[{id: int, text: str, done: bool}] = []
  state filter: str = "all"
  derived activeTodos = todos.filter(t => !t.done)
  derived completedTodos = todos.filter(t => t.done)
  derived visibleTodos = filter == "all" ? todos : filter == "active" ? activeTodos : completedTodos
  layout col gap=8:
    for todo in visibleTodos:
      text todo.text
    text "{activeTodos.length} items left"
`);

// 8. Timer pattern with on destroy
inspect('Timer with cleanup', `
page Test:
  state seconds: int = 0
  state timerId: int = 0
  on mount:
    timerId = setInterval(() => seconds += 1, 1000)
  on destroy:
    clearInterval(timerId)
  layout col:
    text "Time: {seconds}s"
`);

// 9. Conditional styling (dynamic bg color)
inspect('Conditional style', `
page Test:
  state isActive: bool = false
  layout col:
    layout row padding=16 radius=8 bg={isActive ? "#e6ffe6" : "#ffe6e6"}:
      text isActive ? "Active" : "Inactive"
      button "Toggle" -> isActive = !isActive
`);

// 10. Deeply nested layouts
inspect('Deep layout nesting', `
page Test:
  layout col padding=20:
    layout row between center:
      layout row gap=8 center:
        text "Logo" bold size=xl
        text "App" color="#666"
      layout row gap=12:
        button "Home" -> navigate("/")
        button "About" -> navigate("/about")
    layout col gap=24 padding=20:
      layout grid cols=3 gap=16:
        layout col padding=16 radius=8 shadow=sm:
          text "Card 1" bold
          text "Description"
        layout col padding=16 radius=8 shadow=sm:
          text "Card 2" bold
          text "Description"
        layout col padding=16 radius=8 shadow=sm:
          text "Card 3" bold
          text "Description"
`);

// 11. Empty state pattern (if + else with content)
inspect('Empty state pattern', `
page Test:
  state items: list[str] = []
  state loading: bool = true
  layout col gap=16 padding=20:
    if loading:
      text "Loading..."
    else:
      if items.length == 0:
        layout col center middle padding=40:
          text "No items yet" size=lg color="#999"
          button "Add Item" style=primary -> addItem()
      else:
        for item in items:
          text item
`);

// 12. Modal with form inside
inspect('Modal with form', `
page Test:
  state name: str = ""
  state email: str = ""
  modal editProfile "Edit Profile" trigger="Edit":
    input name placeholder="Name"
    input email placeholder="Email"
    button "Save" style=primary -> saveProfile()
`);

// 13. Derived with member access
inspect('Derived with member access', `
page Test:
  state user: {name: str, age: int} = {name: "Alice", age: 30}
  derived greeting = "Hello, " + user.name
  derived isAdult = user.age >= 18
  layout col:
    text greeting
    text isAdult ? "Adult" : "Minor"
`);

// 14. Watch with API call
inspect('Watch triggers API', `
page Test:
  state searchQuery: str = ""
  state results: list[str] = []
  watch searchQuery:
    results = await search(searchQuery)
  layout col gap=8:
    input searchQuery placeholder="Search..."
    for result in results:
      text result
`);

// 15. Complex inline action
inspect('Inline arrow in button', `
page Test:
  state items: list[str] = ["a", "b"]
  layout col:
    for item, idx in items:
      layout row gap=8:
        text item
        button "Remove" style=danger -> items = items.filter(i => i != item)
`);

// 16. Multiple modals
inspect('Multiple modals', `
page Test:
  modal settings "Settings" trigger="Settings":
    text "Settings content"
  modal help "Help" trigger="Help":
    text "Help content"
  layout col:
    text "Main content"
`);

// 17. Select with conditional rendering
inspect('Select with conditional content', `
page Test:
  state theme: str = "light"
  layout col gap=16:
    select theme options=["light", "dark", "system"]
    if theme == "dark":
      layout col bg="#333" padding=20 radius=8:
        text "Dark mode" color="#fff"
    else:
      layout col bg="#fff" padding=20 radius=8:
        text "Light mode" color="#333"
`);

// 18. Compound state updates
inspect('Compound state updates', `
page Test:
  state items: list[{id: int, text: str, done: bool}] = [{id: 1, text: "Hello", done: false}]
  fn toggleItem(id):
    items = items.map(i => i.id == id ? {...i, done: !i.done} : i)
  fn removeItem(id):
    items = items.filter(i => i.id != id)
  layout col:
    for item in items:
      layout row gap=8 center:
        toggle item.done
        text item.text strike={item.done}
        button "X" style=danger -> removeItem(item.id)
`);

// 19. Hero section with gradient and CTA
inspect('Hero with CTA buttons', `
page Landing:
  layout col:
    layout col gradient="from #667eea to #764ba2" padding=80 center middle:
      text "Build Faster" bold size=3xl color="#fff" center
      text "The fastest way to build apps" size=lg color="#ffffffcc" center
      layout row gap=12:
        button "Get Started" style=primary -> navigate("/signup")
        button "Learn More" -> navigate("/docs")
`);

// 20. Table with data
inspect('Table with columns', `
page Test:
  state users: list[{name: str, email: str, role: str}] = []
  layout col padding=20:
    text "Users" bold size=xl
    table users:
      col "Name" field=name
      col "Email" field=email
      col "Role" field=role
      col actions: edit, delete
`);

// 21. Drawer component
inspect('Drawer sidebar', `
page Test:
  drawer sidebar "Menu":
    text "Menu Item 1"
    text "Menu Item 2"
    text "Menu Item 3"
  layout col:
    button "Open Menu" -> showSidebar = true
    text "Main content"
`);

// 22. Store pattern
inspect('Store declaration', `
page Test:
  store cart:
    items: list[{name: str, price: float}] = []
    total: float = 0
  layout col:
    text "Cart total: {cart.total}"
`);

// 23. API declaration
inspect('API endpoint', `
page Test:
  state posts: list[str] = []
  api fetchPosts:
    url: "/api/posts"
    method: GET
  on mount:
    posts = await fetchPosts()
  layout col:
    for post in posts:
      text post
`);

// 24. Checkbox list pattern
inspect('Checkbox list', `
page Test:
  state options: list[{label: str, checked: bool}] = [{label: "A", checked: false}, {label: "B", checked: true}]
  layout col gap=8:
    for opt in options:
      layout row gap=8 center:
        toggle opt.checked
        text opt.label
`);

// 25. Responsive-ish layout with scroll
inspect('Scrollable layout', `
page Test:
  state messages: list[str] = []
  state input: str = ""
  fn send():
    messages.push(input)
    input = ""
  layout col height="100vh":
    layout col grow=1 scroll=y:
      for msg in messages:
        text msg
    layout row gap=8 padding=12:
      input input placeholder="Type..." grow=1
      button "Send" style=primary -> send()
`);
