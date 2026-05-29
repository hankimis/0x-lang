// Deep debugging tests - finds edge cases in code generation
import { compile } from './dist/index.js';

let total = 0, pass = 0, fail = 0;
const failures = [];

function check(label, code, framework, test) {
  total++;
  try {
    const result = compile(code, { target: framework, validate: false });
    const output = result.code;
    const ok = test(output);
    if (ok) {
      pass++;
    } else {
      fail++;
      failures.push({ label, framework, output: output.substring(0, 500) });
    }
  } catch (e) {
    fail++;
    failures.push({ label, framework, error: e.message.substring(0, 200) });
  }
}

// ==========================================
// 1. Image with round and radius props
// ==========================================
check('Image round prop - React', `
page Test:
  layout col:
    image "avatar.jpg" round
`, 'react', out => out.includes('borderRadius') && out.includes('50%'));

check('Image radius prop - React', `
page Test:
  layout col:
    image "avatar.jpg" radius=12
`, 'react', out => out.includes('borderRadius') && out.includes('12px'));

check('Image size prop - React', `
page Test:
  layout col:
    image "avatar.jpg" size=64
`, 'react', out => out.includes('width') && out.includes('64px') && out.includes('height'));

// ==========================================
// 2. String with special characters in text
// ==========================================
check('Text with apostrophe', `
page Test:
  layout col:
    text "It's a test"
`, 'react', out => out.includes("It's a test") || out.includes("It\\'s a test"));

check('Text with double quotes', `
page Test:
  layout col:
    text 'He said "hello"'
`, 'react', out => out.includes('He said') && out.includes('hello'));

// ==========================================
// 3. Nested ternary
// ==========================================
check('Nested ternary in text - React', `
page Test:
  state status: string = "loading"
  layout col:
    text status == "loading" ? "Loading..." : status == "error" ? "Error!" : "Done"
`, 'react', out => out.includes('Loading...') && out.includes('Error!') && out.includes('Done'));

// ==========================================
// 4. Complex derived with chain
// ==========================================
check('Derived with method chain - React', `
page Test:
  state items: list = [1, 2, 3, 4, 5]
  derived evens = items.filter((x) => x % 2 == 0)
  derived evenCount = evens.length
  layout col:
    text "Even count: " + evenCount
`, 'react', out => out.includes('useMemo') && out.includes('filter') && out.includes('evens.length'));

// ==========================================
// 5. Button with complex action
// ==========================================
check('Button with multiple statement action - React', `
page Test:
  state count: number = 0
  state log: string = ""
  fn increment():
    count = count + 1
    log = "incremented"
  layout col:
    button "Click" -> increment()
    text count
`, 'react', out => out.includes('setCount') && out.includes('setLog'));

// ==========================================
// 6. For loop with object items
// ==========================================
check('For loop with object items - React key', `
page Test:
  state users: list = [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]
  layout col:
    for user in users:
      text user.name
`, 'react', out => out.includes('key={user.id'));

check('For loop with primitive items - React key', `
page Test:
  state tags: list = ["react", "vue", "svelte"]
  layout col:
    for tag in tags:
      text tag
`, 'react', out => {
  // Should not produce undefined key for primitives
  return out.includes('.map(') && !out.includes('key={undefined');
});

check('For loop with index - React key uses index', `
page Test:
  state items: list = ["a", "b", "c"]
  layout col:
    for item, idx in items:
      text idx + ": " + item
`, 'react', out => out.includes('key={') && out.includes('idx'));

// ==========================================
// 7. If/elif/else blocks
// ==========================================
check('If/elif/else - React', `
page Test:
  state status: string = "idle"
  layout col:
    if status == "loading":
      text "Loading..."
    elif status == "error":
      text "Error occurred"
    elif status == "success":
      text "Success!"
    else:
      text "Idle"
`, 'react', out => {
  const hasLoading = out.includes('Loading...');
  const hasError = out.includes('Error occurred');
  const hasSuccess = out.includes('Success!');
  const hasIdle = out.includes('Idle');
  return hasLoading && hasError && hasSuccess && hasIdle;
});

check('If/elif/else - Vue', `
page Test:
  state status: string = "idle"
  layout col:
    if status == "loading":
      text "Loading..."
    elif status == "error":
      text "Error occurred"
    else:
      text "Idle"
`, 'vue', out => out.includes('v-if') && out.includes('v-else-if') && out.includes('v-else'));

