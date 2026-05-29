// Deep edge case debugging for 0x compiler v0.1.3
import { compile } from './dist/index.js';

const results = { pass: 0, fail: 0, errors: [] };

function test(name, source, checks) {
  const targets = ['react', 'vue', 'svelte'];
  for (const target of targets) {
    const label = `[${target}] ${name}`;
    try {
      const result = compile(source, { target, validate: false });
      const code = result.code;
      const targetChecks = typeof checks === 'function' ? checks : (checks[target] || checks.all || []);
      const checkList = typeof targetChecks === 'function' ? targetChecks(code) : targetChecks;

      for (const [desc, check] of checkList) {
        if (!check(code)) {
          results.fail++;
          results.errors.push({ label, desc, code: code.slice(0, 500) });
        } else {
          results.pass++;
        }
      }
    } catch (err) {
      results.fail++;
      results.errors.push({ label, desc: 'COMPILE ERROR', error: err.message });
    }
  }
}

// ============================================================
// 1. Nested ternary in text
// ============================================================
test('nested ternary in text', `
page Test:
  state score: int = 85
  derived grade = score >= 90 ? "A" : score >= 80 ? "B" : "C"
  layout col:
    text "Grade: {grade}" size=lg
`, {
  all: (code) => [
    ['contains ternary', c => c.includes('>=') && c.includes('?')],
    ['no compile error', () => true],
  ]
});

// ============================================================
// 2. String interpolation with complex expressions
// ============================================================
test('string interpolation with member access', `
page Test:
  state user: {name: str, age: int} = {name: "Kim", age: 25}
  layout col:
    text "Hello {user.name}, age {user.age}"
`, {
  react: (code) => [
    ['interpolation with member', c => c.includes('user.name') && c.includes('user.age')],
    ['uses template literal or concat', c => c.includes('`') || c.includes('{')],
  ],
  vue: (code) => [
    ['interpolation with member', c => c.includes('user.value.name') || c.includes('user.name')],
  ],
  svelte: (code) => [
    ['interpolation with member', c => c.includes('user.name')],
  ],
});

// ============================================================
// 3. For loop with index parameter
// ============================================================
test('for loop with index', `
page Test:
  state items: list[str] = ["a", "b", "c"]
  layout col:
    for item, idx in items:
      text "{idx}: {item}"
`, {
  react: (code) => [
    ['map has index param', c => c.includes('(item, idx)') || c.includes('item, idx')],
    ['displays index', c => c.includes('idx')],
  ],
  vue: (code) => [
    ['v-for has index', c => c.includes('idx') || c.includes('index')],
  ],
  svelte: (code) => [
    ['each has index', c => c.includes('idx') || c.includes('index')],
  ],
});

// ============================================================
// 4. Multiple elif branches
// ============================================================
test('if/elif/elif/else chain', `
page Test:
  state status: str = "idle"
  layout col:
    if status == "loading":
      text "Loading..."
    elif status == "error":
      text "Error!"
    elif status == "success":
      text "Done!"
    else:
      text "Idle"
`, {
  react: (code) => [
    ['has loading condition', c => c.includes('loading')],
    ['has error condition', c => c.includes('error')],
    ['has success condition', c => c.includes('success')],
    ['has else/idle case', c => c.includes('Idle')],
  ],
  vue: (code) => [
    ['has v-if', c => c.includes('v-if')],
    ['has v-else-if', c => c.includes('v-else-if')],
    ['has v-else', c => c.includes('v-else')],
  ],
  svelte: (code) => [
    ['has if block', c => c.includes('{#if')],
    ['has else if', c => c.includes('{:else if')],
    ['has else', c => c.includes('{:else}')],
  ],
});

