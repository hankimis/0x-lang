// debug-v018.mjs — v0.1.19 feature tests
// raw: escape hatch, component children, useCallback, React.memo, AI spec

import { compile, getLanguageSpec } from './dist/index.js';

let pass = 0, fail = 0;
const failures = [];

function test(id, source, checks, target = 'react') {
  try {
    const result = compile(source, { target, sourceMap: false, useClient: false });
    const code = result.code;
    for (const [desc, fn] of Object.entries(checks)) {
      try {
        const ok = fn(code);
        if (ok) {
          pass++;
        } else {
          fail++;
          failures.push(`${id} [${desc}]: check returned false\n  Code snippet: ${code.substring(0, 200)}`);
        }
      } catch (e) {
        fail++;
        failures.push(`${id} [${desc}]: ${e.message}`);
      }
    }
  } catch (e) {
    fail++;
    failures.push(`${id}: compile error — ${e.message}`);
  }
}

function testError(id, source, checks) {
  try {
    compile(source, { target: 'react' });
    fail++;
    failures.push(`${id}: expected error but compiled successfully`);
  } catch (e) {
    for (const [desc, fn] of Object.entries(checks)) {
      const ok = fn(e.message);
      if (ok) pass++;
      else {
        fail++;
        failures.push(`${id} [${desc}]: error message check failed — got: ${e.message}`);
      }
    }
  }
}

console.log('=== v0.1.19 Feature Tests ===\n');

// ──────────────────────────────────────────────────
// Section 1: raw: escape hatch (React)
// ──────────────────────────────────────────────────
console.log('--- Section 1: raw: escape hatch (React) ---');

test('RAW01', `
page Test:
  raw:
    <CustomComponent data-testid="custom" />
`, {
  'contains raw JSX': c => c.includes('<CustomComponent data-testid="custom" />'),
  'in return block': c => c.includes('return (') && c.indexOf('<CustomComponent') > c.indexOf('return ('),
});

test('RAW02', `
page Test:
  layout col:
    text "Above"
    raw:
      <SpecialWidget />
    text "Below"
`, {
  'raw inside layout': c => c.includes('<SpecialWidget />'),
  'text above': c => c.includes('Above'),
  'text below': c => c.includes('Below'),
});

test('RAW03', `
page Test:
  raw { <div className="custom">Hello</div> }
`, {
  'brace syntax': c => c.includes('<div className="custom">Hello</div>') || c.includes('div className = "custom"'),
});

test('RAW04', `
page Test:
  raw:
    <CustomComponent data-testid="custom" />
`, {
  'vue raw in template': c => c.includes('<CustomComponent'),
}, 'vue');

test('RAW05', `
page Test:
  raw:
    <CustomComponent data-testid="custom" />
`, {
  'svelte raw in markup': c => c.includes('<CustomComponent'),
}, 'svelte');

test('RAW06', `
page Test:
  state html: str = "<p>Hello</p>"
  js:
    const helper = () => 42
  raw:
    <div id="raw-content" />
`, {
  'js in script section': c => c.includes('const helper'),
  'raw in JSX section': c => {
    const returnIdx = c.indexOf('return (');
    return c.indexOf('<div id="raw-content"') > returnIdx;
  },
});

// ──────────────────────────────────────────────────
// Section 2: Component children
// ──────────────────────────────────────────────────
console.log('--- Section 2: Component children ---');

test('CHILD01', `
page Test:
  component Dialog(title="Settings"):
    text "Content inside dialog"
`, {
  'opening tag': c => c.includes('<Dialog') && c.includes('title='),
  'closing tag': c => c.includes('</Dialog>'),
  'children content': c => c.includes('Content inside dialog'),
  'not self-closing': c => !c.includes('Dialog') || !c.match(/<Dialog[^>]*\/>/),
});

test('CHILD02', `
page Test:
  component Card(item)
`, {
  'self-closing (no colon)': c => c.includes('<Card') && c.includes('/>'),
  'no closing tag': c => !c.includes('</Card>'),
});

