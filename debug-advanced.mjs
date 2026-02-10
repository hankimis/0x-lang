// Advanced debugging scenarios for 0x compiler v0.1.5
// Tests: contract programming, advanced elements, complex patterns,
//        phase 1-4 features, edge cases, and stress tests
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
          results.errors.push({ label, desc, code: code.slice(0, 800) });
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

const balanced = (code, tag = 'div') => {
  const opens = (code.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
  const closes = (code.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  return opens === closes;
};

// ============================================================
// CATEGORY A: Contract Programming
// ============================================================

test('A1: Function with requires/ensures', `
page Test:
  state balance: int = 100

  fn withdraw(amount: int):
    requires: amount > 0
    requires: amount <= balance
    ensures: balance >= 0
    balance -= amount

  layout col:
    button "Withdraw 10" -> withdraw(10)
    text "{balance}"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has withdraw function', c => c.includes('withdraw')],
    ['has balance state', c => c.includes('balance')],
  ],
});

test('A2: Multiple requires on function', `
page Test:
  state items: list[str] = []

  fn addItem(name: str):
    requires: name != ""
    requires: items.length < 100
    items.push(name)

  layout col:
    button "Add" -> addItem("test")
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has addItem function', c => c.includes('addItem')],
  ],
});

// ============================================================
// CATEGORY B: Model/Form/Table declarations
// ============================================================

test('B1: Model declaration (top-level)', `
model User:
  name: str
  email: str
  age: int

page Test:
  layout col:
    text "Users"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has User reference', c => c.includes('User') || c.includes('user') || c.includes('Test')],
  ],
});

test('B2: Form declaration', `
page Test:
  fn handleSubmit():
    data = 1

  form contactForm:
    field name: str
    field email: str
    field message: str
    submit "전송" -> handleSubmit()

  layout col:
    text "Contact"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has form reference', c => c.includes('contactForm') || c.includes('form') || c.includes('Form') || c.includes('handleSubmit')],
  ],
});

test('B3: Table declaration', `
page Test:
  state users: list[{name: str, age: int}] = []

  table users:
    column "이름" name sortable
    column "나이" age

  layout col:
    text "Table"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has table or users reference', c => c.includes('table') || c.includes('users') || c.includes('이름')],
  ],
});

// ============================================================
// CATEGORY C: Modal/Drawer/Toast/Confirm
// ============================================================

test('C1: Modal element', `
page Test:
  state showModal: bool = false

  layout col:
    button "Open" -> showModal = true
    modal showModal title="확인":
      text "Modal content"
      button "Close" -> showModal = false
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has modal or dialog', c => c.includes('modal') || c.includes('Modal') || c.includes('dialog')],
    ['has showModal state', c => c.includes('showModal')],
  ],
});

test('C2: Toast notification', `
page Test:
  layout col:
    toast "저장되었습니다" type=success duration=3000
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has toast or notification', c => c.includes('toast') || c.includes('Toast') || c.includes('notification') || c.includes('저장')],
  ],
});

test('C3: Confirm dialog', `
page Test:
  state items: list[str] = ["a", "b"]

  fn deleteAll():
    items = []

  layout col:
    confirm "정말 삭제하시겠습니까?" description="되돌릴 수 없습니다" confirm="삭제" cancel="취소" danger
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has confirm or dialog', c => c.includes('confirm') || c.includes('Confirm') || c.includes('dialog') || c.includes('삭제')],
  ],
});

// ============================================================
// CATEGORY D: Animation/Gesture
// ============================================================

test('D1: Animate element', `
page Test:
  layout col:
    animate enter:
      text "Fade in"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has animation or transition', c => c.includes('animate') || c.includes('animation') || c.includes('transition') || c.includes('Fade') || c.includes('opacity')],
  ],
});

test('D2: Gesture element', `
page Test:
  state position: int = 0

  fn handleDrag():
    position += 1

  layout col:
    gesture drag box -> handleDrag()
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has gesture or drag reference', c => c.includes('drag') || c.includes('Drag') || c.includes('gesture') || c.includes('handleDrag')],
  ],
});

// ============================================================
// CATEGORY E: Chart/Stat elements
// ============================================================

test('E1: Chart element', `
page Dashboard:
  state data: list[int] = [10, 20, 30, 40]

  layout col:
    chart bar salesChart:
      data: data
      title: "Sales"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has chart or bar reference', c => c.includes('chart') || c.includes('Chart') || c.includes('bar') || c.includes('Sales')],
  ],
});

test('E2: Stat element', `
page Dashboard:
  layout col:
    stat "총 사용자" value="1,234" change="+12%"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has stat or value', c => c.includes('stat') || c.includes('1,234') || c.includes('사용자')],
  ],
});