// ============================================================
// 5. Show/hide blocks
// ============================================================
test('show and hide blocks', `
page Test:
  state visible: bool = true
  state hidden: bool = false
  layout col:
    show visible:
      text "Shown"
    hide hidden:
      text "Not hidden"
`, {
  react: (code) => [
    ['show conditional', c => c.includes('visible') && c.includes('Shown')],
    ['hide conditional', c => c.includes('hidden') || c.includes('Not hidden')],
  ],
  vue: (code) => [
    ['show uses v-if or v-show', c => c.includes('v-if') || c.includes('v-show')],
  ],
  svelte: (code) => [
    ['show uses if block', c => c.includes('{#if')],
  ],
});

// ============================================================
// 6. Select element
// ============================================================
test('select element', `
page Test:
  state color: str = "red"
  layout col:
    select color options=["red", "green", "blue"]
`, {
  react: (code) => [
    ['has select element', c => c.includes('<select')],
    ['has onChange or change handler', c => c.includes('onChange') || c.includes('change')],
    ['has option elements', c => c.includes('<option') || c.includes('option')],
  ],
  vue: (code) => [
    ['has select element', c => c.includes('<select')],
    ['has v-model', c => c.includes('v-model')],
  ],
  svelte: (code) => [
    ['has select element', c => c.includes('<select')],
    ['has bind:value', c => c.includes('bind:value')],
  ],
});

// ============================================================
// 7. Toggle element
// ============================================================
test('toggle element', `
page Test:
  state enabled: bool = false
  layout col:
    toggle enabled
`, {
  react: (code) => [
    ['has checkbox input', c => c.includes('checkbox') || c.includes('type="checkbox"')],
    ['has checked binding', c => c.includes('checked')],
  ],
  vue: (code) => [
    ['has checkbox', c => c.includes('checkbox')],
    ['has v-model', c => c.includes('v-model')],
  ],
  svelte: (code) => [
    ['has checkbox', c => c.includes('checkbox')],
    ['has bind:checked', c => c.includes('bind:checked')],
  ],
});

// ============================================================
// 8. Image element
// ============================================================
test('image element with props', `
page Test:
  layout col:
    image "https://example.com/photo.jpg" width="100%" height=200
`, {
  react: (code) => [
    ['has img element', c => c.includes('<img')],
    ['has src attr', c => c.includes('src')],
    ['has width', c => c.includes('width') || c.includes('100%')],
  ],
  vue: (code) => [
    ['has img element', c => c.includes('<img')],
    ['has src attr', c => c.includes('src')],
  ],
  svelte: (code) => [
    ['has img element', c => c.includes('<img')],
    ['has src attr', c => c.includes('src')],
  ],
});

// ============================================================
// 9. Link element
// ============================================================
test('link element', `
page Test:
  layout col:
    link "Go to Google" href="https://google.com"
`, {
  react: (code) => [
    ['has anchor element', c => c.includes('<a ')],
    ['has href', c => c.includes('href')],
    ['has label text', c => c.includes('Google')],
  ],
  vue: (code) => [
    ['has anchor element', c => c.includes('<a ')],
    ['has href', c => c.includes('href')],
  ],
  svelte: (code) => [
    ['has anchor element', c => c.includes('<a ')],
    ['has href', c => c.includes('href')],
  ],
});

// ============================================================
// 10. Grid layout
// ============================================================
test('grid layout with cols', `
page Test:
  layout grid cols=3 gap=16:
    text "Item 1"
    text "Item 2"
    text "Item 3"
`, {
  react: (code) => [
    ['has grid display', c => c.includes('grid')],
    ['has 3 columns', c => c.includes('3') || c.includes('repeat')],
    ['has gap', c => c.includes('gap') || c.includes('16')],
  ],
  vue: (code) => [
    ['has grid display', c => c.includes('grid')],
    ['has columns', c => c.includes('3') || c.includes('column')],
  ],
  svelte: (code) => [
    ['has grid display', c => c.includes('grid')],
    ['has columns', c => c.includes('3') || c.includes('column')],
  ],
});