check('If/elif/else - Svelte', `
page Test:
  state status: string = "idle"
  layout col:
    if status == "loading":
      text "Loading..."
    elif status == "error":
      text "Error occurred"
    else:
      text "Idle"
`, 'svelte', out => out.includes('{#if') && out.includes('{:else if') && out.includes('{:else}'));

// ==========================================
// 8. Show/Hide blocks
// ==========================================
check('Show block - React', `
page Test:
  state visible: boolean = true
  layout col:
    show visible:
      text "Visible content"
`, 'react', out => out.includes('visible') && out.includes('Visible content'));

check('Hide block - React', `
page Test:
  state hidden: boolean = false
  layout col:
    hide hidden:
      text "Shown when not hidden"
`, 'react', out => out.includes('hidden') && out.includes('Shown when not hidden'));

// ==========================================
// 9. Watch with multiple statements
// ==========================================
check('Watch block - React', `
page Test:
  state query: string = ""
  state results: list = []
  watch query:
    results = searchApi(query)
  layout col:
    input query placeholder="Search"
`, 'react', out => out.includes('useEffect') && out.includes('query'));

check('Watch block - Vue', `
page Test:
  state query: string = ""
  state results: list = []
  watch query:
    results = searchApi(query)
  layout col:
    input query placeholder="Search"
`, 'vue', out => out.includes('watch(query'));

check('Watch block - Svelte', `
page Test:
  state query: string = ""
  state results: list = []
  watch query:
    results = searchApi(query)
  layout col:
    input query placeholder="Search"
`, 'svelte', out => out.includes('$effect'));

// ==========================================
// 10. Multiple state mutations in one function
// ==========================================
check('Multiple state mutations - React', `
page Test:
  state firstName: string = ""
  state lastName: string = ""
  state fullName: string = ""
  fn updateName():
    fullName = firstName + " " + lastName
  layout col:
    input firstName placeholder="First"
    input lastName placeholder="Last"
    button "Update" -> updateName()
    text fullName
`, 'react', out => {
  return out.includes('setFirstName') && out.includes('setLastName') && out.includes('setFullName');
});

// ==========================================
// 11. Nested layout
// ==========================================
check('Nested layouts - React', `
page Test:
  layout col:
    layout row:
      text "Left"
      text "Right"
    layout row:
      text "Bottom Left"
      text "Bottom Right"
`, 'react', out => {
  return out.includes("flexDirection: 'column'") && out.includes("flexDirection: 'row'");
});

// ==========================================
// 12. Store declaration
// ==========================================
check('Store persistence - React', `
page Test:
  store theme: string = "light"
  layout col:
    text theme
    button "Toggle" -> theme = theme == "light" ? "dark" : "light"
`, 'react', out => out.includes('localStorage') || out.includes('theme'));

// ==========================================
// 13. Component with props
// ==========================================
check('Component with multiple props - React', `
component Card:
  prop title: string = "Default"
  prop color: string = "blue"
  prop size: number = 16
  layout col:
    text title size=size color=color
`, 'react', out => {
  return out.includes('title') && out.includes('color') && out.includes('size');
});

check('Component with props - Vue', `
component Card:
  prop title: string = "Default"
  prop color: string = "blue"
  layout col:
    text title
`, 'vue', out => out.includes('defineProps'));

check('Component with props - Svelte', `
component Card:
  prop title: string = "Default"
  prop color: string = "blue"
  layout col:
    text title
`, 'svelte', out => out.includes('$props()'));

// ==========================================
// 14. Async function
// ==========================================
check('Async function - React', `
page Test:
  state data: list = []
  async fn fetchData():
    data = await fetch("/api/data").json()
  on mount:
    fetchData()
  layout col:
    text "Data loaded"
`, 'react', out => out.includes('async') && out.includes('await') && out.includes('useEffect'));

// ==========================================
// 15. Multiple components
// ==========================================
check('Multiple components in file - React', `
component Header:
  layout row:
    text "Header"

component Footer:
  layout row:
    text "Footer"
`, 'react', out => {
  return out.includes('function Header') && out.includes('function Footer');
});

// ==========================================
// 16. Select element
// ==========================================
check('Select element - React', `
page Test:
  state color: string = "red"
  layout col:
    select color options=["red", "green", "blue"]
    text "Selected: " + color
`, 'react', out => out.includes('<select') && out.includes('onChange'));

check('Select element - Vue', `
page Test:
  state color: string = "red"
  layout col:
    select color options=["red", "green", "blue"]
    text "Selected: " + color
`, 'vue', out => out.includes('<select') && out.includes('v-model'));