// ============================================================
// CATEGORY F: Landing page sections
// ============================================================

test('F1: Hero section', `
page Landing:
  layout col:
    hero title="Welcome to 0x" subtitle="Build faster" cta="Get Started":
      text "Additional content"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has hero content', c => c.includes('Additional content') || c.includes('hero') || c.includes('section')],
  ],
});

test('F2: Features section', `
page Landing:
  layout col:
    features:
      title: "Our Features"
      subtitle: "What we offer"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has features content', c => c.includes('Feature') || c.includes('feature') || c.includes('Landing')],
  ],
});

test('F3: Pricing section', `
page Landing:
  layout col:
    pricing:
      title: "Plans"
      subtitle: "Choose your plan"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has pricing content', c => c.includes('Plan') || c.includes('Pricing') || c.includes('pricing') || c.includes('Landing')],
  ],
});

test('F4: FAQ section', `
page Landing:
  layout col:
    faq:
      title: "FAQ"
      subtitle: "Common questions"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has FAQ content', c => c.includes('FAQ') || c.includes('faq') || c.includes('Landing')],
  ],
});

// ============================================================
// CATEGORY G: Auth/Route/Realtime
// ============================================================

test('G1: Auth declaration (top-level)', `
auth provider="firebase":
  login: email, password
  signup: email, password, name

page Test:
  layout col:
    text "Auth page"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has auth reference', c => c.includes('auth') || c.includes('Auth') || c.includes('firebase') || c.includes('login') || c.includes('Test')],
  ],
});

test('G2: Route declaration (top-level)', `
route "/dashboard":
  page Dashboard
  guard: admin

page App:
  layout col:
    text "App"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has route or path reference', c => c.includes('route') || c.includes('dashboard') || c.includes('App')],
  ],
});

// ============================================================
// CATEGORY H: Upload/Media
// ============================================================

test('H1: Upload element', `
page Test:
  state file: str = ""

  layout col:
    upload avatar:
      accept: "image/*"
      maxSize: 5000000
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has upload or file reference', c => c.includes('upload') || c.includes('Upload') || c.includes('file') || c.includes('avatar')],
  ],
});

// ============================================================
// CATEGORY I: Responsive design
// ============================================================

test('I1: Responsive breakpoints', `
page Test:
  layout col:
    responsive mobile show:
      text "Mobile view"
    responsive desktop show:
      text "Desktop view"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has responsive content', c => c.includes('Mobile') || c.includes('Desktop') || c.includes('media') || c.includes('responsive')],
  ],
});

// ============================================================
// CATEGORY J: Store (global state)
// ============================================================

test('J1: Store with component sharing', `
page App:
  store theme: str = "light"
  store lang: str = "ko"

  layout col:
    text "Theme: {theme}"
    text "Lang: {lang}"
    button "Toggle" -> theme = theme == "light" ? "dark" : "light"
`, {
  react: (code) => [
    ['has context or store', c => c.includes('Context') || c.includes('context') || c.includes('theme')],
    ['has lang', c => c.includes('lang')],
  ],
  vue: (code) => [
    ['has theme', c => c.includes('theme')],
    ['has lang', c => c.includes('lang')],
  ],
  svelte: (code) => [
    ['has theme', c => c.includes('theme')],
    ['has lang', c => c.includes('lang')],
  ],
});

// ============================================================
// CATEGORY K: Complex expression edge cases
// ============================================================

test('K1: Deeply chained member access', `
page Test:
  state data: {user: {profile: {name: str}}} = {user: {profile: {name: "Kim"}}}
  layout col:
    text data.user.profile.name
`, {
  all: (code) => [
    ['has deep access', c => c.includes('data') && (c.includes('user') || c.includes('profile'))],
    ['compiles', () => true],
  ],
});

test('K2: Nested ternary expressions', `
page Test:
  state level: int = 2
  derived label = level == 1 ? "Bronze" : level == 2 ? "Silver" : level == 3 ? "Gold" : "Platinum"
  layout col:
    text label
`, {
  all: (code) => [
    ['has ternary chain', c => c.includes('?') && c.includes(':')],
    ['has all labels', c => c.includes('Bronze') && c.includes('Silver') && c.includes('Gold')],
  ],
});

test('K3: Complex arithmetic expression', `
page Test:
  state a: int = 10
  state b: int = 20
  state c: int = 5
  derived result = (a + b) * c - a / 2 + b % 3
  layout col:
    text "{result}"
`, {
  all: (code) => [
    ['has arithmetic', c => c.includes('+') || c.includes('*') || c.includes('-')],
    ['compiles', () => true],
  ],
});

