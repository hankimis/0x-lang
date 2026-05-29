// Advanced scenario debugging for 0x compiler v0.1.4
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
          results.errors.push({ label, desc, code: code.slice(0, 600) });
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

// Helper: count balanced tags
const balanced = (code, tag = 'div') => {
  const opens = (code.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
  const closes = (code.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  return opens === closes;
};

// ============================================================
// SCENARIO 1: Login form page
// ============================================================
test('S1: Login form page', `
page Login:
  state email: str = ""
  state password: str = ""
  state error: str = ""
  state loading: bool = false

  async fn handleLogin():
    loading = true
    error = ""
    result = await fetch("/api/login")
    if result.ok:
      redirect("/dashboard")
    else:
      error = "로그인 실패"
    loading = false

  layout col gap=24 padding=32 maxWidth=400 margin=auto:
    text "로그인" size=3xl bold center

    if error != "":
      text error color=#ef4444

    layout col gap=12:
      input email placeholder="이메일" type="email"
      input password placeholder="비밀번호" type="password"

    button "로그인" style=primary -> handleLogin()

    if loading:
      text "처리 중..." center color=#999
`, {
  react: (code) => [
    ['has useState x4', c => (c.match(/useState/g) || []).length >= 4],
    ['has async function', c => c.includes('async')],
    ['has error display', c => c.includes('error') && c.includes('ef4444')],
    ['has email input', c => c.includes('email')],
    ['has password input', c => c.includes('password')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has ref x4', c => (c.match(/ref\(/g) || []).length >= 4],
    ['has async function', c => c.includes('async')],
    ['has v-model for email', c => c.includes('v-model="email"')],
    ['has v-model for password', c => c.includes('v-model="password"')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has $state x4', c => (c.match(/\$state\(/g) || []).length >= 4],
    ['has async function', c => c.includes('async')],
    ['has bind:value for email', c => c.includes('bind:value={email}')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 2: Kanban board with drag states
// ============================================================
test('S2: Kanban board', `
page Kanban:
  type Task = {id: int, title: str, status: str}
  state tasks: list[Task] = []
  state newTask: str = ""

  derived todo = tasks.filter(t => t.status == "todo")
  derived doing = tasks.filter(t => t.status == "doing")
  derived done = tasks.filter(t => t.status == "done")

  fn addTask():
    if newTask.trim() != "":
      tasks.push({id: Date.now(), title: newTask, status: "todo"})
      newTask = ""

  fn moveTask(id: int, status: str):
    task = tasks.find(t => t.id == id)
    if task:
      task.status = status

  fn deleteTask(id: int):
    tasks = tasks.filter(t => t.id != id)

  layout col gap=16 padding=24:
    text "칸반 보드" size=2xl bold

    layout row gap=8:
      input newTask placeholder="새 작업..."
      button "추가" style=primary -> addTask()

    layout grid cols=3 gap=16:
      layout col gap=8 padding=16 bg=#f8f9fa radius=8:
        text "할 일 ({todo.length})" bold
        for task in todo:
          layout col padding=12 bg=white radius=6 shadow=sm:
            text task.title
            layout row gap=4:
              button "→" size=sm -> moveTask(task.id, "doing")
              button "✗" style=danger size=sm -> deleteTask(task.id)

      layout col gap=8 padding=16 bg=#fff3cd radius=8:
        text "진행 중 ({doing.length})" bold
        for task in doing:
          layout col padding=12 bg=white radius=6 shadow=sm:
            text task.title
            layout row gap=4:
              button "←" size=sm -> moveTask(task.id, "todo")
              button "→" size=sm -> moveTask(task.id, "done")

      layout col gap=8 padding=16 bg=#d4edda radius=8:
        text "완료 ({done.length})" bold
        for task in done:
          layout col padding=12 bg=white radius=6 shadow=sm:
            text task.title strike
            button "←" size=sm -> moveTask(task.id, "doing")
`, {
  react: (code) => [
    ['has 3 derived filters', c => (c.match(/useMemo/g) || []).length >= 3],
    ['has addTask function', c => c.includes('addTask')],
    ['has moveTask function', c => c.includes('moveTask')],
    ['has deleteTask function', c => c.includes('deleteTask')],
    ['has grid layout', c => c.includes('grid')],
    ['balanced divs', c => balanced(c)],
    ['has strike style', c => c.includes('textDecoration') || c.includes('line-through')],
  ],
  vue: (code) => [
    ['has 3 computed', c => (c.match(/computed\(/g) || []).length >= 3],
    ['has grid layout', c => c.includes('grid')],
    ['balanced divs', c => balanced(c)],
    ['has v-for for tasks', c => (c.match(/v-for/g) || []).length >= 3],
  ],
  svelte: (code) => [
    ['has 3 $derived', c => (c.match(/\$derived\(/g) || []).length >= 3],
    ['has grid layout', c => c.includes('grid')],
    ['balanced divs', c => balanced(c)],
    ['has {#each} x3', c => (c.match(/\{#each/g) || []).length >= 3],
  ],
});

// ============================================================
// SCENARIO 3: Settings page with multiple toggles
// ============================================================
test('S3: Settings with toggles', `
page Settings:
  state darkMode: bool = false
  state notifications: bool = true
  state autoSave: bool = true
  state language: str = "ko"

  fn saveSettings():
    data = {dark: darkMode, notif: notifications, auto: autoSave, lang: language}

  layout col gap=24 padding=32 maxWidth=600 margin=auto:
    text "설정" size=2xl bold

    layout col gap=16:
      layout row between center:
        text "다크 모드"
        toggle darkMode

      layout row between center:
        text "알림"
        toggle notifications

      layout row between center:
        text "자동 저장"
        toggle autoSave

      layout row between center:
        text "언어"
        select language options=["ko", "en", "ja"]

    button "저장" style=primary -> saveSettings()
`, {
  react: (code) => [
    ['has 3 toggle checkboxes', c => (c.match(/type="checkbox"/g) || []).length >= 3],
    ['has select element', c => c.includes('<select')],
    ['has space-between', c => (c.match(/space-between/g) || []).length >= 4],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has 3 v-model checkboxes', c => (c.match(/v-model/g) || []).length >= 4], // 3 toggles + 1 select
    ['has select', c => c.includes('<select')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has 3 bind:checked', c => (c.match(/bind:checked/g) || []).length >= 3],
    ['has select with bind:value', c => c.includes('bind:value')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 4: Nested component with multiple props
// ============================================================
test('S4: Component with named props', `
page Profile:
  state user: {name: str, email: str, bio: str} = {name: "Kim", email: "kim@test.com", bio: "Hello"}

  layout col gap=16 padding=24:
    component UserCard(name=user.name, email=user.email)
    component BioSection(text=user.bio)

component UserCard:
  prop name: str
  prop email: str

  layout col gap=8 padding=16 radius=12 shadow=md bg=white:
    text name size=xl bold
    text email color=#666

component BioSection:
  prop text: str

  layout col padding=16:
    text "소개" size=lg bold
    text text
`, {
  react: (code) => [
    ['has UserCard component', c => c.includes('function UserCard')],
    ['has BioSection component', c => c.includes('function BioSection')],
    ['passes name prop', c => c.includes('name=')],
    ['passes email prop', c => c.includes('email=')],
    ['UserCard has shadow', c => c.includes('boxShadow') || c.includes('box-shadow')],
  ],
  vue: (code) => [
    ['has UserCard usage', c => c.includes('UserCard')],
    ['has BioSection usage', c => c.includes('BioSection')],
    ['has defineProps', c => c.includes('defineProps')],
  ],
  svelte: (code) => [
    ['has UserCard usage', c => c.includes('UserCard')],
    ['has $props', c => c.includes('$props')],
  ],
});

// ============================================================
// SCENARIO 5: Deeply nested control flow
// ============================================================
test('S5: Nested if inside for inside if', `
page DataView:
  state items: list[{name: str, category: str, active: bool}] = []
  state showAll: bool = false
  state search: str = ""

  derived filtered = showAll ? items : items.filter(i => i.active)

  layout col gap=16 padding=24:
    layout row gap=8:
      input search placeholder="검색..."
      toggle showAll

    if filtered.length > 0:
      for item in filtered:
        if item.category == "important":
          layout row gap=8 center bg=#fff3cd padding=8 radius=4:
            text "★" color=#f59e0b
            text item.name bold
        elif item.category == "urgent":
          layout row gap=8 center bg=#fee2e2 padding=8 radius=4:
            text "!" color=#ef4444
            text item.name bold color=#ef4444
        else:
          layout row gap=8 center padding=8:
            text item.name
    else:
      text "항목이 없습니다" center color=#999
`, {
  react: (code) => [
    ['has nested ternary or conditions', c => c.includes('important') && c.includes('urgent')],
    ['has map for filtered', c => c.includes('.map(')],
    ['has star char', c => c.includes('★')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has v-for', c => c.includes('v-for')],
    ['has v-if/v-else-if/v-else', c => c.includes('v-if') && c.includes('v-else-if') && c.includes('v-else')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has {#each}', c => c.includes('{#each')],
    ['has {#if}/{:else if}/{:else}', c => c.includes('{#if') && c.includes('{:else if') && c.includes('{:else}')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 6: Multi-API dashboard
// ============================================================
test('S6: Dashboard with multiple APIs', `
page Dashboard:
  state users: list[str] = []
  state posts: list[str] = []
  state loading: bool = true
  state activeTab: str = "users"

  api getUsers = GET "/api/users"
  api getPosts = GET "/api/posts"

  on mount:
    users = await getUsers()
    posts = await getPosts()
    loading = false

  layout col gap=24 padding=32:
    text "관리자 대시보드" size=3xl bold

    layout row gap=8:
      button "사용자" -> activeTab = "users"
      button "게시물" -> activeTab = "posts"

    if loading:
      text "로딩 중..." center
    else:
      if activeTab == "users":
        text "사용자 ({users.length}명)" size=xl bold
        for user in users:
          text user
      else:
        text "게시물 ({posts.length}개)" size=xl bold
        for post in posts:
          text post
`, {
  react: (code) => [
    ['has 2 API functions', c => c.includes('getUsers') && c.includes('getPosts')],
    ['has useEffect for mount', c => c.includes('useEffect')],
    ['has tab switching', c => c.includes('activeTab')],
    ['has conditional rendering', c => c.includes('users') && c.includes('posts')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has 2 API functions', c => c.includes('getUsers') && c.includes('getPosts')],
    ['has onMounted', c => c.includes('onMounted')],
    ['has tab switching', c => c.includes('activeTab')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has 2 API functions', c => c.includes('getUsers') && c.includes('getPosts')],
    ['has onMount or $effect', c => c.includes('onMount') || c.includes('$effect')],
    ['has tab switching', c => c.includes('activeTab')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 7: Shopping cart with computed totals
// ============================================================
test('S7: Shopping cart', `
page Cart:
  type CartItem = {id: int, name: str, price: float, qty: int}

  state items: list[CartItem] = []
  state coupon: str = ""

  derived subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  derived discount = coupon == "SAVE10" ? subtotal * 0.1 : 0
  derived total = subtotal - discount

  fn updateQty(id: int, delta: int):
    item = items.find(i => i.id == id)
    if item:
      item.qty = item.qty + delta
      if item.qty <= 0:
        items = items.filter(i => i.id != id)

  fn removeItem(id: int):
    items = items.filter(i => i.id != id)

  layout col gap=16 padding=24 maxWidth=800 margin=auto:
    text "장바구니" size=2xl bold

    if items.length == 0:
      text "장바구니가 비어있습니다" center color=#999
    else:
      for item in items:
        layout row between center padding=12 bg=white radius=8 shadow=sm:
          layout col:
            text item.name bold
            text "₩{item.price}" color=#666

          layout row gap=8 center:
            button "-" -> updateQty(item.id, -1)
            text "{item.qty}"
            button "+" -> updateQty(item.id, 1)
            button "삭제" style=danger size=sm -> removeItem(item.id)

      layout col gap=8 padding=16 bg=#f8f9fa radius=8:
        layout row between:
          text "소계"
          text "₩{subtotal}"
        if discount > 0:
          layout row between:
            text "할인" color=#22c55e
            text "-₩{discount}" color=#22c55e
        layout row between:
          text "합계" bold size=lg
          text "₩{total}" bold size=lg color=#e74c3c

      layout row gap=8:
        input coupon placeholder="쿠폰 코드"
        button "결제하기" style=primary
`, {
  react: (code) => [
    ['has reduce for subtotal', c => c.includes('reduce')],
    ['has discount logic', c => c.includes('SAVE10') || c.includes('discount')],
    ['has updateQty', c => c.includes('updateQty')],
    ['has removeItem', c => c.includes('removeItem')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has computed for totals', c => (c.match(/computed\(/g) || []).length >= 3],
    ['has discount logic', c => c.includes('SAVE10') || c.includes('discount')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has $derived for totals', c => (c.match(/\$derived\(/g) || []).length >= 3],
    ['has discount logic', c => c.includes('SAVE10') || c.includes('discount')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 8: Chat with message alignment
// ============================================================
test('S8: Chat with sender alignment', `
page Chat:
  type Msg = {id: int, text: str, sender: str}
  state messages: list[Msg] = []
  state input: str = ""
  state username: str = "나"

  fn send():
    if input.trim() != "":
      messages.push({id: Date.now(), text: input, sender: username})
      input = ""

  layout col height=100vh:
    layout row center padding=16 bg=#075e54:
      text "채팅" bold color=white

    layout col gap=8 padding=16 scroll=y grow=1:
      for msg in messages:
        layout col padding=12 radius=12 maxWidth="70%" bg={msg.sender == username ? "#dcf8c6" : "white"} shadow=sm:
          text msg.text
          text msg.sender size=xs color=#999

    layout row gap=8 padding=16 bg=#f0f0f0:
      input input placeholder="메시지..." grow=1
      button "전송" style=primary -> send()
`, {
  react: (code) => [
    ['has 100vh height', c => c.includes('100vh')],
    ['has overflow/scroll', c => c.includes('overflow')],
    ['has grow', c => c.includes('flexGrow') || c.includes('flex-grow')],
    ['has dynamic bg', c => c.includes('dcf8c6')],
    ['has border-radius 12', c => c.includes('12')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has 100vh', c => c.includes('100vh')],
    ['has overflow/scroll', c => c.includes('overflow')],
    ['has dynamic :style', c => c.includes(':style')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has 100vh', c => c.includes('100vh')],
    ['has overflow/scroll', c => c.includes('overflow')],
    ['has dynamic bg', c => c.includes('dcf8c6')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 9: Multi-step wizard form
// ============================================================
test('S9: Multi-step form', `
page Wizard:
  state step: int = 1
  state name: str = ""
  state email: str = ""
  state phone: str = ""

  fn nextStep():
    if step < 3:
      step += 1

  fn prevStep():
    if step > 1:
      step -= 1

  fn submit():
    data = {name: name, email: email, phone: phone}

  layout col gap=24 padding=32 maxWidth=500 margin=auto:
    text "회원가입 ({step}/3)" size=2xl bold center

    if step == 1:
      layout col gap=12:
        text "이름을 입력하세요" color=#666
        input name placeholder="이름"
        button "다음" style=primary -> nextStep()

    elif step == 2:
      layout col gap=12:
        text "연락처를 입력하세요" color=#666
        input email placeholder="이메일" type="email"
        input phone placeholder="전화번호" type="tel"
        layout row gap=8:
          button "이전" -> prevStep()
          button "다음" style=primary -> nextStep()

    elif step == 3:
      layout col gap=12:
        text "확인" size=lg bold
        text "이름: {name}"
        text "이메일: {email}"
        text "전화: {phone}"
        layout row gap=8:
          button "이전" -> prevStep()
          button "완료" style=primary -> submit()
`, {
  react: (code) => [
    ['has step state', c => c.includes('step')],
    ['has 3 step conditions', c => c.includes('1') && c.includes('2') && c.includes('3')],
    ['has nextStep function', c => c.includes('nextStep')],
    ['has prevStep function', c => c.includes('prevStep')],
    ['has template for name display', c => c.includes('name')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has step ref', c => c.includes('step')],
    ['has v-if for steps', c => c.includes('v-if')],
    ['has v-else-if', c => c.includes('v-else-if')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has step $state', c => c.includes('step')],
    ['has {#if}/{:else if}', c => c.includes('{#if') && c.includes('{:else if')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 10: Data table with sorting
// ============================================================
test('S10: Sortable data table', `
page Users:
  type User = {id: int, name: str, age: int, role: str}
  state users: list[User] = []
  state sortBy: str = "name"
  state sortAsc: bool = true
  state search: str = ""

  derived filtered = users.filter(u => u.name.includes(search) || u.role.includes(search))
  derived sorted = sortAsc ? filtered.sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1) : filtered.sort((a, b) => a[sortBy] < b[sortBy] ? 1 : -1)

  fn toggleSort(field: str):
    if sortBy == field:
      sortAsc = !sortAsc
    else:
      sortBy = field
      sortAsc = true

  layout col gap=16 padding=24:
    text "사용자 관리" size=2xl bold

    input search placeholder="검색..."

    layout col bg=white radius=8 shadow=md:
      layout row bg=#f8f9fa padding=12:
        button "이름" -> toggleSort("name")
        button "나이" -> toggleSort("age")
        button "역할" -> toggleSort("role")

      for user in sorted:
        layout row padding=12 between center:
          text user.name bold
          text "{user.age}"
          text user.role color=#666

    text "{filtered.length}명 표시 중" size=sm color=#999
`, {
  react: (code) => [
    ['has sort logic', c => c.includes('sort')],
    ['has toggleSort', c => c.includes('toggleSort')],
    ['has filter with search', c => c.includes('filter') && c.includes('includes')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has computed for filtered', c => c.includes('computed')],
    ['has toggleSort', c => c.includes('toggleSort')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has $derived', c => c.includes('$derived')],
    ['has toggleSort', c => c.includes('toggleSort')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 11: Image gallery with preview
// ============================================================
test('S11: Image gallery', `
page Gallery:
  type Photo = {id: int, url: str, title: str}
  state photos: list[Photo] = []
  state selected: int = -1

  derived current = selected >= 0 ? photos[selected] : null

  fn selectPhoto(idx: int):
    selected = idx

  fn closePreview():
    selected = -1

  fn nextPhoto():
    if selected < photos.length - 1:
      selected += 1

  fn prevPhoto():
    if selected > 0:
      selected -= 1

  layout col gap=16 padding=24:
    text "갤러리" size=2xl bold

    layout grid cols=3 gap=8:
      for photo, idx in photos:
        image photo.url width="100%" height=200

    if selected >= 0:
      layout col center middle bg="rgba(0,0,0,0.8)" padding=32:
        image current.url width="80%"
        text current.title color=white size=lg
        layout row gap=16:
          button "◀" -> prevPhoto()
          button "닫기" -> closePreview()
          button "▶" -> nextPhoto()
`, {
  all: (code) => [
    ['compiles', () => true],
    ['has photos loop', c => c.includes('photo')],
    ['has selected state', c => c.includes('selected')],
    ['has navigation functions', c => c.includes('nextPhoto') && c.includes('prevPhoto')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 12: Accordion/FAQ pattern
// ============================================================
test('S12: Accordion FAQ', `
page FAQ:
  state active: int = -1

  fn toggle(idx: int):
    if active == idx:
      active = -1
    else:
      active = idx

  layout col gap=8 padding=24 maxWidth=600 margin=auto:
    text "자주 묻는 질문" size=2xl bold center

    layout col gap=4:
      button "Q1: 0x란 무엇인가요?" -> toggle(0)
      if active == 0:
        text "0x는 AI 친화적 프로그래밍 언어입니다." color=#666

      button "Q2: 어떤 프레임워크를 지원하나요?" -> toggle(1)
      if active == 1:
        text "React, Vue, Svelte를 지원합니다." color=#666

      button "Q3: 무료인가요?" -> toggle(2)
      if active == 2:
        text "네, 오픈소스이며 무료입니다." color=#666
`, {
  react: (code) => [
    ['has toggle function', c => c.includes('toggle')],
    ['has active state', c => c.includes('active')],
    ['has 3 conditions', c => (c.match(/active/g) || []).length >= 4],
    ['has Korean text', c => c.includes('0x') || c.includes('무엇')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has toggle function', c => c.includes('toggle')],
    ['has v-if for answers', c => (c.match(/v-if/g) || []).length >= 3],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has toggle function', c => c.includes('toggle')],
    ['has {#if} for answers', c => (c.match(/\{#if/g) || []).length >= 3],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 13: Timer/Stopwatch
// ============================================================
test('S13: Stopwatch', `
page Stopwatch:
  state time: int = 0
  state running: bool = false
  state timer: int = 0

  derived minutes = Math.floor(time / 60)
  derived seconds = time % 60
  derived display = minutes + ":" + (seconds < 10 ? "0" : "") + seconds

  fn start():
    running = true

  fn stop():
    running = false

  fn reset():
    running = false
    time = 0

  layout col gap=16 padding=32 center:
    text display size=3xl bold
    layout row gap=8:
      if running:
        button "정지" style=danger -> stop()
      else:
        button "시작" style=primary -> start()
      button "초기화" -> reset()
`, {
  all: (code) => [
    ['has time state', c => c.includes('time')],
    ['has running state', c => c.includes('running')],
    ['has start function', c => c.includes('start')],
    ['has stop function', c => c.includes('stop')],
    ['has reset function', c => c.includes('reset')],
    ['has Math.floor', c => c.includes('Math.floor')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 14: Theme switcher with dynamic styles
// ============================================================
test('S14: Theme switcher', `
page Theme:
  state dark: bool = false

  derived bgColor = dark ? "#1a1a2e" : "#ffffff"
  derived textColor = dark ? "#eee" : "#333"
  derived btnBg = dark ? "#e94560" : "#3b82f6"

  fn toggleTheme():
    dark = !dark

  layout col gap=16 padding=32 bg={bgColor}:
    text "테마 전환 데모" size=2xl bold color={textColor}
    text "현재: {dark ? '다크' : '라이트'}" color={textColor}
    button "테마 변경" -> toggleTheme()
`, {
  react: (code) => [
    ['has dark state', c => c.includes('dark')],
    ['has dynamic bg', c => c.includes('bgColor') || c.includes('backgroundColor')],
    ['has dynamic text color', c => c.includes('textColor') || c.includes('color')],
    ['has ternary for theme', c => c.includes('1a1a2e') || c.includes('dark')],
    ['balanced divs', c => balanced(c)],
  ],
  vue: (code) => [
    ['has dynamic :style', c => c.includes(':style')],
    ['has dark computed', c => c.includes('dark') || c.includes('bgColor')],
    ['balanced divs', c => balanced(c)],
  ],
  svelte: (code) => [
    ['has dynamic style', c => c.includes('bgColor') || c.includes('{bgColor}') || c.includes('background')],
    ['has dark state', c => c.includes('dark')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 15: Pagination pattern
// ============================================================
test('S15: Paginated list', `
page PaginatedList:
  state items: list[str] = []
  state page: int = 1
  state perPage: int = 10

  derived totalPages = Math.ceil(items.length / perPage)
  derived start = (page - 1) * perPage
  derived pageItems = items.slice(start, start + perPage)

  fn prevPage():
    if page > 1:
      page -= 1

  fn nextPage():
    if page < totalPages:
      page += 1

  layout col gap=16 padding=24:
    text "목록 ({items.length}개)" size=xl bold

    for item in pageItems:
      layout row padding=8 between:
        text item

    layout row gap=8 center:
      button "◀ 이전" -> prevPage()
      text "{page} / {totalPages}"
      button "다음 ▶" -> nextPage()
`, {
  all: (code) => [
    ['has page state', c => c.includes('page')],
    ['has Math.ceil', c => c.includes('Math.ceil')],
    ['has slice', c => c.includes('slice')],
    ['has prevPage', c => c.includes('prevPage')],
    ['has nextPage', c => c.includes('nextPage')],
    ['balanced divs', c => balanced(c)],
  ],
});

// ============================================================
// SCENARIO 16: Multi-component layout
// ============================================================
test('S16: Header + Content + Footer layout', `
page App:
  state loggedIn: bool = false

  layout col height=100vh:
    component Header()
    layout col grow=1 padding=24:
      if loggedIn:
        text "환영합니다!" size=2xl
      else:
        text "로그인해 주세요" size=2xl
    component Footer()

component Header:
  layout row between center padding=16 bg=#333:
    text "MyApp" bold color=white size=lg
    layout row gap=8:
      button "홈"
      button "소개"
      button "연락처"

component Footer:
  layout row center padding=16 bg=#f5f5f5:
    text "© 2024 MyApp" size=sm color=#999
`, {
  react: (code) => [
    ['has Header component', c => c.includes('Header')],
    ['has Footer component', c => c.includes('Footer')],
    ['has 100vh', c => c.includes('100vh')],
    ['has flexGrow', c => c.includes('flexGrow') || c.includes('flex')],
  ],
  vue: (code) => [
    ['has Header component', c => c.includes('Header')],
    ['has Footer component', c => c.includes('Footer')],
    ['has 100vh', c => c.includes('100vh')],
  ],
  svelte: (code) => [
    ['has Header component', c => c.includes('Header')],
    ['has Footer component', c => c.includes('Footer')],
    ['has 100vh', c => c.includes('100vh')],
  ],
});

// ============================================================
// SCENARIO 17: Complex string interpolation
// ============================================================
test('S17: Complex interpolations', `
page Test:
  state count: int = 42
  state name: str = "World"
  state items: list[str] = ["a", "b", "c"]

  derived greeting = "Hello " + name + "!"
  derived status = count > 0 ? "positive" : "zero"

  layout col gap=8:
    text "Count: {count}"
    text "Name: {name}"
    text "Items: {items.length}개"
    text "Status: {status}"
    text greeting
`, {
  react: (code) => [
    ['has count interpolation', c => c.includes('{count}') || c.includes('count')],
    ['has name interpolation', c => c.includes('{name}') || c.includes('name')],
    ['has items.length', c => c.includes('items.length') || c.includes('length')],
    ['has greeting', c => c.includes('greeting')],
    ['has status', c => c.includes('status')],
  ],
  vue: (code) => [
    ['has vue mustache interpolation', c => c.includes('{{')],
    ['has items.length', c => c.includes('length')],
  ],
  svelte: (code) => [
    ['has svelte {expr} interpolation', c => c.includes('{count}') || c.includes('{name}')],
    ['has items.length', c => c.includes('length')],
  ],
});

// ============================================================
// SCENARIO 18: Conditional styles on text
// ============================================================
test('S18: Conditional text styles', `
page Styles:
  state score: int = 75
  state active: bool = true

  derived scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444"

  layout col gap=8 padding=24:
    text "점수: {score}" size=xl bold color={scoreColor}
    text "상태" bold color={active ? "#22c55e" : "#999"}
    text "완료!" strike={!active}
`, {
  react: (code) => [
    ['has dynamic color', c => c.includes('scoreColor') || c.includes('color')],
    ['has conditional strike', c => c.includes('textDecoration') || c.includes('line-through')],
    ['has ternary', c => c.includes('?')],
  ],
  vue: (code) => [
    ['has dynamic :style', c => c.includes(':style')],
    ['has ternary', c => c.includes('?')],
  ],
  svelte: (code) => [
    ['has dynamic color', c => c.includes('scoreColor') || c.includes('color')],
    ['has ternary', c => c.includes('?')],
  ],
});

// ============================================================
// SCENARIO 19: Style declaration reuse
// ============================================================
test('S19: Style declarations', `
page Styled:
  style card:
    padding: 24
    radius: 12
    shadow: md
    bg: white

  style header:
    padding: 16
    bg: #333

  layout col gap=16 padding=24 bg=#f0f0f0:
    layout col .card:
      text "Card 1" size=lg bold
      text "Content of card 1"

    layout col .card:
      text "Card 2" size=lg bold
      text "Content of card 2"
`, {
  react: (code) => [
    ['has padding 24', c => c.includes("padding: '24px'") || c.includes("padding: 24")],
    ['has borderRadius', c => c.includes('borderRadius') || c.includes('border-radius')],
    ['has boxShadow', c => c.includes('boxShadow') || c.includes('box-shadow')],
    ['has bg white', c => c.includes('white') || c.includes('#fff')],
    ['style applied to both cards', c => (c.match(/borderRadius/g) || []).length >= 2],
  ],
  vue: (code) => [
    ['has padding 24px', c => c.includes('padding: 24px')],
    ['has border-radius', c => c.includes('border-radius')],
    ['has box-shadow', c => c.includes('box-shadow')],
    ['style applied to both cards', c => (c.match(/border-radius/g) || []).length >= 2],
  ],
  svelte: (code) => [
    ['has padding 24px', c => c.includes('padding: 24px')],
    ['has border-radius', c => c.includes('border-radius')],
    ['has box-shadow', c => c.includes('box-shadow')],
    ['style applied to both cards', c => (c.match(/border-radius/g) || []).length >= 2],
  ],
});

// ============================================================
// SCENARIO 20: Ternary in layout prop
// ============================================================
test('S20: Dynamic layout props', `
page Dynamic:
  state compact: bool = false

  layout col gap={compact ? 4 : 16} padding={compact ? 8 : 24}:
    text "Dynamic spacing"
    button "Toggle" -> compact = !compact
`, {
  react: (code) => [
    ['has dynamic gap', c => c.includes('compact') && c.includes('gap')],
    ['has dynamic padding', c => c.includes('compact') && c.includes('padding')],
    ['has toggle logic', c => c.includes('!compact') || c.includes('prev')],
  ],
  vue: (code) => [
    ['compiles', () => true],
    ['has compact ref', c => c.includes('compact')],
  ],
  svelte: (code) => [
    ['compiles', () => true],
    ['has compact state', c => c.includes('compact')],
  ],
});

// ============================================================
// Report
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('SCENARIO DEBUG RESULTS');
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
    if (err.code) console.log(`   Code:\n   ${err.code.slice(0, 400).replace(/\n/g, '\n   ')}\n`);
  }
} else {
  console.log('\n✅ All scenario tests passed!\n');
}

process.exit(results.fail > 0 ? 1 : 0);
