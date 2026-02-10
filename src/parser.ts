// 0x Parser — Recursive Descent Parser

import { tokenize, Token, TokenType } from './tokenizer.js';
import type {
  ASTNode, PageNode, ComponentNode, AppNode,
  StateDecl, DerivedDecl, PropDecl, TypeDecl, StoreDecl, ApiDecl,
  FnDecl, Param, OnMount, OnDestroy, WatchBlock, CheckDecl,
  LayoutNode, TextNode, ButtonNode, InputNode, ImageNode, LinkNode,
  ToggleNode, SelectNode, IfBlock, ForBlock, ShowBlock, HideBlock,
  StyleDecl, StyleProperty, ComponentCall, CommentNode,
  JsImport, UseImport, JsBlock,
  ModelNode, ModelField, DataDecl, FormDecl, FormField, FormValidation, FormSubmit,
  TableNode, TableColumn,
  AuthDecl, ChartNode, StatNode, RealtimeDecl, RouteDecl, NavNode, NavItem,
  UploadNode, ModalNode, ToastNode,
  RoleDecl, CrudNode, ListNode, LayoutShellNode, SlideOverNode, DrawerNode,
  CommandNode, ConfirmNode, PayNode, CartNode, MediaNode, NotificationNode,
  SearchNode, FilterNode, SocialNode, ProfileNode,
  HeroNode, FeaturesNode, PricingNode, FaqNode, TestimonialNode, FooterNode,
  AdminNode, SeoNode, A11yNode, AnimateNode, GestureNode, AiNode,
  AutomationNode, DevNode, EmitNode, ResponsiveNode, BreadcrumbNode, StatsGridNode,
  // Phase 4
  DeployNode, EnvNode, DockerNode, CiNode, DomainNode, CdnNode, MonitorNode, BackupNode,
  EndpointNode, MiddlewareNode, QueueNode, CronNode, CacheNode, MigrateNode, SeedNode, WebhookNode, StorageNode,
  TestNode, E2eNode, MockNode, FixtureNode,
  ErrorNode, LoadingNode, OfflineNode, RetryNode, LogNode,
  I18nNode, LocaleNode, RtlNode,
  TypeExpr, Expression, Statement, UINode, SourceLocation,
} from './ast.js';

