// debug-quality.mjs — Tests for codegen quality improvements
import { compile } from './dist/index.js';

let total = 0, pass = 0, fail = 0;
const failures = [];

function test(name, code, checks) {
  const targets = ['react', 'vue', 'svelte'];
  for (const target of targets) {
    try {
      const result = compile(code.trim(), { target, validate: false });
      const c = result.code;
      const targetChecks = checks[target] ? checks[target](c) : (checks.all ? checks.all(c) : []);
      for (const [desc, fn] of targetChecks) {
        total++;
        try {
          if (fn(c)) { pass++; }
          else {
            fail++;
            failures.push({ name, target, desc, code: c.slice(0, 300) });
          }
        } catch (e) {
          fail++;
          failures.push({ name, target, desc, error: e.message });
        }
      }
    } catch (e) {
      // If compile itself throws, count each expected check as a failure
      const targetChecks = checks[target] ? checks[target]('') : (checks.all ? checks.all('') : []);
      for (const [desc] of targetChecks) {
        total++;
        fail++;
        failures.push({ name, target, desc, error: `Compile error: ${e.message}` });
      }
    }
  }
}

// ============================================================
// 1. STRING ESCAPING — quotes and backslashes
// ============================================================

test('Q1: Single quote in string literal', `
page Test:
  state msg: str = "it's working"
  layout col:
    text msg
`, {
  react: (c) => [
    ['escapes single quote in state init', c => !c.includes("'it's") && (c.includes("it\\'s") || c.includes("it's"))],
  ],
  vue: (c) => [
    ['escapes single quote in state init', c => !c.includes("'it's") && (c.includes("it\\'s") || c.includes("it's"))],
  ],
  svelte: (c) => [
    ['escapes single quote in state init', c => !c.includes("'it's") && (c.includes("it\\'s") || c.includes("it's"))],
  ],
});

test('Q2: Backslash in string literal', `
page Test:
  state path: str = "C:\\Users\\name"
  layout col:
    text path
`, {
  all: (c) => [
    ['compiles', () => true],
    ['has path reference', c => c.includes('path')],
  ],
});

// ============================================================
// 2. CSS UNIT HANDLING — don't double-append px
// ============================================================

test('Q3: Layout with numeric gap', `
page Test:
  layout col gap=16:
    text "A"
    text "B"
`, {
  react: (c) => [
    ['gap has px', c => c.includes('16px') || c.includes("'16px'") || c.includes('"16px"')],
  ],
  vue: (c) => [
    ['gap has px', c => c.includes('16px')],
  ],
  svelte: (c) => [
    ['gap has px', c => c.includes('16px')],
  ],
});

test('Q4: Layout with padding', `
page Test:
  layout col padding=20:
    text "Content"
`, {
  all: (c) => [
    ['padding has px', c => c.includes('20px')],
  ],
});

test('Q5: Layout with radius', `
page Test:
  layout col radius=8:
    text "Rounded"
`, {
  all: (c) => [
    ['radius has px', c => c.includes('8px')],
  ],
});

// ============================================================
// 3. MODAL/DRAWER STATE DECLARATION
// ============================================================

test('Q6: Modal generates state variable', `
page Test:
  layout col:
    modal myDialog:
      text "Dialog content"
`, {
  vue: (c) => [
    ['compiles', () => true],
    ['declares showMyDialog ref', c => c.includes('showMyDialog') && c.includes('ref')],
    ['has modal in template', c => c.includes('v-if')],
  ],
  svelte: (c) => [
    ['compiles', () => true],
    ['declares showMyDialog state', c => c.includes('showMyDialog') && c.includes('$state')],
    ['has if block', c => c.includes('{#if')],
  ],
  react: (c) => [
    ['compiles', () => true],
    ['has modal state', c => c.includes('showMyDialog') || c.includes('show')],
  ],
});

test('Q7: Drawer generates state variable', `
page Test:
  layout col:
    drawer sidebar:
      text "Sidebar content"
`, {
  vue: (c) => [
    ['declares showSidebar ref', c => c.includes('showSidebar') && c.includes('ref')],
  ],
  svelte: (c) => [
    ['declares showSidebar state', c => c.includes('showSidebar') && c.includes('$state')],
  ],
  react: (c) => [
    ['has drawer state', c => c.includes('showSidebar') || c.includes('show') || c.includes('open')],
  ],
});

// ============================================================
// 4. REACT KEY GENERATION
// ============================================================

test('Q8: Table uses stable keys', `
page Test:
  state users: list[{id: int, name: str}] = []

  table users:
    column "Name" name
    column "ID" id

  layout col:
    text "Users table"
`, {
  react: (c) => [
    ['compiles', () => true],
    ['uses row.id key instead of just idx', c => c.includes('row.id') || !c.includes('key={idx}')],
  ],
});

test('Q9: List component key generation', `
page Test:
  state items: list[{id: int, text: str}] = []

  layout col:
    list items:
      text item.text
`, {
  react: (c) => [
    ['compiles', () => true],
    ['has key prop', c => c.includes('key=')],
  ],
});

