import { describe, test, expect } from 'vitest';
import { parse } from '../src/parser.js';
import type { PageNode, ComponentNode, StateDecl, DerivedDecl, PropDecl, TypeDecl, FnDecl, CheckDecl, LayoutNode, TextNode, ButtonNode, InputNode, ToggleNode, SelectNode, ImageNode, LinkNode, IfBlock, ForBlock, ShowBlock, HideBlock, OnMount, OnDestroy, WatchBlock, ApiDecl, StyleDecl, ComponentCall, CommentNode, JsImport, UseImport, StoreDecl } from '../src/ast.js';

describe('Parser', () => {
  describe('최상위 구조', () => {
    test('빈 page 파싱', () => {
      const ast = parse('page Empty:');
      expect(ast.length).toBe(1);
      expect(ast[0].type).toBe('Page');
      expect((ast[0] as PageNode).name).toBe('Empty');
    });

    test('빈 component 파싱', () => {
      const ast = parse('component Card:');
      expect(ast.length).toBe(1);
      expect(ast[0].type).toBe('Component');
      expect((ast[0] as ComponentNode).name).toBe('Card');
    });

    test('page와 component 함께 파싱', () => {
      const source = `page Dashboard:\n  text "hello"\n\ncomponent Card:\n  prop title: str`;
      const ast = parse(source);
      expect(ast.length).toBe(2);
      expect(ast[0].type).toBe('Page');
      expect(ast[1].type).toBe('Component');
    });
  });

  describe('state 선언', () => {
    test('기본 state', () => {
      const ast = parse('page T:\n  state count: int = 0');
      const page = ast[0] as PageNode;
      const state = page.body[0] as StateDecl;
      expect(state.type).toBe('StateDecl');
      expect(state.name).toBe('count');
      expect(state.valueType).toEqual({ kind: 'primitive', name: 'int' });
      expect(state.initial).toEqual({ kind: 'number', value: 0 });
    });

    test('문자열 초기값 state', () => {
      const ast = parse('page T:\n  state name: str = ""');
      const state = (ast[0] as PageNode).body[0] as StateDecl;
      expect(state.valueType).toEqual({ kind: 'primitive', name: 'str' });
      expect(state.initial).toEqual({ kind: 'string', value: '' });
    });

    test('bool state', () => {
      const ast = parse('page T:\n  state loading: bool = true');
      const state = (ast[0] as PageNode).body[0] as StateDecl;
      expect(state.valueType).toEqual({ kind: 'primitive', name: 'bool' });
      expect(state.initial).toEqual({ kind: 'boolean', value: true });
    });

    test('list 타입 state', () => {
      const ast = parse('page T:\n  state items: list[str] = []');
      const state = (ast[0] as PageNode).body[0] as StateDecl;
      expect(state.valueType).toEqual({ kind: 'list', itemType: { kind: 'primitive', name: 'str' } });
      expect(state.initial).toEqual({ kind: 'array', elements: [] });
    });

    test('커스텀 타입 list state', () => {
      const ast = parse('page T:\n  state items: list[Item] = []');
      const state = (ast[0] as PageNode).body[0] as StateDecl;
      expect(state.valueType).toEqual({ kind: 'list', itemType: { kind: 'named', name: 'Item' } });
    });
  });

  describe('derived 선언', () => {
    test('기본 derived', () => {
      const ast = parse('page T:\n  derived total = a + b');
      const derived = (ast[0] as PageNode).body[0] as DerivedDecl;
      expect(derived.type).toBe('DerivedDecl');
      expect(derived.name).toBe('total');
      expect(derived.expression.kind).toBe('binary');
    });

    test('메서드 호출 derived', () => {
      const ast = parse('page T:\n  derived remaining = items.filter(i => !i.done).length');
      const derived = (ast[0] as PageNode).body[0] as DerivedDecl;
      expect(derived.type).toBe('DerivedDecl');
      expect(derived.name).toBe('remaining');
    });

    test('삼항 연산자 derived', () => {
      const ast = parse('page T:\n  derived arrow = isPositive ? "↑" : "↓"');
      const derived = (ast[0] as PageNode).body[0] as DerivedDecl;
      expect(derived.expression.kind).toBe('ternary');
    });
  });

  describe('prop 선언', () => {
    test('기본 prop', () => {
      const ast = parse('component C:\n  prop title: str');
      const prop = (ast[0] as ComponentNode).body[0] as PropDecl;
      expect(prop.type).toBe('PropDecl');
      expect(prop.name).toBe('title');
      expect(prop.defaultValue).toBeNull();
    });

    test('기본값 있는 prop', () => {
      const ast = parse('component C:\n  prop size: int = 16');
      const prop = (ast[0] as ComponentNode).body[0] as PropDecl;
      expect(prop.defaultValue).toEqual({ kind: 'number', value: 16 });
    });
  });

  describe('type 선언', () => {
    test('객체 타입', () => {
      const ast = parse('page T:\n  type Item = {id: int, text: str, done: bool}');
      const typeDecl = (ast[0] as PageNode).body[0] as TypeDecl;
      expect(typeDecl.type).toBe('TypeDecl');
      expect(typeDecl.name).toBe('Item');
      expect(typeDecl.definition.kind).toBe('object');
    });

    test('유니온 타입', () => {
      const ast = parse('page T:\n  type Status = "active" | "inactive" | "pending"');
      const typeDecl = (ast[0] as PageNode).body[0] as TypeDecl;
      expect(typeDecl.definition.kind).toBe('union');
      if (typeDecl.definition.kind === 'union') {
        expect(typeDecl.definition.members).toEqual(['active', 'inactive', 'pending']);
      }
    });
  });

  describe('함수 선언', () => {
    test('기본 함수', () => {
      const ast = parse('page T:\n  fn add():\n    count += 1');
      const fn = (ast[0] as PageNode).body[0] as FnDecl;
      expect(fn.type).toBe('FnDecl');
      expect(fn.name).toBe('add');
      expect(fn.isAsync).toBe(false);
      expect(fn.params.length).toBe(0);
    });

    test('매개변수 있는 함수', () => {
      const ast = parse('page T:\n  fn remove(id: int):\n    items = items.filter(i => i.id != id)');
      const fn = (ast[0] as PageNode).body[0] as FnDecl;
      expect(fn.params.length).toBe(1);
      expect(fn.params[0].name).toBe('id');
    });

    test('async 함수', () => {
      const ast = parse('page T:\n  async fn load():\n    result = await fetch("/api")');
      const fn = (ast[0] as PageNode).body[0] as FnDecl;
      expect(fn.isAsync).toBe(true);
    });

    test('requires/ensures 있는 함수', () => {
      const ast = parse('page T:\n  fn withdraw(amount: float):\n    requires: amount > 0\n    balance -= amount');
      const fn = (ast[0] as PageNode).body[0] as FnDecl;
      expect(fn.requires.length).toBe(1);
    });
  });

  describe('check 선언', () => {
    test('기본 check', () => {
      const ast = parse('page T:\n  check items.length <= 500 "할일은 500개 이하"');
      const check = (ast[0] as PageNode).body[0] as CheckDecl;
      expect(check.type).toBe('CheckDecl');
      expect(check.message).toBe('할일은 500개 이하');
    });
  });

  describe('라이프사이클', () => {
    test('on mount', () => {
      const ast = parse('page T:\n  on mount:\n    loading = false');
      const mount = (ast[0] as PageNode).body[0] as OnMount;
      expect(mount.type).toBe('OnMount');
      expect(mount.body.length).toBeGreaterThan(0);
    });

    test('on destroy', () => {
      const ast = parse('page T:\n  on destroy:\n    cleanup()');
      const destroy = (ast[0] as PageNode).body[0] as OnDestroy;
      expect(destroy.type).toBe('OnDestroy');
    });

    test('watch', () => {
      const ast = parse('page T:\n  watch period:\n    loading = true');
      const watch = (ast[0] as PageNode).body[0] as WatchBlock;
      expect(watch.type).toBe('WatchBlock');
      expect(watch.variable).toBe('period');
    });
  });

  describe('API 선언', () => {
    test('GET API', () => {
      const ast = parse('page T:\n  api products = GET "/api/products"');
      const api = (ast[0] as PageNode).body[0] as ApiDecl;
      expect(api.type).toBe('ApiDecl');
      expect(api.name).toBe('products');
      expect(api.method).toBe('GET');
      expect(api.url).toBe('/api/products');
    });

    test('POST API', () => {
      const ast = parse('page T:\n  api createProduct = POST "/api/products"');
      const api = (ast[0] as PageNode).body[0] as ApiDecl;
      expect(api.method).toBe('POST');
    });
  });

  describe('UI 요소', () => {
    test('text 요소', () => {
      const ast = parse('page T:\n  text "hello"');
      const text = (ast[0] as PageNode).body[0] as TextNode;
      expect(text.type).toBe('Text');
    });

    test('text with props', () => {
      const ast = parse('page T:\n  text "제목" size=xl bold');
      const text = (ast[0] as PageNode).body[0] as TextNode;
      expect(text.type).toBe('Text');
      expect(text.props['size']).toBeDefined();
      expect(text.props['bold']).toBeDefined();
    });

    test('button 요소', () => {
      const ast = parse('page T:\n  button "클릭" -> count += 1');
      const btn = (ast[0] as PageNode).body[0] as ButtonNode;
      expect(btn.type).toBe('Button');
    });

    test('button with style and action', () => {
      const ast = parse('page T:\n  button "추가" style=primary -> add()');
      const btn = (ast[0] as PageNode).body[0] as ButtonNode;
      expect(btn.type).toBe('Button');
      expect(btn.props['style']).toBeDefined();
    });

    test('input 요소', () => {
      const ast = parse('page T:\n  input name placeholder="입력"');
      const inp = (ast[0] as PageNode).body[0] as InputNode;
      expect(inp.type).toBe('Input');
      expect(inp.binding).toBe('name');
    });

    test('toggle 요소', () => {
      const ast = parse('page T:\n  toggle active');
      const tog = (ast[0] as PageNode).body[0] as ToggleNode;
      expect(tog.type).toBe('Toggle');
      expect(tog.binding).toBe('active');
    });

    test('select 요소', () => {
      const ast = parse('page T:\n  select period options=["day", "week"]');
      const sel = (ast[0] as PageNode).body[0] as SelectNode;
      expect(sel.type).toBe('Select');
      expect(sel.binding).toBe('period');
    });

    test('image 요소', () => {
      const ast = parse('page T:\n  image src width=200 height=200');
      const img = (ast[0] as PageNode).body[0] as ImageNode;
      expect(img.type).toBe('Image');
    });

    test('link 요소', () => {
      const ast = parse('page T:\n  link "홈" href="/home"');
      const lnk = (ast[0] as PageNode).body[0] as LinkNode;
      expect(lnk.type).toBe('Link');
    });
  });

  describe('layout', () => {
    test('기본 layout', () => {
      const ast = parse('page T:\n  layout col:\n    text "hello"');
      const layout = (ast[0] as PageNode).body[0] as LayoutNode;
      expect(layout.type).toBe('Layout');
      expect(layout.direction).toBe('col');
      expect(layout.children.length).toBe(1);
    });

    test('layout row with props', () => {
      const ast = parse('page T:\n  layout row gap=8 center:\n    text "hello"');
      const layout = (ast[0] as PageNode).body[0] as LayoutNode;
      expect(layout.direction).toBe('row');
      expect(layout.props['gap']).toBeDefined();
    });

    test('layout grid', () => {
      const ast = parse('page T:\n  layout grid cols=3 gap=16:\n    text "hello"');
      const layout = (ast[0] as PageNode).body[0] as LayoutNode;
      expect(layout.direction).toBe('grid');
    });

    test('중첩 layout', () => {
      const ast = parse('page T:\n  layout col:\n    layout row:\n      text "hello"');
      const outer = (ast[0] as PageNode).body[0] as LayoutNode;
      expect(outer.direction).toBe('col');
      const inner = outer.children[0] as LayoutNode;
      expect(inner.type).toBe('Layout');
      expect(inner.direction).toBe('row');
    });

    test('layout with style class', () => {
      const ast = parse('page T:\n  layout col .card:\n    text "hello"');
      const layout = (ast[0] as PageNode).body[0] as LayoutNode;
      expect(layout.styleClass).toBe('card');
    });
  });

  describe('제어 흐름', () => {
    test('if 블록', () => {
      const ast = parse('page T:\n  if loading:\n    text "로딩..."');
      const ifBlock = (ast[0] as PageNode).body[0] as IfBlock;
      expect(ifBlock.type).toBe('IfBlock');
      expect(ifBlock.body.length).toBe(1);
    });

    test('if-else 블록', () => {
      const ast = parse('page T:\n  if loading:\n    text "로딩..."\n  else:\n    text "완료"');
      const ifBlock = (ast[0] as PageNode).body[0] as IfBlock;
      expect(ifBlock.elseBody).not.toBeNull();
      expect(ifBlock.elseBody!.length).toBe(1);
    });

    test('if-elif-else 블록', () => {
      const ast = parse('page T:\n  if a:\n    text "A"\n  elif b:\n    text "B"\n  else:\n    text "C"');
      const ifBlock = (ast[0] as PageNode).body[0] as IfBlock;
      expect(ifBlock.elifs.length).toBe(1);
      expect(ifBlock.elseBody).not.toBeNull();
    });

    test('for 블록', () => {
      const ast = parse('page T:\n  for item in items:\n    text item.name');
      const forBlock = (ast[0] as PageNode).body[0] as ForBlock;
      expect(forBlock.type).toBe('ForBlock');
      expect(forBlock.item).toBe('item');
      expect(forBlock.index).toBeNull();
    });

    test('for with index', () => {
      const ast = parse('page T:\n  for item, index in items:\n    text item.name');
      const forBlock = (ast[0] as PageNode).body[0] as ForBlock;
      expect(forBlock.item).toBe('item');
      expect(forBlock.index).toBe('index');
    });

    test('show 블록', () => {
      const ast = parse('page T:\n  show isVisible:\n    text "보임"');
      const show = (ast[0] as PageNode).body[0] as ShowBlock;
      expect(show.type).toBe('ShowBlock');
    });

    test('hide 블록', () => {
      const ast = parse('page T:\n  hide isHidden:\n    text "숨김"');
      const hide = (ast[0] as PageNode).body[0] as HideBlock;
      expect(hide.type).toBe('HideBlock');
    });
  });

  describe('style 선언', () => {
    test('기본 style', () => {
      const ast = parse('page T:\n  style card:\n    padding: 16\n    radius: 8');
      const style = (ast[0] as PageNode).body[0] as StyleDecl;
      expect(style.type).toBe('StyleDecl');
      expect(style.name).toBe('card');
      expect(style.properties.length).toBe(2);
    });
  });

  describe('component call', () => {
    test('기본 component call', () => {
      const ast = parse('page T:\n  component MetricCard(metric)');
      const call = (ast[0] as PageNode).body[0] as ComponentCall;
      expect(call.type).toBe('ComponentCall');
      expect(call.name).toBe('MetricCard');
    });
  });

  describe('5단계 중첩', () => {
    test('깊은 중첩 레이아웃', () => {
      const source = `page Deep:
  layout col:
    layout row:
      layout col:
        layout row:
          layout col:
            text "깊은 곳"`;
      const ast = parse(source);
      const page = ast[0] as PageNode;
      const l1 = page.body[0] as LayoutNode;
      const l2 = l1.children[0] as LayoutNode;
      const l3 = l2.children[0] as LayoutNode;
      const l4 = l3.children[0] as LayoutNode;
      const l5 = l4.children[0] as LayoutNode;
      expect(l5.children[0].type).toBe('Text');
    });
  });

  describe('에러 처리', () => {
    test('잘못된 최상위 키워드', () => {
      expect(() => parse('state count: int = 0')).toThrow();
    });
  });

  describe('주석', () => {
    test('주석 보존', () => {
      const ast = parse('page T:\n  // 이것은 주석\n  text "hello"');
      const page = ast[0] as PageNode;
      const comment = page.body.find(n => n.type === 'Comment') as CommentNode;
      expect(comment).toBeDefined();
    });
  });
});
