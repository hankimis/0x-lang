// Phase 2 Advanced Features Tests — auth, chart, stat, realtime, route, nav, upload, modal, toast
import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser.js';
import { compile } from '../src/compiler.js';
import { tokenize } from '../src/tokenizer.js';

describe('Phase 2: auth keyword', () => {
  const authSource = `
auth provider="supabase":
  login: email, password
  signup: email, password, name
  logout
  guard: auth -> redirect("/login")
  guard: admin -> redirect("/")
`;

  it('tokenizer recognizes auth/login/signup/guard keywords', () => {
    const tokens = tokenize('auth provider="supabase":');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('auth');

    const tokens2 = tokenize('login: email, password');
    expect(tokens2[0].type).toBe('KEYWORD');
    expect(tokens2[0].value).toBe('login');

    const tokens3 = tokenize('guard: admin');
    expect(tokens3[0].type).toBe('KEYWORD');
    expect(tokens3[0].value).toBe('guard');
  });

  it('parses auth declaration with provider', () => {
    const ast = parse(authSource);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('AuthDecl');

    const auth = ast[0] as any;
    expect(auth.provider).toBe('supabase');
  });

  it('parses auth login and signup fields', () => {
    const ast = parse(authSource);
    const auth = ast[0] as any;
    expect(auth.loginFields).toEqual(['email', 'password']);
    expect(auth.signupFields).toEqual(['email', 'password', 'name']);
  });

  it('parses auth guards with redirects', () => {
    const ast = parse(authSource);
    const auth = ast[0] as any;
    expect(auth.guards.length).toBe(2);
    expect(auth.guards[0]).toEqual({ role: 'auth', redirect: '/login' });
    expect(auth.guards[1]).toEqual({ role: 'admin', redirect: '/' });
  });

  it('generates React auth provider code', () => {
    const result = compile(authSource, { target: 'react', validate: false });
    expect(result.code).toContain('AuthContext');
    expect(result.code).toContain('AuthProvider');
    expect(result.code).toContain('useAuth');
    expect(result.code).toContain('login');
    expect(result.code).toContain('signup');
    expect(result.code).toContain('logout');
  });

  it('generates React auth guard components', () => {
    const result = compile(authSource, { target: 'react', validate: false });
    expect(result.code).toContain('AuthGuard');
    expect(result.code).toContain('AdminGuard');
    expect(result.code).toContain('/login');
  });
});