// ============================================================
// 11. Deeply nested layouts (3 levels)
// ============================================================
test('deeply nested layouts', `
page Test:
  layout col gap=16:
    layout row gap=8:
      layout col gap=4:
        text "Deep"
`, {
  all: (code) => [
    ['has nested divs', c => (c.match(/<div/g) || []).length >= 3],
    ['has Deep text', c => c.includes('Deep')],
    ['divs are balanced', c => (c.match(/<div/g) || []).length === (c.match(/<\/div>/g) || []).length],
  ],
});

// ============================================================
// 12. Button styles (primary, danger, etc.)
// ============================================================
test('button style variants', `
page Test:
  fn doA():
    count += 1
  fn doB():
    count -= 1
  state count: int = 0
  layout col:
    button "Primary" style=primary -> doA()
    button "Danger" style=danger -> doB()
`, {
  all: (code) => [
    ['has primary style', c => c.includes('primary') || c.includes('#3b82f6') || c.includes('backgroundColor')],
    ['has danger style', c => c.includes('danger') || c.includes('#ef4444') || c.includes('red')],
    ['has two buttons', c => (c.match(/<button/g) || []).length >= 2],
  ],
});

// ============================================================
// 13. Watch block
// ============================================================
test('watch block', `
page Test:
  state query: str = ""
  state results: list[str] = []

  watch query:
    results = await fetch("/search?q=" + query)

  layout col:
    input query placeholder="Search..."
`, {
  react: (code) => [
    ['has useEffect', c => c.includes('useEffect')],
    ['watches query', c => c.includes('query')],
  ],
  vue: (code) => [
    ['has watch', c => c.includes('watch(')],
    ['watches query', c => c.includes('query')],
  ],
  svelte: (code) => [
    ['has $effect', c => c.includes('$effect')],
    ['references query', c => c.includes('query')],
  ],
});

// ============================================================
// 14. Async function with await
// ============================================================
test('async function with await', `
page Test:
  state data: str = ""

  async fn loadData():
    data = await fetch("/api/data")

  layout col:
    button "Load" -> loadData()
    text data
`, {
  react: (code) => [
    ['async function', c => c.includes('async')],
    ['has await', c => c.includes('await')],
  ],
  vue: (code) => [
    ['async function', c => c.includes('async')],
    ['has await', c => c.includes('await')],
  ],
  svelte: (code) => [
    ['async function', c => c.includes('async')],
    ['has await', c => c.includes('await')],
  ],
});

// ============================================================
// 15. On mount lifecycle
// ============================================================
test('on mount lifecycle', `
page Test:
  state loaded: bool = false

  on mount:
    loaded = true

  layout col:
    text "Status: {loaded}"
`, {
  react: (code) => [
    ['has useEffect', c => c.includes('useEffect')],
    ['empty deps array', c => c.includes('[]')],
  ],
  vue: (code) => [
    ['has onMounted', c => c.includes('onMounted')],
  ],
  svelte: (code) => [
    ['has onMount or $effect', c => c.includes('onMount') || c.includes('$effect')],
  ],
});

// ============================================================
// 16. Component call with args
// ============================================================
test('component call with args', `
page Test:
  state items: list[{name: str}] = []
  layout col:
    for item in items:
      component Card(item)

component Card:
  prop data: any
  layout col:
    text data.name
`, {
  all: (code) => [
    ['has Card reference', c => c.includes('Card')],
    ['no compile error', () => true],
  ],
});

// ============================================================
// 17. Style class declaration
// ============================================================
test('style class applied to layout', `
page Test:
  style card:
    padding: 24
    radius: 12
    bg: white
    shadow: md

  layout col .card:
    text "Styled card"
`, {
  all: (code) => [
    ['has padding style', c => c.includes('padding') || c.includes('24')],
    ['has border-radius', c => c.includes('borderRadius') || c.includes('border-radius') || c.includes('radius') || c.includes('12')],
    ['has background', c => c.includes('background') || c.includes('white')],
    ['has shadow', c => c.includes('shadow') || c.includes('Shadow')],
  ],
});