// ==========================================
// 17. Toggle element
// ==========================================
check('Toggle element - React', `
page Test:
  state darkMode: boolean = false
  layout col:
    toggle darkMode
    text darkMode ? "Dark" : "Light"
`, 'react', out => out.includes('type="checkbox"') && out.includes('checked'));

// ==========================================
// 18. Link element
// ==========================================
check('Link element - React', `
page Test:
  layout col:
    link "Google" href="https://google.com"
`, 'react', out => out.includes('<a') && out.includes('href') && out.includes('Google'));

// ==========================================
// 19. Layout with style props
// ==========================================
check('Layout with gap, padding, bg - React', `
page Test:
  layout col gap=16 padding=24 bg="#f0f0f0":
    text "Styled layout"
`, 'react', out => out.includes('gap') && out.includes('padding') && out.includes('backgroundColor'));

check('Layout with shadow - React', `
page Test:
  layout col shadow="md":
    text "Shadow box"
`, 'react', out => out.includes('boxShadow'));

check('Layout with gradient - React', `
page Test:
  layout col gradient="from #667eea to #764ba2":
    text "Gradient"
`, 'react', out => out.includes('linear-gradient'));

// ==========================================
// 20. Array state mutations
// ==========================================
check('Array push mutation - React', `
page Test:
  state items: list = []
  fn addItem():
    items.push("new")
  layout col:
    button "Add" -> addItem()
`, 'react', out => {
  // Should use setItems with spread, not direct push
  return out.includes('setItems') && !out.includes('items.push');
});

check('Array splice/remove - React', `
page Test:
  state items: list = ["a", "b", "c"]
  fn removeFirst():
    items.splice(0, 1)
  layout col:
    button "Remove" -> removeFirst()
`, 'react', out => out.includes('setItems'));

// ==========================================
// 21. Object state with nested mutation
// ==========================================
check('Object nested mutation - React', `
page Test:
  state user: object = {name: "Alice", address: {city: "NYC"}}
  fn updateCity():
    user.address.city = "LA"
  layout col:
    text user.address.city
    button "Move" -> updateCity()
`, 'react', out => {
  // Should use spread-based immutable update
  return out.includes('setUser') && out.includes('prev');
});

// ==========================================
// 22. Template string expressions
// ==========================================
check('Template string in text - React', `
page Test:
  state name: string = "World"
  layout col:
    text \`Hello \${name}!\`
`, 'react', out => out.includes('Hello') && out.includes('name'));

// ==========================================
// 23. On mount and on destroy together
// ==========================================
check('Mount and destroy lifecycle - React', `
page Test:
  state timer: number = 0
  on mount:
    timer = setInterval(() => tick(), 1000)
  on destroy:
    clearInterval(timer)
  layout col:
    text "Timer running"
`, 'react', out => {
  const hasMount = out.includes('useEffect');
  const hasCleanup = out.includes('clearInterval');
  return hasMount && hasCleanup;
});

check('Mount and destroy - Vue', `
page Test:
  state timer: number = 0
  on mount:
    timer = setInterval(() => tick(), 1000)
  on destroy:
    clearInterval(timer)
  layout col:
    text "Timer running"
`, 'vue', out => out.includes('onMounted') && out.includes('onUnmounted'));

check('Mount and destroy - Svelte', `
page Test:
  state timer: number = 0
  on mount:
    timer = setInterval(() => tick(), 1000)
  on destroy:
    clearInterval(timer)
  layout col:
    text "Timer running"
`, 'svelte', out => out.includes('onMount') && out.includes('clearInterval'));

// ==========================================
// 24. Derived from derived
// ==========================================
check('Derived from derived - React', `
page Test:
  state items: list = [1, 2, 3, 4, 5]
  derived filtered = items.filter((x) => x > 2)
  derived count = filtered.length
  derived doubled = count * 2
  layout col:
    text "Doubled: " + doubled
`, 'react', out => {
  // All should be useMemo
  const memoCount = (out.match(/useMemo/g) || []).length;
  return memoCount >= 3;
});

// ==========================================
// 25. Button with inline state assignment
// ==========================================
check('Button inline assignment - React', `
page Test:
  state count: number = 0
  layout col:
    button "Reset" -> count = 0
    button "Set 10" -> count = 10
    text count
`, 'react', out => out.includes('setCount(0)') && out.includes('setCount(10)'));

check('Button inline assignment - Vue', `
page Test:
  state count: number = 0
  layout col:
    button "Reset" -> count = 0
    text count
`, 'vue', out => out.includes('count = 0'));