describe('Phase 2: chart keyword', () => {
  const chartSource = `
page Dashboard:
  state sales: list = []

  chart bar salesChart:
    data: sales
    x: month
    y: revenue
    title: "월별 매출"

  layout col:
    text "대시보드" size=2xl bold
`;

  it('tokenizer recognizes chart keyword', () => {
    const tokens = tokenize('chart bar salesChart:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('chart');
  });

  it('parses chart with type and props', () => {
    const ast = parse(chartSource);
    const page = ast[0] as any;
    const chart = page.body.find((n: any) => n.type === 'Chart');
    expect(chart).toBeTruthy();
    expect(chart.chartType).toBe('bar');
    expect(chart.name).toBe('salesChart');
    expect(chart.props.data).toBeTruthy();
    expect(chart.props.x).toBeTruthy();
    expect(chart.props.y).toBeTruthy();
    expect(chart.props.title).toBeTruthy();
  });

  it('generates React chart component', () => {
    const result = compile(chartSource, { target: 'react', validate: false });
    expect(result.code).toContain('chart-salesChart');
    expect(result.code).toContain('월별 매출');
    expect(result.code).toContain('sales');
  });

  it('parses different chart types', () => {
    const src = `
page Stats:
  state items: list = []
  chart pie categoryChart:
    data: items
    x: name
    y: value
  layout col:
    text "Charts"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const chart = page.body.find((n: any) => n.type === 'Chart');
    expect(chart.chartType).toBe('pie');
    expect(chart.name).toBe('categoryChart');
  });
});

describe('Phase 2: stat keyword', () => {
  it('tokenizer recognizes stat keyword', () => {
    const tokens = tokenize('stat "매출" value=revenue');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('stat');
  });

  it('parses stat card with value and change', () => {
    const src = `
page Dashboard:
  state revenue: int = 0
  layout row:
    stat "총 매출" value=revenue change="+12%"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    // stat is inside layout children
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const stat = layout.children.find((n: any) => n.type === 'Stat');
    expect(stat).toBeTruthy();
    expect(stat.label).toBe('총 매출');
    expect(stat.value.kind).toBe('identifier');
    expect(stat.value.name).toBe('revenue');
    expect(stat.change).toBeTruthy();
  });

  it('generates React stat card', () => {
    const src = `
page Dashboard:
  state revenue: int = 0
  layout row:
    stat "총 매출" value=revenue change="+12%"
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('총 매출');
    expect(result.code).toContain('revenue');
    expect(result.code).toContain('+12%');
  });
});

describe('Phase 2: realtime keyword', () => {
  const realtimeSource = `
page Chat:
  state messages: list = []

  realtime ws = subscribe("wss://chat.example.com"):
    on message:
      messages.push(message)
    on error:
      console.log("연결 끊김")

  layout col:
    text "채팅" size=2xl bold
`;

  it('tokenizer recognizes realtime/subscribe keywords', () => {
    const tokens = tokenize('realtime ws = subscribe("channel")');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('realtime');
  });

  it('parses realtime subscription', () => {
    const ast = parse(realtimeSource);
    const page = ast[0] as any;
    const rt = page.body.find((n: any) => n.type === 'RealtimeDecl');
    expect(rt).toBeTruthy();
    expect(rt.name).toBe('ws');
    expect(rt.channel).toBeTruthy();
    expect(rt.handlers.length).toBe(2);
    expect(rt.handlers[0].event).toBe('message');
    expect(rt.handlers[1].event).toBe('error');
  });

  it('generates React WebSocket code', () => {
    const result = compile(realtimeSource, { target: 'react', validate: false });
    expect(result.code).toContain('WebSocket');
    expect(result.code).toContain('onmessage');
    expect(result.code).toContain('onerror');
    expect(result.code).toContain('ws.close');
  });
});

describe('Phase 2: route keyword', () => {
  const routeSource = `
route "/products":
  page ProductList

route "/products/:id":
  page ProductDetail
  guard: auth
`;

  it('tokenizer recognizes route keyword', () => {
    const tokens = tokenize('route "/products":');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('route');
  });

  it('parses route declarations', () => {
    const ast = parse(routeSource);
    expect(ast.length).toBe(2);

    const route1 = ast[0] as any;
    expect(route1.type).toBe('RouteDecl');
    expect(route1.path).toBe('/products');
    expect(route1.target).toBe('ProductList');
    expect(route1.guard).toBeNull();

    const route2 = ast[1] as any;
    expect(route2.path).toBe('/products/:id');
    expect(route2.target).toBe('ProductDetail');
    expect(route2.guard).toBe('auth');
  });

  it('generates React route code', () => {
    const result = compile(routeSource, { target: 'react', validate: false });
    expect(result.code).toContain('Route');
    expect(result.code).toContain('/products');
    expect(result.code).toContain('ProductList');
    expect(result.code).toContain('ProductDetail');
    expect(result.code).toContain('AuthGuard');
  });
});

describe('Phase 2: nav keyword', () => {
  it('tokenizer recognizes nav keyword', () => {
    const tokens = tokenize('nav:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('nav');
  });

  it('parses nav with link items', () => {
    const src = `
page Home:
  nav:
    link "홈" href="/"
    link "상품" href="/products"
    link "문의" href="/contact" icon="mail"
  layout col:
    text "Welcome"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const nav = page.body.find((n: any) => n.type === 'Nav');
    expect(nav).toBeTruthy();
    expect(nav.items.length).toBe(3);
    expect(nav.items[0]).toEqual({ label: '홈', href: '/', icon: null });
    expect(nav.items[1]).toEqual({ label: '상품', href: '/products', icon: null });
    expect(nav.items[2]).toEqual({ label: '문의', href: '/contact', icon: 'mail' });
  });

  it('generates React nav component', () => {
    const src = `
page Home:
  nav:
    link "홈" href="/"
    link "상품" href="/products"
  layout col:
    text "Welcome"
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('<nav');
    expect(result.code).toContain('홈');
    expect(result.code).toContain('상품');
    expect(result.code).toContain('/products');
  });
});

describe('Phase 2: upload keyword', () => {
  it('tokenizer recognizes upload keyword', () => {
    const tokens = tokenize('upload avatar:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('upload');
  });

  it('parses upload with options', () => {
    const src = `
page Profile:
  upload avatar:
    accept: "image/*"
    maxSize: 5
    preview: true
  layout col:
    text "Profile"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const upload = page.body.find((n: any) => n.type === 'Upload');
    expect(upload).toBeTruthy();
    expect(upload.name).toBe('avatar');
    expect(upload.accept).toBe('image/*');
    expect(upload.maxSize).toBe(5);
    expect(upload.preview).toBe(true);
  });

  it('generates React upload component', () => {
    const src = `
page Profile:
  upload avatar:
    accept: "image/*"
    maxSize: 5
    preview: true
  layout col:
    text "Profile"
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('type="file"');
    expect(result.code).toContain('image/*');
    expect(result.code).toContain('avatarFile');
    expect(result.code).toContain('avatarPreview');
    expect(result.code).toContain('5 * 1024 * 1024');
  });
});

describe('Phase 2: modal keyword', () => {
  it('tokenizer recognizes modal keyword', () => {
    const tokens = tokenize('modal editDialog:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('modal');
  });

  it('parses modal with title and body', () => {
    const src = `
page Settings:
  modal editDialog title="설정 편집" trigger="편집":
    text "설정을 변경하세요"
    button "저장" -> save()
  layout col:
    text "Settings"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const modal = page.body.find((n: any) => n.type === 'Modal');
    expect(modal).toBeTruthy();
    expect(modal.name).toBe('editDialog');
    expect(modal.title).toBe('설정 편집');
    expect(modal.trigger).toBe('편집');
    expect(modal.body.length).toBe(2);
  });

  it('generates React modal component', () => {
    const src = `
page Settings:
  modal editDialog title="설정 편집" trigger="편집":
    text "설정을 변경하세요"
  layout col:
    text "Settings"
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('설정 편집');
    expect(result.code).toContain('편집');
    expect(result.code).toContain('position: \'fixed\'');
    expect(result.code).toContain('rgba(0,0,0,0.5)');
  });
});

describe('Phase 2: toast keyword', () => {
  it('tokenizer recognizes toast keyword', () => {
    const tokens = tokenize('toast "저장 완료!" type=success');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('toast');
  });

  it('parses toast with type and message', () => {
    const src = `
page Notify:
  layout col:
    toast "저장 완료!" type=success duration=3000
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const toast = layout.children.find((n: any) => n.type === 'Toast');
    expect(toast).toBeTruthy();
    expect(toast.message.kind).toBe('string');
    expect(toast.message.value).toBe('저장 완료!');
    expect(toast.toastType).toBe('success');
    expect(toast.duration).toBe(3000);
  });

  it('generates React toast notification', () => {
    const src = `
page Notify:
  layout col:
    toast "오류 발생" type=error
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('오류 발생');
    expect(result.code).toContain('#e53e3e');
    expect(result.code).toContain('position: \'fixed\'');
  });

  it('toast works as expression in form submit', () => {
    const src = `
page Contact:
  form contactForm:
    field name: str
      label: "이름"
      required: "이름을 입력하세요"
    submit "전송" -> api.send(contactForm.data):
      success: toast("전송 완료!")
      error: toast("전송 실패")
  layout col:
    text "문의"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const form = page.body.find((n: any) => n.type === 'FormDecl');
    expect(form.submit.success).toBeTruthy();
    expect(form.submit.error).toBeTruthy();
  });
});

describe('Phase 2: combined features', () => {
  it('auth + route + page can coexist', () => {
    const src = `
auth provider="custom":
  login: email, password
  guard: auth -> redirect("/login")

route "/dashboard":
  page Dashboard
  guard: auth

page Dashboard:
  state count: int = 0
  layout col:
    text "Dashboard" size=2xl bold
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('AuthProvider');
    expect(result.code).toContain('Route');
    expect(result.code).toContain('Dashboard');
    expect(result.code).toContain('useState');
  });

  it('chart + stat + nav in single page', () => {
    const src = `
page Analytics:
  state sales: list = []
  state revenue: int = 0

  nav:
    link "대시보드" href="/"
    link "분석" href="/analytics"

  chart bar salesChart:
    data: sales
    x: month
    y: amount

  layout row:
    stat "총 매출" value=revenue
    stat "주문 수" value=42
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('<nav');
    expect(result.code).toContain('chart-salesChart');
    expect(result.code).toContain('총 매출');
    expect(result.code).toContain('주문 수');
  });
});