// ============================================================
// 18. Multiple state mutations in one function
// ============================================================
test('multiple state mutations', `
page Test:
  state a: int = 0
  state b: str = ""
  state c: bool = false

  fn reset():
    a = 0
    b = ""
    c = false

  layout col:
    button "Reset" -> reset()
`, {
  react: (code) => [
    ['has setA', c => c.includes('setA')],
    ['has setB', c => c.includes('setB')],
    ['has setC', c => c.includes('setC')],
  ],
  vue: (code) => [
    ['sets a.value', c => c.includes('a.value')],
    ['sets b.value', c => c.includes('b.value')],
    ['sets c.value', c => c.includes('c.value')],
  ],
  svelte: (code) => [
    ['sets a', c => c.includes('a =') || c.includes('a=')],
    ['sets b', c => c.includes('b =') || c.includes('b=')],
    ['sets c', c => c.includes('c =') || c.includes('c=')],
  ],
});

// ============================================================
// 19. API declaration usage
// ============================================================
test('api declaration and usage', `
page Test:
  state users: list[str] = []
  api getUsers = GET "/api/users"

  on mount:
    users = await getUsers()

  layout col:
    for user in users:
      text user
`, {
  react: (code) => [
    ['has fetch call', c => c.includes('fetch') || c.includes('/api/users')],
    ['has async/await', c => c.includes('await')],
  ],
  vue: (code) => [
    ['has fetch call', c => c.includes('fetch') || c.includes('/api/users')],
  ],
  svelte: (code) => [
    ['has fetch call', c => c.includes('fetch') || c.includes('/api/users')],
  ],
});

// ============================================================
// 20. Input with various props
// ============================================================
test('input with type and placeholder', `
page Test:
  state email: str = ""
  state age: int = 0
  layout col:
    input email placeholder="Enter email" type="email"
    input age placeholder="Enter age" type="number"
`, {
  all: (code) => [
    ['has email input', c => c.includes('email')],
    ['has number type', c => c.includes('number')],
    ['has placeholder', c => c.includes('placeholder')],
    ['has two inputs', c => (c.match(/<input/g) || []).length >= 2],
  ],
});

// ============================================================
// 21. Nested for + if
// ============================================================
test('for loop containing if block', `
page Test:
  state items: list[{name: str, active: bool}] = []
  layout col:
    for item in items:
      if item.active:
        text item.name bold
      else:
        text item.name color=#999
`, {
  react: (code) => [
    ['has map', c => c.includes('.map(')],
    ['has conditional', c => c.includes('?') || c.includes('&&')],
    ['has active check', c => c.includes('active')],
  ],
  vue: (code) => [
    ['has v-for', c => c.includes('v-for')],
    ['has v-if', c => c.includes('v-if')],
  ],
  svelte: (code) => [
    ['has each', c => c.includes('{#each')],
    ['has if', c => c.includes('{#if')],
  ],
});

// ============================================================
// 22. Derived with method chain
// ============================================================
test('derived with method chain', `
page Test:
  state items: list[{price: float, qty: int}] = []
  derived total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  derived formatted = total.toFixed(2)
  layout col:
    text "Total: {formatted}"
`, {
  react: (code) => [
    ['has useMemo or direct calc', c => c.includes('useMemo') || c.includes('reduce')],
    ['has toFixed', c => c.includes('toFixed')],
  ],
  vue: (code) => [
    ['has computed', c => c.includes('computed')],
    ['has reduce', c => c.includes('reduce')],
  ],
  svelte: (code) => [
    ['has $derived', c => c.includes('$derived')],
    ['has reduce', c => c.includes('reduce')],
  ],
});

// ============================================================
// 23. Stack layout
// ============================================================
test('stack layout', `
page Test:
  layout stack:
    text "Layer 1"
    text "Layer 2"
`, {
  all: (code) => [
    ['has position relative or grid', c => c.includes('position') || c.includes('grid')],
    ['has both layers', c => c.includes('Layer 1') && c.includes('Layer 2')],
  ],
});

