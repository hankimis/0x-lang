// Phase 3 High-Level Pattern Keywords Tests
import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser.js';
import { compile } from '../src/compiler.js';
import { tokenize } from '../src/tokenizer.js';

describe('Phase 3: hero keyword', () => {
  it('tokenizer recognizes hero keyword', () => {
    const tokens = tokenize('hero:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('hero');
  });

  it('parses hero section with body', () => {
    const src = `
page Landing:
  hero:
    text "Welcome to 0x" size=3xl bold
    text "AI-First Programming Language" size=xl
    button "시작하기" style=primary -> navigate("/start")
  layout col:
    text "Content"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const hero = page.body.find((n: any) => n.type === 'Hero');
    expect(hero).toBeTruthy();
    expect(hero.body.length).toBe(3);
  });
});

describe('Phase 3: crud keyword', () => {
  it('tokenizer recognizes crud keyword', () => {
    const tokens = tokenize('crud Product:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('crud');
  });

  it('parses crud declaration', () => {
    const src = `
page Admin:
  crud Product:
    text "Products"
  layout col:
    text "Admin Panel"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const crud = page.body.find((n: any) => n.type === 'Crud');
    expect(crud).toBeTruthy();
    expect(crud.model).toBe('Product');
  });
});

describe('Phase 3: animate keyword', () => {
  it('tokenizer recognizes animate keyword', () => {
    const tokens = tokenize('animate enter:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('animate');
  });

  it('parses animate with type and body', () => {
    const src = `
page Animated:
  layout col:
    animate enter:
      text "Fading in" size=2xl
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const animate = layout.children.find((n: any) => n.type === 'Animate');
    expect(animate).toBeTruthy();
    expect(animate.animType).toBe('enter');
    expect(animate.body.length).toBe(1);
  });
});

describe('Phase 3: ai keyword', () => {
  it('tokenizer recognizes ai keyword', () => {
    const tokens = tokenize('ai chat:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('ai');
  });

  it('parses ai.chat with body', () => {
    const src = `
page Assistant:
  layout col:
    ai chat:
      text "AI Assistant"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const ai = layout.children.find((n: any) => n.type === 'Ai');
    expect(ai).toBeTruthy();
    expect(ai.aiType).toBe('chat');
  });
});

describe('Phase 3: search keyword', () => {
  it('parses search declaration', () => {
    const src = `
page SearchPage:
  layout col:
    search global products:
      text "Results"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const search = layout.children.find((n: any) => n.type === 'Search');
    expect(search).toBeTruthy();
    expect(search.searchType).toBe('global');
    expect(search.target).toBe('products');
  });
});

describe('Phase 3: social keyword', () => {
  it('parses social like', () => {
    const src = `
page Post:
  state post: str = ""
  layout col:
    social like post:
      text "좋아요"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const social = layout.children.find((n: any) => n.type === 'Social');
    expect(social).toBeTruthy();
    expect(social.socialType).toBe('like');
  });
});

describe('Phase 3: pay keyword', () => {
  it('tokenizer recognizes pay keyword', () => {
    const tokens = tokenize('pay checkout:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('pay');
  });

  it('parses pay checkout', () => {
    const src = `
page Checkout:
  layout col:
    pay checkout:
      text "결제"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const pay = layout.children.find((n: any) => n.type === 'Pay');
    expect(pay).toBeTruthy();
    expect(pay.payType).toBe('checkout');
  });
});

describe('Phase 3: seo keyword', () => {
  it('parses seo with props', () => {
    const src = `
page Home:
  seo:
    title: "0x - AI First Language"
    description: "Build UIs with AI"
  layout col:
    text "Home"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const seo = page.body.find((n: any) => n.type === 'Seo');
    expect(seo).toBeTruthy();
    expect(seo.props.title).toBeTruthy();
    expect(seo.props.description).toBeTruthy();
  });
});

describe('Phase 3: responsive keyword', () => {
  it('parses responsive/mobile with body', () => {
    const src = `
page Responsive:
  layout col:
    mobile show:
      text "모바일 전용"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const resp = layout.children.find((n: any) => n.type === 'Responsive');
    expect(resp).toBeTruthy();
    expect(resp.breakpoint).toBe('mobile');
    expect(resp.action).toBe('show');
    expect(resp.body.length).toBe(1);
  });
});

describe('Phase 3: drawer keyword', () => {
  it('parses drawer with body', () => {
    const src = `
page App:
  layout col:
    drawer sidebar:
      text "Sidebar Content"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const drawer = layout.children.find((n: any) => n.type === 'Drawer');
    expect(drawer).toBeTruthy();
    expect(drawer.name).toBe('sidebar');
    expect(drawer.body.length).toBe(1);
  });
});

describe('Phase 3: media keyword', () => {
  it('parses media gallery', () => {
    const src = `
page Gallery:
  state images: list = []
  layout col:
    media gallery images cols=3
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const media = layout.children.find((n: any) => n.type === 'Media');
    expect(media).toBeTruthy();
    expect(media.mediaType).toBe('gallery');
  });
});

describe('Phase 3: confirm keyword', () => {
  it('parses confirm dialog', () => {
    const src = `
page Delete:
  layout col:
    confirm "정말 삭제하시겠습니까?" danger confirm="삭제" cancel="취소"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const conf = layout.children.find((n: any) => n.type === 'Confirm');
    expect(conf).toBeTruthy();
    expect(conf.message).toBe('정말 삭제하시겠습니까?');
    expect(conf.danger).toBe(true);
    expect(conf.confirmLabel).toBe('삭제');
    expect(conf.cancelLabel).toBe('취소');
  });
});

describe('Phase 3: roles keyword (top-level)', () => {
  it('parses roles declaration', () => {
    const src = `
roles:
  admin:
    can: read, write, delete
  editor:
    can: read, write
`;
    const ast = parse(src);
    expect(ast[0].type).toBe('RoleDecl');
    const roles = ast[0] as any;
    expect(roles.roles.length).toBe(2);
    expect(roles.roles[0].name).toBe('admin');
    expect(roles.roles[0].can).toEqual(['read', 'write', 'delete']);
    expect(roles.roles[1].name).toBe('editor');
    expect(roles.roles[1].can).toEqual(['read', 'write']);
  });
});

describe('Phase 3: breadcrumb keyword', () => {
  it('parses breadcrumb', () => {
    const src = `
page Product:
  layout col:
    breadcrumb auto
    text "Product Page"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const bc = layout.children.find((n: any) => n.type === 'Breadcrumb');
    expect(bc).toBeTruthy();
    expect(bc.props.auto).toBeTruthy();
  });
});

describe('Phase 3: stats grid keyword', () => {
  it('parses stats grid with multiple stat cards', () => {
    const src = `
page Dashboard:
  state revenue: int = 0
  state orders: int = 0
  layout col:
    stats 3:
      stat "매출" value=revenue
      stat "주문" value=orders
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const layout = page.body.find((n: any) => n.type === 'Layout');
    const grid = layout.children.find((n: any) => n.type === 'StatsGrid');
    expect(grid).toBeTruthy();
    expect(grid.cols).toBe(3);
    expect(grid.stats.length).toBe(2);
    expect(grid.stats[0].label).toBe('매출');
    expect(grid.stats[1].label).toBe('주문');
  });
});

describe('Phase 3: combined landing page', () => {
  it('parses full landing page structure', () => {
    const src = `
page Landing:
  seo:
    title: "0x"
    description: "AI-First Language"

  nav:
    link "홈" href="/"
    link "기능" href="#features"
    link "가격" href="#pricing"

  hero:
    text "0x" size=3xl bold
    text "Build faster with AI" size=xl
    button "시작하기" style=primary -> navigate("/start")

  layout col:
    text "Content"
`;
    const result = compile(src, { target: 'react', validate: false });
    expect(result.code).toContain('0x');
    expect(result.code).toContain('Build faster with AI');
    expect(result.code).toContain('<nav');
    expect(result.code).toContain('시작하기');
  });
});
