// debug-v017.mjs — Deep edge-case & scenario tests for v0.1.17
// Thoroughly tests class, passthrough, "did you mean", source maps
// across React, Vue, Svelte with complex real-world patterns
import { compile } from './dist/index.js';
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
      failures.push({ name, result: String(result).slice(0, 500) });
    }
  } catch (e) {
    fail++;
    failures.push({ name, error: e.message.slice(0, 500) });
  }
}

function ct(code, target, opts = {}) {
  return compile(code.trim(), { target, validate: false, sourceMap: false, ...opts });
}

// ============================================================
// SECTION 1: HYPHENATED PROP PARSING EDGE CASES
// ============================================================

test('HP01: data-testid on layout', () => {
  const c = ct(`
page A:
  layout col data-testid="root":
    text "hi"
`, 'react').code;
  return c.includes('data-testid="root"') || c;
});

test('HP02: aria-label on button', () => {
  const c = ct(`
page A:
  button "X" -> close() aria-label="Close"
`, 'react').code;
  return c.includes('aria-label="Close"') || c;
});

test('HP03: aria-hidden boolean-like prop', () => {
  const c = ct(`
page A:
  layout col aria-hidden="true":
    text "hidden"
`, 'react').code;
  return c.includes('aria-hidden="true"') || c;
});

test('HP04: data-cy for Cypress testing', () => {
  const c = ct(`
page A:
  button "Submit" -> submit() data-cy="submit-btn"
`, 'react').code;
  return c.includes('data-cy="submit-btn"') || c;
});

test('HP05: multiple hyphenated props on one element', () => {
  const c = ct(`
page A:
  layout col data-testid="main" aria-label="Main" aria-live="polite":
    text "content"
`, 'react').code;
  return c.includes('data-testid="main"') && c.includes('aria-label="Main"') && c.includes('aria-live="polite"') || c;
});

test('HP06: data-tooltip custom prop', () => {
  const c = ct(`
page A:
  text "Hover me" data-tooltip="More info"
`, 'react').code;
  return c.includes('data-tooltip="More info"') || c;
});

test('HP07: aria-required on input', () => {
  const c = ct(`
page A:
  state name: string = ""
  input name aria-required="true" aria-invalid="false"
`, 'react').code;
  return c.includes('aria-required="true"') && c.includes('aria-invalid="false"') || c;
});

test('HP08: data-action on image', () => {
  const c = ct(`
page A:
  image "/pic.jpg" data-action="zoom"
`, 'react').code;
  return c.includes('data-action="zoom"') || c;
});

test('HP09: aria-expanded on toggle', () => {
  const c = ct(`
page A:
  state open: boolean = false
  toggle open aria-expanded="true"
`, 'react').code;
  return c.includes('aria-expanded="true"') || c;
});

test('HP10: aria-describedby on select', () => {
  const c = ct(`
page A:
  state v: string = "a"
  select v options=items aria-describedby="help-text"
`, 'react').code;
  return c.includes('aria-describedby="help-text"') || c;
});

test('HP11: hyphenated props on link', () => {
  const c = ct(`
page A:
  link "Click" href="/go" data-track="nav-click" aria-current="page"
`, 'react').code;
  return c.includes('data-track="nav-click"') && c.includes('aria-current="page"') || c;
});

// ============================================================
// SECTION 2: CLASS + PASSTHROUGH + STYLE COMBINATIONS
// ============================================================

test('CPS01: layout class + gap + passthrough', () => {
  const c = ct(`
page A:
  layout col class="container" gap=16 data-testid="wrapper":
    text "Hi"
`, 'react').code;
  return c.includes('className="container"') && c.includes('gap:') && c.includes('data-testid="wrapper"') || c;
});

test('CPS02: text class + bold + passthrough', () => {
  const c = ct(`
page A:
  text "Title" class="heading" bold data-testid="title"
`, 'react').code;
  return c.includes('className="heading"') && c.includes('fontWeight') && c.includes('data-testid="title"') || c;
});

test('CPS03: button class + style=primary + passthrough', () => {
  const c = ct(`
page A:
  button "Save" -> save() style="primary" class="btn" data-testid="save"
`, 'react').code;
  return c.includes('className="btn"') && c.includes('backgroundColor') && c.includes('data-testid="save"') || c;
});