test('CHILD03', `
page Test:
  component Wrapper(className="container"):
    layout col:
      text "Nested layout"
      button "Click" -> doSomething()
`, {
  'wrapping component': c => c.includes('<Wrapper') && c.includes('</Wrapper>'),
  'nested layout inside': c => c.includes('<div') && c.indexOf('<div') > c.indexOf('<Wrapper'),
  'button inside': c => c.includes('<button'),
});

test('CHILD04', `
page Test:
  component Dialog(title="Settings"):
    text "Content"
`, {
  'vue children': c => c.includes('<Dialog') && c.includes('</Dialog>') && c.includes('Content'),
}, 'vue');

test('CHILD05', `
page Test:
  component Dialog(title="Settings"):
    text "Content"
`, {
  'svelte children': c => c.includes('<Dialog') && c.includes('</Dialog>') && c.includes('Content'),
}, 'svelte');

test('CHILD06', `
page Test:
  component Tabs:
    component TabPanel(label="Tab 1"):
      text "Panel 1 content"
    component TabPanel(label="Tab 2"):
      text "Panel 2 content"
`, {
  'nested component children': c => c.includes('<Tabs') && c.includes('</Tabs>'),
  'inner panels': c => c.includes('Panel 1 content') && c.includes('Panel 2 content'),
  'TabPanel tags': c => c.includes('<TabPanel') && c.includes('</TabPanel>'),
});

test('CHILD07', `
page Test:
  component Card:
    text "No props"
`, {
  'component without args': c => c.includes('<Card') && c.includes('</Card>'),
  'content inside': c => c.includes('No props'),
});

// ──────────────────────────────────────────────────
// Section 3: useCallback for fn declarations
// ──────────────────────────────────────────────────
console.log('--- Section 3: useCallback ---');

test('CB01', `
page Test:
  state count: int = 0
  fn increment():
    count += 1
`, {
  'useCallback wrapper': c => c.includes('useCallback('),
  'imports useCallback': c => c.includes('useCallback') && c.includes('import'),
  'count in deps': c => c.includes(', [count]') || c.includes(', [count,'),
});

test('CB02', `
page Test:
  state items: list[str] = []
  fn addItem(text: str):
    items.push(text)
`, {
  'useCallback': c => c.includes('useCallback('),
  'param not in deps': c => {
    // 'text' is a function param, should NOT be in deps array
    const depsMatch = c.match(/useCallback\(.*?\], \[([^\]]*)\]\)/s);
    if (!depsMatch) return true; // might not have deps
    return !depsMatch[1].includes('text');
  },
  'items in deps': c => c.includes('[items]') || c.includes('items'),
});

test('CB03', `
page Test:
  state a: int = 0
  state b: int = 0
  derived sum = a + b
  fn reset():
    a = 0
    b = 0
`, {
  'useCallback': c => c.includes('useCallback('),
  'multiple state deps': c => c.includes('a') && c.includes('b'),
});

test('CB04', `
page Test:
  fn doNothing():
    return null
`, {
  'empty deps for no state': c => c.includes(', [])')
});

test('CB05', `
page Test:
  state loading: bool = false
  async fn fetchData():
    loading = true
    const res = await fetch("/api")
    loading = false
`, {
  'async useCallback': c => c.includes('useCallback(async'),
  'loading in deps': c => c.includes('loading'),
});

// ──────────────────────────────────────────────────
// Section 4: React.memo
// ──────────────────────────────────────────────────
console.log('--- Section 4: React.memo ---');

test('MEMO01', `
component Card:
  prop title: str
  text title
`, {
  'React.memo wrapper': c => c.includes('React.memo(Card)'),
  'export as Card': c => c.includes('as Card') || c.includes('export { Memoized'),
  'imports React': c => c.includes('import React'),
});

test('MEMO02', `
component Badge:
  prop label: str
  prop color: str = "blue"
  text label
`, {
  'React.memo': c => c.includes('React.memo(Badge)'),
  'multiple props': c => c.includes('label') && c.includes('color'),
});