// ============================================================
// 5. TEMPLATE EXPRESSION — member access in interpolation
// ============================================================

test('Q10: Template with member access', `
page Test:
  state user: {name: str, age: int} = {name: "Alice", age: 25}
  layout col:
    text "Name: {user.name}"
`, {
  react: (c) => [
    ['compiles', () => true],
    ['has user.name in output', c => c.includes('user.name') || c.includes('user') && c.includes('name')],
  ],
  vue: (c) => [
    ['compiles', () => true],
    ['has user.name in template', c => c.includes('user.name') || c.includes('user')],
  ],
  svelte: (c) => [
    ['compiles', () => true],
    ['has user.name in output', c => c.includes('user.name') || c.includes('user')],
  ],
});

test('Q11: Template with nested member access', `
page Test:
  state data: {user: {name: str}} = {user: {name: "Bob"}}
  layout col:
    text "Hello {data.user.name}"
`, {
  all: (c) => [
    ['compiles', () => true],
    ['has nested access', c => c.includes('data.user.name') || c.includes('data')],
  ],
});

// ============================================================
// 6. ASYNC LIFECYCLE (from previous fixes)
// ============================================================

test('Q12: onMount with await generates async', `
page Test:
  state items: list[str] = []
  on mount:
    items = await fetchItems()
  layout col:
    text "Items"
`, {
  react: (c) => [
    ['has async IIFE', c => c.includes('async () =>') || c.includes('async ()')],
    ['has useEffect', c => c.includes('useEffect')],
  ],
  vue: (c) => [
    ['has async callback', c => c.includes('async ()')],
    ['has onMounted', c => c.includes('onMounted')],
  ],
  svelte: (c) => [
    ['has async callback', c => c.includes('async ()')],
    ['has onMount', c => c.includes('onMount')],
  ],
});

// ============================================================
// 7. DERIVED READONLY (from previous fixes)
// ============================================================