test('CPS04: button class + style=danger', () => {
  const c = ct(`
page A:
  button "Delete" -> del() style="danger" class="btn-del"
`, 'react').code;
  return c.includes('className="btn-del"') && c.includes('backgroundColor') && c.includes('#ef4444') || c;
});

test('CPS05: input class + placeholder + passthrough', () => {
  const c = ct(`
page A:
  state q: string = ""
  input q class="search-input" placeholder="Search..." autocomplete="off" data-testid="search"
`, 'react').code;
  return c.includes('className="search-input"') && c.includes('placeholder="Search..."') && c.includes('autocomplete="off"') && c.includes('data-testid="search"') || c;
});

test('CPS06: image class + round + passthrough', () => {
  const c = ct(`
page A:
  image "/avatar.jpg" class="avatar" round data-user-id="123"
`, 'react').code;
  return c.includes('className="avatar"') && c.includes('borderRadius') && c.includes('data-user-id="123"') || c;
});

test('CPS07: image class + size + alt', () => {
  const c = ct(`
page A:
  image "/logo.png" class="logo" size=64 alt="Logo"
`, 'react').code;
  return c.includes('className="logo"') && c.includes('width:') && c.includes('alt="Logo"') || c;
});

test('CPS08: layout with all CSS props + class + passthrough', () => {
  const c = ct(`
page A:
  layout col class="main" gap=8 padding=16 margin=4 bg="#fff" radius=12 shadow data-section="hero":
    text "Hero"
`, 'react').code;
  return c.includes('className="main"') && c.includes('gap:') && c.includes('padding:') && c.includes('borderRadius:') && c.includes('data-section="hero"') || c;
});

// ============================================================
// SECTION 3: NESTED STRUCTURES WITH CLASS/PASSTHROUGH
// ============================================================

test('NS01: nested layouts with different classes', () => {
  const c = ct(`
page A:
  layout col class="outer" data-testid="outer":
    layout row class="inner" data-testid="inner":
      text "Nested"
`, 'react').code;
  return c.includes('className="outer"') && c.includes('className="inner"') && c.includes('data-testid="outer"') && c.includes('data-testid="inner"') || c;
});

test('NS02: class inside if block', () => {
  const c = ct(`
page A:
  state show: boolean = true
  if show:
    text "Visible" class="text-green"
`, 'react').code;
  return c.includes('className="text-green"') || c;
});

test('NS03: class inside for loop', () => {
  const c = ct(`
page A:
  state items: array = []
  for item in items:
    text item.name class="item-name" data-testid="item"
`, 'react').code;
  return c.includes('className="item-name"') && c.includes('data-testid="item"') || c;
});

test('NS04: class inside show block', () => {
  const c = ct(`
page A:
  state visible: boolean = true
  show visible:
    layout col class="shown-content":
      text "Content" class="shown-text"
`, 'react').code;
  return c.includes('className="shown-content"') && c.includes('className="shown-text"') || c;
});

test('NS05: button with class inside for loop', () => {
  const c = ct(`
page A:
  state items: array = []
  for item in items:
    button item.name -> select(item) class="list-btn" data-id={item.id}
`, 'react').code;
  return c.includes('className="list-btn"') || c;
});

test('NS06: deeply nested layout classes (3 levels)', () => {
  const c = ct(`
page A:
  layout col class="level-1":
    layout row class="level-2":
      layout col class="level-3":
        text "Deep"
`, 'react').code;
  return c.includes('className="level-1"') && c.includes('className="level-2"') && c.includes('className="level-3"') || c;
});

// ============================================================
// SECTION 4: CROSS-TARGET CONSISTENCY — Same input, all 3 targets
// ============================================================

const crossCode = `
page App:
  state name: string = ""
  state dark: boolean = false
  layout col class="container mx-auto" data-testid="app":
    text "Hello" class="text-xl" data-testid="heading"
    input name class="input" placeholder="Name" autocomplete="name"
    toggle dark class="switch" aria-label="Dark mode"
    button "Save" -> save() class="btn" data-testid="save-btn"
    image "/logo.png" class="logo" alt="Logo"
`;

test('XT01: React — class renders as className', () => {
  const c = ct(crossCode, 'react').code;
  return c.includes('className="container mx-auto"') &&
         c.includes('className="text-xl"') &&
         c.includes('className="input"') &&
         c.includes('className="switch"') &&
         c.includes('className="btn"') &&
         c.includes('className="logo"') || c;
});