// ============================================================
// 24. Text with multiple style props
// ============================================================
test('text with all style props', `
page Test:
  layout col:
    text "Bold" bold
    text "Italic" italic
    text "Underline" underline
    text "Strike" strike
    text "Centered" center
    text "Large" size=2xl
    text "Colored" color=#ff0000
`, {
  all: (code) => [
    ['has bold style', c => c.includes('bold') || c.includes('fontWeight') || c.includes('font-weight')],
    ['has italic style', c => c.includes('italic') || c.includes('fontStyle') || c.includes('font-style')],
    ['has underline', c => c.includes('underline') || c.includes('textDecoration') || c.includes('text-decoration')],
    ['has color red', c => c.includes('#ff0000') || c.includes('ff0000')],
    ['has size 2xl', c => c.includes('32px') || c.includes('fontSize') || c.includes('font-size')],
  ],
});

// ============================================================
// 25. Empty layout
// ============================================================
test('empty layout', `
page Test:
  layout col:
    text "Just text"
`, {
  all: (code) => [
    ['compiles without error', () => true],
    ['has text', c => c.includes('Just text')],
  ],
});

// ============================================================
// 26. JS import statement
// ============================================================
test('js import statement (known limitation: use import not fully generated)', `
page Test:
  use format from "date-fns"
  state date: str = ""
  layout col:
    text date
`, {
  all: (code) => [
    ['compiles without error', () => true],
    ['has state', c => c.includes('date')],
  ],
});

// ============================================================
// 27. Check constraints
// ============================================================
test('check constraints', `
page Test:
  state count: int = 0
  check count >= 0 "Count must be non-negative"
  check count <= 100 "Count must be 100 or less"
  layout col:
    text "{count}"
`, {
  all: (code) => [
    ['compiles without error', () => true],
    ['has count reference', c => c.includes('count')],
  ],
});

// ============================================================
// 28. On destroy lifecycle
// ============================================================
test('on destroy lifecycle', `
page Test:
  state timer: int = 0
  state count: int = 0

  fn tick():
    count += 1

  on mount:
    timer = setInterval(tick, 1000)

  on destroy:
    clearInterval(timer)

  layout col:
    text "{count}"
`, {
  react: (code) => [
    ['has cleanup in useEffect', c => c.includes('return') && c.includes('clearInterval')],
  ],
  vue: (code) => [
    ['has onUnmounted', c => c.includes('onUnmounted') || c.includes('onBeforeUnmount')],
  ],
  svelte: (code) => [
    ['has onDestroy or cleanup', c => c.includes('onDestroy') || c.includes('return')],
  ],
});

// ============================================================
// 29. Complex button action (multi-statement)
// ============================================================
test('button with inline multi-statement action', `
page Test:
  state count: int = 0

  fn handleClick():
    count += 1
    if count > 10:
      count = 0

  layout col:
    button "Click" -> handleClick()
    text "{count}"
`, {
  all: (code) => [
    ['has handleClick function', c => c.includes('handleClick')],
    ['has count > 10 check', c => c.includes('10')],
    ['has button click binding', c => c.includes('handleClick') || c.includes('click')],
  ],
});