export class ParseError extends Error {
  constructor(message: string, public line: number, public column: number) {
    super(`Line ${line}, Col ${column}: ${message}`);
    this.name = 'ParseError';
  }
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    // Filter out comments for storage, but keep them for potential AST inclusion
    this.tokens = tokens;
  }

  // ── Utilities ─────────────────────────────────────────

  private current(): Token {
    return this.tokens[this.pos];
  }

  private peek(offset: number = 0): Token {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) return this.tokens[this.tokens.length - 1];
    return this.tokens[idx];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private expect(type: TokenType, value?: string): Token {
    const tok = this.current();
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      throw new ParseError(
        `Expected ${type}${value ? ` '${value}'` : ''}, got ${tok.type} '${tok.value}'`,
        tok.line, tok.column
      );
    }
    return this.advance();
  }

  private match(type: TokenType, value?: string): boolean {
    const tok = this.current();
    return tok.type === type && (value === undefined || tok.value === value);
  }

  private matchAndAdvance(type: TokenType, value?: string): Token | null {
    if (this.match(type, value)) {
      return this.advance();
    }
    return null;
  }

  private skipNewlines(): void {
    while (this.match('NEWLINE')) this.advance();
  }

  private loc(): SourceLocation {
    const tok = this.current();
    return { line: tok.line, column: tok.column };
  }

  // Accept IDENTIFIER or KEYWORD as a name (keywords like 'input' can be variable names)
  private expectName(): string {
    const tok = this.current();
    if (tok.type === 'IDENTIFIER' || tok.type === 'KEYWORD') {
      this.advance();
      return tok.value;
    }
    throw new ParseError(`Expected name, got ${tok.type} '${tok.value}'`, tok.line, tok.column);
  }

  // ── Top Level ─────────────────────────────────────────

  parseProgram(): ASTNode[] {
    const nodes: ASTNode[] = [];
    this.skipNewlines();

    while (!this.match('EOF')) {
      if (this.match('NEWLINE')) { this.advance(); continue; }
      if (this.match('DEDENT')) { this.advance(); continue; }
      if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

      if (this.match('KEYWORD', 'page')) {
        nodes.push(this.parsePage());
      } else if (this.match('KEYWORD', 'component')) {
        nodes.push(this.parseComponent());
      } else if (this.match('KEYWORD', 'app')) {
        nodes.push(this.parseApp());
      } else if (this.match('KEYWORD', 'model')) {
        nodes.push(this.parseModel());
      } else if (this.match('KEYWORD', 'auth')) {
        nodes.push(this.parseAuth());
      } else if (this.match('KEYWORD', 'route')) {
        nodes.push(this.parseRoute());
      } else if (this.match('KEYWORD', 'roles')) {
        nodes.push(this.parseRoles());
      } else if (this.match('KEYWORD', 'automation')) {
        nodes.push(this.parseAutomation());
      } else if (this.match('KEYWORD', 'dev')) {
        nodes.push(this.parseDev());
      // Phase 4: Infrastructure top-level
      } else if (this.match('KEYWORD', 'deploy')) {
        nodes.push(this.parseDeploy());
      } else if (this.match('KEYWORD', 'env')) {
        nodes.push(this.parseEnv());
      } else if (this.match('KEYWORD', 'docker')) {
        nodes.push(this.parseDocker());
      } else if (this.match('KEYWORD', 'ci')) {
        nodes.push(this.parseCi());
      } else if (this.match('KEYWORD', 'domain')) {
        nodes.push(this.parseDomain());
      } else if (this.match('KEYWORD', 'cdn')) {
        nodes.push(this.parseCdn());
      } else if (this.match('KEYWORD', 'monitor')) {
        nodes.push(this.parseMonitor());
      } else if (this.match('KEYWORD', 'backup')) {
        nodes.push(this.parseBackup());
      // Phase 4: Backend top-level
      } else if (this.match('KEYWORD', 'endpoint')) {
        nodes.push(this.parseEndpoint());
      } else if (this.match('KEYWORD', 'middleware')) {
        nodes.push(this.parseMiddleware());
      } else if (this.match('KEYWORD', 'queue')) {
        nodes.push(this.parseQueue());
      } else if (this.match('KEYWORD', 'cron')) {
        nodes.push(this.parseCron());
      } else if (this.match('KEYWORD', 'cache')) {
        nodes.push(this.parseCache());
      } else if (this.match('KEYWORD', 'migrate')) {
        nodes.push(this.parseMigrate());
      } else if (this.match('KEYWORD', 'seed')) {
        nodes.push(this.parseSeed());
      } else if (this.match('KEYWORD', 'webhook')) {
        nodes.push(this.parseWebhook());
      } else if (this.match('KEYWORD', 'storage')) {
        nodes.push(this.parseStorage());
      // Phase 4: Testing top-level
      } else if (this.match('KEYWORD', 'test')) {
        nodes.push(this.parseTest());
      } else if (this.match('KEYWORD', 'e2e')) {
        nodes.push(this.parseE2e());
      } else if (this.match('KEYWORD', 'mock')) {
        nodes.push(this.parseMock());
      } else if (this.match('KEYWORD', 'fixture')) {
        nodes.push(this.parseFixture());
      // Phase 4: i18n top-level
      } else if (this.match('KEYWORD', 'i18n')) {
        nodes.push(this.parseI18n());
      } else if (this.match('KEYWORD', 'locale')) {
        nodes.push(this.parseLocale());
      } else if (this.match('KEYWORD', 'rtl')) {
        nodes.push(this.parseRtl());
      } else {
        const tok = this.current();
        throw new ParseError(
          `Expected top-level keyword, got '${tok.value}'`,
          tok.line, tok.column
        );
      }
      this.skipNewlines();
    }

    return nodes;
  }

  private parsePage(): PageNode {
    const location = this.loc();
    this.expect('KEYWORD', 'page');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseBlock();
    return { type: 'Page', name, body, loc: location };
  }

  private parseComponent(): ComponentNode {
    const location = this.loc();
    this.expect('KEYWORD', 'component');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseBlock();
    return { type: 'Component', name, body, loc: location };
  }

  private parseApp(): AppNode {
    const location = this.loc();
    this.expect('KEYWORD', 'app');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseBlock();
    return { type: 'App', name, body, loc: location };
  }

  // ── Block ─────────────────────────────────────────────

  private parseBlock(): ASTNode[] {
    const items: ASTNode[] = [];
    if (!this.match('INDENT')) return items;
    this.advance(); // consume INDENT
    this.skipNewlines();

    while (!this.match('DEDENT') && !this.match('EOF')) {
      if (this.match('NEWLINE')) { this.advance(); continue; }
      if (this.match('COMMENT')) {
        const tok = this.advance();
        items.push({ type: 'Comment', text: tok.value, loc: { line: tok.line, column: tok.column } } as CommentNode);
        this.skipNewlines();
        continue;
      }
      const node = this.parseBodyItem();
      if (node) items.push(node);
      this.skipNewlines();
    }

    if (this.match('DEDENT')) this.advance();
    return items;
  }

  private parseUIBlock(): UINode[] {
    const items: UINode[] = [];
    if (!this.match('INDENT')) return items;
    this.advance();
    this.skipNewlines();

    while (!this.match('DEDENT') && !this.match('EOF')) {
      if (this.match('NEWLINE')) { this.advance(); continue; }
      if (this.match('COMMENT')) {
        const tok = this.advance();
        items.push({ type: 'Comment', text: tok.value, loc: { line: tok.line, column: tok.column } } as CommentNode);
        this.skipNewlines();
        continue;
      }
      const node = this.parseUIElement();
      if (node) items.push(node);
      this.skipNewlines();
    }

    if (this.match('DEDENT')) this.advance();
    return items;
  }

  // ── Body Items ────────────────────────────────────────

  private parseBodyItem(): ASTNode {
    const tok = this.current();

    if (tok.type === 'KEYWORD') {
      switch (tok.value) {
        case 'state': return this.parseState();
        case 'derived': return this.parseDerived();
        case 'prop': return this.parseProp();
        case 'type': return this.parseType();
        case 'store': return this.parseStore();
        case 'api': return this.parseApi();
        case 'fn': return this.parseFn(false);
        case 'async': return this.parseFn(true);
        case 'on': return this.parseOn();
        case 'watch': return this.parseWatch();
        case 'check': return this.parseCheck();
        case 'style': return this.parseStyle();
        case 'js': return this.parseJsInterop();
        case 'use': return this.parseUseImport();
        // Phase 1 advanced
        case 'data': return this.parseData();
        case 'form': return this.parseForm();
        // Phase 2 advanced
        case 'realtime': return this.parseRealtime();
        case 'emit': return this.parseEmit();
        // Phase 4: error/loading/offline/retry/log in body context
        case 'error': return this.parseError();
        case 'loading': return this.parseLoading();
        case 'offline': return this.parseOffline();
        case 'retry': return this.parseRetry();
        case 'log': return this.parseLog();
        // UI elements — fall through to shared UI dispatch
        default: {
          const uiNode = this.tryParseUIKeyword(tok.value);
          if (uiNode) return uiNode;
        }
      }
    }

    throw new ParseError(`Unexpected token '${tok.value}'`, tok.line, tok.column);
  }

  private tryParseUIKeyword(value: string): UINode | null {
    switch (value) {
      case 'layout': return this.parseLayout();
      case 'text': return this.parseText();
      case 'button': return this.parseButton();
      case 'input': return this.parseInput();
      case 'image': return this.parseImage();
      case 'link': return this.parseLink();
      case 'toggle': return this.parseToggle();
      case 'select': return this.parseSelect();
      case 'if': return this.parseIf();
      case 'for': return this.parseFor();
      case 'show': return this.parseShow();
      case 'hide': return this.parseHide();
      case 'component': return this.parseComponentCall();
      case 'table': return this.parseTable();
      case 'chart': return this.parseChart();
      case 'stat': return this.parseStat();
      case 'stats': return this.parseStatsGrid();
      case 'nav': return this.parseNav();
      case 'upload': return this.parseUpload();
      case 'modal': return this.parseModal();
      case 'toast': return this.parseToast();
      case 'crud': return this.parseCrud();
      case 'list': return this.parseList();
      case 'drawer': return this.parseDrawer();
      case 'command': return this.parseCommand();
      case 'confirm': return this.parseConfirm();
      case 'pay': return this.parsePay();
      case 'cart': return this.parseCart();
      case 'media': return this.parseMedia();
      case 'gallery': return this.parseMedia();
      case 'notification': return this.parseNotification();
      case 'search': return this.parseSearch();
      case 'filter': return this.parseFilter();
      case 'social': return this.parseSocial();
      case 'profile': return this.parseProfile();
      case 'hero': return this.parseHero();
      case 'features': return this.parseFeatures();
      case 'pricing': return this.parsePricing();
      case 'faq': return this.parseFaq();
      case 'testimonials': return this.parseTestimonials();
      case 'footer': return this.parseFooter();
      case 'admin': return this.parseAdmin();
      case 'seo': return this.parseSeo();
      case 'a11y': return this.parseA11y();
      case 'animate': return this.parseAnimate();
      case 'gesture': return this.parseGesture();
      case 'ai': return this.parseAi();
      case 'breadcrumb': return this.parseBreadcrumb();
      case 'responsive': return this.parseResponsive();
      case 'mobile': return this.parseResponsive();
      default: return null;
    }
  }

  private parseUIElement(): UINode {
    const tok = this.current();
    if (tok.type === 'KEYWORD') {
      const uiNode = this.tryParseUIKeyword(tok.value);
      if (uiNode) return uiNode;
    }
    throw new ParseError(`Expected UI element, got '${tok.value}'`, tok.line, tok.column);
  }

  // ── Declarations ──────────────────────────────────────

  private parseState(): StateDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'state');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    const valueType = this.parseTypeExpr();
    this.expect('OPERATOR', '=');
    const initial = this.parseExpression();
    return { type: 'StateDecl', name, valueType, initial, loc: location };
  }

  private parseDerived(): DerivedDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'derived');
    const name = this.expectName();
    this.expect('OPERATOR', '=');
    const expression = this.parseExpression();
    return { type: 'DerivedDecl', name, expression, loc: location };
  }

  private parseProp(): PropDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'prop');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    const valueType = this.parseTypeExpr();
    let defaultValue: Expression | null = null;
    if (this.match('OPERATOR', '=')) {
      this.advance();
      defaultValue = this.parseExpression();
    }
    return { type: 'PropDecl', name, valueType, defaultValue, loc: location };
  }

  private parseType(): TypeDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'type');
    const name = this.expectName();
    this.expect('OPERATOR', '=');

    // Check if it's a union type: "val1" | "val2" ...
    if (this.match('STRING')) {
      const members: string[] = [];
      members.push(this.advance().value);
      while (this.match('OPERATOR', '|')) {
        this.advance();
        members.push(this.expect('STRING').value);
      }
      if (members.length > 1) {
        return { type: 'TypeDecl', name, definition: { kind: 'union', members }, loc: location };
      }
      // Single string — treat as union with 1 member
      return { type: 'TypeDecl', name, definition: { kind: 'union', members }, loc: location };
    }

    // Object type: { field: type, ... }
    if (this.match('PUNCTUATION', '{')) {
      const definition = this.parseObjectType();
      return { type: 'TypeDecl', name, definition, loc: location };
    }

    // Named or other type
    const definition = this.parseTypeExpr();
    return { type: 'TypeDecl', name, definition, loc: location };
  }

  private parseStore(): StoreDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'store');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    const valueType = this.parseTypeExpr();
    this.expect('OPERATOR', '=');
    const initial = this.parseExpression();
    return { type: 'StoreDecl', name, valueType, initial, loc: location };
  }

  private parseApi(): ApiDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'api');
    const name = this.expectName();
    this.expect('OPERATOR', '=');
    const method = this.expect('HTTP_METHOD').value as ApiDecl['method'];
    const url = this.expect('STRING').value;
    return { type: 'ApiDecl', name, method, url, loc: location };
  }

  // ── Functions ─────────────────────────────────────────

  private parseFn(isAsync: boolean): FnDecl {
    const location = this.loc();
    if (isAsync) {
      this.expect('KEYWORD', 'async');
    }
    this.expect('KEYWORD', 'fn');
    const name = this.expectName();
    this.expect('PUNCTUATION', '(');
    const params = this.parseParams();
    this.expect('PUNCTUATION', ')');
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    // Parse function body block
    const requires: Expression[] = [];
    const ensures: Expression[] = [];
    const body: Statement[] = [];

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }

        if (this.match('KEYWORD', 'requires')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          requires.push(this.parseExpression());
          this.skipNewlines();
          continue;
        }
        if (this.match('KEYWORD', 'ensures')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          ensures.push(this.parseExpression());
          this.skipNewlines();
          continue;
        }

        body.push(this.parseStatement());
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'FnDecl', name, params, body, isAsync, requires, ensures, loc: location };
  }

  private parseParams(): Param[] {
    const params: Param[] = [];
    if (this.match('PUNCTUATION', ')')) return params;

    params.push(this.parseParam());
    while (this.match('PUNCTUATION', ',')) {
      this.advance();
      params.push(this.parseParam());
    }
    return params;
  }

  private parseParam(): Param {
    const name = this.expectName();
    let paramType: TypeExpr | null = null;
    let defaultValue: Expression | null = null;

    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      paramType = this.parseTypeExpr();
    }
    if (this.match('OPERATOR', '=')) {
      this.advance();
      defaultValue = this.parseExpression();
    }
    return { name, paramType, defaultValue };
  }

  // ── Lifecycle ─────────────────────────────────────────

  private parseOn(): OnMount | OnDestroy {
    const location = this.loc();
    this.expect('KEYWORD', 'on');
    const kind = this.current().value;
    if (kind === 'mount') {
      this.advance();
      this.expect('PUNCTUATION', ':');
      this.skipNewlines();
      const body = this.parseStatementBlock();
      return { type: 'OnMount', body, loc: location };
    } else if (kind === 'destroy') {
      this.advance();
      this.expect('PUNCTUATION', ':');
      this.skipNewlines();
      const body = this.parseStatementBlock();
      return { type: 'OnDestroy', body, loc: location };
    }
    throw new ParseError(`Expected 'mount' or 'destroy' after 'on', got '${kind}'`, this.current().line, this.current().column);
  }

  private parseWatch(): WatchBlock {
    const location = this.loc();
    this.expect('KEYWORD', 'watch');
    const variable = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseStatementBlock();
    return { type: 'WatchBlock', variable, body, loc: location };
  }

  private parseStatementBlock(): Statement[] {
    const stmts: Statement[] = [];
    if (!this.match('INDENT')) return stmts;
    this.advance();
    this.skipNewlines();

    while (!this.match('DEDENT') && !this.match('EOF')) {
      if (this.match('NEWLINE')) { this.advance(); continue; }
      if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
      stmts.push(this.parseStatement());
      this.skipNewlines();
    }
    if (this.match('DEDENT')) this.advance();
    return stmts;
  }

  // ── Check ─────────────────────────────────────────────

  private parseCheck(): CheckDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'check');
    const condition = this.parseExpression();
    const message = this.expect('STRING').value;
    return { type: 'CheckDecl', condition, message, loc: location };
  }

  // ── Style ─────────────────────────────────────────────

  private parseStyle(): StyleDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'style');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const properties: StyleProperty[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        let responsive: string | null = null;
        if (this.match('AT_KEYWORD')) {
          responsive = '@' + this.advance().value;
          this.expect('PUNCTUATION', ':');
        }

        const propName = this.advance().value; // property name (could be KEYWORD or IDENTIFIER)
        this.expect('PUNCTUATION', ':');
        const value = this.parseExpression();
        properties.push({ name: propName, value, responsive });
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'StyleDecl', name, properties, loc: location };
  }

  // ── JS Interop ────────────────────────────────────────

  private parseJsInterop(): JsImport | JsBlock {
    const location = this.loc();
    this.expect('KEYWORD', 'js');

    if (this.match('KEYWORD', 'import')) {
      return this.parseJsImport(location);
    }

    // JS block: js { ... }
    if (this.match('PUNCTUATION', '{')) {
      this.advance();
      let code = '';
      let braceDepth = 1;
      while (braceDepth > 0 && !this.match('EOF')) {
        const tok = this.advance();
        if (tok.value === '{') braceDepth++;
        else if (tok.value === '}') {
          braceDepth--;
          if (braceDepth === 0) break;
        }
        code += tok.value + ' ';
      }
      return { type: 'JsBlock', code: code.trim(), loc: location };
    }

    throw new ParseError(`Expected 'import' or '{' after 'js'`, this.current().line, this.current().column);
  }

  private parseJsImport(location: SourceLocation): JsImport {
    this.expect('KEYWORD', 'import');
    const specifiers: string[] = [];
    let isDefault = false;

    if (this.match('PUNCTUATION', '{')) {
      this.advance();
      while (!this.match('PUNCTUATION', '}')) {
        specifiers.push(this.advance().value);
        if (this.match('PUNCTUATION', ',')) this.advance();
      }
      this.expect('PUNCTUATION', '}');
    } else {
      specifiers.push(this.advance().value);
      isDefault = true;
    }

    this.expect('KEYWORD', 'from');
    const source = this.expect('STRING').value;
    return { type: 'JsImport', specifiers, source, isDefault, loc: location };
  }

  private parseUseImport(): UseImport {
    const location = this.loc();
    this.expect('KEYWORD', 'use');
    const name = this.expectName();
    this.expect('KEYWORD', 'from');
    const source = this.expect('STRING').value;
    return { type: 'UseImport', name, source, loc: location };
  }

  // ── UI Elements ───────────────────────────────────────

  private parseLayout(): LayoutNode {
    const location = this.loc();
    this.expect('KEYWORD', 'layout');

    let direction: LayoutNode['direction'] = 'col';
    if (this.match('KEYWORD', 'row') || this.match('KEYWORD', 'col') ||
        this.match('KEYWORD', 'grid') || this.match('KEYWORD', 'stack')) {
      direction = this.advance().value as LayoutNode['direction'];
    }

    const props: Record<string, Expression> = {};
    let styleClass: string | null = null;

    // Parse layout props until ':'
    while (!this.match('PUNCTUATION', ':') && !this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('STYLE_CLASS')) {
        styleClass = this.advance().value.slice(1); // remove '.'
      } else if (this.match('KEYWORD') || this.match('IDENTIFIER')) {
        const propName = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          props[propName] = this.parseAtomicExpression();
        } else {
          // Boolean prop (e.g., center, bold)
          props[propName] = { kind: 'boolean', value: true };
        }
      } else if (this.match('PUNCTUATION', '{')) {
        // Dynamic prop like {expr ? "a" : "b"}
        // Skip for now — treat as raw expression prop
        const expr = this.parseExpression();
        props['_dynamic'] = expr;
      } else {
        break;
      }
    }

    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const children = this.parseUIBlock();

    return { type: 'Layout', direction, props, styleClass, children, loc: location };
  }

  private parseText(): TextNode {
    const location = this.loc();
    this.expect('KEYWORD', 'text');
    const content = this.parseExpression();
    const props = this.parseInlineProps();
    return { type: 'Text', content, props, loc: location };
  }

  private parseButton(): ButtonNode {
    const location = this.loc();
    this.expect('KEYWORD', 'button');
    const label = this.parseAtomicExpression();
    const props = this.parseInlinePropsUntilArrow();

    let action: Expression | Statement[] = { kind: 'null' };
    if (this.match('OPERATOR', '->')) {
      this.advance();
      const expr = this.parseExpression();
      // Check for assignment in action: count += 1, items.push(x), etc.
      if (this.match('OPERATOR', '=') || this.match('OPERATOR', '+=') || this.match('OPERATOR', '-=')) {
        const op = this.advance().value;
        const value = this.parseExpression();
        action = { kind: 'assignment', target: expr, op, value };
      } else {
        action = expr;
      }
    }

    return { type: 'Button', label, action, props, loc: location };
  }

  private parseInput(): InputNode {
    const location = this.loc();
    this.expect('KEYWORD', 'input');
    const binding = this.expectName();
    const props = this.parseInlineProps();
    return { type: 'Input', binding, props, loc: location };
  }

  private parseImage(): ImageNode {
    const location = this.loc();
    this.expect('KEYWORD', 'image');
    const src = this.parseAtomicExpression();
    const props = this.parseInlineProps();
    return { type: 'Image', src, props, loc: location };
  }

  private parseLink(): LinkNode {
    const location = this.loc();
    this.expect('KEYWORD', 'link');
    const label = this.parseAtomicExpression();
    const props = this.parseInlineProps();
    const href = props['href'] || { kind: 'string' as const, value: '#' };
    return { type: 'Link', label, href, props, loc: location };
  }

  private parseToggle(): ToggleNode {
    const location = this.loc();
    this.expect('KEYWORD', 'toggle');

    // binding can be simple identifier or member expression like item.done
    let binding = '';
    if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
      binding = this.advance().value;
      while (this.match('PUNCTUATION', '.')) {
        this.advance();
        binding += '.' + this.advance().value;
      }
    }

    const props = this.parseInlineProps();
    return { type: 'Toggle', binding, props, loc: location };
  }

  private parseSelect(): SelectNode {
    const location = this.loc();
    this.expect('KEYWORD', 'select');
    const binding = this.expectName();
    const props = this.parseInlineProps();
    const options = props['options'] || { kind: 'array', elements: [] };
    return { type: 'Select', binding, options, props, loc: location };
  }

  private parseComponentCall(): ComponentCall {
    const location = this.loc();
    this.expect('KEYWORD', 'component');
    const name = this.expectName();

    const args: Record<string, Expression> = {};
    if (this.match('PUNCTUATION', '(')) {
      this.advance();
      let idx = 0;
      while (!this.match('PUNCTUATION', ')') && !this.match('EOF')) {
        // Check for named arg: name=value
        if ((this.current().type === 'IDENTIFIER' || this.current().type === 'KEYWORD') &&
            this.peek(1).type === 'OPERATOR' && this.peek(1).value === '=') {
          const argName = this.advance().value;
          this.advance(); // consume =
          const value = this.parseAtomicExpression();
          args[argName] = value;
        } else {
          // Positional args stored with index as key
          const expr = this.parseExpression();
          args[`_arg${idx}`] = expr;
          idx++;
        }
        if (this.match('PUNCTUATION', ',')) this.advance();
      }
      this.expect('PUNCTUATION', ')');
    }

    return { type: 'ComponentCall', name, args, loc: location };
  }

  // ── Control Flow ──────────────────────────────────────

  private parseIf(): IfBlock {
    const location = this.loc();
    this.expect('KEYWORD', 'if');
    const condition = this.parseExpression();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseUIBlock();

    const elifs: { condition: Expression; body: UINode[] }[] = [];
    let elseBody: UINode[] | null = null;

    while (this.match('KEYWORD', 'elif')) {
      this.advance();
      const elifCond = this.parseExpression();
      this.expect('PUNCTUATION', ':');
      this.skipNewlines();
      const elifBody = this.parseUIBlock();
      elifs.push({ condition: elifCond, body: elifBody });
    }

    if (this.match('KEYWORD', 'else')) {
      this.advance();
      this.expect('PUNCTUATION', ':');
      this.skipNewlines();
      elseBody = this.parseUIBlock();
    }

    return { type: 'IfBlock', condition, body, elifs, elseBody, loc: location };
  }

  private parseFor(): ForBlock {
    const location = this.loc();
    this.expect('KEYWORD', 'for');
    const item = this.expectName();
    let index: string | null = null;

    if (this.match('PUNCTUATION', ',')) {
      this.advance();
      index = this.expectName();
    }

    this.expect('KEYWORD', 'in');
    const iterable = this.parseExpression();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseUIBlock();

    return { type: 'ForBlock', item, index, iterable, body, loc: location };
  }

  private parseShow(): ShowBlock {
    const location = this.loc();
    this.expect('KEYWORD', 'show');
    const condition = this.parseExpression();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseUIBlock();
    return { type: 'ShowBlock', condition, body, loc: location };
  }

  private parseHide(): HideBlock {
    const location = this.loc();
    this.expect('KEYWORD', 'hide');
    const condition = this.parseExpression();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseUIBlock();
    return { type: 'HideBlock', condition, body, loc: location };
  }

  // ── Phase 1 Advanced: Model ──────────────────────────

  private parseModel(): ModelNode {
    const location = this.loc();
    this.expect('KEYWORD', 'model');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const fields: ModelField[] = [];
    const validate: { condition: Expression; message: string }[] = [];
    const permissions: { action: string; role: string }[] = [];
    const search: string[] = [];
    const sort: string[] = [];
    const filter: string[] = [];

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'validate')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              const condition = this.parseExpression();
              const message = this.expect('STRING').value;
              validate.push({ condition, message });
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        if (this.match('KEYWORD', 'permission')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              const action = this.expectName();
              this.expect('PUNCTUATION', ':');
              const role = this.expectName();
              permissions.push({ action, role });
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        // search:, sort:, filter: — list of field names
        if ((this.match('IDENTIFIER', 'search') || this.match('KEYWORD', 'search')) && this.peek(1).value === ':') {
          this.advance(); this.advance(); // name + ':'
          while (!this.match('NEWLINE') && !this.match('EOF')) {
            search.push(this.expectName());
            if (this.match('PUNCTUATION', ',')) this.advance();
          }
          this.skipNewlines();
          continue;
        }
        if ((this.match('IDENTIFIER', 'sort') || this.match('KEYWORD', 'sort')) && this.peek(1).value === ':') {
          this.advance(); this.advance();
          while (!this.match('NEWLINE') && !this.match('EOF')) {
            sort.push(this.expectName());
            if (this.match('PUNCTUATION', ',')) this.advance();
          }
          this.skipNewlines();
          continue;
        }
        if ((this.match('IDENTIFIER', 'filter') || this.match('KEYWORD', 'filter')) && this.peek(1).value === ':') {
          this.advance(); this.advance();
          while (!this.match('NEWLINE') && !this.match('EOF')) {
            filter.push(this.expectName());
            if (this.match('PUNCTUATION', ',')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        // Field: name: type = default
        const fieldName = this.expectName();
        this.expect('PUNCTUATION', ':');
        const fieldType = this.parseTypeExpr();
        let defaultValue: Expression | null = null;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          defaultValue = this.parseExpression();
        }
        fields.push({ name: fieldName, fieldType, defaultValue });
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'Model', name, fields, validate, permissions, search, sort, filter, loc: location };
  }

  // ── Phase 1 Advanced: Data ──────────────────────────

  private parseData(): DataDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'data');
    const name = this.expectName();
    this.expect('OPERATOR', '=');
    const query = this.parseExpression();

    let loading: Expression | null = null;
    let error: string | null = null;
    let empty: string | null = null;

    // Check for block with loading/error/empty
    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();
      if (this.match('INDENT')) {
        this.advance();
        this.skipNewlines();
        while (!this.match('DEDENT') && !this.match('EOF')) {
          if (this.match('NEWLINE')) { this.advance(); continue; }
          const key = this.expectName();
          this.expect('PUNCTUATION', ':');
          if (key === 'loading') {
            loading = this.parseExpression();
          } else if (key === 'error') {
            error = this.expect('STRING').value;
          } else if (key === 'empty') {
            empty = this.expect('STRING').value;
          }
          this.skipNewlines();
        }
        if (this.match('DEDENT')) this.advance();
      }
    }

    return { type: 'DataDecl', name, query, loading, error, empty, loc: location };
  }

  // ── Phase 1 Advanced: Form ──────────────────────────

  private parseForm(): FormDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'form');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const fields: FormField[] = [];
    let submit: FormSubmit | null = null;

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'field')) {
          fields.push(this.parseFormField());
          this.skipNewlines();
          continue;
        }

        if (this.match('KEYWORD', 'submit')) {
          submit = this.parseFormSubmit();
          this.skipNewlines();
          continue;
        }

        // Skip unknown
        this.advance();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'FormDecl', name, fields, submit, loc: location };
  }

  private parseFormField(): FormField {
    this.expect('KEYWORD', 'field');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    const fieldType = this.parseTypeExpr();
    this.skipNewlines();

    let label = name;
    const validations: FormValidation[] = [];
    const props: Record<string, Expression> = {};

    // Parse field block with validations
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        const key = this.expectName();
        this.expect('PUNCTUATION', ':');

        if (key === 'label') {
          label = this.expect('STRING').value;
        } else if (key === 'required') {
          const message = this.expect('STRING').value;
          validations.push({ rule: 'required', value: null, message });
        } else if (key === 'min') {
          const value = this.parseExpression();
          const message = this.expect('STRING').value;
          validations.push({ rule: 'min', value, message });
        } else if (key === 'max') {
          const value = this.parseExpression();
          const message = this.expect('STRING').value;
          validations.push({ rule: 'max', value, message });
        } else if (key === 'format') {
          const formatName = this.expectName();
          const message = this.expect('STRING').value;
          validations.push({ rule: 'format', value: { kind: 'string', value: formatName }, message });
        } else if (key === 'pattern') {
          const pattern = this.expect('STRING').value;
          const message = this.expect('STRING').value;
          validations.push({ rule: 'pattern', value: { kind: 'string', value: pattern }, message });
        } else {
          // Generic prop
          props[key] = this.parseExpression();
        }
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { name, fieldType, label, validations, props };
  }

  private parseFormSubmit(): FormSubmit {
    this.expect('KEYWORD', 'submit');
    const label = this.expect('STRING').value;
    this.expect('OPERATOR', '->');
    const action = this.parseExpression();

    let success: Expression | null = null;
    let error: Expression | null = null;

    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();
      if (this.match('INDENT')) {
        this.advance();
        this.skipNewlines();
        while (!this.match('DEDENT') && !this.match('EOF')) {
          if (this.match('NEWLINE')) { this.advance(); continue; }
          const key = this.expectName();
          this.expect('PUNCTUATION', ':');
          if (key === 'success') {
            success = this.parseExpression();
          } else if (key === 'error') {
            error = this.parseExpression();
          }
          this.skipNewlines();
        }
        if (this.match('DEDENT')) this.advance();
      }
    }

    return { label, action, success, error };
  }

  // ── Phase 1 Advanced: Table ──────────────────────────

  private parseTable(): TableNode {
    const location = this.loc();
    this.expect('KEYWORD', 'table');
    const dataSource = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const columns: TableColumn[] = [];
    const features: Record<string, Expression> = {};

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'column')) {
          this.advance();
          const label = this.expect('STRING').value;
          const field = this.expectName();

          // Parse column modifiers
          let sortable = false;
          let searchable = false;
          let filterable = false;
          let format: string | undefined;

          while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('DEDENT')) {
            const mod = this.expectName();
            if (mod === 'sortable') sortable = true;
            else if (mod === 'searchable') searchable = true;
            else if (mod === 'filterable') filterable = true;
            else if (mod === 'format') {
              this.expect('OPERATOR', '=');
              format = this.expectName();
              // Allow format=currency(KRW) etc.
              if (this.match('PUNCTUATION', '(')) {
                this.advance();
                format += '(' + this.expectName() + ')';
                this.expect('PUNCTUATION', ')');
              }
            }
          }

          columns.push({ kind: 'field', field, label, sortable, searchable, filterable, format });
          this.skipNewlines();
          continue;
        }

        // select (checkbox column)
        if (this.match('KEYWORD', 'select') || this.match('IDENTIFIER', 'select')) {
          this.advance();
          columns.push({ kind: 'select' });
          this.skipNewlines();
          continue;
        }

        // actions: [edit, delete]
        if (this.match('IDENTIFIER', 'actions') || this.match('KEYWORD', 'actions')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          const actionsExpr = this.parseExpression();
          const actions: string[] = [];
          if (actionsExpr.kind === 'array') {
            for (const el of actionsExpr.elements) {
              if (el.kind === 'identifier') actions.push(el.name);
              else if (el.kind === 'string') actions.push(el.value);
            }
          }
          columns.push({ kind: 'actions', actions });
          this.skipNewlines();
          continue;
        }

        // features block
        if (this.match('IDENTIFIER', 'features') || this.match('KEYWORD', 'features')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              const featureName = this.expectName();
              this.expect('PUNCTUATION', ':');
              features[featureName] = this.parseExpression();
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        // columns: block (nested)
        if (this.match('IDENTIFIER', 'columns') || this.match('KEYWORD', 'columns')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              if (this.match('KEYWORD', 'column')) {
                this.advance();
                const label = this.expect('STRING').value;
                // field can be member expr like product.name
                let field = this.expectName();
                while (this.match('PUNCTUATION', '.')) {
                  this.advance();
                  field += '.' + this.expectName();
                }

                let sortable = false, searchable = false, filterable = false;
                let format: string | undefined;

                while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('DEDENT')) {
                  const mod = this.expectName();
                  if (mod === 'sortable') sortable = true;
                  else if (mod === 'searchable') searchable = true;
                  else if (mod === 'filterable') filterable = true;
                  else if (mod === 'format') {
                    this.expect('OPERATOR', '=');
                    format = this.expectName();
                    if (this.match('PUNCTUATION', '(')) {
                      this.advance();
                      format += '(' + this.expectName() + ')';
                      this.expect('PUNCTUATION', ')');
                    }
                  }
                }
                columns.push({ kind: 'field', field, label, sortable, searchable, filterable, format });
              } else if (this.match('KEYWORD', 'select') || this.match('IDENTIFIER', 'select')) {
                this.advance();
                columns.push({ kind: 'select' });
              } else if (this.match('IDENTIFIER', 'actions') || this.match('KEYWORD', 'actions')) {
                this.advance();
                this.expect('PUNCTUATION', ':');
                const actionsExpr = this.parseExpression();
                const actions: string[] = [];
                if (actionsExpr.kind === 'array') {
                  for (const el of actionsExpr.elements) {
                    if (el.kind === 'identifier') actions.push(el.name);
                    else if (el.kind === 'string') actions.push(el.value);
                  }
                }
                columns.push({ kind: 'actions', actions });
              } else {
                this.advance();
              }
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        // Skip unknown
        this.advance();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'Table', dataSource, columns, features, loc: location };
  }

  // ── Phase 2 Advanced: Auth ──────────────────────────

  private parseAuth(): AuthDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'auth');

    let provider = 'custom';
    // auth provider="supabase": OR auth:
    if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
      const key = this.current().value;
      if (key === 'provider') {
        this.advance();
        this.expect('OPERATOR', '=');
        provider = this.expect('STRING').value;
      }
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const loginFields: string[] = [];
    const signupFields: string[] = [];
    const guards: { role: string; redirect: string | null }[] = [];

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'login')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          while (!this.match('NEWLINE') && !this.match('EOF')) {
            loginFields.push(this.expectName());
            if (this.match('PUNCTUATION', ',')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        if (this.match('KEYWORD', 'signup')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          while (!this.match('NEWLINE') && !this.match('EOF')) {
            signupFields.push(this.expectName());
            if (this.match('PUNCTUATION', ',')) this.advance();
          }
          this.skipNewlines();
          continue;
        }

        if (this.match('KEYWORD', 'logout')) {
          this.advance();
          // logout is just a flag, no params needed
          this.skipNewlines();
          continue;
        }

        if (this.match('KEYWORD', 'guard')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          const role = this.expectName();
          let redirect: string | null = null;
          if (this.match('OPERATOR', '->')) {
            this.advance();
            if (this.match('KEYWORD', 'redirect') || this.match('IDENTIFIER', 'redirect')) {
              this.advance();
              this.expect('PUNCTUATION', '(');
              redirect = this.expect('STRING').value;
              this.expect('PUNCTUATION', ')');
            } else {
              redirect = this.expect('STRING').value;
            }
          }
          guards.push({ role, redirect });
          this.skipNewlines();
          continue;
        }

        this.advance();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'AuthDecl', provider, loginFields, signupFields, guards, loc: location };
  }

  // ── Phase 2 Advanced: Chart ──────────────────────────

  private parseChart(): ChartNode {
    const location = this.loc();
    this.expect('KEYWORD', 'chart');

    // chart bar myChart: OR chart line myChart:
    let chartType = 'bar';
    const typeNames = ['bar', 'line', 'pie', 'doughnut', 'area', 'radar', 'scatter'];
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && typeNames.includes(this.current().value)) {
      chartType = this.advance().value;
    }

    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const props: Record<string, Expression> = {};

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        const key = this.expectName();
        this.expect('PUNCTUATION', ':');
        props[key] = this.parseExpression();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'Chart', chartType, name, props, loc: location };
  }

  // ── Phase 2 Advanced: Stat ──────────────────────────

  private parseStat(): StatNode {
    const location = this.loc();
    this.expect('KEYWORD', 'stat');
    const label = this.expect('STRING').value;
    const props: Record<string, Expression> = {};
    let value: Expression = { kind: 'number', value: 0 };
    let change: Expression | null = null;
    let icon: string | null = null;

    // Parse inline props: stat "매출" value=revenue change="+12%" icon="chart"
    while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('PUNCTUATION', ':') && !this.match('INDENT')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          const expr = this.parseAtomicExpression();
          if (key === 'value') value = expr;
          else if (key === 'change') change = expr;
          else if (key === 'icon') icon = expr.kind === 'string' ? expr.value : null;
          else props[key] = expr;
        } else {
          props[key] = { kind: 'boolean', value: true };
        }
      } else {
        break;
      }
    }

    return { type: 'Stat', label, value, change, icon, props, loc: location };
  }

  // ── Phase 2 Advanced: Realtime ──────────────────────

  private parseRealtime(): RealtimeDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'realtime');
    const name = this.expectName();
    this.expect('OPERATOR', '=');

    // realtime messages = subscribe("channel"):
    let channel: Expression;
    if (this.match('KEYWORD', 'subscribe') || this.match('IDENTIFIER', 'subscribe')) {
      this.advance();
      this.expect('PUNCTUATION', '(');
      channel = this.parseExpression();
      this.expect('PUNCTUATION', ')');
    } else {
      channel = this.parseExpression();
    }

    const handlers: { event: string; body: Statement[] }[] = [];

    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();

      if (this.match('INDENT')) {
        this.advance();
        this.skipNewlines();

        while (!this.match('DEDENT') && !this.match('EOF')) {
          if (this.match('NEWLINE')) { this.advance(); continue; }
          if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

          if (this.match('KEYWORD', 'on')) {
            this.advance();
            const event = this.expectName();
            this.expect('PUNCTUATION', ':');
            this.skipNewlines();

            // Could be single-line or block
            if (this.match('INDENT')) {
              const body = this.parseStatementBlock();
              handlers.push({ event, body });
            } else {
              const stmt = this.parseStatement();
              handlers.push({ event, body: [stmt] });
              this.skipNewlines();
            }
            continue;
          }

          this.advance();
          this.skipNewlines();
        }
        if (this.match('DEDENT')) this.advance();
      }
    }

    return { type: 'RealtimeDecl', name, channel, handlers, loc: location };
  }

  // ── Phase 2 Advanced: Route ──────────────────────────

  private parseRoute(): RouteDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'route');
    const path = this.expect('STRING').value;
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    let target = '';
    let guard: string | null = null;

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'page')) {
          this.advance();
          target = this.expectName();
          this.skipNewlines();
          continue;
        }

        if (this.match('KEYWORD', 'guard')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          guard = this.expectName();
          this.skipNewlines();
          continue;
        }

        this.advance();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'RouteDecl', path, target, guard, loc: location };
  }

  // ── Phase 2 Advanced: Nav ──────────────────────────

  private parseNav(): NavNode {
    const location = this.loc();
    this.expect('KEYWORD', 'nav');

    const props: Record<string, Expression> = {};
    // optional inline props
    while (!this.match('PUNCTUATION', ':') && !this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          props[key] = this.parseAtomicExpression();
        } else {
          props[key] = { kind: 'boolean', value: true };
        }
      } else {
        break;
      }
    }

    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const items: NavItem[] = [];

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'link')) {
          this.advance();
          const label = this.expect('STRING').value;
          let href = '#';
          let icon: string | null = null;

          // Parse link props
          while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('DEDENT')) {
            if ((this.match('IDENTIFIER') || this.match('KEYWORD'))) {
              const key = this.advance().value;
              if (key === 'href' && this.match('OPERATOR', '=')) {
                this.advance();
                href = this.expect('STRING').value;
              } else if (key === 'icon' && this.match('OPERATOR', '=')) {
                this.advance();
                icon = this.expect('STRING').value;
              }
            } else {
              break;
            }
          }

          items.push({ label, href, icon });
          this.skipNewlines();
          continue;
        }

        this.advance();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'Nav', items, props, loc: location };
  }

  // ── Phase 2 Advanced: Upload ──────────────────────────

  private parseUpload(): UploadNode {
    const location = this.loc();
    this.expect('KEYWORD', 'upload');
    const name = this.expectName();

    let accept: string | null = null;
    let maxSize: number | null = null;
    let preview = false;
    let action: Expression | null = null;

    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();

      if (this.match('INDENT')) {
        this.advance();
        this.skipNewlines();

        while (!this.match('DEDENT') && !this.match('EOF')) {
          if (this.match('NEWLINE')) { this.advance(); continue; }
          if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

          const key = this.expectName();
          this.expect('PUNCTUATION', ':');

          if (key === 'accept') {
            accept = this.expect('STRING').value;
          } else if (key === 'maxSize') {
            maxSize = parseFloat(this.expect('NUMBER').value);
          } else if (key === 'preview') {
            const val = this.current().value;
            if (val === 'true') { this.advance(); preview = true; }
            else if (val === 'false') { this.advance(); preview = false; }
            else preview = true;
          } else if (key === 'action') {
            action = this.parseExpression();
          }
          this.skipNewlines();
        }
        if (this.match('DEDENT')) this.advance();
      }
    }

    return { type: 'Upload', name, accept, maxSize, preview, action, loc: location };
  }

  // ── Phase 2 Advanced: Modal ──────────────────────────

  private parseModal(): ModalNode {
    const location = this.loc();
    this.expect('KEYWORD', 'modal');
    const name = this.expectName();

    let title = name;
    let trigger: string | null = null;

    // Parse optional inline props
    while (!this.match('PUNCTUATION', ':') && !this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (key === 'title' && this.match('OPERATOR', '=')) {
          this.advance();
          title = this.expect('STRING').value;
        } else if (key === 'trigger' && this.match('OPERATOR', '=')) {
          this.advance();
          trigger = this.expect('STRING').value;
        }
      } else {
        break;
      }
    }

    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseUIBlock();

    return { type: 'Modal', name, title, trigger, body, loc: location };
  }

  // ── Phase 2 Advanced: Toast ──────────────────────────

  private parseToast(): ToastNode {
    const location = this.loc();
    this.expect('KEYWORD', 'toast');
    const message = this.parseExpression();

    let toastType = 'info';
    let duration: number | null = null;

    // Parse inline props: toast "message" type=success duration=3000
    while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('DEDENT')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          if (key === 'type') {
            toastType = this.advance().value;
          } else if (key === 'duration') {
            duration = parseFloat(this.expect('NUMBER').value);
          }
        }
      } else {
        break;
      }
    }

    return { type: 'Toast', message, toastType, duration, loc: location };
  }

  // ── Phase 3 Stubs (top-level) ──────────────────────────

  private parseRoles(): RoleDecl {
    const location = this.loc();
    this.expect('KEYWORD', 'roles');
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const roles: { name: string; inherits: string[]; can: string[] }[] = [];

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();

      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('IDENTIFIER') || (this.match('KEYWORD') && !['validate', 'permission', 'data', 'form', 'table'].includes(this.current().value))) {
          const name = this.expectName();
          const inherits: string[] = [];
          const can: string[] = [];

          if (this.match('PUNCTUATION', ':')) {
            this.advance();
            this.skipNewlines();
            if (this.match('INDENT')) {
              this.advance();
              this.skipNewlines();
              while (!this.match('DEDENT') && !this.match('EOF')) {
                if (this.match('NEWLINE')) { this.advance(); continue; }
                const key = this.expectName();
                if (key === 'can') {
                  this.expect('PUNCTUATION', ':');
                  while (!this.match('NEWLINE') && !this.match('EOF')) {
                    can.push(this.expectName());
                    if (this.match('PUNCTUATION', ',')) this.advance();
                  }
                }
                this.skipNewlines();
              }
              if (this.match('DEDENT')) this.advance();
            }
          }

          roles.push({ name, inherits, can });
          this.skipNewlines();
          continue;
        }

        this.advance();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'RoleDecl', roles, loc: location };
  }

  private parseAutomation(): AutomationNode {
    const location = this.loc();
    this.expect('KEYWORD', 'automation');
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const triggers: { event: string; actions: Expression[] }[] = [];
    const schedules: { cron: string; actions: Expression[] }[] = [];

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }

        if (this.match('KEYWORD', 'trigger') || (this.match('IDENTIFIER') && this.current().value === 'trigger')) {
          this.advance();
          const event = this.match('STRING') ? this.advance().value : this.expectName();
          const actions: Expression[] = [];
          this.skipNewlines();
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
              actions.push(this.parseExpression());
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          triggers.push({ event, actions });
        } else if (this.match('KEYWORD', 'schedule') || (this.match('IDENTIFIER') && this.current().value === 'schedule')) {
          this.advance();
          const cron = this.match('STRING') ? this.advance().value : '* * * * *';
          const actions: Expression[] = [];
          this.skipNewlines();
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
              actions.push(this.parseExpression());
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          schedules.push({ cron, actions });
        } else {
          // Skip unknown tokens in the block
          this.advance();
          this.skipNewlines();
        }
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'Automation', triggers, schedules, loc: location };
  }

  private parseDev(): DevNode {
    const location = this.loc();
    this.expect('KEYWORD', 'dev');
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();

    const props: Record<string, Expression> = {};

    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        const key = this.expectName();
        this.expect('PUNCTUATION', ':');
        props[key] = this.parseExpression();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }

    return { type: 'Dev', props, loc: location };
  }

  // ── Phase 3: Generic block parser (reusable for many node types) ────

  private parseGenericBlock(): { props: Record<string, Expression>; body: UINode[] } {
    const props: Record<string, Expression> = {};
    // Parse inline props before ':'
    while (!this.match('PUNCTUATION', ':') && !this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          props[key] = this.parseAtomicExpression();
        } else {
          props[key] = { kind: 'boolean', value: true };
        }
      } else break;
    }
    let body: UINode[] = [];
    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();
      body = this.parseUIBlock();
    }
    return { props, body };
  }

  private parseGenericPropsBlock(): Record<string, Expression> {
    const props: Record<string, Expression> = {};
    if (!this.match('PUNCTUATION', ':')) return props;
    this.advance();
    this.skipNewlines();
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        const key = this.expectName();
        this.expect('PUNCTUATION', ':');
        props[key] = this.parseExpression();
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return props;
  }

  // ── Phase 3: All pattern keyword parsers ──────────────

  private parseEmit(): EmitNode {
    const location = this.loc();
    this.expect('KEYWORD', 'emit');
    const channel = this.parseExpression();
    const props: Record<string, Expression> = {};
    let data: Expression = { kind: 'null' };
    while (!this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) { this.advance(); props[key] = this.parseAtomicExpression(); }
      } else break;
    }
    if (props['data']) data = props['data'];
    return { type: 'Emit', channel, data, props, loc: location };
  }

  private parseCrud(): CrudNode {
    const location = this.loc();
    this.expect('KEYWORD', 'crud');
    const model = this.expectName();
    const { props, body } = this.parseGenericBlock();
    return { type: 'Crud', model, props, columns: [], actions: [], bulkActions: [], loc: location };
  }

  private parseList(): ListNode {
    const location = this.loc();
    this.advance(); // 'list' keyword
    let listType = 'grid';
    const typeNames = ['grid', 'timeline', 'kanban', 'tree', 'virtual'];
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && typeNames.includes(this.current().value)) {
      listType = this.advance().value;
    }
    const dataSource = this.parseExpression();
    const { props, body } = this.parseGenericBlock();
    return { type: 'List', listType, dataSource, props, body, loc: location };
  }

  private parseDrawer(): DrawerNode {
    const location = this.loc();
    this.expect('KEYWORD', 'drawer');
    const name = this.expectName();
    const { props, body } = this.parseGenericBlock();
    return { type: 'Drawer', name, props, body, loc: location };
  }

  private parseCommand(): CommandNode {
    const location = this.loc();
    this.expect('KEYWORD', 'command');
    let shortcut = 'ctrl+k';
    if (this.match('STRING')) shortcut = this.advance().value;
    const props = this.parseGenericPropsBlock();
    return { type: 'Command', shortcut, props, sections: [], loc: location };
  }

  private parseConfirm(): ConfirmNode {
    const location = this.loc();
    this.expect('KEYWORD', 'confirm');
    const message = this.expect('STRING').value;
    let description: string | null = null;
    let confirmLabel = 'Confirm';
    let cancelLabel = 'Cancel';
    let danger = false;
    while (!this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (key === 'danger') danger = true;
        else if (this.match('OPERATOR', '=')) {
          this.advance();
          if (key === 'confirm') confirmLabel = this.expect('STRING').value;
          else if (key === 'cancel') cancelLabel = this.expect('STRING').value;
          else if (key === 'description') description = this.expect('STRING').value;
        }
      } else break;
    }
    return { type: 'Confirm', message, description, confirmLabel, cancelLabel, danger, loc: location };
  }

  private parsePay(): PayNode {
    const location = this.loc();
    this.expect('KEYWORD', 'pay');
    let payType = 'checkout';
    let provider = 'stripe';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['checkout', 'pricing', 'portal', 'buyButton'].includes(this.current().value)) {
      payType = this.advance().value;
    }
    const { props } = this.parseGenericBlock();
    if (props['provider'] && props['provider'].kind === 'string') provider = (props['provider'] as any).value;
    return { type: 'Pay', provider, payType, props, loc: location };
  }

  private parseCart(): CartNode {
    const location = this.loc();
    this.expect('KEYWORD', 'cart');
    const props = this.parseGenericPropsBlock();
    return { type: 'Cart', props, computed: [], loc: location };
  }

  private parseMedia(): MediaNode {
    const location = this.loc();
    const keyword = this.advance().value; // 'media' or 'gallery'
    let mediaType = keyword === 'gallery' ? 'gallery' : 'gallery';
    const typeNames = ['gallery', 'video', 'audio', 'carousel'];
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && typeNames.includes(this.current().value)) {
      mediaType = this.advance().value;
    }
    const src = this.parseExpression();
    const props: Record<string, Expression> = {};
    while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('PUNCTUATION', ':')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) { this.advance(); props[key] = this.parseAtomicExpression(); }
        else props[key] = { kind: 'boolean', value: true };
      } else break;
    }
    return { type: 'Media', mediaType, src, props, loc: location };
  }

  private parseNotification(): NotificationNode {
    const location = this.loc();
    this.expect('KEYWORD', 'notification');
    let notifType = 'center';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['center', 'push', 'email'].includes(this.current().value)) {
      notifType = this.advance().value;
    }
    const props = this.parseGenericPropsBlock();
    return { type: 'Notification', notifType, props, loc: location };
  }

  private parseSearch(): SearchNode {
    const location = this.loc();
    this.expect('KEYWORD', 'search');
    let searchType = 'global';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['global', 'inline'].includes(this.current().value)) {
      searchType = this.advance().value;
    }
    const target = (this.match('IDENTIFIER') || this.match('KEYWORD')) && !this.match('PUNCTUATION', ':') ? this.advance().value : '';
    const { props } = this.parseGenericBlock();
    return { type: 'Search', searchType, target, props, loc: location };
  }

  private parseFilter(): FilterNode {
    const location = this.loc();
    this.expect('KEYWORD', 'filter');
    const target = this.expectName();
    const props = this.parseGenericPropsBlock();
    return { type: 'Filter', target, fields: [], props, loc: location };
  }

  private parseSocial(): SocialNode {
    const location = this.loc();
    this.expect('KEYWORD', 'social');
    let socialType = 'like';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['like', 'bookmark', 'comments', 'follow', 'share', 'feed'].includes(this.current().value)) {
      socialType = this.advance().value;
    }
    const target = this.parseExpression();
    const { props, body } = this.parseGenericBlock();
    return { type: 'Social', socialType, target, props, body, loc: location };
  }

  private parseProfile(): ProfileNode {
    const location = this.loc();
    this.expect('KEYWORD', 'profile');
    const user = this.parseExpression();
    const { props, body } = this.parseGenericBlock();
    return { type: 'Profile', user, props, sections: [], loc: location };
  }

  private parseHero(): HeroNode {
    const location = this.loc();
    this.expect('KEYWORD', 'hero');
    const { props, body } = this.parseGenericBlock();
    return { type: 'Hero', props, body, loc: location };
  }

  private parseFeatures(): FeaturesNode {
    const location = this.loc();
    this.expect('KEYWORD', 'features');
    const props = this.parseGenericPropsBlock();
    return { type: 'Features', props, items: [], loc: location };
  }

  private parsePricing(): PricingNode {
    const location = this.loc();
    this.expect('KEYWORD', 'pricing');
    const props = this.parseGenericPropsBlock();
    return { type: 'Pricing', props, plans: [], loc: location };
  }

  private parseFaq(): FaqNode {
    const location = this.loc();
    this.expect('KEYWORD', 'faq');
    const props = this.parseGenericPropsBlock();
    return { type: 'Faq', props, items: [], loc: location };
  }

  private parseTestimonials(): TestimonialNode {
    const location = this.loc();
    this.expect('KEYWORD', 'testimonials');
    const props = this.parseGenericPropsBlock();
    return { type: 'Testimonial', props, items: [], loc: location };
  }

  private parseFooter(): FooterNode {
    const location = this.loc();
    this.expect('KEYWORD', 'footer');
    const props = this.parseGenericPropsBlock();
    return { type: 'Footer', columns: [], props, loc: location };
  }

  private parseAdmin(): AdminNode {
    const location = this.loc();
    this.expect('KEYWORD', 'admin');
    let adminType = 'dashboard';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['dashboard', 'cms'].includes(this.current().value)) {
      adminType = this.advance().value;
    }
    const { props, body } = this.parseGenericBlock();
    return { type: 'Admin', adminType, props, body, loc: location };
  }

  private parseSeo(): SeoNode {
    const location = this.loc();
    this.expect('KEYWORD', 'seo');
    const props = this.parseGenericPropsBlock();
    return { type: 'Seo', props, loc: location };
  }

  private parseA11y(): A11yNode {
    const location = this.loc();
    this.expect('KEYWORD', 'a11y');
    const props = this.parseGenericPropsBlock();
    return { type: 'A11y', props, loc: location };
  }

  private parseAnimate(): AnimateNode {
    const location = this.loc();
    this.expect('KEYWORD', 'animate');
    let animType = 'enter';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['enter', 'exit', 'scroll', 'count', 'type', 'confetti'].includes(this.current().value)) {
      animType = this.advance().value;
    }
    const { props, body } = this.parseGenericBlock();
    return { type: 'Animate', animType, props, body, loc: location };
  }

  private parseGesture(): GestureNode {
    const location = this.loc();
    this.expect('KEYWORD', 'gesture');
    let gestureType = 'drag';
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['drag', 'pinch', 'longPress', 'doubleTap', 'swipe'].includes(this.current().value)) {
      gestureType = this.advance().value;
    }
    const target = this.parseExpression();
    let action: Expression = { kind: 'null' };
    if (this.match('OPERATOR', '->')) {
      this.advance();
      action = this.parseExpression();
    }
    const props: Record<string, Expression> = {};
    return { type: 'Gesture', gestureType, target, action, props, loc: location };
  }

  private parseAi(): AiNode {
    const location = this.loc();
    this.expect('KEYWORD', 'ai');
    let aiType = 'chat';
    if (this.match('PUNCTUATION', '.')) {
      this.advance();
      aiType = this.expectName();
    } else if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['generate', 'chat', 'search', 'vision', 'recommend', 'translate', 'summarize'].includes(this.current().value)) {
      aiType = this.advance().value;
    }
    const { props, body } = this.parseGenericBlock();
    return { type: 'Ai', aiType, props, body, loc: location };
  }

  private parseBreadcrumb(): BreadcrumbNode {
    const location = this.loc();
    this.expect('KEYWORD', 'breadcrumb');
    const props: Record<string, Expression> = {};
    while (!this.match('NEWLINE') && !this.match('EOF')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const key = this.advance().value;
        if (this.match('OPERATOR', '=')) { this.advance(); props[key] = this.parseAtomicExpression(); }
        else props[key] = { kind: 'boolean', value: true };
      } else break;
    }
    return { type: 'Breadcrumb', props, loc: location };
  }

  private parseResponsive(): ResponsiveNode {
    const location = this.loc();
    const keyword = this.advance().value; // 'responsive', 'mobile', 'desktop', 'tablet'
    let breakpoint = keyword;
    let action = 'show';
    if (keyword === 'responsive') {
      breakpoint = this.expectName();
    }
    if ((this.match('IDENTIFIER') || this.match('KEYWORD')) && ['show', 'hide'].includes(this.current().value)) {
      action = this.advance().value;
    }
    let body: UINode[] = [];
    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();
      body = this.parseUIBlock();
    }
    return { type: 'Responsive', breakpoint, action, body, loc: location };
  }

  private parseStatsGrid(): StatsGridNode {
    const location = this.loc();
    this.expect('KEYWORD', 'stats');
    let cols = 4;
    if (this.match('NUMBER')) {
      cols = parseFloat(this.advance().value);
    }
    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();
    }
    const stats: import('./ast.js').StatNode[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('KEYWORD', 'stat')) {
          stats.push(this.parseStat());
        } else {
          this.advance();
        }
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'StatsGrid', cols, stats, loc: location };
  }

  // ── Inline Props ──────────────────────────────────────

  private parseInlineProps(): Record<string, Expression> {
    const props: Record<string, Expression> = {};
    while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('INDENT') && !this.match('DEDENT') && !this.match('OPERATOR', '->')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const name = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          props[name] = this.parseAtomicExpression();
        } else {
          props[name] = { kind: 'boolean', value: true };
        }
      } else if (this.match('AT_KEYWORD')) {
        const atName = '@' + this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          props[atName] = this.parseAtomicExpression();
        }
      } else if (this.match('COLOR')) {
        // Color that appears without prop name — rare, skip
        this.advance();
      } else {
        break;
      }
    }
    return props;
  }

  private parseInlinePropsUntilArrow(): Record<string, Expression> {
    const props: Record<string, Expression> = {};
    while (!this.match('NEWLINE') && !this.match('EOF') && !this.match('OPERATOR', '->')) {
      if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
        const name = this.advance().value;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          props[name] = this.parseAtomicExpression();
        } else if (name !== 'disabled') {
          // plain boolean prop
          props[name] = { kind: 'boolean', value: true };
        } else {
          props[name] = { kind: 'boolean', value: true };
        }
      } else {
        break;
      }
    }
    return props;
  }

  // ── Statements ────────────────────────────────────────

  private parseStatement(): Statement {
    // Return statement
    if (this.match('KEYWORD', 'return')) {
      this.advance();
      if (this.match('NEWLINE') || this.match('EOF') || this.match('DEDENT')) {
        return { kind: 'return', value: null };
      }
      const value = this.parseExpression();
      return { kind: 'return', value };
    }

    // If statement (imperative)
    if (this.match('KEYWORD', 'if')) {
      return this.parseIfStmt();
    }

    // For statement (imperative)
    if (this.match('KEYWORD', 'for')) {
      return this.parseForStmt();
    }

    // Variable-like: identifier = expr or expression statement
    const expr = this.parseExpression();

    // Check for assignment
    if (this.match('OPERATOR', '=') || this.match('OPERATOR', '+=') || this.match('OPERATOR', '-=')) {
      const op = this.advance().value;
      const value = this.parseExpression();
      return { kind: 'assignment_stmt', target: expr, op, value };
    }

    return { kind: 'expr_stmt', expression: expr };
  }

  private parseIfStmt(): Statement {
    this.expect('KEYWORD', 'if');
    const condition = this.parseExpression();

    // Check for single-line if: `if key == "Enter": send()`
    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      // Check if next token is on same line (not NEWLINE)
      if (!this.match('NEWLINE') && !this.match('INDENT') && !this.match('EOF')) {
        // Single-line body
        const stmt = this.parseStatement();
        return { kind: 'if_stmt', condition, body: [stmt], elifs: [], elseBody: null };
      }
      // Multi-line body
      this.skipNewlines();
      const body = this.parseStatementBlock();
      const elifs: { condition: Expression; body: Statement[] }[] = [];
      let elseBody: Statement[] | null = null;

      while (this.match('KEYWORD', 'elif')) {
        this.advance();
        const elifCond = this.parseExpression();
        this.expect('PUNCTUATION', ':');
        this.skipNewlines();
        const elifBody = this.parseStatementBlock();
        elifs.push({ condition: elifCond, body: elifBody });
      }

      if (this.match('KEYWORD', 'else')) {
        this.advance();
        this.expect('PUNCTUATION', ':');
        this.skipNewlines();
        elseBody = this.parseStatementBlock();
      }

      return { kind: 'if_stmt', condition, body, elifs, elseBody };
    }

    throw new ParseError(`Expected ':' after if condition`, this.current().line, this.current().column);
  }

  private parseForStmt(): Statement {
    this.expect('KEYWORD', 'for');
    const item = this.expectName();
    let index: string | null = null;
    if (this.match('PUNCTUATION', ',')) {
      this.advance();
      index = this.expectName();
    }
    this.expect('KEYWORD', 'in');
    const iterable = this.parseExpression();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseStatementBlock();
    return { kind: 'for_stmt', item, index, iterable, body };
  }

  // ── Type Expressions ──────────────────────────────────

  private parseTypeExpr(): TypeExpr {
    let type: TypeExpr;

    if (this.match('KEYWORD', 'list')) {
      this.advance();
      if (this.match('PUNCTUATION', '[')) {
        this.advance();
        const itemType = this.parseTypeExpr();
        this.expect('PUNCTUATION', ']');
        type = { kind: 'list', itemType };
      } else {
        // Bare 'list' without type parameter = list[any]
        type = { kind: 'list', itemType: { kind: 'primitive', name: 'any' } };
      }
    } else if (this.match('KEYWORD', 'map') || this.match('IDENTIFIER', 'map')) {
      this.advance();
      this.expect('PUNCTUATION', '[');
      const keyType = this.parseTypeExpr();
      this.expect('PUNCTUATION', ',');
      const valueType = this.parseTypeExpr();
      this.expect('PUNCTUATION', ']');
      type = { kind: 'map', keyType, valueType };
    } else if (this.match('KEYWORD', 'set') || this.match('IDENTIFIER', 'set')) {
      this.advance();
      this.expect('PUNCTUATION', '[');
      const itemType = this.parseTypeExpr();
      this.expect('PUNCTUATION', ']');
      type = { kind: 'set', itemType };
    } else if (this.match('PUNCTUATION', '{')) {
      type = this.parseObjectType();
    } else {
      // Primitive or named type
      const name = this.advance().value;
      const primitives = new Set(['int', 'float', 'str', 'bool', 'date', 'time', 'datetime']);
      if (primitives.has(name)) {
        type = { kind: 'primitive', name };
      } else {
        type = { kind: 'named', name };
      }
    }

    // Check nullable
    if (this.match('PUNCTUATION', '?')) {
      this.advance();
      type = { kind: 'nullable', inner: type };
    }

    return type;
  }

  private parseObjectType(): TypeExpr {
    this.expect('PUNCTUATION', '{');
    const fields: { name: string; fieldType: TypeExpr }[] = [];

    while (!this.match('PUNCTUATION', '}') && !this.match('EOF')) {
      const name = this.advance().value;
      this.expect('PUNCTUATION', ':');
      const fieldType = this.parseTypeExpr();
      fields.push({ name, fieldType });
      if (this.match('PUNCTUATION', ',')) this.advance();
    }
    this.expect('PUNCTUATION', '}');
    return { kind: 'object', fields };
  }

  // ── Expressions ───────────────────────────────────────

  parseExpression(): Expression {
    return this.parseTernary();
  }

  private parseTernary(): Expression {
    const left = this.parseOr();
    if (this.match('PUNCTUATION', '?')) {
      this.advance();
      const consequent = this.parseExpression();
      this.expect('PUNCTUATION', ':');
      const alternate = this.parseExpression();
      return { kind: 'ternary', condition: left, consequent, alternate };
    }
    return left;
  }

  private parseOr(): Expression {
    let left = this.parseAnd();
    while (this.match('OPERATOR', '||')) {
      this.advance();
      const right = this.parseAnd();
      left = { kind: 'binary', op: '||', left, right };
    }
    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseEquality();
    while (this.match('OPERATOR', '&&')) {
      this.advance();
      const right = this.parseEquality();
      left = { kind: 'binary', op: '&&', left, right };
    }
    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();
    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseAdditive();
    while (this.match('OPERATOR', '>') || this.match('OPERATOR', '<') ||
           this.match('OPERATOR', '>=') || this.match('OPERATOR', '<=')) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();
    while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();
    while (this.match('OPERATOR', '*') || this.match('OPERATOR', '/') || this.match('OPERATOR', '%')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.match('OPERATOR', '!')) {
      this.advance();
      const operand = this.parseUnary();
      return { kind: 'unary', op: '!', operand };
    }
    if (this.match('OPERATOR', '-')) {
      // Negative number or unary minus
      this.advance();
      const operand = this.parseUnary();
      return { kind: 'unary', op: '-', operand };
    }
    if (this.match('KEYWORD', 'await')) {
      this.advance();
      const expr = this.parseUnary();
      return { kind: 'await', expression: expr };
    }
    if (this.match('KEYWORD', 'old')) {
      this.advance();
      this.expect('PUNCTUATION', '(');
      const expr = this.parseExpression();
      this.expect('PUNCTUATION', ')');
      return { kind: 'old', expression: expr };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match('PUNCTUATION', '.')) {
        this.advance();
        const prop = this.advance().value;
        expr = { kind: 'member', object: expr, property: prop };
      } else if (this.match('PUNCTUATION', '[')) {
        this.advance();
        const index = this.parseExpression();
        this.expect('PUNCTUATION', ']');
        expr = { kind: 'index', object: expr, index };
      } else if (this.match('PUNCTUATION', '(')) {
        this.advance();
        const args: Expression[] = [];
        while (!this.match('PUNCTUATION', ')') && !this.match('EOF')) {
          // Check for named arg: `name: value` pattern
          if ((this.current().type === 'IDENTIFIER' || this.current().type === 'KEYWORD') &&
              this.peek(1).type === 'PUNCTUATION' && this.peek(1).value === ':') {
            // Named argument — collect as object expression
            const properties: { key: string; value: Expression }[] = [];
            while (!this.match('PUNCTUATION', ')') && !this.match('EOF')) {
              const key = this.advance().value;
              this.expect('PUNCTUATION', ':');
              const value = this.parseExpression();
              properties.push({ key, value });
              if (this.match('PUNCTUATION', ',')) this.advance();
            }
            args.push({ kind: 'object_expr', properties });
            break;
          }
          args.push(this.parseArgExpression());
          if (this.match('PUNCTUATION', ',')) this.advance();
        }
        this.expect('PUNCTUATION', ')');
        expr = { kind: 'call', callee: expr, args };
      } else {
        break;
      }
    }

    return expr;
  }

  private parseArgExpression(): Expression {
    // Could be an arrow function: param => body
    // Or a named argument: key: value
    const expr = this.parseExpression();

    if (this.match('OPERATOR', '=>')) {
      this.advance();
      // Arrow function body
      const params: string[] = [];
      if (expr.kind === 'identifier') {
        params.push(expr.name);
      }
      const body = this.parseExpression();
      return { kind: 'arrow', params, body };
    }

    return expr;
  }

  private parsePrimary(): Expression {
    const tok = this.current();

    // Number
    if (tok.type === 'NUMBER') {
      this.advance();
      return { kind: 'number', value: parseFloat(tok.value) };
    }

    // String
    if (tok.type === 'STRING') {
      this.advance();
      // Check if it contains template interpolation
      if (tok.value.includes('{') && tok.value.includes('}')) {
        return { kind: 'template', parts: this.parseTemplateParts(tok.value) };
      }
      return { kind: 'string', value: tok.value };
    }

    // Color (treat as string)
    if (tok.type === 'COLOR') {
      this.advance();
      return { kind: 'string', value: tok.value };
    }

    // Boolean
    if (tok.type === 'KEYWORD' && tok.value === 'true') {
      this.advance();
      return { kind: 'boolean', value: true };
    }
    if (tok.type === 'KEYWORD' && tok.value === 'false') {
      this.advance();
      return { kind: 'boolean', value: false };
    }

    // Null
    if (tok.type === 'KEYWORD' && tok.value === 'null') {
      this.advance();
      return { kind: 'null' };
    }

    // Identifier (or could be arrow function param, keywords used as identifiers like 'now')
    if (tok.type === 'IDENTIFIER' || (tok.type === 'KEYWORD' && !this.isStructuralKeyword(tok.value))) {
      this.advance();
      return { kind: 'identifier', name: tok.value };
    }

    // Parenthesized expression or tuple
    if (tok.type === 'PUNCTUATION' && tok.value === '(') {
      this.advance();
      if (this.match('PUNCTUATION', ')')) {
        this.advance();
        return { kind: 'array', elements: [] }; // empty parens
      }
      const expr = this.parseExpression();
      if (this.match('PUNCTUATION', ',')) {
        // Tuple-like (for function args with parens)
        const elements = [expr];
        while (this.match('PUNCTUATION', ',')) {
          this.advance();
          if (this.match('PUNCTUATION', ')')) break;
          elements.push(this.parseExpression());
        }
        this.expect('PUNCTUATION', ')');
        return { kind: 'array', elements };
      }
      this.expect('PUNCTUATION', ')');
      return expr;
    }

    // Array literal
    if (tok.type === 'PUNCTUATION' && tok.value === '[') {
      this.advance();
      const elements: Expression[] = [];
      while (!this.match('PUNCTUATION', ']') && !this.match('EOF')) {
        elements.push(this.parseExpression());
        if (this.match('PUNCTUATION', ',')) this.advance();
      }
      this.expect('PUNCTUATION', ']');
      return { kind: 'array', elements };
    }

    // Object literal
    if (tok.type === 'PUNCTUATION' && tok.value === '{') {
      this.advance();
      const properties: { key: string; value: Expression }[] = [];
      this.skipNewlines();
      while (!this.match('PUNCTUATION', '}') && !this.match('EOF')) {
        this.skipNewlines();
        const key = this.advance().value;
        if (this.match('PUNCTUATION', ':')) {
          this.advance();
          const value = this.parseExpression();
          properties.push({ key, value });
        } else {
          // Shorthand: {name} = {name: name}
          properties.push({ key, value: { kind: 'identifier', name: key } });
        }
        if (this.match('PUNCTUATION', ',')) this.advance();
        this.skipNewlines();
      }
      this.expect('PUNCTUATION', '}');
      return { kind: 'object_expr', properties };
    }

    throw new ParseError(`Unexpected token '${tok.value}' (${tok.type})`, tok.line, tok.column);
  }

  parseAtomicExpression(): Expression {
    const tok = this.current();

    if (tok.type === 'STRING') {
      this.advance();
      if (tok.value.includes('{') && tok.value.includes('}')) {
        return { kind: 'template', parts: this.parseTemplateParts(tok.value) };
      }
      return { kind: 'string', value: tok.value };
    }

    if (tok.type === 'NUMBER') {
      this.advance();
      return { kind: 'number', value: parseFloat(tok.value) };
    }

    if (tok.type === 'COLOR') {
      this.advance();
      return { kind: 'string', value: tok.value };
    }

    if (tok.type === 'KEYWORD' && tok.value === 'true') {
      this.advance();
      return { kind: 'boolean', value: true };
    }

    if (tok.type === 'KEYWORD' && tok.value === 'false') {
      this.advance();
      return { kind: 'boolean', value: false };
    }

    if (tok.type === 'IDENTIFIER' || (tok.type === 'KEYWORD' && !this.isStructuralKeyword(tok.value))) {
      this.advance();
      let expr: Expression = { kind: 'identifier', name: tok.value };
      // Allow member access
      while (this.match('PUNCTUATION', '.')) {
        this.advance();
        const prop = this.advance().value;
        expr = { kind: 'member', object: expr, property: prop };
      }
      return expr;
    }

    if (tok.type === 'PUNCTUATION' && tok.value === '[') {
      this.advance();
      const elements: Expression[] = [];
      while (!this.match('PUNCTUATION', ']') && !this.match('EOF')) {
        elements.push(this.parseExpression());
        if (this.match('PUNCTUATION', ',')) this.advance();
      }
      this.expect('PUNCTUATION', ']');
      return { kind: 'array', elements };
    }

    if (tok.type === 'PUNCTUATION' && tok.value === '{') {
      this.advance(); // consume {
      const inner = this.parseExpression();
      this.expect('PUNCTUATION', '}');
      return { kind: 'braced' as const, expression: inner };
    }

    return this.parseExpression();
  }

  private parseTemplateParts(template: string): (string | Expression)[] {
    const parts: (string | Expression)[] = [];
    let current = '';
    let i = 0;

    while (i < template.length) {
      if (template[i] === '{') {
        if (current) { parts.push(current); current = ''; }
        i++;
        let exprStr = '';
        let depth = 1;
        while (i < template.length && depth > 0) {
          if (template[i] === '{') depth++;
          else if (template[i] === '}') {
            depth--;
            if (depth === 0) break;
          }
          exprStr += template[i];
          i++;
        }
        i++; // skip closing }
        // Parse the expression string
        parts.push({ kind: 'identifier', name: exprStr.trim() });
      } else {
        current += template[i];
        i++;
      }
    }
    if (current) parts.push(current);
    return parts;
  }

  // ── Phase 4: Infrastructure parsers ─────────────────

  private parseDeploy(): DeployNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'deploy');
    const provider = this.expectName();
    const props = this.parseGenericPropsBlock();
    return { type: 'Deploy', provider, props, loc };
  }

  private parseEnv(): EnvNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'env');
    let envType = 'all';
    if (this.current().type === 'IDENTIFIER' || this.current().type === 'KEYWORD') {
      envType = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const vars: { name: string; value: Expression; secret: boolean }[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        const secret = (this.match('KEYWORD', 'secret') || (this.match('IDENTIFIER') && this.current().value === 'secret')) ? (this.advance(), true) : false;
        const name = this.expectName();
        this.expect('OPERATOR', '=');
        const value = this.parseExpression();
        vars.push({ name, value, secret });
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'Env', envType, vars, loc };
  }

  private parseDocker(): DockerNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'docker');
    let baseImage = 'node:20-alpine';
    if (this.current().type === 'STRING') {
      baseImage = this.advance().value;
    } else if (this.current().type === 'IDENTIFIER') {
      baseImage = this.advance().value;
    }
    const props = this.parseGenericPropsBlock();
    return { type: 'Docker', baseImage, props, loc };
  }

  private parseCi(): CiNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'ci');
    let provider = 'github';
    if (this.current().type === 'IDENTIFIER' || this.current().type === 'KEYWORD') {
      provider = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const steps: { name: string; command: Expression }[] = [];
    const triggers: string[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        if (this.match('KEYWORD', 'trigger') || this.match('KEYWORD', 'on')) {
          this.advance();
          triggers.push(this.expectName());
        } else {
          const name = this.expectName();
          this.expect('OPERATOR', '=');
          const command = this.parseExpression();
          steps.push({ name, command });
        }
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'Ci', provider, steps, triggers, loc };
  }

  private parseDomain(): DomainNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'domain');
    let domain = '';
    if (this.current().type === 'STRING') {
      domain = this.advance().value;
    } else {
      domain = this.expectName();
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    return { type: 'Domain', domain, props, loc };
  }

  private parseCdn(): CdnNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'cdn');
    let provider = 'cloudflare';
    if (this.current().type === 'IDENTIFIER') {
      provider = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    return { type: 'Cdn', provider, props, loc };
  }

  private parseMonitor(): MonitorNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'monitor');
    let provider = 'sentry';
    if (this.current().type === 'IDENTIFIER') {
      provider = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    return { type: 'Monitor', provider, props, loc };
  }

  private parseBackup(): BackupNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'backup');
    let strategy = 'daily';
    if (this.current().type === 'IDENTIFIER') {
      strategy = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    return { type: 'Backup', strategy, props, loc };
  }

  // ── Phase 4: Backend parsers ──────────────────────────

  private parseEndpoint(): EndpointNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'endpoint');
    let method = 'GET';
    if (this.current().type === 'HTTP_METHOD') {
      method = this.advance().value;
    } else if (this.current().type === 'IDENTIFIER' && ['get','post','put','delete','patch'].includes(this.current().value.toLowerCase())) {
      method = this.advance().value.toUpperCase();
    }
    let path = '/';
    if (this.current().type === 'STRING') {
      path = this.advance().value;
    } else if (this.current().type === 'IDENTIFIER') {
      path = '/' + this.advance().value;
    }
    const middleware: string[] = [];
    while (this.match('KEYWORD', 'middleware') || this.match('KEYWORD', 'guard')) {
      this.advance();
      middleware.push(this.expectName());
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const handler = this.parseStatementBlock();
    const props: Record<string, Expression> = {};
    return { type: 'Endpoint', method, path, handler, middleware, props, loc };
  }

  private parseMiddleware(): MiddlewareNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'middleware');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const handler = this.parseStatementBlock();
    const props: Record<string, Expression> = {};
    return { type: 'Middleware', name, handler, props, loc };
  }

  private parseQueue(): QueueNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'queue');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const handler = this.parseStatementBlock();
    const props: Record<string, Expression> = {};
    return { type: 'Queue', name, handler, props, loc };
  }

  private parseCron(): CronNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'cron');
    const name = this.expectName();
    let schedule = '0 * * * *';
    if (this.current().type === 'STRING') {
      schedule = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const handler = this.parseStatementBlock();
    return { type: 'Cron', name, schedule, handler, loc };
  }

  private parseCache(): CacheNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'cache');
    const name = this.expectName();
    let strategy = 'memory';
    if (this.current().type === 'IDENTIFIER' && ['memory', 'redis', 'cdn'].includes(this.current().value)) {
      strategy = this.advance().value;
    }
    const props = this.parseGenericPropsBlock();
    const ttl = props['ttl'] || null;
    return { type: 'Cache', name, strategy, ttl, props, loc };
  }

  private parseMigrate(): MigrateNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'migrate');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    let up: Statement[] = [];
    let down: Statement[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        if (this.match('IDENTIFIER', 'up') || this.match('KEYWORD', 'up')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          up = this.parseStatementBlock();
        } else if (this.match('IDENTIFIER', 'down') || this.match('KEYWORD', 'down')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          down = this.parseStatementBlock();
        } else {
          // treat as up statement
          up.push(this.parseStatement());
        }
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'Migrate', name, up, down, loc };
  }

  private parseSeed(): SeedNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'seed');
    const model = this.expectName();
    let count: Expression | null = null;
    if (this.current().type === 'NUMBER') {
      count = this.parseExpression();
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const data = this.parseExpression();
    this.skipNewlines();
    return { type: 'Seed', model, data, count, loc };
  }

  private parseWebhook(): WebhookNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'webhook');
    const name = this.expectName();
    let path = '/webhooks/' + name;
    if (this.current().type === 'STRING') {
      path = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const handler = this.parseStatementBlock();
    const props: Record<string, Expression> = {};
    return { type: 'Webhook', name, path, handler, props, loc };
  }

  private parseStorage(): StorageNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'storage');
    const name = this.expectName();
    let provider = 's3';
    if (this.current().type === 'IDENTIFIER' && ['s3', 'r2', 'gcs', 'local'].includes(this.current().value)) {
      provider = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    return { type: 'Storage', provider, name, props, loc };
  }

  // ── Phase 4: Testing parsers ──────────────────────────

  private parseTest(): TestNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'test');
    let testType = 'unit';
    if (this.current().type === 'IDENTIFIER' && ['unit', 'integration', 'component'].includes(this.current().value)) {
      testType = this.advance().value;
    }
    let name = 'unnamed';
    if (this.current().type === 'STRING') {
      name = this.advance().value;
    } else if (this.current().type === 'IDENTIFIER') {
      name = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseStatementBlock();
    return { type: 'Test', name, testType, body, loc };
  }

  private parseE2e(): E2eNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'e2e');
    let name = 'unnamed';
    if (this.current().type === 'STRING') {
      name = this.advance().value;
    } else if (this.current().type === 'IDENTIFIER') {
      name = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const steps: { action: string; target: Expression; value: Expression | null }[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        const action = this.expectName();
        const target = this.parseExpression();
        let value: Expression | null = null;
        if (this.match('OPERATOR', '=')) {
          this.advance();
          value = this.parseExpression();
        }
        steps.push({ action, target, value });
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'E2e', name, steps, loc };
  }

  private parseMock(): MockNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'mock');
    const target = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const responses: { method: string; path: string; response: Expression }[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        let method = 'GET';
        if (this.current().type === 'HTTP_METHOD') {
          method = this.advance().value;
        } else if (this.current().type === 'IDENTIFIER') {
          method = this.advance().value.toUpperCase();
        }
        let path = '/';
        if (this.current().type === 'STRING') {
          path = this.advance().value;
        }
        this.expect('OPERATOR', '=>');
        const response = this.parseExpression();
        responses.push({ method, path, response });
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'Mock', target, responses, loc };
  }

  private parseFixture(): FixtureNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'fixture');
    const name = this.expectName();
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const data = this.parseExpression();
    this.skipNewlines();
    return { type: 'Fixture', name, data, loc };
  }

  // ── Phase 4: Error/State parsers ──────────────────────

  private parseError(): ErrorNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'error');
    let errorType = 'boundary';
    if (this.current().type === 'IDENTIFIER' && ['boundary', 'global', 'fallback'].includes(this.current().value)) {
      errorType = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const handler: Statement[] = [];
    const fallback: UINode[] = [];
    const props: Record<string, Expression> = {};
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        if (this.match('IDENTIFIER', 'fallback') || this.match('KEYWORD', 'fallback')) {
          this.advance();
          this.expect('PUNCTUATION', ':');
          this.skipNewlines();
          fallback.push(...this.parseUIBlock());
        } else if (this.match('KEYWORD', 'fn') || this.match('KEYWORD', 'on')) {
          handler.push(this.parseStatement());
        } else {
          // Try as prop
          const name = this.expectName();
          if (this.match('OPERATOR', '=')) {
            this.advance();
            props[name] = this.parseExpression();
          }
        }
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'Error', errorType, handler, fallback, props, loc };
  }

  private parseLoading(): LoadingNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'loading');
    let loadingType = 'spinner';
    if (this.current().type === 'IDENTIFIER' && ['skeleton', 'spinner', 'shimmer', 'global'].includes(this.current().value)) {
      loadingType = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const body = this.parseUIBlock();
    const props: Record<string, Expression> = {};
    return { type: 'Loading', loadingType, props, body, loc };
  }

  private parseOffline(): OfflineNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'offline');
    let strategy = 'cache-first';
    if (this.current().type === 'IDENTIFIER') {
      strategy = this.advance().value;
    } else if (this.current().type === 'STRING') {
      strategy = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const fallback = this.parseUIBlock();
    const props: Record<string, Expression> = {};
    return { type: 'Offline', strategy, props, fallback, loc };
  }

  private parseRetry(): RetryNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'retry');
    const maxRetries = this.parseExpression();
    let delay: Expression | null = null;
    let backoff = 'exponential';
    if (this.current().type === 'IDENTIFIER' && ['linear', 'exponential'].includes(this.current().value)) {
      backoff = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    delay = props['delay'] || null;
    const action = props['action'] || { kind: 'null' as const };
    return { type: 'Retry', maxRetries, delay, backoff, action, loc };
  }

  private parseLog(): LogNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'log');
    let level = 'info';
    if (this.current().type === 'IDENTIFIER' && ['debug', 'info', 'warn', 'error'].includes(this.current().value)) {
      level = this.advance().value;
    }
    const message = this.parseExpression();
    let data: Expression | null = null;
    if (this.match('PUNCTUATION', ',')) {
      this.advance();
      data = this.parseExpression();
    }
    this.skipNewlines();
    return { type: 'Log', level, message, data, loc };
  }

  // ── Phase 4: i18n parsers ─────────────────────────────

  private parseI18n(): I18nNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'i18n');
    let defaultLocale = 'ko';
    if (this.current().type === 'IDENTIFIER') {
      defaultLocale = this.advance().value;
    } else if (this.current().type === 'STRING') {
      defaultLocale = this.advance().value;
    }
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const locales: string[] = [];
    const translations: { locale: string; entries: { key: string; value: string }[] }[] = [];
    if (this.match('INDENT')) {
      this.advance();
      this.skipNewlines();
      while (!this.match('DEDENT') && !this.match('EOF')) {
        if (this.match('NEWLINE')) { this.advance(); continue; }
        if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
        const localeName = this.expectName();
        locales.push(localeName);
        if (this.match('PUNCTUATION', ':')) {
          this.advance();
          this.skipNewlines();
          const entries: { key: string; value: string }[] = [];
          if (this.match('INDENT')) {
            this.advance();
            this.skipNewlines();
            while (!this.match('DEDENT') && !this.match('EOF')) {
              if (this.match('NEWLINE')) { this.advance(); continue; }
              if (this.match('COMMENT')) { this.advance(); this.skipNewlines(); continue; }
              const key = this.expectName();
              this.expect('OPERATOR', '=');
              const value = this.current().type === 'STRING' ? this.advance().value : this.expectName();
              entries.push({ key, value });
              this.skipNewlines();
            }
            if (this.match('DEDENT')) this.advance();
          }
          translations.push({ locale: localeName, entries });
        }
        this.skipNewlines();
      }
      if (this.match('DEDENT')) this.advance();
    }
    return { type: 'I18n', defaultLocale, locales, translations, loc };
  }

  private parseLocale(): LocaleNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'locale');
    this.expect('PUNCTUATION', ':');
    this.skipNewlines();
    const props = this.parseGenericPropsBlock();
    return { type: 'Locale', props, loc };
  }

  private parseRtl(): RtlNode {
    const loc = this.loc();
    this.expect('KEYWORD', 'rtl');
    let enabled = true;
    if (this.match('KEYWORD', 'false')) {
      this.advance();
      enabled = false;
    } else if (this.match('KEYWORD', 'true')) {
      this.advance();
    }
    const props: Record<string, Expression> = {};
    if (this.match('PUNCTUATION', ':')) {
      this.advance();
      this.skipNewlines();
      Object.assign(props, this.parseGenericPropsBlock());
    }
    this.skipNewlines();
    return { type: 'Rtl', enabled, props, loc };
  }

  private isStructuralKeyword(value: string): boolean {
    // Only keywords that CANNOT appear as variable names in expression context
    return [
      'page', 'component', 'app', 'state', 'derived', 'prop', 'type',
      'fn', 'async', 'layout', 'if', 'elif', 'else', 'for',
      'show', 'hide', 'on', 'watch', 'check', 'requires', 'ensures',
      'store', 'use', 'js', 'import', 'from', 'return',
      'model', 'form', 'field', 'table', 'column', 'submit',
      'validate', 'permission',
      'auth', 'guard', 'role',
      'chart', 'stat', 'realtime',
      'route', 'nav',
      'upload', 'modal',
      // Phase 4 (structural only — not error/loading/offline/retry/log which are used as identifiers)
      'deploy', 'env', 'docker', 'ci', 'domain', 'cdn', 'monitor', 'backup',
      'endpoint', 'middleware', 'queue', 'cron', 'cache', 'migrate', 'webhook', 'storage',
      'test', 'e2e', 'mock', 'fixture',
      'i18n', 'locale', 'rtl',
    ].includes(value);
  }
}

export function parse(source: string): ASTNode[] {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  return parser.parseProgram();
}