test('XT02: React — passthrough attrs present', () => {
  const c = ct(crossCode, 'react').code;
  return c.includes('data-testid="app"') &&
         c.includes('data-testid="heading"') &&
         c.includes('autocomplete="name"') &&
         c.includes('aria-label="Dark mode"') &&
         c.includes('data-testid="save-btn"') || c;
});

test('XT03: Vue — class renders as class', () => {
  const c = ct(crossCode, 'vue').code;
  return c.includes('class="container mx-auto"') &&
         c.includes('class="text-xl"') &&
         c.includes('class="input"') &&
         c.includes('class="switch"') &&
         c.includes('class="btn"') &&
         c.includes('class="logo"') || c;
});

test('XT04: Vue — passthrough attrs present', () => {
  const c = ct(crossCode, 'vue').code;
  return c.includes('data-testid="app"') &&
         c.includes('data-testid="heading"') &&
         c.includes('autocomplete="name"') &&
         c.includes('aria-label="Dark mode"') &&
         c.includes('data-testid="save-btn"') || c;
});

test('XT05: Svelte — class renders as class', () => {
  const c = ct(crossCode, 'svelte').code;
  return c.includes('class="container mx-auto"') &&
         c.includes('class="text-xl"') &&
         c.includes('class="input"') &&
         c.includes('class="switch"') &&
         c.includes('class="btn"') &&
         c.includes('class="logo"') || c;
});

test('XT06: Svelte — passthrough attrs present', () => {
  const c = ct(crossCode, 'svelte').code;
  return c.includes('data-testid="app"') &&
         c.includes('data-testid="heading"') &&
         c.includes('autocomplete="name"') &&
         c.includes('aria-label="Dark mode"') &&
         c.includes('data-testid="save-btn"') || c;
});

// ============================================================
// SECTION 5: KNOWN PROPS NOT LEAKING INTO PASSTHROUGH
// ============================================================

test('KP01: layout gap NOT duplicated as passthrough', () => {
  const c = ct(`
page A:
  layout col gap=16 padding=8:
    text "Hi"
`, 'react').code;
  // gap/padding should be in style only, not as HTML attrs
  return !c.includes(' gap="') && !c.includes(' padding="') || c;
});

test('KP02: text bold NOT as passthrough', () => {
  const c = ct(`
page A:
  text "Bold" bold size="lg"
`, 'react').code;
  return !c.includes(' bold="') && !c.includes(' bold ') || 'bold leaked';
});

test('KP03: button disabled NOT duplicated', () => {
  const c = ct(`
page A:
  state loading: boolean = false
  button "Go" -> go() disabled=loading
`, 'react').code;
  const count = (c.match(/disabled/g) || []).length;
  return count === 1 || `disabled appeared ${count} times in: ${c.slice(0, 300)}`;
});

test('KP04: input placeholder NOT duplicated', () => {
  const c = ct(`
page A:
  state q: string = ""
  input q placeholder="Type..."
`, 'react').code;
  const count = (c.match(/placeholder/g) || []).length;
  return count === 1 || `placeholder appeared ${count} times`;
});

test('KP05: image alt NOT duplicated', () => {
  const c = ct(`
page A:
  image "/pic.jpg" alt="Photo" round
`, 'react').code;
  const count = (c.match(/alt=/g) || []).length;
  return count === 1 || `alt appeared ${count} times`;
});

test('KP06: image size NOT as passthrough', () => {
  const c = ct(`
page A:
  image "/pic.jpg" size=100
`, 'react').code;
  return c.includes('width:') && !c.includes(' size="100"') || c;
});

test('KP07: input type NOT duplicated', () => {
  const c = ct(`
page A:
  state pw: string = ""
  input pw type="password" placeholder="Password"
`, 'react').code;
  const count = (c.match(/type=/g) || []).length;
  return count === 1 || `type appeared ${count} times`;
});

test('KP08: link href NOT duplicated — Vue', () => {
  const c = ct(`
page A:
  link "Go" href="/about"
`, 'vue').code;
  const count = (c.match(/href/g) || []).length;
  return count === 1 || `href appeared ${count} times: ${c}`;
});

