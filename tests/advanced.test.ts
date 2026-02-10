// Phase 1 Advanced Features Tests — model, data, form, table
import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser.js';
import { compile } from '../src/compiler.js';
import { tokenize } from '../src/tokenizer.js';

describe('Phase 1: model keyword', () => {
  const modelSource = `
model Product:
  name: str
  price: float
  category: str
  createdAt: datetime = now()

  validate:
    name.length >= 2 "이름은 2자 이상"
    price > 0 "가격은 양수"

  permission:
    read: all
    write: auth
    delete: admin

  search: name, category
  sort: price, createdAt
  filter: category
`;

  it('tokenizer recognizes model keyword', () => {
    const tokens = tokenize('model Product:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('model');
  });

  it('parses model declaration', () => {
    const ast = parse(modelSource);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('Model');

    const model = ast[0] as any;
    expect(model.name).toBe('Product');
    expect(model.fields.length).toBe(4);
    expect(model.fields[0].name).toBe('name');
    expect(model.fields[1].name).toBe('price');
    expect(model.fields[2].name).toBe('category');
    expect(model.fields[3].name).toBe('createdAt');
    expect(model.fields[3].defaultValue).toBeTruthy();
  });

  it('parses model validate block', () => {
    const ast = parse(modelSource);
    const model = ast[0] as any;
    expect(model.validate.length).toBe(2);
    expect(model.validate[0].message).toBe('이름은 2자 이상');
    expect(model.validate[1].message).toBe('가격은 양수');
  });

  it('parses model permission block', () => {
    const ast = parse(modelSource);
    const model = ast[0] as any;
    expect(model.permissions.length).toBe(3);
    expect(model.permissions[0]).toEqual({ action: 'read', role: 'all' });
    expect(model.permissions[1]).toEqual({ action: 'write', role: 'auth' });
    expect(model.permissions[2]).toEqual({ action: 'delete', role: 'admin' });
  });

  it('parses model search/sort/filter', () => {
    const ast = parse(modelSource);
    const model = ast[0] as any;
    expect(model.search).toEqual(['name', 'category']);
    expect(model.sort).toEqual(['price', 'createdAt']);
    expect(model.filter).toEqual(['category']);
  });

  it('generates React CRUD code from model', () => {
    const result = compile(modelSource, { target: 'react', validate: false });
    expect(result.code).toContain('ProductAPI');
    expect(result.code).toContain('findAll');
    expect(result.code).toContain('create');
    expect(result.code).toContain('update');
    expect(result.code).toContain('delete');
    expect(result.code).toContain('/api/products');
    expect(result.code).toContain('useProducts');
    expect(result.code).toContain('useCreateProduct');
  });

  it('generates validation function from model', () => {
    const result = compile(modelSource, { target: 'react', validate: false });
    expect(result.code).toContain('validateProduct');
    expect(result.code).toContain('이름은 2자 이상');
    expect(result.code).toContain('가격은 양수');
  });
});

describe('Phase 1: data keyword', () => {
  const dataSource = `
page Products:
  data products = fetch("/api/products"):
    loading: "로딩 중..."
    error: "상품을 불러올 수 없습니다"
    empty: "등록된 상품이 없습니다"

  layout col:
    text "상품 목록" size=2xl bold
`;

  it('tokenizer recognizes data keyword', () => {
    const tokens = tokenize('data products = fetch("/api/products")');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('data');
  });

  it('parses data declaration with loading/error/empty', () => {
    const ast = parse(dataSource);
    const page = ast[0] as any;
    const dataDecl = page.body.find((n: any) => n.type === 'DataDecl');
    expect(dataDecl).toBeTruthy();
    expect(dataDecl.name).toBe('products');
    expect(dataDecl.error).toBe('상품을 불러올 수 없습니다');
    expect(dataDecl.empty).toBe('등록된 상품이 없습니다');
  });

  it('generates React hooks from data declaration', () => {
    const result = compile(dataSource, { target: 'react', validate: false });
    expect(result.code).toContain('useState');
    expect(result.code).toContain('useEffect');
    expect(result.code).toContain('productsLoading');
    expect(result.code).toContain('productsError');
    expect(result.code).toContain('setProducts');
  });

  it('data without block works too', () => {
    const src = `
page Simple:
  data items = fetch("/api/items")
  layout col:
    text "Items"
`;
    const ast = parse(src);
    const page = ast[0] as any;
    const dataDecl = page.body.find((n: any) => n.type === 'DataDecl');
    expect(dataDecl.name).toBe('items');
    expect(dataDecl.loading).toBeNull();
  });
});

describe('Phase 1: form keyword', () => {
  const formSource = `
page Contact:
  form contactForm:
    field name: str
      label: "이름"
      required: "이름을 입력하세요"
      min: 2 "2자 이상 입력"

    field email: str
      label: "이메일"
      format: email "올바른 이메일 형식이 아닙니다"

    field phone: str
      label: "전화번호"
      pattern: "^01[0-9]{8,9}$" "올바른 전화번호 형식"

    field message: str
      label: "메시지"
      max: 500 "500자 이하"

    submit "보내기" -> api.sendContact(contactForm.data):
      success: toast("전송 완료!")
      error: toast("전송 실패")

  layout col:
    text "문의하기" size=2xl bold
`;

  it('tokenizer recognizes form/field/submit keywords', () => {
    const tokens = tokenize('form contactForm:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('form');

    const tokens2 = tokenize('field name: str');
    expect(tokens2[0].type).toBe('KEYWORD');
    expect(tokens2[0].value).toBe('field');

    const tokens3 = tokenize('submit "보내기" -> action()');
    expect(tokens3[0].type).toBe('KEYWORD');
    expect(tokens3[0].value).toBe('submit');
  });

  it('parses form with fields and validations', () => {
    const ast = parse(formSource);
    const page = ast[0] as any;
    const form = page.body.find((n: any) => n.type === 'FormDecl');
    expect(form).toBeTruthy();
    expect(form.name).toBe('contactForm');
    expect(form.fields.length).toBe(4);
  });

  it('parses field validations correctly', () => {
    const ast = parse(formSource);
    const page = ast[0] as any;
    const form = page.body.find((n: any) => n.type === 'FormDecl');

    const nameField = form.fields[0];
    expect(nameField.name).toBe('name');
    expect(nameField.label).toBe('이름');
    expect(nameField.validations.length).toBe(2);
    expect(nameField.validations[0].rule).toBe('required');
    expect(nameField.validations[1].rule).toBe('min');

    const emailField = form.fields[1];
    expect(emailField.validations[0].rule).toBe('format');

    const phoneField = form.fields[2];
    expect(phoneField.validations[0].rule).toBe('pattern');
  });

  it('parses form submit with success/error handlers', () => {
    const ast = parse(formSource);
    const page = ast[0] as any;
    const form = page.body.find((n: any) => n.type === 'FormDecl');
    expect(form.submit).toBeTruthy();
    expect(form.submit.label).toBe('보내기');
    expect(form.submit.success).toBeTruthy();
    expect(form.submit.error).toBeTruthy();
  });

  it('generates React form with validation', () => {
    const result = compile(formSource, { target: 'react', validate: false });
    expect(result.code).toContain('contactForm');
    expect(result.code).toContain('contactFormErrors');
    expect(result.code).toContain('validateContactForm');
    expect(result.code).toContain('이름을 입력하세요');
    expect(result.code).toContain('submitContactForm');
  });
});

describe('Phase 1: table keyword', () => {
  const tableSource = `
page AdminProducts:
  state products: list = []

  table products:
    columns:
      select
      column "상품명" name sortable searchable
      column "가격" price sortable
      column "카테고리" category filterable
      actions: [edit, delete]
    features:
      pagination: 20
`;

  it('tokenizer recognizes table/column keywords', () => {
    const tokens = tokenize('table products:');
    expect(tokens[0].type).toBe('KEYWORD');
    expect(tokens[0].value).toBe('table');

    const tokens2 = tokenize('column "이름" name sortable');
    expect(tokens2[0].type).toBe('KEYWORD');
    expect(tokens2[0].value).toBe('column');
  });

  it('parses table with columns and features', () => {
    const ast = parse(tableSource);
    const page = ast[0] as any;
    const table = page.body.find((n: any) => n.type === 'Table');
    expect(table).toBeTruthy();
    expect(table.dataSource).toBe('products');
  });

  it('parses table columns correctly', () => {
    const ast = parse(tableSource);
    const page = ast[0] as any;
    const table = page.body.find((n: any) => n.type === 'Table');

    // select + 3 field columns + actions = 5
    expect(table.columns.length).toBe(5);

    const selectCol = table.columns.find((c: any) => c.kind === 'select');
    expect(selectCol).toBeTruthy();

    const nameCol = table.columns.find((c: any) => c.field === 'name');
    expect(nameCol).toBeTruthy();
    expect(nameCol.sortable).toBe(true);
    expect(nameCol.searchable).toBe(true);

    const priceCol = table.columns.find((c: any) => c.field === 'price');
    expect(priceCol).toBeTruthy();
    expect(priceCol.sortable).toBe(true);

    const actionsCol = table.columns.find((c: any) => c.kind === 'actions');
    expect(actionsCol).toBeTruthy();
    expect(actionsCol.actions).toContain('edit');
    expect(actionsCol.actions).toContain('delete');
  });

  it('parses table features', () => {
    const ast = parse(tableSource);
    const page = ast[0] as any;
    const table = page.body.find((n: any) => n.type === 'Table');
    expect(table.features.pagination).toBeTruthy();
  });

  it('generates React table JSX', () => {
    const result = compile(tableSource, { target: 'react', validate: false });
    expect(result.code).toContain('<table');
    expect(result.code).toContain('<thead>');
    expect(result.code).toContain('<tbody>');
    expect(result.code).toContain('상품명');
    expect(result.code).toContain('가격');
    expect(result.code).toContain('Edit');
    expect(result.code).toContain('Delete');
  });
});

describe('Phase 1: model + page integration', () => {
  it('model and page can coexist in same file', () => {
    const src = `
model Todo:
  title: str
  done: bool = false

  validate:
    title.length >= 1 "할 일을 입력하세요"

  permission:
    read: all
    write: auth

page TodoApp:
  state todos: list = []
  state input: str = ""

  fn add():
    todos.push({title: input, done: false})
    input = ""

  layout col gap=16 padding=24:
    text "할 일" size=2xl bold
    layout row gap=8:
      input input placeholder="할 일 입력"
      button "추가" style=primary -> add()
`;

    const result = compile(src, { target: 'react', validate: false });
    // Model code
    expect(result.code).toContain('TodoAPI');
    expect(result.code).toContain('validateTodo');
    // Page code
    expect(result.code).toContain('function TodoApp');
    expect(result.code).toContain('useState');
  });
});