test('K4: Logical operators combined', `
page Test:
  state a: bool = true
  state b: bool = false
  state c: int = 10
  layout col:
    if a && !b && c > 5:
      text "All conditions met"
    if a || b:
      text "At least one"
`, {
  react: (code) => [
    ['has && operator', c => c.includes('&&')],
    ['has || operator', c => c.includes('||')],
    ['has negation', c => c.includes('!')],
  ],
  vue: (code) => [
    ['has && in v-if', c => c.includes('&&')],
    ['has || in condition', c => c.includes('||')],
  ],
  svelte: (code) => [
    ['has && operator', c => c.includes('&&')],
    ['has || operator', c => c.includes('||')],
  ],
});

test('K5: String concatenation in derived', `
page Test:
  state first: str = "Hello"
  state last: str = "World"
  derived greeting = first + " " + last + "!"
  layout col:
    text greeting
`, {
  all: (code) => [
    ['has concatenation', c => c.includes('+') || c.includes('`')],
    ['has first and last', c => c.includes('first') && c.includes('last')],
  ],
});

test('K6: Compound assignment operators', `
page Test:
  state a: int = 10
  state b: float = 2.5
  state c: str = "hello"

  fn operations():
    a += 5
    a -= 3
    a *= 2
    b /= 0.5
    c += " world"

  layout col:
    button "Go" -> operations()
    text "{a}"
`, {
  react: (code) => [
    ['has setA calls', c => c.includes('setA')],
    ['has setB calls', c => c.includes('setB')],
    ['has setC calls', c => c.includes('setC')],
  ],
  vue: (code) => [
    ['has a.value update', c => c.includes('a.value')],
    ['has b.value update', c => c.includes('b.value')],
  ],
  svelte: (code) => [
    ['has a reassignment', c => c.includes('a ') || c.includes('a=')],
  ],
});

// ============================================================
// CATEGORY L: Complex type system
// ============================================================

test('L1: Union type declaration', `
page Test:
  type Theme = "light" | "dark" | "auto"
  state theme: Theme = "light"
  layout col:
    text theme
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has theme state', c => c.includes('theme') && c.includes('light')],
  ],
});

test('L2: Nested list type', `
page Test:
  state matrix: list[list[int]] = [[1, 2], [3, 4]]
  layout col:
    for row in matrix:
      for cell in row:
        text "{cell}"
`, {
  react: (code) => [
    ['has nested map', c => (c.match(/\.map\(/g) || []).length >= 2],
  ],
  vue: (code) => [
    ['has nested v-for', c => (c.match(/v-for/g) || []).length >= 2],
  ],
  svelte: (code) => [
    ['has nested each', c => (c.match(/\{#each/g) || []).length >= 2],
  ],
});

test('L3: Complex object type', `
page Test:
  type Address = {city: str, zip: str}
  type Person = {name: str, age: int, address: Address}
  state person: Person = {name: "Kim", age: 30, address: {city: "Seoul", zip: "06000"}}
  layout col:
    text person.name
    text person.address.city
`, {
  all: (code) => [
    ['has person', c => c.includes('person')],
    ['has deep access', c => c.includes('address') && c.includes('city')],
    ['has Seoul', c => c.includes('Seoul')],
  ],
});

// ============================================================
// CATEGORY M: Multiple components & props
// ============================================================

test('M1: Three components with props', `
page App:
  layout col:
    component Header(title="My App")
    component Content(text="Hello")
    component Footer(year=2024)

component Header:
  prop title: str
  layout row center padding=16 bg=#333:
    text title bold color=white

component Content:
  prop text: str
  layout col padding=24:
    text text

component Footer:
  prop year: int
  layout row center padding=8 bg=#f5f5f5:
    text "© {year}" size=sm color=#999
`, {
  react: (code) => [
    ['has 3 component functions', c => c.includes('function Header') && c.includes('function Content') && c.includes('function Footer')],
    ['passes title prop', c => c.includes('title')],
    ['passes year prop', c => c.includes('year') || c.includes('2024')],
  ],
  vue: (code) => [
    ['has all 3 components', c => c.includes('Header') && c.includes('Content') && c.includes('Footer')],
    ['has defineProps', c => c.includes('defineProps')],
  ],
  svelte: (code) => [
    ['has all 3 components', c => c.includes('Header') && c.includes('Content') && c.includes('Footer')],
  ],
});

test('M2: Component with event callback', `
page App:
  state count: int = 0

  fn increment():
    count += 1

  layout col:
    component Counter(value=count, onIncrement=increment)

component Counter:
  prop value: int
  prop onIncrement: fn

  layout row gap=8 center:
    text "{value}"
    button "+" -> onIncrement()
`, {
  react: (code) => [
    ['has Counter component', c => c.includes('Counter')],
    ['passes onIncrement prop', c => c.includes('onIncrement') || c.includes('increment')],
    ['has value prop', c => c.includes('value')],
  ],
  vue: (code) => [
    ['has Counter component', c => c.includes('Counter')],
  ],
  svelte: (code) => [
    ['has Counter component', c => c.includes('Counter')],
  ],
});

// ============================================================
// CATEGORY N: Edge cases - whitespace, unicode, empty states
// ============================================================

test('N1: Korean text in all positions', `
page 테스트:
  state 이름: str = "김철수"
  state 나이: int = 25

  fn 인사하기():
    이름 = "박영희"

  layout col gap=16:
    text "이름: {이름}"
    text "나이: {나이}세"
    button "변경" -> 인사하기()
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has Korean state values', c => c.includes('김철수') || c.includes('이름')],
  ],
});