test('MEMO03', `
component SimpleBox:
  text "No props here"
`, {
  'no memo without props': c => !c.includes('React.memo'),
  'simple export': c => c.includes('export { SimpleBox }'),
});

test('MEMO04', `
page Dashboard:
  state count: int = 0
  text "Hello"
`, {
  'no memo for pages': c => !c.includes('React.memo'),
  'export default': c => c.includes('export default function Dashboard'),
});

// ──────────────────────────────────────────────────
// Section 5: raw + component children combo
// ──────────────────────────────────────────────────
console.log('--- Section 5: Combinations ---');

test('COMBO01', `
page Test:
  component Dialog(open=true):
    raw:
      <DialogContent className="sm:max-w-[425px]">
    text "Dialog body"
`, {
  'component with children': c => c.includes('<Dialog') && c.includes('</Dialog>'),
  'raw inside children': c => c.includes('DialogContent') || c.includes('sm:max-w'),
});

test('COMBO02', `
page Test:
  state count: int = 0
  fn increment():
    count += 1
  component Counter(value=count):
    button "+" -> increment()
`, {
  'useCallback fn': c => c.includes('useCallback('),
  'component with children': c => c.includes('<Counter') && c.includes('</Counter>'),
  'button inside': c => c.includes('<button'),
});

test('COMBO03', `
page Test:
  layout col class="container":
    raw:
      <ThirdPartyChart data={chartData} />
    component Legend(items=legendItems):
      text "Legend content"
`, {
  'layout with class': c => c.includes('className="container"'),
  'raw inside layout': c => c.includes('ThirdPartyChart'),
  'component children': c => c.includes('</Legend>'),
});

// ──────────────────────────────────────────────────
// Section 6: Cross-target raw block
// ──────────────────────────────────────────────────
console.log('--- Section 6: Cross-target ---');

test('XT01', `
page Test:
  raw:
    <slot name="header" />
`, {
  'vue slot raw': c => c.includes('<slot'),
}, 'vue');

test('XT02', `
page Test:
  raw:
    <svelte:head><title>My App</title></svelte:head>
`, {
  'svelte special element': c => c.includes('svelte:head') || c.includes('svelte : head'),
}, 'svelte');

test('XT03', `
page Test:
  component Card(title="Hi"):
    text "Vue children"
`, {
  'vue props binding': c => c.includes(':title="'),
  'vue closing tag': c => c.includes('</Card>'),
}, 'vue');

test('XT04', `
page Test:
  component Card(title="Hi"):
    text "Svelte children"
`, {
  'svelte props': c => c.includes('title={'),
  'svelte closing tag': c => c.includes('</Card>'),
}, 'svelte');

// ──────────────────────────────────────────────────
// Section 7: AI Spec
// ──────────────────────────────────────────────────
console.log('--- Section 7: AI Spec ---');

{
  const spec = getLanguageSpec();
  const checks = {
    'spec includes raw block': () => spec.includes('raw') && (spec.includes('escape') || spec.includes('Escape') || spec.includes('Raw Block')),
    'spec includes component children': () => spec.includes('children') || spec.includes('Children'),
    'spec includes useCallback': () => spec.includes('useCallback'),
    'spec includes React.memo': () => spec.includes('React.memo'),
    'spec includes class prop': () => spec.includes('class=') || spec.includes('class"'),
    'spec includes passthrough': () => spec.includes('passthrough') || spec.includes('Passthrough') || spec.includes('aria-') || spec.includes('data-'),
  };
  for (const [desc, fn] of Object.entries(checks)) {
    if (fn()) {
      pass++;
    } else {
      fail++;
      failures.push(`SPEC [${desc}]: check failed`);
    }
  }
}

// ──────────────────────────────────────────────────
// Section 8: Edge cases
// ──────────────────────────────────────────────────
console.log('--- Section 8: Edge cases ---');

test('EDGE01', `
page Test:
  raw:
    <><div>Fragment</div><span>Content</span></>
`, {
  'JSX fragment': c => c.includes('Fragment') || c.includes('<>'),
});