check('Button inline assignment - Svelte', `
page Test:
  state count: number = 0
  layout col:
    button "Reset" -> count = 0
    text count
`, 'svelte', out => out.includes('count = 0'));

// ==========================================
// 26. Conditional rendering with &&
// ==========================================
check('If block with single branch - React', `
page Test:
  state showMsg: boolean = true
  layout col:
    if showMsg:
      text "Hello"
`, 'react', out => out.includes('showMsg') && out.includes('Hello'));

// ==========================================
// 27. Form element
// ==========================================
check('Form declaration - React', `
page Test:
  form loginForm:
    field username: string
      label "Username"
      required "Username is required"
    field password: string
      label "Password"
      required "Password is required"
    submit "Login" -> handleLogin()
  fn handleLogin():
    data = 1
  layout col:
    text "Login page"
`, 'react', out => out.includes('loginForm') || out.includes('username'));

check('Form declaration with colon syntax - React', `
page Test:
  form myForm:
    field email: string
      label: "Email"
      required: "Email is required"
    submit "Save" -> save()
  fn save():
    data = 1
  layout col:
    text "Form"
`, 'react', out => out.includes('myForm') || out.includes('email'));

// ==========================================
// 28. Table element
// ==========================================
check('Table with columns - React', `
page Test:
  state users: list = []
  layout col:
    table users:
      col "Name" field=name
      col "Email" field=email
      col "Age" field=age sortable
`, 'react', out => out.includes('<table') || out.includes('<thead') || out.includes('Name'));

// ==========================================
// 29. Style declaration
// ==========================================
check('Named style - React', `
page Test:
  style card:
    padding: 16
    radius: 8
    bg: "#fff"
  layout col .card:
    text "Styled card"
`, 'react', out => out.includes('padding') && out.includes('borderRadius'));

// ==========================================
// 30. Api declaration
// ==========================================
check('API declaration - React', `
page Test:
  api getUsers = GET "/api/users"
  state users: list = []
  on mount:
    users = await getUsers()
  layout col:
    text "Users loaded"
`, 'react', out => out.includes('getUsers') || out.includes('/api/users'));

// ==========================================
// 31. Complex expression in button action
// ==========================================
check('Button with ternary action - React', `
page Test:
  state active: boolean = false
  layout col:
    button "Toggle" -> active = !active
    text active ? "ON" : "OFF"
`, 'react', out => out.includes('setActive') && out.includes('!active'));

// ==========================================
// 32. Vue v-for key handling
// ==========================================
check('For loop key - Vue', `
page Test:
  state items: list = [{id: 1, name: "A"}, {id: 2, name: "B"}]
  layout col:
    for item in items:
      text item.name
`, 'vue', out => out.includes(':key='));

check('For loop key - Svelte', `
page Test:
  state items: list = [{id: 1, name: "A"}, {id: 2, name: "B"}]
  layout col:
    for item in items:
      text item.name
`, 'svelte', out => out.includes('{#each'));

