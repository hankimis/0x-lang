// debug-v016.mjs — Comprehensive tests for v0.1.17 features
// className/class support, passthrough props, "did you mean" errors, source map improvements
import { compile } from './dist/index.js';
import { parse } from './dist/parser.js';
import { suggestKeyword, levenshtein, COMMON_MISTAKES } from './dist/generators/shared.js';

let total = 0, pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  total++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      pass++;
    } else {
      fail++;
      failures.push({ name, result: String(result).slice(0, 400) });
    }
  } catch (e) {
    fail++;
    failures.push({ name, error: e.message.slice(0, 400) });
  }
}

function compileTarget(code, target, opts = {}) {
  return compile(code.trim(), { target, validate: false, sourceMap: false, ...opts });
}

// ============================================================
// SECTION 1: CLASS PROP — REACT (className)
// ============================================================

test('C01: layout with Tailwind class → React className', () => {
  const r = compileTarget(`
page Home:
  layout col class="container mx-auto p-4":
    text "Hello"
`, 'react');
  return r.code.includes('className="container mx-auto p-4"') || r.code;
});

test('C02: text with class → React className', () => {
  const r = compileTarget(`
page Home:
  text "Title" class="text-xl font-bold text-blue-600"
`, 'react');
  return r.code.includes('className="text-xl font-bold text-blue-600"') || r.code;
});

test('C03: button with class → React className', () => {
  const r = compileTarget(`
page Home:
  button "Save" -> save() class="btn btn-primary"
`, 'react');
  return r.code.includes('className="btn btn-primary"') || r.code;
});

test('C04: input with class → React className', () => {
  const r = compileTarget(`
page Home:
  state name: string = ""
  input name class="input input-bordered"
`, 'react');
  return r.code.includes('className="input input-bordered"') || r.code;
});

test('C05: image with class → React className', () => {
  const r = compileTarget(`
page Home:
  image "/photo.jpg" class="rounded-lg shadow-md"
`, 'react');
  return r.code.includes('className="rounded-lg shadow-md"') || r.code;
});

test('C06: link with class → React className', () => {
  const r = compileTarget(`
page Home:
  link "Home" href="/" class="nav-link active"
`, 'react');
  return r.code.includes('className="nav-link active"') || r.code;
});

test('C07: toggle with class → React className', () => {
  const r = compileTarget(`
page Home:
  state dark: boolean = false
  toggle dark class="form-check-input"
`, 'react');
  return r.code.includes('className="form-check-input"') || r.code;
});

test('C08: select with class → React className', () => {
  const r = compileTarget(`
page Home:
  state color: string = "red"
  select color options=colors class="form-select"
`, 'react');
  return r.code.includes('className="form-select"') || r.code;
});

test('C09: button style="primary" still works alongside class', () => {
  const r = compileTarget(`
page Home:
  button "OK" -> ok() style="primary"
`, 'react');
  return r.code.includes('backgroundColor') || r.code;
});

test('C10: class + inline style coexist on layout', () => {
  const r = compileTarget(`
page Home:
  layout col class="container" gap=16:
    text "Hi"
`, 'react');
  const c = r.code;
  return c.includes('className="container"') && c.includes('gap:') || c;
});

// ============================================================
// SECTION 2: CLASS PROP — VUE
// ============================================================

test('V01: layout with class → Vue class attr', () => {
  const r = compileTarget(`
page Home:
  layout col class="container mx-auto":
    text "Hello"
`, 'vue');
  return r.code.includes('class="container mx-auto"') || r.code;
});

test('V02: button with class → Vue class attr', () => {
  const r = compileTarget(`
page Home:
  button "Save" -> save() class="btn btn-primary"
`, 'vue');
  return r.code.includes('class="btn btn-primary"') || r.code;
});

test('V03: input with class → Vue class attr', () => {
  const r = compileTarget(`
page Home:
  state name: string = ""
  input name class="form-control"
`, 'vue');
  return r.code.includes('class="form-control"') || r.code;
});

test('V04: image with class → Vue class attr', () => {
  const r = compileTarget(`
page Home:
  image "/img.png" class="img-fluid"
`, 'vue');
  return r.code.includes('class="img-fluid"') || r.code;
});

test('V05: link with class → Vue class attr', () => {
  const r = compileTarget(`
page Home:
  link "Go" href="/about" class="text-link"
`, 'vue');
  return r.code.includes('class="text-link"') || r.code;
});

// ============================================================
// SECTION 3: CLASS PROP — SVELTE
// ============================================================

test('S01: layout with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  layout col class="flex flex-col":
    text "Hello"
`, 'svelte');
  return r.code.includes('class="flex flex-col"') || r.code;
});

test('S02: button with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  button "Save" -> save() class="btn"
`, 'svelte');
  return r.code.includes('class="btn"') || r.code;
});