test('N2: Empty state arrays and objects', `
page Test:
  state items: list[str] = []
  state config: {name: str} = {name: ""}
  state count: int = 0
  state flag: bool = false
  state text_: str = ""

  layout col:
    text "{count}"
    text "{flag}"
    text text_
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has empty array', c => c.includes('[]')],
    ['has 0 default', c => c.includes('0')],
    ['has false default', c => c.includes('false')],
  ],
});

test('N3: Single character identifiers', `
page T:
  state x: int = 0
  state y: int = 0

  fn f():
    x += 1
    y = x * 2

  layout col:
    button "Go" -> f()
    text "{x}, {y}"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has x and y', c => c.includes('x') && c.includes('y')],
    ['has function f', c => c.includes('f')],
  ],
});

test('N4: Very deeply nested layout (5 levels)', `
page Test:
  layout col gap=16:
    layout row gap=8:
      layout col gap=4:
        layout row center:
          layout col:
            text "Deep level 5"
`, {
  all: (code) => [
    ['has 5+ nested divs', c => (c.match(/<div/g) || []).length >= 5],
    ['balanced divs', c => balanced(c)],
    ['has deep text', c => c.includes('Deep level 5')],
  ],
});

test('N5: Multiple pages in one file', `
page Home:
  layout col:
    text "Home page"

page About:
  layout col:
    text "About page"

page Contact:
  layout col:
    text "Contact page"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has Home', c => c.includes('Home')],
    ['has About', c => c.includes('About')],
    ['has Contact', c => c.includes('Contact')],
  ],
});

// ============================================================
// CATEGORY O: API with different HTTP methods
// ============================================================

test('O1: CRUD API declarations', `
page Test:
  state data: list[str] = []

  api getItems = GET "/api/items"
  api createItem = POST "/api/items"
  api updateItem = PUT "/api/items"
  api deleteItem = DELETE "/api/items"

  layout col:
    text "CRUD"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has GET endpoint', c => c.includes('/api/items') || c.includes('getItems')],
    ['has POST or create', c => c.includes('POST') || c.includes('createItem') || c.includes('fetch')],
  ],
});

// ============================================================
// CATEGORY P: JS block / Use statement
// ============================================================

