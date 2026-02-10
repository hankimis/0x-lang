// debug-inspect4.mjs — Round 4: Deeper inspection for untested features
import { compile } from './dist/index.js';

let pass = 0, fail = 0;
const errors = [];

function inspect(name, code) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(70));
  for (const target of ['react', 'vue', 'svelte']) {
    try {
      const result = compile(code.trim(), { target, validate: false });
      console.log(`\n--- ${target.toUpperCase()} ---`);
      console.log(result.code);
      pass++;
    } catch (e) {
      console.log(`\n--- ${target.toUpperCase()} ERROR ---`);
      console.log(e.message);
      fail++;
      errors.push({ name, target, error: e.message });
    }
  }
}

// 1. Derived state (computed)
inspect('Derived state', `
page Test:
  state items: list[str] = ["a", "b", "c"]
  derived count = items.length
  layout col:
    text "Count: {count}"
`);

// 2. Multiple derived values
inspect('Multiple derived', `
page Test:
  state price: int = 100
  state qty: int = 2
  derived total = price * qty
  derived tax = total * 0.1
  derived grandTotal = total + tax
  layout col:
    text "Total: {grandTotal}"
`);

// 3. OnMount lifecycle
inspect('OnMount lifecycle', `
page Test:
  state data: list[str] = []
  on mount:
    data = await fetchData()
  layout col:
    for item in data:
      text item
`);

// 4. OnDestroy lifecycle
inspect('OnDestroy lifecycle', `
page Test:
  state timer: int = 0
  on mount:
    timer = setInterval(tick, 1000)
  on destroy:
    clearInterval(timer)
  layout col:
    text "Timer active"
`);

// 5. Show/hide blocks
inspect('Show and hide blocks', `
page Test:
  state visible: bool = true
  layout col:
    button "Toggle" -> visible = !visible
    show visible:
      text "I am shown"
    hide visible:
      text "I am hidden when visible is true"
`);

// 6. Form with validation
inspect('Form validation', `
page Test:
  state email: str = ""
  state password: str = ""
  fn handleSubmit():
    login(email, password)
  layout col:
    form handleSubmit:
      input email placeholder="Email" required
      input password type="password" required min=8
      button "Login" type="submit"
`);

// 7. Data loading with states
inspect('Data loading states', `
page Test:
  data users = fetchUsers()
    loading:
      text "Loading..."
    error:
      text "Failed to load"
    empty:
      text "No users found"
  layout col:
    for user in users:
      text user.name
`);

// 8. Store (global state)
inspect('Store declaration', `
page Test:
  store auth:
    user: str = ""
    token: str = ""
  layout col:
    text "User: {auth.user}"
`);

// 9. API declaration
inspect('API declaration', `
page Test:
  api userApi:
    get "/users" -> fetchUsers
    post "/users" -> createUser
    delete "/users/{id}" -> deleteUser
  state users: list = []
  layout col:
    button "Load" -> users = await userApi.fetchUsers()
`);

// 10. Chart component
inspect('Bar chart', `
page Test:
  state data: list[int] = [10, 20, 30, 40]
  layout col:
    chart bar data=data
`);

// 11. Pie chart
inspect('Pie chart', `
page Test:
  state data: list[int] = [30, 20, 50]
  state labels: list[str] = ["A", "B", "C"]
  layout col:
    chart pie data=data labels=labels
`);

// 12. Upload component
inspect('File upload', `
page Test:
  state file: str = ""
  fn handleUpload(f):
    file = f
  layout col:
    upload handleUpload accept="image/*" max=5mb
    text "File: {file}"
`);

// 13. Stat card
inspect('Stat card', `
page Test:
  state revenue: int = 50000
  state change: int = 12
  layout col:
    stat "Revenue" value=revenue change=change icon="dollar"
`);

// 14. Breadcrumb
inspect('Breadcrumb navigation', `
page Test:
  layout col:
    breadcrumb:
      "Home" -> "/"
      "Products" -> "/products"
      "Detail"
`);

// 15. Hero section
inspect('Hero section', `
page Landing:
  layout col:
    hero:
      text "Welcome" size=3xl bold
      text "Build faster with 0x" size=lg
      button "Get Started" style=primary size=lg
`);

// 16. Pricing section
inspect('Pricing section', `
page Landing:
  layout col:
    pricing:
      plan "Free":
        price "$0/mo"
        feature "1 project"
        feature "Basic support"
        button "Start Free"
      plan "Pro" highlight:
        price "$19/mo"
        feature "Unlimited projects"
        feature "Priority support"
        button "Subscribe"
`);