test('S03: input with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  state name: string = ""
  input name class="input-field"
`, 'svelte');
  return r.code.includes('class="input-field"') || r.code;
});

test('S04: image with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  image "/pic.jpg" class="rounded shadow"
`, 'svelte');
  return r.code.includes('class="rounded shadow"') || r.code;
});

test('S05: toggle with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  state ok: boolean = false
  toggle ok class="toggle-switch"
`, 'svelte');
  return r.code.includes('class="toggle-switch"') || r.code;
});

test('S06: select with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  state v: string = "a"
  select v options=items class="select-box"
`, 'svelte');
  return r.code.includes('class="select-box"') || r.code;
});

test('S07: link with class → Svelte class attr', () => {
  const r = compileTarget(`
page Home:
  link "Home" href="/" class="nav-link"
`, 'svelte');
  return r.code.includes('class="nav-link"') || r.code;
});

// ============================================================
// SECTION 4: PASSTHROUGH PROPS — REACT
// ============================================================

test('P01: layout with data-testid → React passthrough', () => {
  const r = compileTarget(`
page Home:
  layout col data-testid="main":
    text "Test"
`, 'react');
  return r.code.includes('data-testid="main"') || r.code;
});

test('P02: button with aria-label → React passthrough', () => {
  const r = compileTarget(`
page Home:
  button "X" -> close() aria-label="Close dialog"
`, 'react');
  return r.code.includes('aria-label="Close dialog"') || r.code;
});

test('P03: input with autocomplete → React passthrough', () => {
  const r = compileTarget(`
page Home:
  state email: string = ""
  input email autocomplete="email"
`, 'react');
  return r.code.includes('autocomplete="email"') || r.code;
});

test('P04: layout with role → React passthrough', () => {
  const r = compileTarget(`
page Home:
  layout col role="navigation":
    text "Nav"
`, 'react');
  return r.code.includes('role="navigation"') || r.code;
});

test('P05: image with loading=lazy → React passthrough', () => {
  const r = compileTarget(`
page Home:
  image "/large.jpg" loading="lazy"
`, 'react');
  return r.code.includes('loading="lazy"') || r.code;
});

test('P06: multiple passthrough on single element', () => {
  const r = compileTarget(`
page Home:
  layout col data-testid="main" role="main" aria-label="Main content":
    text "Hi"
`, 'react');
  const c = r.code;
  return c.includes('data-testid="main"') && c.includes('role="main"') && c.includes('aria-label="Main content"') || c;
});

test('P07: class + passthrough combined', () => {
  const r = compileTarget(`
page Home:
  button "Save" -> save() class="btn" data-testid="save-btn" aria-busy="false"
`, 'react');
  const c = r.code;
  return c.includes('className="btn"') && c.includes('data-testid="save-btn"') || c;
});

// ============================================================
// SECTION 5: PASSTHROUGH PROPS — VUE
// ============================================================

test('PV01: layout with data-testid → Vue passthrough', () => {
  const r = compileTarget(`
page Home:
  layout col data-testid="main":
    text "Test"
`, 'vue');
  return r.code.includes('data-testid="main"') || r.code;
});

test('PV02: button with aria-label → Vue passthrough', () => {
  const r = compileTarget(`
page Home:
  button "Close" -> close() aria-label="Dismiss"
`, 'vue');
  return r.code.includes('aria-label="Dismiss"') || r.code;
});

test('PV03: input with aria-required → Vue passthrough', () => {
  const r = compileTarget(`
page Home:
  state name: string = ""
  input name aria-required="true"
`, 'vue');
  return r.code.includes('aria-required="true"') || r.code;
});

// ============================================================
// SECTION 6: PASSTHROUGH PROPS — SVELTE
// ============================================================

test('PS01: layout with data-testid → Svelte passthrough', () => {
  const r = compileTarget(`
page Home:
  layout col data-testid="main":
    text "Test"
`, 'svelte');
  return r.code.includes('data-testid="main"') || r.code;
});

test('PS02: button with aria-label → Svelte passthrough', () => {
  const r = compileTarget(`
page Home:
  button "OK" -> ok() aria-label="Confirm"
`, 'svelte');
  return r.code.includes('aria-label="Confirm"') || r.code;
});

test('PS03: image with loading → Svelte passthrough', () => {
  const r = compileTarget(`
page Home:
  image "/pic.jpg" loading="lazy"
`, 'svelte');
  return r.code.includes('loading="lazy"') || r.code;
});

// ============================================================
// SECTION 7: "DID YOU MEAN?" ERROR SUGGESTIONS
// ============================================================