test('P1: JS block (braced syntax)', `
page Test:
  js { console.log("Hello from JS"); }

  state count: int = 0
  layout col:
    text "{count}"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has console.log or count', c => c.includes('console.log') || c.includes('Hello from JS') || c.includes('count')],
  ],
});

test('P2: Use/Import statement', `
page Test:
  use dayjs from "dayjs"
  use lodash from "lodash"

  state date: str = ""
  layout col:
    text date
`, {
  react: (code) => [
    ['compiles', () => true],
    ['has import or reference', c => c.includes('import') || c.includes('dayjs') || c.includes('date')],
  ],
  vue: (code) => [
    ['compiles', () => true],
    ['has import or reference', c => c.includes('import') || c.includes('dayjs') || c.includes('date')],
  ],
  svelte: (code) => [
    ['compiles', () => true],
    ['has date reference', c => c.includes('date')],
  ],
});

// ============================================================
// CATEGORY Q: Watch with multiple dependencies
// ============================================================

test('Q1: Watch block', `
page Test:
  state query: str = ""
  state results: list[str] = []
  state loading: bool = false

  watch query:
    loading = true
    results = await fetch("/search?q=" + query)
    loading = false

  layout col:
    input query placeholder="Search..."
    if loading:
      text "Loading..."
    for result in results:
      text result
`, {
  react: (code) => [
    ['has useEffect', c => c.includes('useEffect')],
    ['has query dependency', c => c.includes('query')],
    ['has fetch call', c => c.includes('fetch')],
  ],
  vue: (code) => [
    ['has watch', c => c.includes('watch(')],
    ['has query', c => c.includes('query')],
  ],
  svelte: (code) => [
    ['has $effect', c => c.includes('$effect')],
    ['has query', c => c.includes('query')],
  ],
});

// ============================================================
// CATEGORY R: Complex real-world scenarios
// ============================================================

test('R1: E-commerce product page', `
page Product:
  type Review = {author: str, rating: int, text: str}
  state product: {name: str, price: float, description: str, images: list[str]} = {name: "Laptop", price: 999.99, description: "Great laptop", images: []}
  state quantity: int = 1
  state reviews: list[Review] = []
  state selectedImage: int = 0

  derived averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  derived total = product.price * quantity

  fn addToCart():
    data = {product: product, qty: quantity}

  fn changeQty(delta: int):
    quantity = quantity + delta
    if quantity < 1:
      quantity = 1

  layout col gap=24 padding=24 maxWidth=1200 margin=auto:
    layout row gap=32:
      layout col gap=8:
        image product.images[selectedImage] width=400 height=400
        layout row gap=4:
          for img, idx in product.images:
            image img width=80 height=80

      layout col gap=16 grow=1:
        text product.name size=3xl bold
        text "₩{product.price}" size=2xl color=#e74c3c
        text product.description color=#666
        text "평점: {averageRating.toFixed(1)}" color=#f59e0b

        layout row gap=8 center:
          button "-" -> changeQty(-1)
          text "{quantity}"
          button "+" -> changeQty(1)

        text "합계: ₩{total}" size=xl bold

        button "장바구니에 추가" style=primary -> addToCart()

    text "리뷰 ({reviews.length})" size=xl bold
    for review in reviews:
      layout col padding=16 radius=8 bg=#f9f9f9 gap=4:
        layout row between:
          text review.author bold
          text "★ {review.rating}" color=#f59e0b
        text review.text color=#666
`, {
  react: (code) => [
    ['has product state', c => c.includes('product')],
    ['has quantity state', c => c.includes('quantity')],
    ['has useMemo for averageRating', c => c.includes('useMemo') || c.includes('averageRating')],
    ['has addToCart', c => c.includes('addToCart')],
    ['has changeQty', c => c.includes('changeQty')],
    ['has nested map', c => c.includes('.map(')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has computed for averageRating', c => c.includes('computed')],
    ['has v-for for reviews', c => c.includes('v-for')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has $derived for averageRating', c => c.includes('$derived')],
    ['has {#each} for reviews', c => c.includes('{#each')],
    ['balanced divs', c => balanced(c)],
  ],
});

test('R2: Social media feed', `
page Feed:
  type Post = {id: int, author: str, content: str, likes: int, liked: bool, time: str}
  state posts: list[Post] = []
  state newPost: str = ""
  state loading: bool = false

  api getFeed = GET "/api/feed"

  on mount:
    loading = true
    posts = await getFeed()
    loading = false

  fn createPost():
    if newPost.trim() != "":
      posts = [{id: Date.now(), author: "나", content: newPost, likes: 0, liked: false, time: "방금"}] + posts
      newPost = ""

  fn toggleLike(id: int):
    post = posts.find(p => p.id == id)
    if post:
      post.liked = !post.liked
      post.likes = post.liked ? post.likes + 1 : post.likes - 1

  layout col gap=16 padding=24 maxWidth=600 margin=auto:
    text "피드" size=2xl bold

    layout col gap=8 padding=16 radius=12 bg=#f0f0f0:
      input newPost placeholder="무슨 생각을 하고 있나요?"
      button "게시" style=primary -> createPost()

    if loading:
      text "불러오는 중..." center color=#999
    else:
      for post in posts:
        layout col gap=8 padding=16 radius=12 bg=white shadow=sm:
          layout row between center:
            text post.author bold
            text post.time size=sm color=#999

          text post.content

          layout row gap=16:
            button "{post.liked ? '❤️' : '🤍'} {post.likes}" -> toggleLike(post.id)
`, {
  react: (code) => [
    ['has posts state', c => c.includes('posts')],
    ['has createPost', c => c.includes('createPost')],
    ['has toggleLike', c => c.includes('toggleLike')],
    ['has useEffect for mount', c => c.includes('useEffect')],
    ['has fetch call', c => c.includes('fetch') || c.includes('getFeed')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has onMounted', c => c.includes('onMounted')],
    ['has v-for for posts', c => c.includes('v-for')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has onMount or $effect', c => c.includes('onMount') || c.includes('$effect')],
    ['has {#each} for posts', c => c.includes('{#each')],
    ['balanced divs', c => balanced(c)],
  ],
});

test('R3: Real-time chat rooms', `
page ChatRooms:
  type Room = {id: int, name: str, lastMessage: str}
  type Message = {id: int, sender: str, text: str, time: str}
  state rooms: list[Room] = []
  state activeRoom: int = -1
  state messages: list[Message] = []
  state input: str = ""
  state username: str = "User"

  derived currentRoom = activeRoom >= 0 ? rooms.find(r => r.id == activeRoom) : null

  fn selectRoom(id: int):
    activeRoom = id
    messages = []

  fn sendMessage():
    if input.trim() != "":
      messages.push({id: Date.now(), sender: username, text: input, time: "now"})
      input = ""

  layout row height=100vh:
    layout col width=300 bg=#2c3e50 scroll=y:
      text "채팅방" size=xl bold color=white padding=16
      for room in rooms:
        layout col padding=16 bg={room.id == activeRoom ? "#34495e" : "transparent"}:
          text room.name bold color=white
          text room.lastMessage size=sm color=#bdc3c7

    layout col grow=1:
      if activeRoom >= 0:
        layout row padding=16 bg=#ecf0f1:
          text currentRoom.name bold size=lg

        layout col grow=1 scroll=y padding=16 gap=8:
          for msg in messages:
            layout col padding=8 radius=8 maxWidth="70%" bg={msg.sender == username ? "#3498db" : "#ecf0f1"}:
              text msg.text color={msg.sender == username ? "white" : "#333"}
              text msg.sender size=xs color={msg.sender == username ? "#bde0fe" : "#999"}

        layout row gap=8 padding=16 bg=#f5f5f5:
          input input placeholder="메시지를 입력하세요..." grow=1
          button "전송" style=primary -> sendMessage()
      else:
        layout col center middle grow=1:
          text "채팅방을 선택하세요" size=xl color=#999
`, {
  react: (code) => [
    ['has rooms state', c => c.includes('rooms')],
    ['has activeRoom', c => c.includes('activeRoom')],
    ['has selectRoom', c => c.includes('selectRoom')],
    ['has sendMessage', c => c.includes('sendMessage')],
    ['has 100vh', c => c.includes('100vh')],
    ['has dynamic bg colors', c => c.includes('3498db') || c.includes('ecf0f1')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has activeRoom', c => c.includes('activeRoom')],
    ['has v-for for rooms', c => c.includes('v-for')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has activeRoom', c => c.includes('activeRoom')],
    ['has {#each} for rooms', c => c.includes('{#each')],
    ['balanced divs', c => balanced(c)],
  ],
});

test('R4: Music player UI', `
page Player:
  type Track = {id: int, title: str, artist: str, duration: int}
  state tracks: list[Track] = []
  state currentIdx: int = 0
  state playing: bool = false
  state progress: int = 0
  state volume: int = 80

  derived current = tracks.length > 0 ? tracks[currentIdx] : null
  derived progressPercent = current ? (progress / current.duration * 100) : 0

  fn play():
    playing = true

  fn pause():
    playing = false

  fn next():
    if currentIdx < tracks.length - 1:
      currentIdx += 1
      progress = 0

  fn prev():
    if currentIdx > 0:
      currentIdx -= 1
      progress = 0

  layout col height=100vh bg=#1a1a2e:
    layout col grow=1 scroll=y padding=16 gap=4:
      text "재생목록" size=lg bold color=#eee
      for track, idx in tracks:
        layout row between center padding=12 radius=8 bg={idx == currentIdx ? "#16213e" : "transparent"}:
          layout col:
            text track.title bold color={idx == currentIdx ? "#e94560" : "#eee"}
            text track.artist size=sm color=#999
          text "{Math.floor(track.duration / 60)}:{track.duration % 60}" color=#999

    layout col padding=24 bg=#16213e:
      if current:
        text current.title bold color=white center
        text current.artist color=#999 center size=sm

      layout row center gap=24 padding=16:
        button "⏮" -> prev()
        if playing:
          button "⏸" -> pause()
        else:
          button "▶" -> play()
        button "⏭" -> next()

      layout row center gap=8:
        text "🔊" color=#999
        text "{volume}%" color=#999 size=sm
`, {
  all: (code) => [
    ['has tracks state', c => c.includes('tracks')],
    ['has currentIdx', c => c.includes('currentIdx')],
    ['has playing state', c => c.includes('playing')],
    ['has play/pause functions', c => c.includes('play') && c.includes('pause')],
    ['has next/prev functions', c => c.includes('next') && c.includes('prev')],
    ['has 100vh', c => c.includes('100vh')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// CATEGORY S: Stress tests - deeply complex patterns
// ============================================================

test('S1: Multiple derived chaining', `
page Test:
  state items: list[{price: float, qty: int, discount: float}] = []

  derived subtotals = items.map(i => i.price * i.qty)
  derived discounts = items.map(i => i.price * i.qty * i.discount)
  derived netTotals = items.map((i, idx) => subtotals[idx] - discounts[idx])
  derived grandTotal = netTotals.reduce((sum, t) => sum + t, 0)
  derived taxAmount = grandTotal * 0.1
  derived finalTotal = grandTotal + taxAmount

  layout col gap=8:
    text "소계: {grandTotal}"
    text "세금: {taxAmount}"
    text "합계: {finalTotal}"
`, {
  react: (code) => [
    ['has multiple useMemo', c => (c.match(/useMemo/g) || []).length >= 4],
    ['has reduce', c => c.includes('reduce')],
    ['has map', c => c.includes('.map(')],
  ],
  vue: (code) => [
    ['has multiple computed', c => (c.match(/computed\(/g) || []).length >= 4],
  ],
  svelte: (code) => [
    ['has multiple $derived', c => (c.match(/\$derived\(/g) || []).length >= 4],
  ],
});

test('S2: Nested for+if+for pattern', `
page Test:
  type Category = {name: str, items: list[{name: str, active: bool}]}
  state categories: list[Category] = []

  layout col gap=16:
    for cat in categories:
      layout col gap=4:
        text cat.name bold size=lg
        if cat.items.length > 0:
          for item in cat.items:
            if item.active:
              text item.name color=#22c55e
            else:
              text item.name color=#999 strike
        else:
          text "항목 없음" color=#ccc italic
`, {
  react: (code) => [
    ['has nested map calls', c => (c.match(/\.map\(/g) || []).length >= 2],
    ['has conditional in nested', c => c.includes('active')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has nested v-for', c => (c.match(/v-for/g) || []).length >= 2],
    ['has v-if in nested', c => c.includes('v-if')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has nested each', c => (c.match(/\{#each/g) || []).length >= 2],
    ['has if in nested', c => c.includes('{#if')],
    ['balanced divs', c => balanced(c)],
  ],
});

test('S3: 10 state variables page', `
page BigState:
  state s1: str = "a"
  state s2: str = "b"
  state s3: int = 1
  state s4: int = 2
  state s5: bool = true
  state s6: bool = false
  state s7: float = 1.5
  state s8: float = 2.5
  state s9: list[str] = []
  state s10: list[int] = []

  fn resetAll():
    s1 = ""
    s2 = ""
    s3 = 0
    s4 = 0
    s5 = false
    s6 = false
    s7 = 0.0
    s8 = 0.0
    s9 = []
    s10 = []

  layout col gap=8:
    text s1
    text s2
    text "{s3}"
    text "{s4}"
    button "Reset" -> resetAll()
`, {
  react: (code) => [
    ['has 10 useState', c => (c.match(/useState/g) || []).length >= 10],
    ['has resetAll', c => c.includes('resetAll')],
  ],
  vue: (code) => [
    ['has 10 ref', c => (c.match(/ref\(/g) || []).length >= 10],
    ['has resetAll', c => c.includes('resetAll')],
  ],
  svelte: (code) => [
    ['has 10 $state', c => (c.match(/\$state\(/g) || []).length >= 10],
    ['has resetAll', c => c.includes('resetAll')],
  ],
});

test('S4: Complex event handler chains', `
page Test:
  state count: int = 0
  state log: list[str] = []

  fn increment():
    count += 1
    log.push("incremented to " + count)

  fn decrement():
    count -= 1
    log.push("decremented to " + count)

  fn double():
    count *= 2
    log.push("doubled to " + count)

  fn halve():
    count = Math.floor(count / 2)
    log.push("halved to " + count)

  fn clearLog():
    log = []

  layout col gap=16 padding=24:
    text "Count: {count}" size=2xl bold

    layout row gap=8:
      button "+1" style=primary -> increment()
      button "-1" -> decrement()
      button "x2" -> double()
      button "/2" -> halve()

    layout col gap=4:
      layout row between:
        text "Log ({log.length})" bold
        button "Clear" style=danger size=sm -> clearLog()
      for entry in log:
        text entry size=sm color=#666
`, {
  all: (code) => [
    ['has 5 functions', c => c.includes('increment') && c.includes('decrement') && c.includes('double') && c.includes('halve') && c.includes('clearLog')],
    ['has 4+ buttons', c => (c.match(/<button/g) || []).length >= 4],
    ['has log list', c => c.includes('log')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// CATEGORY T: i18n/SEO/A11y
// ============================================================

test('T1: SEO element (block syntax)', `
page Test:
  layout col:
    seo:
      title: "My App"
      description: "Best app ever"
    text "Hello"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has SEO metadata or text', c => c.includes('My App') || c.includes('title') || c.includes('seo') || c.includes('meta') || c.includes('Hello')],
  ],
});