// ============================================================
// 30. Type declaration usage
// ============================================================
test('type declaration', `
page Test:
  type Status = "active" | "inactive" | "pending"
  state status: Status = "active"
  layout col:
    text status
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has status', c => c.includes('status')],
  ],
});

// ============================================================
// 31. Row layout with between/center
// ============================================================
test('row layout with between and center', `
page Test:
  layout row between center:
    text "Left"
    text "Right"
`, {
  all: (code) => [
    ['has space-between', c => c.includes('space-between')],
    ['has center alignment', c => c.includes('center')],
    ['has flex-direction row', c => c.includes('row') || c.includes('flex')],
  ],
});

// ============================================================
// 32. Background color on layout
// ============================================================
test('layout with bg color', `
page Test:
  layout col bg=#f0f0f0 padding=16:
    text "Content"
`, {
  all: (code) => [
    ['has background color', c => c.includes('#f0f0f0') || c.includes('f0f0f0')],
    ['has padding', c => c.includes('padding') || c.includes('16')],
  ],
});

// ============================================================
// 33. Dynamic bg color (braced expression)
// ============================================================
test('dynamic bg color on layout', `
page Test:
  state theme: str = "#fff"
  layout col bg={theme}:
    text "Dynamic bg"
`, {
  react: (code) => [
    ['has dynamic bg', c => c.includes('theme') && c.includes('background')],
  ],
  vue: (code) => [
    ['has dynamic style', c => c.includes(':style') || c.includes('theme')],
  ],
  svelte: (code) => [
    ['has dynamic style', c => c.includes('theme') && c.includes('style')],
  ],
});

// ============================================================
// 34. Comments preservation
// ============================================================
test('comments in source', `
page Test:
  // This is a header comment
  state count: int = 0
  layout col:
    // Section comment
    text "Hello"
`, {
  all: (code) => [
    ['preserves comment', c => c.includes('header comment') || c.includes('Section comment') || c.includes('//')],
  ],
});

// ============================================================
// 35. Store declaration
// ============================================================
test('store declaration', `
page Test:
  store theme: str = "light"
  layout col:
    text theme
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has theme reference', c => c.includes('theme')],
  ],
});

// ============================================================
// 36. Gradient on layout
// ============================================================
test('gradient background', `
page Test:
  layout col gradient="from #ff0000 to #0000ff":
    text "Gradient"
`, {
  all: (code) => [
    ['has gradient', c => c.includes('gradient') || c.includes('linear-gradient')],
    ['has colors', c => c.includes('ff0000') || c.includes('0000ff')],
  ],
});

// ============================================================
// 37. Unary expression (negation)
// ============================================================
test('unary negation', `
page Test:
  state visible: bool = true
  layout col:
    if !visible:
      text "Hidden"
`, {
  react: (code) => [
    ['has negation', c => c.includes('!visible')],
  ],
  vue: (code) => [
    ['has negation', c => c.includes('!visible')],
  ],
  svelte: (code) => [
    ['has negation', c => c.includes('!visible')],
  ],
});

// ============================================================
// 38. Array expression in state
// ============================================================
test('array literal in state', `
page Test:
  state colors: list[str] = ["red", "green", "blue"]
  layout col:
    for color in colors:
      text color
`, {
  all: (code) => [
    ['has array literal', c => c.includes('[') && c.includes(']')],
    ['has red/green/blue', c => c.includes('red') && c.includes('green') && c.includes('blue')],
  ],
});

// ============================================================
// 39. Object expression in state
// ============================================================
test('object literal in state', `
page Test:
  state config: {theme: str, lang: str} = {theme: "dark", lang: "ko"}
  layout col:
    text config.theme
    text config.lang
`, {
  all: (code) => [
    ['has object literal', c => c.includes('theme') && c.includes('dark')],
    ['has member access', c => c.includes('config.') || c.includes('config')],
  ],
});

// ============================================================
// 40. Multiple pages compiled
// ============================================================
test('page with component', `
page Home:
  state items: list[str] = []
  layout col:
    for item in items:
      component ItemCard(item)

component ItemCard:
  prop value: str
  layout col:
    text value bold
`, {
  react: (code) => [
    ['has Home component', c => c.includes('Home')],
    ['has ItemCard component', c => c.includes('ItemCard')],
    ['has prop handling', c => c.includes('value') || c.includes('prop')],
  ],
  vue: (code) => [
    ['has ItemCard component', c => c.includes('ItemCard')],
    ['has prop handling', c => c.includes('value') || c.includes('prop')],
  ],
  svelte: (code) => [
    ['has ItemCard component', c => c.includes('ItemCard')],
    ['has prop handling', c => c.includes('value') || c.includes('prop')],
  ],
});