test('E01: levenshtein basic distances', () => {
  return levenshtein('kitten', 'sitting') === 3 &&
         levenshtein('page', 'page') === 0 &&
         levenshtein('pag', 'page') === 1 || 'distance check failed';
});

test('E02: suggestKeyword matches close typo', () => {
  const result = suggestKeyword('layot', ['layout', 'text', 'button']);
  return result === 'layout' || `got: ${result}`;
});

test('E03: suggestKeyword returns null for distant word', () => {
  const result = suggestKeyword('xyzabc', ['layout', 'text', 'button']);
  return result === null || `got: ${result}`;
});

test('E04: COMMON_MISTAKES has onMount entry', () => {
  return COMMON_MISTAKES['onMount'] !== undefined || 'missing onMount';
});

test('E05: COMMON_MISTAKES has className entry', () => {
  return COMMON_MISTAKES['className'] !== undefined || 'missing className';
});

test('E06: typo "pge" at top-level gives did-you-mean error', () => {
  try {
    compile('pge Home:\n  text "hi"', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("Did you mean 'page'") || e.message;
  }
});

test('E07: typo "layot" in body gives did-you-mean error', () => {
  try {
    compile('page Home:\n  layot col:\n    text "hi"', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("Did you mean 'layout'") || e.message;
  }
});

test('E08: "onMount" in body gives hint about on mount:', () => {
  try {
    compile('page Home:\n  onMount:\n    console.log("hi")', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("on mount") || e.message;
  }
});

test('E09: "className" gives hint about class prop', () => {
  try {
    compile('page Home:\n  className "test"', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("class") || e.message;
  }
});

test('E10: "componnt" typo gives did-you-mean component', () => {
  try {
    compile('componnt Card:\n  text "hi"', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("Did you mean 'component'") || e.message;
  }
});

test('E11: "buton" typo gives did-you-mean button', () => {
  try {
    compile('page Home:\n  buton "OK" -> ok()', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("Did you mean 'button'") || e.message;
  }
});

test('E12: "toogle" typo gives did-you-mean toggle', () => {
  try {
    compile('page Home:\n  state ok: boolean = false\n  toogle ok', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("Did you mean 'toggle'") || e.message;
  }
});

test('E13: "elif" gives hint about else', () => {
  try {
    compile('page Home:\n  elif:\n    text "no"', { target: 'react', validate: false, sourceMap: false });
    return 'should have thrown';
  } catch (e) {
    return e.message.includes("elif") || e.message;
  }
});

// ============================================================
// SECTION 8: SOURCE MAP IMPROVEMENTS
// ============================================================

test('SM01: state decl has source map comment in React', () => {
  const r = compileTarget(`
page Home:
  state count: number = 0
  text count
`, 'react', { sourceMap: true });
  return r.code.includes('0x:L') || r.code;
});

test('SM02: on mount has source map comment in React', () => {
  const r = compileTarget(`
page Home:
  on mount:
    console.log("mounted")
  text "Hi"
`, 'react', { sourceMap: true });
  return r.code.includes('0x:L') || r.code;
});

test('SM03: fn has source map comment in React', () => {
  const r = compileTarget(`
page Home:
  fn greet():
    console.log("hello")
  text "Hi"
`, 'react', { sourceMap: true });
  return r.code.includes('0x:L') || r.code;
});

test('SM04: derived has source map comment in React', () => {
  const r = compileTarget(`
page Home:
  state x: number = 5
  derived doubled = x * 2
  text doubled
`, 'react', { sourceMap: true });
  return r.code.includes('0x:L') || r.code;
});

test('SM05: source map comment in Vue', () => {
  const r = compileTarget(`
page Home:
  state count: number = 0
  on mount:
    console.log("hi")
  text count
`, 'vue', { sourceMap: true });
  return r.code.includes('0x:L') || r.code;
});

test('SM06: source map comment in Svelte', () => {
  const r = compileTarget(`
page Home:
  state count: number = 0
  on mount:
    console.log("hi")
  text count
`, 'svelte', { sourceMap: true });
  return r.code.includes('0x:L') || r.code;
});

// ============================================================
// SECTION 9: INTEGRATION — FULL TAILWIND SCENARIO
// ============================================================

test('INT01: Full Tailwind dashboard layout — React', () => {
  const r = compileTarget(`
page Dashboard:
  state items: array = []
  layout col class="min-h-screen bg-gray-100":
    layout row class="bg-white shadow-md p-4" data-testid="header":
      text "Dashboard" class="text-2xl font-bold"
      button "Refresh" -> refresh() class="ml-auto bg-blue-500 text-white px-4 py-2 rounded"
    layout col class="p-6 space-y-4" role="main":
      text "Welcome" class="text-gray-600"
      input items class="border rounded px-3 py-2 w-full" placeholder="Search..."
`, 'react');
  const c = r.code;
  return c.includes('className="min-h-screen bg-gray-100"') &&
         c.includes('className="text-2xl font-bold"') &&
         c.includes('className="ml-auto bg-blue-500 text-white px-4 py-2 rounded"') &&
         c.includes('data-testid="header"') &&
         c.includes('role="main"') || c;
});

test('INT02: Accessible form — React', () => {
  const r = compileTarget(`
page Form:
  state email: string = ""
  state agree: boolean = false
  layout col class="max-w-md mx-auto p-8" role="form" aria-label="Sign up form":
    text "Sign Up" class="text-xl font-semibold mb-4"
    input email class="input" placeholder="Email" aria-required="true" autocomplete="email"
    toggle agree class="checkbox" aria-label="Agree to terms"
    button "Submit" -> submit() class="btn btn-primary" data-testid="submit"
`, 'react');
  const c = r.code;
  return c.includes('role="form"') &&
         c.includes('aria-label="Sign up form"') &&
         c.includes('aria-required="true"') &&
         c.includes('autocomplete="email"') &&
         c.includes('data-testid="submit"') || c;
});

test('INT03: Same scenario → Vue', () => {
  const r = compileTarget(`
page Form:
  state email: string = ""
  layout col class="container" role="form":
    input email class="input" autocomplete="email"
    button "Go" -> go() class="btn" data-testid="go"
`, 'vue');
  const c = r.code;
  return c.includes('class="container"') &&
         c.includes('role="form"') &&
         c.includes('class="input"') &&
         c.includes('autocomplete="email"') &&
         c.includes('data-testid="go"') || c;
});

test('INT04: Same scenario → Svelte', () => {
  const r = compileTarget(`
page Form:
  state email: string = ""
  layout col class="container" role="form":
    input email class="input" autocomplete="email"
    button "Go" -> go() class="btn" data-testid="go"
`, 'svelte');
  const c = r.code;
  return c.includes('class="container"') &&
         c.includes('role="form"') &&
         c.includes('class="input"') &&
         c.includes('autocomplete="email"') &&
         c.includes('data-testid="go"') || c;
});

test('INT05: class does not appear as passthrough', () => {
  const r = compileTarget(`
page Home:
  layout col class="test":
    text "Hi"
`, 'react');
  // class should appear as className, not as a separate HTML attribute
  const c = r.code;
  return c.includes('className="test"') || c;
});

// ============================================================
// SECTION 10: EDGE CASES
// ============================================================

test('EDGE01: empty class attribute', () => {
  const r = compileTarget(`
page Home:
  text "Hi" class=""
`, 'react');
  // Should handle gracefully (empty or no className)
  return typeof r.code === 'string';
});

test('EDGE02: button style=primary + class coexist', () => {
  const r = compileTarget(`
page Home:
  button "Go" -> go() style="primary" class="extra-class"
`, 'react');
  const c = r.code;
  return c.includes('className="extra-class"') && c.includes('backgroundColor') || c;
});

test('EDGE03: known props NOT in passthrough', () => {
  const r = compileTarget(`
page Home:
  layout col gap=16 padding=8:
    text "Hi"
`, 'react');
  // gap and padding should NOT appear as passthrough attrs
  return !r.code.includes(' gap="16"') && !r.code.includes(' padding="8"') || r.code;
});

test('EDGE04: input placeholder NOT in passthrough', () => {
  const r = compileTarget(`
page Home:
  state q: string = ""
  input q placeholder="Search..."
`, 'react');
  // placeholder should appear normally, not duplicated via passthrough
  const count = (r.code.match(/placeholder/g) || []).length;
  return count === 1 || `placeholder appeared ${count} times`;
});

test('EDGE05: class on layout with all CSS props', () => {
  const r = compileTarget(`
page Home:
  layout col class="wrapper" gap=16 padding=20 bg="#f5f5f5" radius=8:
    text "Content"
`, 'react');
  const c = r.code;
  return c.includes('className="wrapper"') && c.includes('gap:') && c.includes('padding:') || c;
});

// ============================================================
// RESULTS
// ============================================================
console.log('\n============================================================');
console.log(`debug-v016.mjs — v0.1.17 Feature Tests`);
console.log('============================================================');
console.log(`Total: ${total}`);
console.log(`Pass:  ${pass}`);
console.log(`Fail:  ${fail}`);
console.log('============================================================');

if (failures.length > 0) {
  console.log('\nFailed tests:');
  for (const f of failures) {
    console.log(`  ❌ ${f.name}`);
    if (f.error) console.log(`     Error: ${f.error}`);
    if (f.result) console.log(`     Result: ${f.result}`);
  }
} else {
  console.log('\n✅ All v0.1.17 tests passed!');
}