// ==========================================
// 33. Nested for loops
// ==========================================
check('Nested for loops - React', `
page Test:
  state matrix: list = [[1,2],[3,4]]
  layout col:
    for row in matrix:
      layout row:
        for cell in row:
          text cell
`, 'react', out => {
  const mapCount = (out.match(/\.map\(/g) || []).length;
  return mapCount >= 2;
});

// ==========================================
// 34. Empty state initial values
// ==========================================
check('Empty array state - React', `
page Test:
  state items: list = []
  layout col:
    text "Count: " + items.length
`, 'react', out => out.includes('useState([])'));

check('Empty object state - React', `
page Test:
  state data: object = {}
  layout col:
    text "Has data"
`, 'react', out => out.includes('useState({})'));

// ==========================================
// 35. Text with numeric size
// ==========================================
check('Text with size prop (named size) - React', `
page Test:
  layout col:
    text "Big text" size="2xl"
`, 'react', out => out.includes('fontSize') && out.includes('32px'));

check('Text with pixel size - React', `
page Test:
  layout col:
    text "Custom text" size=20
`, 'react', out => out.includes('fontSize') && out.includes('20px'));

// ==========================================
// 36. Text with color
// ==========================================
check('Text with color - React', `
page Test:
  layout col:
    text "Red text" color="#ff0000"
`, 'react', out => out.includes("color: '#ff0000'") || out.includes('color:'));

// ==========================================
// 37. Input with placeholder
// ==========================================
check('Input with placeholder - React', `
page Test:
  state name: string = ""
  layout col:
    input name placeholder="Enter name"
`, 'react', out => out.includes('placeholder') && out.includes('Enter name'));

check('Input with placeholder - Vue', `
page Test:
  state name: string = ""
  layout col:
    input name placeholder="Enter name"
`, 'vue', out => out.includes('v-model') && out.includes('placeholder'));

check('Input with placeholder - Svelte', `
page Test:
  state name: string = ""
  layout col:
    input name placeholder="Enter name"
`, 'svelte', out => out.includes('bind:value') && out.includes('placeholder'));

// ==========================================
// 38. Function with parameters
// ==========================================
check('Function with parameters - React', `
page Test:
  state result: number = 0
  fn add(a, b):
    result = a + b
  layout col:
    button "Add" -> add(3, 4)
    text result
`, 'react', out => out.includes('add(3, 4)') || out.includes('add('));

// ==========================================
// 39. Function with if/else
// ==========================================
check('Function with control flow - React', `
page Test:
  state msg: string = ""
  fn classify(n):
    if n > 0:
      msg = "positive"
    elif n < 0:
      msg = "negative"
    else:
      msg = "zero"
  layout col:
    button "Check" -> classify(5)
    text msg
`, 'react', out => out.includes('positive') && out.includes('negative') && out.includes('zero'));

// ==========================================
// 40. Function with return value
// ==========================================
check('Function with return - React', `
page Test:
  state result: number = 0
  fn double(n):
    return n * 2
  fn compute():
    result = double(21)
  layout col:
    button "Compute" -> compute()
    text result
`, 'react', out => out.includes('return') && out.includes('n * 2'));

// ==========================================
// 41. Multiple watchers
// ==========================================
check('Multiple watch blocks - React', `
page Test:
  state a: number = 0
  state b: number = 0
  state sum: number = 0
  state product: number = 0
  watch a:
    sum = a + b
  watch b:
    product = a * b
  layout col:
    text sum
    text product
`, 'react', out => {
  const effectCount = (out.match(/useEffect/g) || []).length;
  return effectCount >= 2;
});

// ==========================================
// 42. JS import
// ==========================================
check('JS import statement - React', `
page Test:
  import { formatDate } from "./utils"
  state date: string = formatDate(new Date())
  layout col:
    text date
`, 'react', out => out.includes("import { formatDate }") && out.includes('./utils'));

// ==========================================
// 43. Comment node
// ==========================================
check('Comment in layout - React', `
page Test:
  layout col:
    // This is a comment
    text "Hello"
`, 'react', out => out.includes('comment') || out.includes('Hello'));

// ==========================================
// 44. Increment/decrement operations
// ==========================================
check('Increment via += - React', `
page Test:
  state count: number = 0
  fn increment():
    count += 1
  layout col:
    button "+" -> increment()
    text count
`, 'react', out => out.includes('setCount'));

// ==========================================
// 45. Decrement
// ==========================================
check('Decrement via -= - React', `
page Test:
  state count: number = 10
  fn decrement():
    count -= 1
  layout col:
    button "-" -> decrement()
    text count
`, 'react', out => out.includes('setCount'));

// ==========================================
// 46. Boolean toggle
// ==========================================
check('Boolean toggle - React', `
page Test:
  state isOpen: boolean = false
  layout col:
    button "Toggle" -> isOpen = !isOpen
    if isOpen:
      text "Open!"
`, 'react', out => out.includes('setIsOpen') && out.includes('!isOpen'));

// ==========================================
// 47. Derived readOnly should not double-wrap
// ==========================================
check('Derived readOnly - no setState for filter in derived', `
page Test:
  state items: list = [1, 2, 3, 4, 5]
  derived odds = items.filter((x) => x % 2 != 0)
  layout col:
    text odds.length
`, 'react', out => {
  // derived should use useMemo with filter, NOT setItems
  return out.includes('useMemo') && out.includes('filter') && !out.includes('setItems(prev => prev.filter');
});

// ==========================================
// 48. Complex button action with function call
// ==========================================
check('Button calls async function - React', `
page Test:
  state loading: boolean = false
  async fn save():
    loading = true
    await api.save(data)
    loading = false
  layout col:
    button "Save" -> save()
    text loading ? "Saving..." : "Ready"
`, 'react', out => out.includes('async') && out.includes('setLoading'));

// ==========================================
// 49. Divider element
// ==========================================
check('Divider element - React', `
page Test:
  layout col:
    text "Above"
    divider
    text "Below"
`, 'react', out => out.includes('borderTop') || out.includes('hr') || out.includes('border'));

// ==========================================
// 50. Progress element
// ==========================================
check('Progress element - React', `
page Test:
  state progress: number = 75
  layout col:
    progress progress
`, 'react', out => out.includes('75') || out.includes('progress'));

// ==========================================
// 51. StatsGrid
// ==========================================
check('StatsGrid - React', `
page Test:
  layout col:
    stats 3:
      stat "Users" value=100
      stat "Revenue" value=5000
      stat "Growth" value=12
`, 'react', out => out.includes('Users') && out.includes('Revenue'));

// ==========================================
// 52. Unary not operator
// ==========================================
check('Unary not in condition - React', `
page Test:
  state loading: boolean = false
  layout col:
    if !loading:
      text "Loaded"
`, 'react', out => out.includes('!loading') && out.includes('Loaded'));

// ==========================================
// 53. Binary comparison operators
// ==========================================
check('Greater than comparison - React', `
page Test:
  state count: number = 5
  layout col:
    if count > 0:
      text "Positive"
    if count >= 5:
      text "At least five"
    if count <= 10:
      text "At most ten"
`, 'react', out => out.includes('>') && out.includes('>=') && out.includes('<='));

// ==========================================
// 54. Logical operators
// ==========================================
check('AND/OR operators - React', `
page Test:
  state a: boolean = true
  state b: boolean = false
  layout col:
    if a && b:
      text "Both"
    if a || b:
      text "Either"
`, 'react', out => out.includes('&&') && out.includes('||'));

// ==========================================
// 55. For loop in function
// ==========================================
check('For loop in function body - React', `
page Test:
  state sum: number = 0
  fn calcSum():
    let total = 0
    for item in [1, 2, 3]:
      total = total + item
    sum = total
  layout col:
    button "Calc" -> calcSum()
    text sum
`, 'react', out => out.includes('for') || out.includes('of'));

// ==========================================
// 56. Var decl in function
// ==========================================
check('Var declaration in function - React', `
page Test:
  state result: string = ""
  fn process():
    let x = 10
    let y = 20
    result = x + y
  layout col:
    button "Process" -> process()
    text result
`, 'react', out => out.includes('const x =') || out.includes('let x ='));

// ==========================================
// 57. Vue computed with .value
// ==========================================
check('Vue computed .value in script', `
page Test:
  state items: list = [1, 2, 3]
  derived count = items.length
  fn showCount():
    alert(count)
  layout col:
    button "Show" -> showCount()
    text count
`, 'vue', out => {
  // In template, computed refs are auto-unwrapped
  // In script, they need .value
  return out.includes('computed') && out.includes('count');
});

// ==========================================
// 58. Svelte $derived
// ==========================================
check('Svelte derived with $derived', `
page Test:
  state items: list = [1, 2, 3]
  derived total = items.reduce((a, b) => a + b, 0)
  layout col:
    text total
`, 'svelte', out => out.includes('$derived') && out.includes('reduce'));

// ==========================================
// 59. Input with type prop
// ==========================================
check('Input with type=password - React', `
page Test:
  state pwd: string = ""
  layout col:
    input pwd type="password" placeholder="Password"
`, 'react', out => out.includes('type="password"') || out.includes("type='password'"));

// ==========================================
// 60. Multiple buttons with different actions
// ==========================================
check('Multiple buttons - React', `
page Test:
  state count: number = 0
  layout col:
    layout row:
      button "-" -> count = count - 1
      text count
      button "+" -> count = count + 1
    button "Reset" -> count = 0
`, 'react', out => {
  return out.includes('setCount') && (out.match(/setCount/g) || []).length >= 3;
});

// ==========================================
// 61. Nested state mutation: array inside object
// ==========================================
check('Push to nested array - React', `
page Test:
  state todo: object = {items: [], title: "My List"}
  fn addItem():
    todo.items.push("new item")
  layout col:
    button "Add" -> addItem()
`, 'react', out => {
  // Should generate immutable update
  return out.includes('setTodo') && out.includes('prev');
});

// ==========================================
// 62. Member expression as button action target
// ==========================================
check('State assignment with member - React', `
page Test:
  state config: object = {theme: "light", lang: "en"}
  layout col:
    button "Dark" -> config.theme = "dark"
    text config.theme
`, 'react', out => out.includes('setConfig'));

// ==========================================
// 63. Type declaration (should not crash)
// ==========================================
check('Type declaration - React', `
page Test:
  type Status = "loading" | "error" | "success"
  state status: Status = "loading"
  layout col:
    text status
`, 'react', out => out.includes('status'));

// ==========================================
// 64. Async watch
// ==========================================
check('Async watch - React', `
page Test:
  state query: string = ""
  state results: list = []
  watch query:
    results = await searchApi(query)
  layout col:
    input query
`, 'react', out => out.includes('useEffect') && out.includes('async'));

// ==========================================
// 65. Text with gradient style
// ==========================================
check('Text gradient - React', `
page Test:
  layout col:
    text "Gradient text" gradient="from #667eea to #764ba2"
`, 'react', out => out.includes('linear-gradient') || out.includes('gradient'));

// ==========================================
// 66. Check (assertion) declaration
// ==========================================
check('Check declaration', `
page Test:
  state age: number = 25
  check age >= 0 "Age must be non-negative"
  layout col:
    text age
`, 'react', out => out.includes('age') && out.includes('non-negative'));

// ==========================================
// 67. Vue state with .value in functions
// ==========================================
check('Vue state .value in function body', `
page Test:
  state count: number = 0
  fn increment():
    count = count + 1
  layout col:
    button "+" -> increment()
    text count
`, 'vue', out => {
  // In <script setup>, should use count.value
  return out.includes('count.value');
});

// ==========================================
// 68. Svelte onclick (not onClick)
// ==========================================
check('Svelte uses lowercase onclick', `
page Test:
  state count: number = 0
  layout col:
    button "Click" -> count = count + 1
`, 'svelte', out => out.includes('onclick') && !out.includes('onClick'));

// ==========================================
// 69. React uses onClick (camelCase)
// ==========================================
check('React uses camelCase onClick', `
page Test:
  state count: number = 0
  layout col:
    button "Click" -> count = count + 1
`, 'react', out => out.includes('onClick') && !out.includes('onclick'));

// ==========================================
// 70. Vue uses @click
// ==========================================
check('Vue uses @click', `
page Test:
  state count: number = 0
  layout col:
    button "Click" -> count = count + 1
`, 'vue', out => out.includes('@click'));

// ==========================================
// 71. Modal component
// ==========================================
check('Modal - React', `
page Test:
  layout col:
    modal settings "Settings" trigger="Open Settings":
      text "Settings content"
      button "Save" -> close()
`, 'react', out => out.includes('Settings') && out.includes('useState') && out.includes('showSettings'));

check('Modal - Vue', `
page Test:
  layout col:
    modal settings "Settings" trigger="Open Settings":
      text "Settings content"
`, 'vue', out => out.includes('showSettings') && out.includes('Teleport'));

// ==========================================
// 72. Drawer component
// ==========================================
check('Drawer - React', `
page Test:
  layout col:
    drawer myDrawer:
      text "Drawer content"
`, 'react', out => out.includes('Drawer') || out.includes('drawer') || out.includes('showMyDrawer'));

// ==========================================
// 73. Grid layout
// ==========================================
check('Grid layout - React', `
page Test:
  layout grid:
    text "A"
    text "B"
    text "C"
    text "D"
`, 'react', out => out.includes('grid'));

// ==========================================
// 74. Stack layout
// ==========================================
check('Stack layout - React', `
page Test:
  layout stack:
    text "Bottom"
    text "Top"
`, 'react', out => out.includes('position') || out.includes('stack'));

// ==========================================
// 75. Derived equality check
// ==========================================
check('Derived with == comparison', `
page Test:
  state a: number = 5
  state b: number = 5
  derived isEqual = a == b
  layout col:
    text isEqual ? "Equal" : "Not equal"
`, 'react', out => out.includes('useMemo') && out.includes('=='));

// ==========================================
// 76. Complex template string in text
// ==========================================
check('Template with member access', `
page Test:
  state user: object = {name: "Test", score: 100}
  layout col:
    text \`User: \${user.name}, Score: \${user.score}\`
`, 'react', out => out.includes('user.name') && out.includes('user.score'));

// ==========================================
// 77. Button with disabled prop
// ==========================================
check('Button with disabled prop - React', `
page Test:
  state loading: boolean = false
  layout col:
    button "Submit" -> save() disabled=loading
`, 'react', out => out.includes('disabled'));

// ==========================================
// 78. Input with type=number
// ==========================================
check('Input type number - React', `
page Test:
  state age: number = 25
  layout col:
    input age type="number" placeholder="Age"
`, 'react', out => out.includes('type="number"') || out.includes("type='number'"));

// ==========================================
// 79. Multiple for loops side by side
// ==========================================
check('Multiple for loops - React', `
page Test:
  state fruits: list = ["apple", "banana"]
  state vegs: list = ["carrot", "pea"]
  layout col:
    for f in fruits:
      text f
    for v in vegs:
      text v
`, 'react', out => {
  const mapCount = (out.match(/\.map\(/g) || []).length;
  return mapCount >= 2;
});

// ==========================================
// 80. Expression with method call in text
// ==========================================
check('Method call in text - React', `
page Test:
  state name: string = "hello world"
  layout col:
    text name.toUpperCase()
`, 'react', out => out.includes('toUpperCase'));

// ==========================================
// 81. Ternary in button label
// ==========================================
check('Dynamic button label - React', `
page Test:
  state editing: boolean = false
  layout col:
    button {editing ? "Save" : "Edit"} -> editing = !editing
`, 'react', out => out.includes('Save') && out.includes('Edit'));

// ==========================================
// 82. Derived that depends on other derived
// ==========================================
check('Chained derived - Vue', `
page Test:
  state nums: list = [1, 2, 3, 4, 5]
  derived evens = nums.filter((x) => x % 2 == 0)
  derived evenCount = evens.length
  layout col:
    text evenCount
`, 'vue', out => {
  return out.includes('computed') && (out.match(/computed/g) || []).length >= 2;
});

// ==========================================
// 83. Svelte for each with index
// ==========================================
check('For each with index - Svelte', `
page Test:
  state items: list = ["a", "b", "c"]
  layout col:
    for item, idx in items:
      text idx + ": " + item
`, 'svelte', out => out.includes('{#each') && out.includes('as item, idx'));

// ==========================================
// 84. Use import
// ==========================================
check('Use import - React', `
page Test:
  use myHook from "./hooks"
  layout col:
    text "test"
`, 'react', out => out.includes('myHook') && out.includes('./hooks'));

// ==========================================
// 85. JS block
// ==========================================
check('JS block passthrough (braces)', `
page Test:
  js {
    const helper = (x) => x * 2;
  }
  layout col:
    text "test"
`, 'react', out => out.includes('helper'));

check('JS block passthrough (indented)', `
page Test:
  js:
    const helper = (x) => x * 2
  layout col:
    text "test"
`, 'react', out => out.includes('helper'));

// ==========================================
// 86. Array literal state
// ==========================================
check('Array literal with objects - React', `
page Test:
  state items: list = [{id: 1, text: "Buy milk"}, {id: 2, text: "Walk dog"}]
  layout col:
    for item in items:
      text item.text
`, 'react', out => out.includes('Buy milk') && out.includes('Walk dog'));

// ==========================================
// 87. Numeric state operations
// ==========================================
check('Numeric multiplication - React', `
page Test:
  state price: number = 10
  state quantity: number = 3
  derived total = price * quantity
  layout col:
    text "Total: " + total
`, 'react', out => out.includes('useMemo') && out.includes('price * quantity'));

// ==========================================
// 88. String concatenation in derived
// ==========================================
check('String concat in derived - React', `
page Test:
  state first: string = "John"
  state last: string = "Doe"
  derived fullName = first + " " + last
  layout col:
    text fullName
`, 'react', out => out.includes('useMemo') && out.includes('first') && out.includes('last'));

// ==========================================
// 89. Empty component body
// ==========================================
check('Empty page - React', `
page Empty:
  layout col:
    text "Nothing here"
`, 'react', out => out.includes('function Empty') || out.includes('Nothing here'));

// ==========================================
// 90. Reactive state in Vue computed
// ==========================================
check('Vue computed accesses ref.value', `
page Test:
  state a: number = 5
  state b: number = 10
  derived sum = a + b
  layout col:
    text sum
`, 'vue', out => {
  // computed should use a.value + b.value
  return out.includes('a.value') && out.includes('b.value');
});

// ==========================================
// Print results
// ==========================================
console.log('');
console.log('============================================================');
console.log('DEEP DEBUG RESULTS');
console.log('============================================================');
console.log(`Total: ${total} checks`);
console.log(`Pass:  ${pass}`);
console.log(`Fail:  ${fail}`);
console.log('============================================================');

if (failures.length > 0) {
  console.log('\nFAILURES:');
  console.log('------------------------------------------------------------');
  for (const f of failures) {
    console.log(`\n❌ ${f.label} [${f.framework}]`);
    if (f.error) {
      console.log(`   Error: ${f.error}`);
    } else {
      console.log(`   Output preview:`);
      console.log(`   ${f.output.replace(/\n/g, '\n   ')}`);
    }
  }
}

if (fail === 0) {
  console.log('\n✅ All deep debug tests passed!');
} else {
  console.log(`\n⚠️  ${fail} test(s) need attention`);
}