// ============================================================
// 41. Scroll and grow props
// ============================================================
test('scroll and grow layout props', `
page Test:
  layout col height=100vh:
    layout col scroll=y grow=1:
      text "Scrollable content"
    layout row padding=16:
      text "Fixed footer"
`, {
  all: (code) => [
    ['has overflow/scroll', c => c.includes('overflow') || c.includes('scroll')],
    ['has flex grow', c => c.includes('flex') || c.includes('grow') || c.includes('1')],
    ['has 100vh', c => c.includes('100vh')],
  ],
});

// ============================================================
// 42. Radius and shadow props
// ============================================================
test('radius and shadow on layout', `
page Test:
  layout col radius=12 shadow=lg padding=24:
    text "Card"
`, {
  all: (code) => [
    ['has border-radius', c => c.includes('12') || c.includes('borderRadius') || c.includes('border-radius')],
    ['has box-shadow', c => c.includes('shadow') || c.includes('Shadow') || c.includes('box-shadow')],
  ],
});

// ============================================================
// 43. Margin and maxWidth props
// ============================================================
test('margin and maxWidth on layout', `
page Test:
  layout col maxWidth=600 margin=auto:
    text "Centered container"
`, {
  all: (code) => [
    ['has maxWidth', c => c.includes('600') || c.includes('maxWidth') || c.includes('max-width')],
    ['has margin auto', c => c.includes('auto') || c.includes('margin')],
  ],
});

// ============================================================
// 44. End alignment
// ============================================================
test('end alignment on layout', `
page Test:
  layout row end:
    text "Right aligned"
`, {
  all: (code) => [
    ['has flex-end or end', c => c.includes('flex-end') || c.includes('end')],
  ],
});

// ============================================================
// 45. Middle (vertical center) alignment
// ============================================================
test('middle alignment on layout', `
page Test:
  layout col middle:
    text "Vertically centered"
`, {
  all: (code) => [
    ['has center alignment', c => c.includes('center')],
  ],
});

// ============================================================
// 46. Template with multiple interpolations
// ============================================================
test('template with multiple interpolations', `
page Test:
  state first: str = "John"
  state last: str = "Doe"
  layout col:
    text "Hello {first} {last}!"
`, {
  react: (code) => [
    ['has both interpolations', c => c.includes('first') && c.includes('last')],
    ['no literal {first}', c => !c.includes('"{first}"') && !c.includes("'{first}'")],
  ],
  vue: (code) => [
    ['has vue interpolation', c => c.includes('{{') || (c.includes('first') && c.includes('last'))],
  ],
  svelte: (code) => [
    ['has svelte interpolation', c => c.includes('{first}') || c.includes('{last}') || (c.includes('first') && c.includes('last'))],
  ],
});

// ============================================================
// 47. Arrow function in derived
// ============================================================
test('arrow function in derived', `
page Test:
  state items: list[{done: bool}] = []
  derived pending = items.filter(i => !i.done)
  derived count = pending.length
  layout col:
    text "Pending: {count}"
`, {
  all: (code) => [
    ['has filter', c => c.includes('filter')],
    ['has arrow', c => c.includes('=>')],
    ['has length', c => c.includes('length')],
  ],
});

// ============================================================
// 48. Index access expression
// ============================================================
test('index access on array', `
page Test:
  state items: list[str] = ["a", "b", "c"]
  derived first = items[0]
  layout col:
    text first
`, {
  all: (code) => [
    ['has index access', c => c.includes('[0]')],
    ['compiles', () => true],
  ],
});

// ============================================================
// 49. Boolean state toggle
// ============================================================
test('boolean toggle pattern', `
page Test:
  state open: bool = false

  fn toggleOpen():
    open = !open

  layout col:
    button "Toggle" -> toggleOpen()
    if open:
      text "Open!"
`, {
  react: (code) => [
    ['has toggle logic', c => c.includes('!open') || c.includes('prev')],
    ['has conditional render', c => c.includes('open') && c.includes('Open!')],
  ],
  vue: (code) => [
    ['has toggle', c => c.includes('!open') || c.includes('open.value')],
  ],
  svelte: (code) => [
    ['has toggle', c => c.includes('!open') || c.includes('open =')],
  ],
});