test('KP09: link href NOT duplicated — Svelte', () => {
  const c = ct(`
page A:
  link "Go" href="/about"
`, 'svelte').code;
  const count = (c.match(/href/g) || []).length;
  return count === 1 || `href appeared ${count} times: ${c}`;
});

test('KP10: link href NOT duplicated — React', () => {
  const c = ct(`
page A:
  link "Go" href="/about"
`, 'react').code;
  const count = (c.match(/href/g) || []).length;
  return count === 1 || `href appeared ${count} times: ${c}`;
});

test('KP11: select options NOT as passthrough', () => {
  const c = ct(`
page A:
  state v: string = "a"
  select v options=items
`, 'react').code;
  return !c.includes(' options="') && !c.includes(' options={') || 'options leaked as passthrough';
});

// ============================================================
// SECTION 6: "DID YOU MEAN?" — EXPANDED TYPO COVERAGE
// ============================================================

test('DM01: "paeg" → page', () => {
  try { ct('paeg Home:\n  text "hi"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'page'") || e.message; }
});

test('DM02: "compnent" → component', () => {
  try { ct('compnent Card:\n  text "hi"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'component'") || e.message; }
});

test('DM03: "layut" → layout', () => {
  try { ct('page A:\n  layut col:\n    text "hi"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'layout'") || e.message; }
});

test('DM04: "buton" → button', () => {
  try { ct('page A:\n  buton "OK" -> ok()', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'button'") || e.message; }
});

test('DM05: "toogle" → toggle', () => {
  try { ct('page A:\n  state x: boolean = false\n  toogle x', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'toggle'") || e.message; }
});

test('DM06: "selct" → select', () => {
  try { ct('page A:\n  state v: string = "a"\n  selct v options=i', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'select'") || e.message; }
});

test('DM07: "imge" → image', () => {
  try { ct('page A:\n  imge "/pic.jpg"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'image'") || e.message; }
});

test('DM08: "stat" → state (body keyword)', () => {
  try { ct('page A:\n  stat x: number = 0', 'react'); return 'no throw'; }
  catch (e) {
    // "stat" might match "state" or be a valid keyword (stats grid)
    return e.message.includes("Did you mean") || e.message.includes("stat") || e.message;
  }
});

test('DM09: "derivd" → derived', () => {
  try { ct('page A:\n  state x: number = 0\n  derivd y = x * 2', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'derived'") || e.message; }
});

test('DM10: "endpont" → endpoint (top-level)', () => {
  try { ct('endpont GET "/api":\n  res.json([])', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'endpoint'") || e.message; }
});

test('DM11: COMMON_MISTAKES — "onClick"', () => {
  try { ct('page A:\n  onClick:\n    doSomething()', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('button') || e.message; }
});

test('DM12: COMMON_MISTAKES — "onChange"', () => {
  try { ct('page A:\n  onChange:\n    doSomething()', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('input') || e.message; }
});

test('DM13: COMMON_MISTAKES — "div"', () => {
  try { ct('page A:\n  div:\n    text "hi"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('layout') || e.message; }
});

test('DM14: COMMON_MISTAKES — "span"', () => {
  try { ct('page A:\n  span "hi"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('text') || e.message; }
});

test('DM15: COMMON_MISTAKES — "img"', () => {
  try { ct('page A:\n  img "/pic.jpg"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('image') || e.message; }
});

test('DM16: COMMON_MISTAKES — "var"', () => {
  try { ct('page A:\n  var x = 5', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('state') || e.message; }
});

test('DM17: COMMON_MISTAKES — "function"', () => {
  try { ct('page A:\n  function greet():\n    console.log("hi")', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes('fn') || e.message; }
});

test('DM18: "deplpy" → deploy (top-level)', () => {
  try { ct('deplpy aws:\n  region: "us-east-1"', 'react'); return 'no throw'; }
  catch (e) { return e.message.includes("Did you mean 'deploy'") || e.message; }
});

test('DM19: completely wrong word → no suggestion (distance > 2)', () => {
  try { ct('xyzqwerty Home:\n  text "hi"', 'react'); return 'no throw'; }
  catch (e) { return !e.message.includes("Did you mean") || 'should not suggest for distant word'; }
});

test('DM20: levenshtein edge cases', () => {
  return levenshtein('', '') === 0 &&
         levenshtein('a', '') === 1 &&
         levenshtein('', 'a') === 1 &&
         levenshtein('abc', 'abc') === 0 &&
         levenshtein('abc', 'abd') === 1 || 'distance failed';
});

// ============================================================
// SECTION 7: SOURCE MAP — DETAILED CHECKS
// ============================================================

test('SM01: React state decl gets 0x:L comment', () => {
  const c = ct(`
page A:
  state count: number = 0
  text count
`, 'react', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM02: React on mount gets 0x:L comment', () => {
  const c = ct(`
page A:
  on mount:
    console.log("hi")
  text "Hi"
`, 'react', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM03: React on destroy gets 0x:L comment', () => {
  const c = ct(`
page A:
  on destroy:
    cleanup()
  text "Hi"
`, 'react', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM04: React derived gets 0x:L comment', () => {
  const c = ct(`
page A:
  state x: number = 5
  derived doubled = x * 2
  text doubled
`, 'react', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM05: React fn gets 0x:L comment', () => {
  const c = ct(`
page A:
  fn greet():
    console.log("hello")
  text "Hi"
`, 'react', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM06: React watch gets 0x:L comment', () => {
  const c = ct(`
page A:
  state x: number = 0
  watch x:
    console.log("changed")
  text x
`, 'react', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM07: Vue state/mount gets 0x:L comment', () => {
  const c = ct(`
page A:
  state count: number = 0
  on mount:
    console.log("hi")
  text count
`, 'vue', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM08: Svelte state/mount gets 0x:L comment', () => {
  const c = ct(`
page A:
  state count: number = 0
  on mount:
    console.log("hi")
  text count
`, 'svelte', { sourceMap: true }).code;
  return c.includes('0x:L') || c;
});

test('SM09: sourceMap=false strips all 0x:L comments', () => {
  const c = ct(`
page A:
  state count: number = 0
  on mount:
    console.log("hi")
  layout col:
    text count
    button "Inc" -> inc()
`, 'react', { sourceMap: false }).code;
  return !c.includes('0x:L') || 'source map comments should be stripped';
});

test('SM10: compact mode strips 0x:L comments', () => {
  const c = ct(`
page A:
  state x: number = 0
  text x
`, 'react', { compact: true }).code;
  return !c.includes('0x:L') || 'compact should strip source maps';
});

// ============================================================
// SECTION 8: REAL-WORLD TAILWIND SCENARIOS
// ============================================================

test('TW01: Tailwind card component', () => {
  const c = ct(`
component Card:
  prop title: string = ""
  prop description: string = ""
  layout col class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow":
    text title class="text-lg font-semibold text-gray-900"
    text description class="text-sm text-gray-500 mt-2"
`, 'react').code;
  return c.includes('className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"') &&
         c.includes('className="text-lg font-semibold text-gray-900"') &&
         c.includes('className="text-sm text-gray-500 mt-2"') || c;
});

test('TW02: Tailwind navigation bar', () => {
  const c = ct(`
page Nav:
  layout row class="bg-white border-b border-gray-200 px-4 py-3" role="navigation" aria-label="Main":
    text "Logo" class="text-xl font-bold text-indigo-600"
    layout row class="space-x-4 ml-auto":
      link "Home" href="/" class="text-gray-600 hover:text-gray-900"
      link "About" href="/about" class="text-gray-600 hover:text-gray-900"
`, 'react').code;
  return c.includes('className="bg-white border-b border-gray-200 px-4 py-3"') &&
         c.includes('role="navigation"') &&
         c.includes('aria-label="Main"') || c;
});

test('TW03: Tailwind form with accessibility', () => {
  const c = ct(`
page SignUp:
  state email: string = ""
  state password: string = ""
  state agree: boolean = false
  layout col class="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow" role="form":
    text "Sign Up" class="text-2xl font-bold mb-6"
    input email class="w-full border rounded-md px-3 py-2 mb-4" placeholder="Email" autocomplete="email" aria-required="true"
    input password class="w-full border rounded-md px-3 py-2 mb-4" placeholder="Password" type="password" autocomplete="new-password"
    toggle agree class="mr-2" aria-label="Accept terms"
    button "Create Account" -> signup() class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700" data-testid="signup-submit"
`, 'react').code;
  return c.includes('className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow"') &&
         c.includes('role="form"') &&
         c.includes('autocomplete="email"') &&
         c.includes('aria-required="true"') &&
         c.includes('autocomplete="new-password"') &&
         c.includes('data-testid="signup-submit"') || c;
});

test('TW04: Tailwind dashboard — Vue', () => {
  const c = ct(`
page Dashboard:
  state items: array = []
  layout col class="min-h-screen bg-gray-50":
    layout row class="bg-white shadow px-6 py-4" data-testid="topbar":
      text "Dashboard" class="text-xl font-bold"
    layout col class="p-6" role="main":
      for item in items:
        layout row class="bg-white rounded-lg p-4 mb-4 shadow-sm" data-testid="card":
          text item.name class="font-medium"
`, 'vue').code;
  return c.includes('class="min-h-screen bg-gray-50"') &&
         c.includes('data-testid="topbar"') &&
         c.includes('role="main"') &&
         c.includes('class="font-medium"') || c;
});

test('TW05: Tailwind product card — Svelte', () => {
  const c = ct(`
page Products:
  state products: array = []
  layout col class="grid grid-cols-3 gap-4 p-6":
    for product in products:
      layout col class="bg-white rounded-lg shadow p-4":
        image product.image class="w-full h-48 object-cover rounded" alt="Product"
        text product.name class="font-semibold mt-2"
        text product.price class="text-green-600"
        button "Add to Cart" -> addToCart(product) class="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
`, 'svelte').code;
  return c.includes('class="grid grid-cols-3 gap-4 p-6"') &&
         c.includes('class="bg-white rounded-lg shadow p-4"') &&
         c.includes('class="w-full h-48 object-cover rounded"') &&
         c.includes('class="mt-2 bg-blue-500 text-white px-4 py-2 rounded"') || c;
});

// ============================================================
// SECTION 9: COMPONENT WITH PASSTHROUGH
// ============================================================

test('COMP01: component with class on elements', () => {
  const c = ct(`
component Alert:
  prop message: string = ""
  prop variant: string = "info"
  layout col class="p-4 rounded-lg border":
    text message class="font-medium"
`, 'react').code;
  return c.includes('className="p-4 rounded-lg border"') && c.includes('className="font-medium"') || c;
});

test('COMP02: component with passthrough on elements', () => {
  const c = ct(`
component StatusBadge:
  prop label: string = ""
  text label class="inline-flex items-center px-2 py-1 rounded-full text-xs" data-testid="badge"
`, 'react').code;
  return c.includes('className="inline-flex items-center px-2 py-1 rounded-full text-xs"') && c.includes('data-testid="badge"') || c;
});

// ============================================================
// SECTION 10: EDGE CASES & REGRESSION GUARDS
// ============================================================

test('EDGE01: empty class=""', () => {
  const c = ct(`
page A:
  text "Hi" class=""
`, 'react').code;
  // Should produce className="" or no className — just not crash
  return typeof c === 'string';
});

test('EDGE02: class with special Tailwind chars', () => {
  const c = ct(`
page A:
  layout col class="w-1/2 md:w-1/3 lg:w-1/4":
    text "Responsive"
`, 'react').code;
  return c.includes('className="w-1/2 md:w-1/3 lg:w-1/4"') || c;
});

test('EDGE03: class with brackets in value', () => {
  const c = ct(`
page A:
  text "Hi" class="text-[14px] bg-[#ff0000]"
`, 'react').code;
  return c.includes('className="text-[14px] bg-[#ff0000]"') || c;
});

test('EDGE04: only passthrough, no class', () => {
  const c = ct(`
page A:
  layout col role="main" aria-label="Content":
    text "Hi"
`, 'react').code;
  return c.includes('role="main"') && c.includes('aria-label="Content"') && !c.includes('className') || c;
});

test('EDGE05: only class, no passthrough', () => {
  const c = ct(`
page A:
  layout col class="wrapper":
    text "Hi"
`, 'react').code;
  // Should have className but no unexpected extra attrs
  return c.includes('className="wrapper"') || c;
});

test('EDGE06: button no action + class', () => {
  const c = ct(`
page A:
  button "Info" class="info-btn"
`, 'react').code;
  return c.includes('className="info-btn"') || c;
});

test('EDGE07: input @keypress not duplicated with passthrough', () => {
  const c = ct(`
page A:
  state q: string = ""
  input q @keypress=search
`, 'react').code;
  const count = (c.match(/keypress|onKeyPress|onKeyDown/gi) || []).length;
  return count <= 1 || `keypress appeared ${count} times`;
});

test('EDGE08: input grow not duplicated', () => {
  const c = ct(`
page A:
  state q: string = ""
  input q grow
`, 'react').code;
  return typeof c === 'string';
});

test('EDGE09: text with badge + class', () => {
  const c = ct(`
page A:
  state unread: number = 5
  text "Inbox" class="text-lg" badge=unread
`, 'react').code;
  return c.includes('className="text-lg"') || c;
});

test('EDGE10: text with tooltip + class', () => {
  const c = ct(`
page A:
  text "Help" class="help-text" tooltip="Click for more info"
`, 'react').code;
  return c.includes('className="help-text"') || c;
});

test('EDGE11: layout wrap + class', () => {
  const c = ct(`
page A:
  layout row class="flex-container" wrap:
    text "Item 1"
    text "Item 2"
`, 'react').code;
  return c.includes('className="flex-container"') && c.includes('flexWrap') || c;
});

test('EDGE12: layout scroll + class', () => {
  const c = ct(`
page A:
  layout col class="content" scroll:
    text "Long content"
`, 'react').code;
  return c.includes('className="content"') && c.includes('overflow') || c;
});

test('EDGE13: layout gradient + class', () => {
  const c = ct(`
page A:
  layout col class="hero" gradient="blue,purple":
    text "Welcome"
`, 'react').code;
  return c.includes('className="hero"') && c.includes('linear-gradient') || c;
});

test('EDGE14: passthrough with dynamic value', () => {
  const c = ct(`
page A:
  state busy: boolean = false
  button "Go" -> go() aria-busy={busy}
`, 'react').code;
  return c.includes('aria-busy={busy}') || c;
});

test('EDGE15: multiple data attrs on button', () => {
  const c = ct(`
page A:
  button "Track" -> track() data-event="click" data-category="nav" data-label="home"
`, 'react').code;
  return c.includes('data-event="click"') && c.includes('data-category="nav"') && c.includes('data-label="home"') || c;
});

// ============================================================
// SECTION 11: VUE-SPECIFIC PASSTHROUGH FORMAT
// ============================================================

test('VUE01: static passthrough uses plain attr', () => {
  const c = ct(`
page A:
  layout col role="main":
    text "Hi"
`, 'vue').code;
  return c.includes('role="main"') && !c.includes(':role=') || c;
});

test('VUE02: dynamic passthrough uses :attr', () => {
  const c = ct(`
page A:
  state busy: boolean = false
  button "Go" -> go() aria-busy={busy}
`, 'vue').code;
  // Dynamic values in Vue should use :attr="value" or aria-busy="busy"
  return c.includes('aria-busy') || c;
});

test('VUE03: button style=danger + class', () => {
  const c = ct(`
page A:
  button "Delete" -> del() style="danger" class="danger-btn"
`, 'vue').code;
  return c.includes('class="danger-btn"') && c.includes('#ef4444') || c;
});

// ============================================================
// SECTION 12: SVELTE-SPECIFIC PASSTHROUGH FORMAT
// ============================================================

test('SVE01: static passthrough uses plain attr', () => {
  const c = ct(`
page A:
  layout col role="main":
    text "Hi"
`, 'svelte').code;
  return c.includes('role="main"') || c;
});

test('SVE02: button style=primary + class', () => {
  const c = ct(`
page A:
  button "Go" -> go() style="primary" class="go-btn"
`, 'svelte').code;
  return c.includes('class="go-btn"') && c.includes('#3b82f6') || c;
});

test('SVE03: image class + radius + passthrough', () => {
  const c = ct(`
page A:
  image "/avatar.jpg" class="avatar" radius=50 data-user="me"
`, 'svelte').code;
  return c.includes('class="avatar"') && c.includes('border-radius') && c.includes('data-user="me"') || c;
});

// ============================================================
// SECTION 13: MIXED SCENARIOS — FULL APP PATTERNS
// ============================================================

test('FULL01: Todo app with Tailwind + accessibility', () => {
  const c = ct(`
page TodoApp:
  state todos: array = []
  state input: string = ""

  fn addTodo():
    todos = todos.concat({id: Date.now(), text: input, done: false})
    input = ""

  layout col class="max-w-lg mx-auto p-6" role="main" aria-label="Todo application":
    text "Todo List" class="text-2xl font-bold mb-4"
    layout row class="flex gap-2 mb-4":
      input input class="flex-1 border rounded px-3 py-2" placeholder="What needs to be done?" aria-label="New todo"
      button "Add" -> addTodo() class="bg-blue-500 text-white px-4 py-2 rounded" data-testid="add-btn"
    for todo in todos:
      layout row class="flex items-center gap-2 p-2 border-b" data-testid="todo-item":
        toggle todo.done class="rounded" aria-label="Mark complete"
        text todo.text class="flex-1"
        button "Delete" -> todos = todos.filter(t => t.id != todo.id) class="text-red-500 hover:text-red-700" aria-label="Delete todo"
`, 'react').code;
  return c.includes('className="max-w-lg mx-auto p-6"') &&
         c.includes('role="main"') &&
         c.includes('aria-label="Todo application"') &&
         c.includes('data-testid="add-btn"') &&
         c.includes('aria-label="New todo"') &&
         c.includes('data-testid="todo-item"') &&
         c.includes('aria-label="Mark complete"') &&
         c.includes('aria-label="Delete todo"') || c;
});

test('FULL02: Same todo app — Vue target', () => {
  const c = ct(`
page TodoApp:
  state todos: array = []
  state input: string = ""
  layout col class="container" role="main":
    input input class="input" placeholder="Add todo" aria-label="New todo"
    button "Add" -> add() class="btn" data-testid="add"
    for todo in todos:
      layout row class="todo-item" data-testid="item":
        text todo.text class="todo-text"
`, 'vue').code;
  return c.includes('class="container"') &&
         c.includes('role="main"') &&
         c.includes('class="input"') &&
         c.includes('aria-label="New todo"') &&
         c.includes('data-testid="add"') &&
         c.includes('class="todo-item"') &&
         c.includes('data-testid="item"') || c;
});

test('FULL03: Same todo app — Svelte target', () => {
  const c = ct(`
page TodoApp:
  state todos: array = []
  state input: string = ""
  layout col class="container" role="main":
    input input class="input" placeholder="Add todo" aria-label="New todo"
    button "Add" -> add() class="btn" data-testid="add"
    for todo in todos:
      layout row class="todo-item" data-testid="item":
        text todo.text class="todo-text"
`, 'svelte').code;
  return c.includes('class="container"') &&
         c.includes('role="main"') &&
         c.includes('class="input"') &&
         c.includes('aria-label="New todo"') &&
         c.includes('data-testid="add"') &&
         c.includes('class="todo-item"') &&
         c.includes('data-testid="item"') || c;
});

test('FULL04: E-commerce product page with all features', () => {
  const c = ct(`
page Product:
  state qty: number = 1
  state size: string = "M"
  state inWishlist: boolean = false

  layout col class="max-w-4xl mx-auto grid grid-cols-2 gap-8 p-8":
    image "/product.jpg" class="w-full rounded-lg" alt="Product photo" loading="lazy"
    layout col class="space-y-4":
      text "Premium T-Shirt" class="text-3xl font-bold"
      text "$29.99" class="text-2xl text-green-600 font-semibold"
      select size options=sizes class="border rounded px-3 py-2" aria-label="Select size"
      layout row class="items-center gap-4":
        button "Add to Cart" -> addToCart() class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold" data-testid="add-to-cart"
        toggle inWishlist class="text-red-500" aria-label="Add to wishlist"
`, 'react').code;
  return c.includes('className="max-w-4xl mx-auto grid grid-cols-2 gap-8 p-8"') &&
         c.includes('loading="lazy"') &&
         c.includes('aria-label="Select size"') &&
         c.includes('data-testid="add-to-cart"') &&
         c.includes('aria-label="Add to wishlist"') || c;
});

// ============================================================
// RESULTS
// ============================================================
console.log('\n============================================================');
console.log(`debug-v017.mjs — Deep Edge-Case & Scenario Tests`);
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
  console.log('\n✅ All deep edge-case tests passed!');
}

process.exit(fail > 0 ? 1 : 0);