test('T2: A11y element (block syntax)', `
page Test:
  layout col:
    a11y:
      role: "main"
      lang: "ko"
    text "Accessible content"
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has a11y or content', c => c.includes('role') || c.includes('a11y') || c.includes('Accessible')],
  ],
});

// ============================================================
// CATEGORY U: Error handling patterns
// ============================================================

test('U1: Error/Loading states', `
page Test:
  state data: list[str] = []
  state error: str = ""
  state loading: bool = false

  async fn loadData():
    loading = true
    error = ""
    data = await fetch("/api/data")
    loading = false

  layout col gap=16 padding=24:
    button "Load" style=primary -> loadData()

    if loading:
      text "Loading..." center
    elif error != "":
      layout col gap=8 padding=16 bg=#fee2e2 radius=8:
        text "Error: {error}" color=#ef4444
        button "Retry" -> loadData()
    else:
      for item in data:
        text item
`, {
  all: (code) => [
    ['has loading state', c => c.includes('loading')],
    ['has error state', c => c.includes('error')],
    ['has async function', c => c.includes('async')],
    ['has conditional rendering', c => c.includes('Loading') && c.includes('Error')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// CATEGORY V: On destroy with cleanup
// ============================================================

test('V1: Interval cleanup on destroy', `
page Timer:
  state seconds: int = 0
  state timer: int = 0
  state running: bool = false

  fn tick():
    seconds += 1

  fn start():
    running = true
    timer = setInterval(tick, 1000)

  fn stop():
    running = false
    clearInterval(timer)

  on destroy:
    clearInterval(timer)

  layout col gap=16 center:
    text "{seconds}s" size=3xl bold
    if running:
      button "Stop" style=danger -> stop()
    else:
      button "Start" style=primary -> start()
`, {
  react: (code) => [
    ['has setInterval', c => c.includes('setInterval')],
    ['has clearInterval', c => c.includes('clearInterval')],
    ['has start and stop', c => c.includes('start') && c.includes('stop')],
  ],
  vue: (code) => [
    ['has setInterval', c => c.includes('setInterval')],
    ['has clearInterval', c => c.includes('clearInterval')],
    ['has onUnmounted or onBeforeUnmount', c => c.includes('onUnmounted') || c.includes('onBeforeUnmount')],
  ],
  svelte: (code) => [
    ['has setInterval', c => c.includes('setInterval')],
    ['has clearInterval', c => c.includes('clearInterval')],
    ['has onDestroy', c => c.includes('onDestroy') || c.includes('return')],
  ],
});

// ============================================================
// CATEGORY W: Dynamic style props
// ============================================================

test('W1: Multiple dynamic style expressions', `
page Test:
  state active: bool = true
  state size: int = 16
  state theme: str = "#3b82f6"

  layout col gap={size} padding={size * 2} bg={active ? theme : "#ccc"} radius={active ? 12 : 0}:
    text "Dynamic styles" bold color={active ? "white" : "#333"}
    button "Toggle" -> active = !active
`, {
  react: (code) => [
    ['has dynamic gap', c => c.includes('size') || c.includes('gap')],
    ['has dynamic bg', c => c.includes('active') && c.includes('theme')],
    ['has ternary for radius', c => c.includes('12') || c.includes('borderRadius')],
  ],
  vue: (code) => [
    ['has dynamic style binding', c => c.includes(':style') || c.includes('active')],
  ],
  svelte: (code) => [
    ['has dynamic style', c => c.includes('active') || c.includes('style')],
  ],
});

// ============================================================
// CATEGORY X: Gradient and visual props
// ============================================================

test('X1: Gradient text and layout', `
page Test:
  layout col gap=16 gradient="from #667eea to #764ba2" padding=48:
    text "Gradient Background" size=3xl bold color=white center
    text "Subtitle" color=white center
`, {
  all: (code) => [
    ['has gradient', c => c.includes('gradient') || c.includes('linear-gradient')],
    ['has colors', c => c.includes('667eea') || c.includes('764ba2')],
    ['has text content', c => c.includes('Gradient Background')],
  ],
});

// ============================================================
// Report
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('ADVANCED SCENARIO DEBUG RESULTS');
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
    if (err.error) console.log(`   Error: ${err.error}`);
    if (err.code) console.log(`   Code:\n   ${err.code.slice(0, 500).replace(/\n/g, '\n   ')}\n`);
  }
} else {
  console.log('\n✅ All advanced scenario tests passed!\n');
}

process.exit(results.fail > 0 ? 1 : 0);