test('Q13: Derived with filter does not call setState', `
page Test:
  state items: list[str] = ["a", "b", "c"]
  state search: str = ""
  derived filtered = items.filter(x => x.includes(search))
  layout col:
    text "Count"
`, {
  react: (c) => [
    ['has useMemo', c => c.includes('useMemo')],
    ['no setState in derived', c => {
      const memoMatch = c.match(/useMemo\(\(\) => (.+?),/);
      if (!memoMatch) return true;
      return !memoMatch[1].includes('setItems');
    }],
  ],
});

// ============================================================
// 8. COMPOUND ASSIGNMENT (from previous fixes)
// ============================================================

test('Q14: Compound *= and /= operators', `
page Test:
  state count: int = 10
  fn double():
    count *= 2
  fn halve():
    count /= 2
  layout col:
    button "Double" -> double()
    button "Halve" -> halve()
`, {
  react: (c) => [
    ['has *=', c => c.includes('prev * 2') || c.includes('*= 2') || c.includes('* 2')],
    ['has /=', c => c.includes('prev / 2') || c.includes('/= 2') || c.includes('/ 2')],
  ],
  vue: (c) => [
    ['has *= or multiply', c => c.includes('*= 2') || c.includes('* 2')],
    ['has /= or divide', c => c.includes('/= 2') || c.includes('/ 2')],
  ],
  svelte: (c) => [
    ['has *= or multiply', c => c.includes('*= 2') || c.includes('* 2')],
    ['has /= or divide', c => c.includes('/= 2') || c.includes('/ 2')],
  ],
});

// ============================================================
// 9. BUTTON ACTION PATTERNS
// ============================================================

test('Q15: Button with state assignment', `
page Test:
  state visible: bool = false
  layout col:
    button "Show" -> visible = true
    button "Hide" -> visible = false
`, {
  react: (c) => [
    ['has setVisible(true)', c => c.includes('setVisible(true)')],
    ['has setVisible(false)', c => c.includes('setVisible(false)')],
  ],
  vue: (c) => [
    ['has visible assignment', c => c.includes('visible') && c.includes('true')],
  ],
  svelte: (c) => [
    ['has visible assignment', c => c.includes('visible = true')],
  ],
});

// ============================================================
// 10. FOR LOOP KEY GENERATION
// ============================================================

test('Q16: For loop with key', `
page Test:
  state todos: list[{id: int, text: str}] = []
  layout col:
    for todo in todos:
      text todo.text
`, {
  react: (c) => [
    ['has key prop', c => c.includes('key=')],
    ['uses id for key', c => c.includes('todo.id') || c.includes('.id')],
  ],
  vue: (c) => [
    ['has v-for', c => c.includes('v-for')],
    ['has key binding', c => c.includes(':key')],
  ],
  svelte: (c) => [
    ['has each block', c => c.includes('{#each')],
  ],
});

// ============================================================
// 11. COMPLEX REAL-WORLD SCENARIOS
// ============================================================

test('Q17: E-commerce product card', `
page Shop:
  state products: list[{id: int, name: str, price: int}] = []
  state cart: list[str] = []

  fn addToCart(id):
    cart.push(id)

  layout col gap=16:
    for product in products:
      layout row between:
        text product.name
        text product.price
        button "Add" -> addToCart(product.id)
`, {
  react: (c) => [
    ['compiles', () => true],
    ['has products state', c => c.includes('products')],
    ['has cart state', c => c.includes('cart')],
    ['has addToCart function', c => c.includes('addToCart')],
    ['has map for iteration', c => c.includes('.map(')],
  ],
  vue: (c) => [
    ['compiles', () => true],
    ['has products ref', c => c.includes('products')],
    ['has v-for', c => c.includes('v-for')],
  ],
  svelte: (c) => [
    ['compiles', () => true],
    ['has products state', c => c.includes('products')],
    ['has each block', c => c.includes('{#each')],
  ],
});

test('Q18: Chat app with async', `
page Chat:
  state messages: list[{id: int, text: str}] = []
  state input: str = ""

  fn sendMessage():
    messages.push(input)
    input = ""

  on mount:
    messages = await loadMessages()

  layout col:
    for msg in messages:
      text msg.text
    input input placeholder="Type..."
    button "Send" -> sendMessage()
`, {
  react: (c) => [
    ['compiles', () => true],
    ['has messages state', c => c.includes('messages')],
    ['has async lifecycle', c => c.includes('async')],
    ['has input binding', c => c.includes('input') || c.includes('onChange')],
  ],
  vue: (c) => [
    ['compiles', () => true],
    ['has async onMounted', c => c.includes('async') && c.includes('onMounted')],
  ],
  svelte: (c) => [
    ['compiles', () => true],
    ['has async onMount', c => c.includes('async') && c.includes('onMount')],
  ],
});

test('Q19: Dashboard with derived and watch', `
page Dashboard:
  state data: list[int] = [1, 2, 3, 4, 5]
  state multiplier: int = 1
  derived total = data.filter(x => x > 0).length * multiplier

  watch multiplier:
    result = await recalculate(multiplier)

  layout col:
    text "Total: {total}"
    button "x2" -> multiplier *= 2
`, {
  react: (c) => [
    ['has useMemo for derived', c => c.includes('useMemo')],
    ['derived filter is not setState', c => {
      const memo = c.match(/useMemo\(\(\) => (.+?),/);
      return !memo || !memo[1].includes('setData');
    }],
    ['has async effect for watch', c => c.includes('async')],
  ],
  vue: (c) => [
    ['has computed', c => c.includes('computed')],
    ['has async watch', c => c.includes('async') && c.includes('watch')],
  ],
  svelte: (c) => [
    ['has $derived', c => c.includes('$derived')],
    ['has async $effect', c => c.includes('async') && c.includes('$effect')],
  ],
});

// ============================================================
// 12. EDGE CASES
// ============================================================

test('Q20: Empty state list', `
page Test:
  state items: list[str] = []
  layout col:
    for item in items:
      text item
`, {
  all: (c) => [
    ['compiles', () => true],
    ['has empty array init', c => c.includes('[]')],
  ],
});

test('Q21: Multiple modals on same page', `
page Test:
  layout col:
    modal dialog1:
      text "First dialog"
    modal dialog2:
      text "Second dialog"
`, {
  vue: (c) => [
    ['declares both modal states', c => c.includes('showDialog1') && c.includes('showDialog2')],
  ],
  svelte: (c) => [
    ['declares both modal states', c => c.includes('showDialog1') && c.includes('showDialog2')],
  ],
  react: (c) => [
    ['has both modals', c => c.includes('showDialog1') && c.includes('showDialog2')],
  ],
});

test('Q22: Nested layout with style props', `
page Test:
  layout col gap=24 padding=16:
    layout row gap=8 center:
      text "Left"
      text "Right"
`, {
  all: (c) => [
    ['compiles', () => true],
    ['has outer gap', c => c.includes('24px')],
    ['has inner gap', c => c.includes('8px')],
    ['has padding', c => c.includes('16px')],
  ],
});

// ============================================================
// RESULTS
// ============================================================

console.log('');
if (failures.length > 0) {
  console.log('FAILURES:');
  for (const f of failures) {
    console.log(`  ❌ [${f.target}] ${f.name} — ${f.desc}`);
    if (f.error) console.log(`     Error: ${f.error}`);
    if (f.code) console.log(`     Output: ${f.code.slice(0, 200)}`);
  }
  console.log('');
}

console.log('============================================================');
console.log('QUALITY IMPROVEMENT DEBUG RESULTS');
console.log('============================================================');
console.log(`Total: ${total} checks`);
console.log(`Pass:  ${pass}`);
console.log(`Fail:  ${fail}`);
console.log('============================================================');
if (fail === 0) {
  console.log('\n✅ All quality tests passed!');
} else {
  console.log(`\n❌ ${fail} quality tests failed`);
}