// 17. FAQ section
inspect('FAQ section', `
page Landing:
  layout col:
    faq:
      q "What is 0x?":
        a "A language that compiles to React, Vue, and Svelte"
      q "Is it free?":
        a "Yes, it is open source"
`);

// 18. Testimonial section
inspect('Testimonials', `
page Landing:
  layout col:
    testimonial:
      review "Amazing tool!" by "John Doe" role="Developer"
      review "Saves so much time" by "Jane Smith" role="Designer"
`);

// 19. Footer section
inspect('Footer section', `
page Landing:
  layout col:
    footer:
      col "Product":
        link "Features" href="/features"
        link "Pricing" href="/pricing"
      col "Company":
        link "About" href="/about"
        link "Blog" href="/blog"
`);

// 20. Confirm dialog
inspect('Confirm dialog', `
page Test:
  state showConfirm: bool = false
  fn handleDelete():
    showConfirm = true
  layout col:
    button "Delete" -> handleDelete()
    confirm showConfirm message="Are you sure?" onConfirm=deleteItem
`);

// 21. Slider over / side panel
inspect('SlideOver panel', `
page Test:
  state showPanel: bool = false
  layout col:
    button "Open" -> showPanel = true
    slideover showPanel title="Details":
      text "Panel content here"
`);

// 22. Responsive layout
inspect('Responsive block', `
page Test:
  layout col:
    responsive mobile show:
      text "Mobile view"
    responsive desktop show:
      text "Desktop view"
`);

// 23. Animate enter
inspect('Animation enter', `
page Test:
  layout col:
    animate enter fade:
      text "Fading in"
`);

// 24. Error boundary
inspect('Error boundary', `
page Test:
  layout col:
    error boundary:
      text "Content that might error"
    error fallback:
      text "Something went wrong"
`);

// 25. Loading skeleton
inspect('Loading skeleton', `
page Test:
  state loading: bool = true
  layout col:
    loading skeleton:
      text "placeholder"
`);

// 26. Tabs component
inspect('Tabs', `
page Test:
  state activeTab: str = "home"
  layout col:
    tabs activeTab:
      tab "Home":
        text "Home content"
      tab "Settings":
        text "Settings content"
`);

// 27. Accordion
inspect('Accordion', `
page Test:
  layout col:
    accordion:
      panel "Section 1":
        text "Content 1"
      panel "Section 2":
        text "Content 2"
`);

// 28. Badge/tag component
inspect('Badge on text', `
page Test:
  state count: int = 5
  layout col:
    text "Messages" badge=count
`);

// 29. Tooltip
inspect('Tooltip', `
page Test:
  layout col:
    text "Hover me" tooltip="More info here"
`);

// 30. Progress bar
inspect('Progress bar', `
page Test:
  state progress: int = 75
  layout col:
    progress value=progress max=100
    text "{progress}%"
`);

// 31. Avatar component
inspect('Avatar', `
page Test:
  state user: {name: str, avatar: str} = {name: "John", avatar: "pic.jpg"}
  layout col:
    image user.avatar round size=40
    text user.name
`);

// 32. Divider/separator
inspect('Divider', `
page Test:
  layout col:
    text "Section 1"
    divider
    text "Section 2"
`);

// 33. Complex event with prevent/stop
inspect('Event modifiers', `
page Test:
  state value: str = ""
  fn handleSubmit():
    save(value)
  layout col:
    form handleSubmit:
      input value
      button "Save" type="submit"
`);

// 34. State with complex object type
inspect('Complex state types', `
page Test:
  state user: {name: str, age: int, emails: list[str]} = {name: "Jo", age: 25, emails: []}
  fn addEmail(email: str):
    user.emails.push(email)
  layout col:
    text "Name: {user.name}"
    text "Age: {user.age}"
`);

// 35. Multiple pages (component)
inspect('Component with props', `
component Card(title: str, body: str):
  layout col padding=16 radius=8 shadow=md:
    text title bold size=lg
    text body color="#666"
`);

console.log(`\n${'='.repeat(70)}`);
console.log(`  RESULTS: ${pass} pass, ${fail} fail`);
console.log('='.repeat(70));
if (errors.length > 0) {
  console.log('\nFailed scenarios:');
  for (const e of errors) {
    console.log(`  - [${e.target}] ${e.name}: ${e.error.substring(0, 100)}`);
  }
}