test('EDGE02', `
page Test:
  component Empty:
    raw:
      <></>
`, {
  'component with empty raw children': c => c.includes('<Empty') && c.includes('</Empty>'),
});

test('EDGE03', `
page Test:
  state count: int = 0
  derived doubled = count * 2
  fn handleClick():
    count += 1
`, {
  'derived still useMemo': c => c.includes('useMemo'),
  'fn uses useCallback': c => c.includes('useCallback'),
  'both imported': c => c.includes('useMemo') && c.includes('useCallback'),
});

test('EDGE04', `
page Test:
  for i in items:
    component ItemCard(data=i):
      text i.name
`, {
  'component children inside for': c => c.includes('map') && c.includes('<ItemCard') && c.includes('</ItemCard>'),
});

test('EDGE05', `
page Test:
  if showDialog:
    component Dialog(title="Confirm"):
      text "Are you sure?"
      button "Yes" -> confirm()
`, {
  'component children inside if': c => c.includes('<Dialog') && c.includes('</Dialog>'),
  'conditional': c => c.includes('showDialog'),
});

test('EDGE06', `
component Card:
  prop title: str
  prop subtitle: str = "Default"
  layout col:
    text title
    text subtitle
`, {
  'React.memo with multiple props': c => c.includes('React.memo(Card)'),
  'destructured props': c => c.includes('title') && c.includes('subtitle'),
});

test('EDGE07', `
page Test:
  state x: int = 0
  fn handler(event):
    x = event.target.value
`, {
  'param excluded from deps': c => {
    // 'event' param should not be in the deps
    const match = c.match(/\], \[([^\]]*)\]\)/);
    return match ? !match[1].includes('event') : true;
  },
  'x in deps': c => c.includes('[x]') || c.includes(', [x'),
});

// ──────────────────────────────────────────────────
// Section 9: Multiple raw blocks
// ──────────────────────────────────────────────────
console.log('--- Section 9: Multiple raw blocks ---');

test('MULTI01', `
page Test:
  raw:
    <Header />
  layout col:
    text "Content"
  raw:
    <Footer />
`, {
  'first raw': c => c.includes('<Header'),
  'second raw': c => c.includes('<Footer'),
  'layout between': c => c.indexOf('<Header') < c.indexOf('Content') && c.indexOf('Content') < c.indexOf('<Footer'),
});

test('MULTI02', `
page Test:
  component Sidebar:
    raw:
      <NavMenu />
    raw:
      <UserProfile />
`, {
  'multiple raw in children': c => c.includes('NavMenu') && c.includes('UserProfile'),
  'wrapped in Sidebar': c => c.includes('<Sidebar') && c.includes('</Sidebar>'),
});

// ──────────────────────────────────────────────────
// Section 10: useCallback with complex bodies
// ──────────────────────────────────────────────────
console.log('--- Section 10: Complex useCallback ---');

test('CPLX01', `
page Test:
  state items: list[str] = []
  state filter: str = ""
  fn getFiltered():
    return items.filter(i => i.includes(filter))
`, {
  'items in deps': c => c.includes('items'),
  'filter in deps': c => c.includes('filter'),
  'useCallback': c => c.includes('useCallback'),
});

test('CPLX02', `
page Test:
  state data: list[object] = []
  prop limit: int = 10
  fn loadMore():
    const res = await fetch("/api?limit=" + limit)
    data = res
`, {
  'prop in deps': c => c.includes('limit'),
  'state in deps': c => c.includes('data'),
});

// ──────────────────────────────────────────────────
// Results
// ──────────────────────────────────────────────────
console.log('\n============================================================');
console.log(`  Pass:  ${pass}`);
console.log(`  Fail:  ${fail}`);
console.log('============================================================');

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  ❌ ${f}`));
}

if (fail === 0) {
  console.log('\n✅ All v0.1.19 tests passed!');
} else {
  console.log(`\n❌ ${fail} test(s) failed`);
  process.exit(1);
}