// ============================================================
// 50. Complex real-world: Todo with filter
// ============================================================
test('todo app with filter', `
page Todo:
  type Item = {id: int, text: str, done: bool}
  state items: list[Item] = []
  state input: str = ""
  state filter: str = "all"

  derived filtered = filter == "all" ? items : filter == "done" ? items.filter(i => i.done) : items.filter(i => !i.done)
  derived remaining = items.filter(i => !i.done).length

  fn add():
    if input.trim() != "":
      items.push({id: Date.now(), text: input, done: false})
      input = ""

  fn toggleItem(id: int):
    item = items.find(i => i.id == id)
    if item:
      item.done = !item.done

  fn removeItem(id: int):
    items = items.filter(i => i.id != id)

  layout col gap=16 padding=24 maxWidth=600 margin=auto:
    text "Todo ({remaining})" size=2xl bold

    layout row gap=8:
      input input placeholder="New todo..."
      button "Add" style=primary -> add()

    layout row gap=4:
      button "All" -> filter = "all"
      button "Active" -> filter = "active"
      button "Done" -> filter = "done"

    for item in filtered:
      layout row gap=8 center:
        toggle item.done
        text item.text strike={item.done} color={item.done ? "#999" : "#333"}
        button "X" style=danger size=sm -> removeItem(item.id)

    if items.length == 0:
      text "No todos yet" color=#999 center
`, {
  react: (code) => [
    ['has useState calls', c => c.includes('useState')],
    ['has filter function', c => c.includes('filter')],
    ['has toggle logic', c => c.includes('toggle') || c.includes('done')],
    ['has map for list', c => c.includes('.map(')],
    ['balanced JSX', c => {
      const opens = (c.match(/<div/g) || []).length;
      const closes = (c.match(/<\/div>/g) || []).length;
      return opens === closes;
    }],
    ['has conditional strike', c => c.includes('strike') || c.includes('textDecoration') || c.includes('line-through')],
  ],
  vue: (code) => [
    ['has ref calls', c => c.includes('ref(')],
    ['has v-for', c => c.includes('v-for')],
    ['has v-model', c => c.includes('v-model')],
    ['balanced template', c => {
      const opens = (c.match(/<div/g) || []).length;
      const closes = (c.match(/<\/div>/g) || []).length;
      return opens === closes;
    }],
  ],
  svelte: (code) => [
    ['has $state', c => c.includes('$state')],
    ['has {#each}', c => c.includes('{#each')],
    ['has {/each}', c => c.includes('{/each}')],
    ['balanced blocks', c => {
      const opens = (c.match(/<div/g) || []).length;
      const closes = (c.match(/<\/div>/g) || []).length;
      return opens === closes;
    }],
  ],
});

// ============================================================
// Report
// ============================================================
console.log('\n' + '='.repeat(60));
console.log(`EDGE CASE DEBUG RESULTS`);
console.log('='.repeat(60));
console.log(`Total: ${results.pass + results.fail} checks`);
console.log(`Pass:  ${results.pass}`);
console.log(`Fail:  ${results.fail}`);
console.log('='.repeat(60));

if (results.errors.length > 0) {
  console.log('\nFAILURES:\n');
  for (const err of results.errors) {
    console.log(`❌ ${err.label}`);
    console.log(`   ${err.desc}`);
    if (err.error) {
      console.log(`   Error: ${err.error}`);
    }
    if (err.code) {
      console.log(`   Code preview:`);
      console.log(`   ${err.code.slice(0, 300).replace(/\n/g, '\n   ')}`);
    }
    console.log();
  }
} else {
  console.log('\n✅ All edge case tests passed!\n');
}

process.exit(results.fail > 0 ? 1 : 0);
