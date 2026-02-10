// 0x AST Node Types

export interface SourceLocation {
  line: number;
  column: number;
}

// Base AST node
export interface BaseNode {
  loc: SourceLocation;
}

// Top-level constructs
export interface AppNode extends BaseNode {
  type: 'App';
  name: string;
  body: ASTNode[];
}

export interface PageNode extends BaseNode {
  type: 'Page';
  name: string;
  body: ASTNode[];
}

export interface ComponentNode extends BaseNode {
  type: 'Component';
  name: string;
  body: ASTNode[];
}

// Declarations
export interface StateDecl extends BaseNode {
  type: 'StateDecl';
  name: string;
  valueType: TypeExpr;
  initial: Expression;
}

export interface DerivedDecl extends BaseNode {
  type: 'DerivedDecl';
  name: string;
  expression: Expression;
}

export interface PropDecl extends BaseNode {
  type: 'PropDecl';
  name: string;
  valueType: TypeExpr;
  defaultValue: Expression | null;
}

export interface TypeDecl extends BaseNode {
  type: 'TypeDecl';
  name: string;
  definition: TypeExpr;
}

export interface StoreDecl extends BaseNode {
  type: 'StoreDecl';
  name: string;
  valueType: TypeExpr;
  initial: Expression;
}

export interface ApiDecl extends BaseNode {
  type: 'ApiDecl';
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
}

// Functions
export interface FnDecl extends BaseNode {
  type: 'FnDecl';
  name: string;
  params: Param[];
  body: Statement[];
  isAsync: boolean;
  requires: Expression[];
  ensures: Expression[];
}

export interface Param {
  name: string;
  paramType: TypeExpr | null;
  defaultValue: Expression | null;
}

// Lifecycle & watchers
export interface OnMount extends BaseNode {
  type: 'OnMount';
  body: Statement[];
}

export interface OnDestroy extends BaseNode {
  type: 'OnDestroy';
  body: Statement[];
}

export interface WatchBlock extends BaseNode {
  type: 'WatchBlock';
  variable: string;
  body: Statement[];
}

// Validation
export interface CheckDecl extends BaseNode {
  type: 'CheckDecl';
  condition: Expression;
  message: string;
}

// UI Elements
export interface LayoutNode extends BaseNode {
  type: 'Layout';
  direction: 'row' | 'col' | 'grid' | 'stack';
  props: Record<string, Expression>;
  styleClass: string | null;
  children: UINode[];
}

export interface TextNode extends BaseNode {
  type: 'Text';
  content: Expression;
  props: Record<string, Expression>;
}

export interface ButtonNode extends BaseNode {
  type: 'Button';
  label: Expression;
  action: Expression | Statement[];
  props: Record<string, Expression>;
}

export interface InputNode extends BaseNode {
  type: 'Input';
  binding: string;
  props: Record<string, Expression>;
}

export interface ImageNode extends BaseNode {
  type: 'Image';
  src: Expression;
  props: Record<string, Expression>;
}

export interface LinkNode extends BaseNode {
  type: 'Link';
  label: Expression;
  href: Expression;
  props: Record<string, Expression>;
}

export interface ToggleNode extends BaseNode {
  type: 'Toggle';
  binding: string;
  props: Record<string, Expression>;
}

export interface SelectNode extends BaseNode {
  type: 'Select';
  binding: string;
  options: Expression;
  props: Record<string, Expression>;
}

export interface ComponentCall extends BaseNode {
  type: 'ComponentCall';
  name: string;
  args: Record<string, Expression>;
}

// Control flow (UI)
export interface IfBlock extends BaseNode {
  type: 'IfBlock';
  condition: Expression;
  body: UINode[];
  elifs: { condition: Expression; body: UINode[] }[];
  elseBody: UINode[] | null;
}

export interface ForBlock extends BaseNode {
  type: 'ForBlock';
  item: string;
  index: string | null;
  iterable: Expression;
  body: UINode[];
}

export interface ShowBlock extends BaseNode {
  type: 'ShowBlock';
  condition: Expression;
  body: UINode[];
}

export interface HideBlock extends BaseNode {
  type: 'HideBlock';
  condition: Expression;
  body: UINode[];
}

// Style
export interface StyleDecl extends BaseNode {
  type: 'StyleDecl';
  name: string;
  properties: StyleProperty[];
}

export interface StyleProperty {
  name: string;
  value: Expression;
  responsive: string | null; // null, '@mobile', '@tablet'
}

// JS Interop
export interface JsImport extends BaseNode {
  type: 'JsImport';
  specifiers: string[];
  source: string;
  isDefault: boolean;
}

export interface UseImport extends BaseNode {
  type: 'UseImport';
  name: string;
  source: string;
}

export interface JsBlock extends BaseNode {
  type: 'JsBlock';
  code: string;
}

// Comment
export interface CommentNode extends BaseNode {
  type: 'Comment';
  text: string;
}

// Type expressions
export type TypeExpr =
  | { kind: 'primitive'; name: string }
  | { kind: 'list'; itemType: TypeExpr }
  | { kind: 'map'; keyType: TypeExpr; valueType: TypeExpr }
  | { kind: 'set'; itemType: TypeExpr }
  | { kind: 'object'; fields: { name: string; fieldType: TypeExpr }[] }
  | { kind: 'union'; members: string[] }
  | { kind: 'nullable'; inner: TypeExpr }
  | { kind: 'named'; name: string };

// Expression types
export type Expression =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'identifier'; name: string }
  | { kind: 'member'; object: Expression; property: string }
  | { kind: 'index'; object: Expression; index: Expression }
  | { kind: 'call'; callee: Expression; args: Expression[] }
  | { kind: 'binary'; op: string; left: Expression; right: Expression }
  | { kind: 'unary'; op: string; operand: Expression }
  | { kind: 'ternary'; condition: Expression; consequent: Expression; alternate: Expression }
  | { kind: 'arrow'; params: string[]; body: Expression | Statement[] }
  | { kind: 'array'; elements: Expression[] }
  | { kind: 'object_expr'; properties: { key: string; value: Expression }[] }
  | { kind: 'template'; parts: (string | Expression)[] }
  | { kind: 'assignment'; target: Expression; op: string; value: Expression }
  | { kind: 'await'; expression: Expression }
  | { kind: 'old'; expression: Expression }
  | { kind: 'braced'; expression: Expression };

// Statement types
export type Statement =
  | { kind: 'expr_stmt'; expression: Expression }
  | { kind: 'return'; value: Expression | null }
  | { kind: 'if_stmt'; condition: Expression; body: Statement[]; elifs: { condition: Expression; body: Statement[] }[]; elseBody: Statement[] | null }
  | { kind: 'for_stmt'; item: string; index: string | null; iterable: Expression; body: Statement[] }
  | { kind: 'var_decl'; name: string; value: Expression }
  | { kind: 'assignment_stmt'; target: Expression; op: string; value: Expression };

// ── Phase 1 Advanced Features ────────────────────────

// Model declaration (auto-generates CRUD + API + hooks)
export interface ModelNode extends BaseNode {
  type: 'Model';
  name: string;
  fields: ModelField[];
  validate: { condition: Expression; message: string }[];
  permissions: { action: string; role: string }[];
  search: string[];
  sort: string[];
  filter: string[];
}

export interface ModelField {
  name: string;
  fieldType: TypeExpr;
  defaultValue: Expression | null;
}

// Data fetching with loading/error/empty states
export interface DataDecl extends BaseNode {
  type: 'DataDecl';
  name: string;
  query: Expression;
  loading: Expression | null;
  error: string | null;
  empty: string | null;
}

// Form with fields and validation
export interface FormDecl extends BaseNode {
  type: 'FormDecl';
  name: string;
  fields: FormField[];
  submit: FormSubmit | null;
}

export interface FormField {
  name: string;
  fieldType: TypeExpr;
  label: string;
  validations: FormValidation[];
  props: Record<string, Expression>;
}

export interface FormValidation {
  rule: string;
  value: Expression | null;
  message: string;
}

export interface FormSubmit {
  label: string;
  action: Expression;
  success: Expression | null;
  error: Expression | null;
}

// Table with columns and features
export interface TableNode extends BaseNode {
  type: 'Table';
  dataSource: string;
  columns: TableColumn[];
  features: Record<string, Expression>;
}

export interface TableColumn {
  kind: 'field' | 'select' | 'image' | 'actions';
  field?: string;
  label?: string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  format?: string;
  actions?: string[];
}

// ── Phase 2 Advanced Features ────────────────────────

// Auth configuration
export interface AuthDecl extends BaseNode {
  type: 'AuthDecl';
  provider: string;
  loginFields: string[];
  signupFields: string[];
  guards: { role: string; redirect: string | null }[];
}

// Chart visualization
export interface ChartNode extends BaseNode {
  type: 'Chart';
  chartType: string; // 'bar' | 'line' | 'pie' | 'doughnut' | 'area'
  name: string;
  props: Record<string, Expression>;
}

// Stat card
export interface StatNode extends BaseNode {
  type: 'Stat';
  label: string;
  value: Expression;
  change: Expression | null;
  icon: string | null;
  props: Record<string, Expression>;
}

// Realtime subscription
export interface RealtimeDecl extends BaseNode {
  type: 'RealtimeDecl';
  name: string;
  channel: Expression;
  handlers: { event: string; body: Statement[] }[];
}

// Route definition
export interface RouteDecl extends BaseNode {
  type: 'RouteDecl';
  path: string;
  target: string;
  guard: string | null;
}

// Nav component
export interface NavNode extends BaseNode {
  type: 'Nav';
  items: NavItem[];
  props: Record<string, Expression>;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string | null;
}

// File upload
export interface UploadNode extends BaseNode {
  type: 'Upload';
  name: string;
  accept: string | null;
  maxSize: number | null;
  preview: boolean;
  action: Expression | null;
}

// Modal dialog
export interface ModalNode extends BaseNode {
  type: 'Modal';
  name: string;
  title: string;
  trigger: string | null;
  body: UINode[];
}

// Toast notification (used as expression/statement)
export interface ToastNode extends BaseNode {
  type: 'Toast';
  message: Expression;
  toastType: string; // 'success' | 'error' | 'info' | 'warning'
  duration: number | null;
}

// ── Phase 3: High-Level Pattern Keywords ──────────────

// Role-based access control
export interface RoleDecl extends BaseNode {
  type: 'RoleDecl';
  roles: { name: string; inherits: string[]; can: string[] }[];
}

// CRUD full interface
export interface CrudNode extends BaseNode {
  type: 'Crud';
  model: string;
  props: Record<string, Expression>;
  columns: TableColumn[];
  actions: string[];
  bulkActions: string[];
}

// List patterns (grid, timeline, kanban, tree, virtual)
export interface ListNode extends BaseNode {
  type: 'List';
  listType: string; // 'grid' | 'timeline' | 'kanban' | 'tree' | 'virtual'
  dataSource: Expression;
  props: Record<string, Expression>;
  body: UINode[];
}

// Layout shell
export interface LayoutShellNode extends BaseNode {
  type: 'LayoutShell';
  name: string;
  shellType: string; // 'shell' | 'split' | 'masterDetail'
  props: Record<string, Expression>;
  body: UINode[];
}

// SlideOver panel
export interface SlideOverNode extends BaseNode {
  type: 'SlideOver';
  name: string;
  title: string;
  props: Record<string, Expression>;
  body: UINode[];
}

// Drawer
export interface DrawerNode extends BaseNode {
  type: 'Drawer';
  name: string;
  props: Record<string, Expression>;
  body: UINode[];
}

// Command palette
export interface CommandNode extends BaseNode {
  type: 'Command';
  shortcut: string;
  props: Record<string, Expression>;
  sections: { label: string; items: { label: string; action: Expression }[] }[];
}

// Confirm dialog
export interface ConfirmNode extends BaseNode {
  type: 'Confirm';
  message: string;
  description: string | null;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

// Payment integration
export interface PayNode extends BaseNode {
  type: 'Pay';
  provider: string;
  payType: string; // 'checkout' | 'pricing' | 'portal' | 'buyButton'
  props: Record<string, Expression>;
}

// Cart
export interface CartNode extends BaseNode {
  type: 'Cart';
  props: Record<string, Expression>;
  computed: { name: string; expression: Expression }[];
}

// Media
export interface MediaNode extends BaseNode {
  type: 'Media';
  mediaType: string; // 'gallery' | 'video' | 'audio' | 'carousel'
  src: Expression;
  props: Record<string, Expression>;
}

// Notification center
export interface NotificationNode extends BaseNode {
  type: 'Notification';
  notifType: string; // 'center' | 'push' | 'email'
  props: Record<string, Expression>;
}

// Search
export interface SearchNode extends BaseNode {
  type: 'Search';
  searchType: string; // 'global' | 'inline'
  target: string;
  props: Record<string, Expression>;
}

// Filter panel
export interface FilterNode extends BaseNode {
  type: 'Filter';
  target: string;
  fields: { name: string; filterType: string; props: Record<string, Expression> }[];
  props: Record<string, Expression>;
}

// Social features
export interface SocialNode extends BaseNode {
  type: 'Social';
  socialType: string; // 'like' | 'bookmark' | 'comments' | 'follow' | 'share' | 'feed'
  target: Expression;
  props: Record<string, Expression>;
  body: UINode[];
}

// Profile page
export interface ProfileNode extends BaseNode {
  type: 'Profile';
  user: Expression;
  props: Record<string, Expression>;
  sections: { name: string; body: UINode[] }[];
}

// Landing page sections
export interface HeroNode extends BaseNode {
  type: 'Hero';
  props: Record<string, Expression>;
  body: UINode[];
}

export interface FeaturesNode extends BaseNode {
  type: 'Features';
  props: Record<string, Expression>;
  items: { icon: string; title: string; description: string }[];
}

export interface PricingNode extends BaseNode {
  type: 'Pricing';
  props: Record<string, Expression>;
  plans: { name: string; price: Expression; features: string[]; cta: string; highlighted: boolean }[];
}

export interface FaqNode extends BaseNode {
  type: 'Faq';
  props: Record<string, Expression>;
  items: { question: string; answer: string }[];
}

export interface TestimonialNode extends BaseNode {
  type: 'Testimonial';
  props: Record<string, Expression>;
  items: { name: string; role: string; text: string; avatar: string | null }[];
}

export interface FooterNode extends BaseNode {
  type: 'Footer';
  columns: { title: string; links: { label: string; href: string }[] }[];
  props: Record<string, Expression>;
}

// Admin dashboard
export interface AdminNode extends BaseNode {
  type: 'Admin';
  adminType: string; // 'dashboard' | 'cms'
  props: Record<string, Expression>;
  body: UINode[];
}

// SEO
export interface SeoNode extends BaseNode {
  type: 'Seo';
  props: Record<string, Expression>;
}

// Accessibility
export interface A11yNode extends BaseNode {
  type: 'A11y';
  props: Record<string, Expression>;
}

// Animation
export interface AnimateNode extends BaseNode {
  type: 'Animate';
  animType: string; // 'enter' | 'exit' | 'scroll' | 'count' | 'type' | 'confetti'
  props: Record<string, Expression>;
  body: UINode[];
}

// Gesture
export interface GestureNode extends BaseNode {
  type: 'Gesture';
  gestureType: string; // 'drag' | 'pinch' | 'longPress' | 'doubleTap' | 'swipe'
  target: Expression;
  action: Expression;
  props: Record<string, Expression>;
}

// AI features
export interface AiNode extends BaseNode {
  type: 'Ai';
  aiType: string; // 'generate' | 'chat' | 'search' | 'vision' | 'recommend' | 'translate' | 'summarize'
  props: Record<string, Expression>;
  body: UINode[];
}

// Automation workflow
export interface AutomationNode extends BaseNode {
  type: 'Automation';
  triggers: { event: string; actions: Expression[] }[];
  schedules: { cron: string; actions: Expression[] }[];
}

// Dev tools
export interface DevNode extends BaseNode {
  type: 'Dev';
  props: Record<string, Expression>;
}

// Emit (realtime event sending)
export interface EmitNode extends BaseNode {
  type: 'Emit';
  channel: Expression;
  data: Expression;
  props: Record<string, Expression>;
}

// Responsive wrapper
export interface ResponsiveNode extends BaseNode {
  type: 'Responsive';
  breakpoint: string; // 'mobile' | 'tablet' | 'desktop'
  action: string; // 'show' | 'hide'
  body: UINode[];
}

// Breadcrumb
export interface BreadcrumbNode extends BaseNode {
  type: 'Breadcrumb';
  props: Record<string, Expression>;
}

// Divider
export interface DividerNode extends BaseNode {
  type: 'Divider';
  props: Record<string, Expression>;
}

// Progress bar
export interface ProgressNode extends BaseNode {
  type: 'Progress';
  value: Expression;
  props: Record<string, Expression>;
}

// Stats grid
export interface StatsGridNode extends BaseNode {
  type: 'StatsGrid';
  cols: number;
  stats: StatNode[];
}

// ── Phase 4: Infrastructure / Backend / Testing ──────

// Deploy configuration
export interface DeployNode extends BaseNode {
  type: 'Deploy';
  provider: string; // 'vercel' | 'netlify' | 'aws' | 'docker' | 'fly'
  props: Record<string, Expression>;
}

// Environment variables
export interface EnvNode extends BaseNode {
  type: 'Env';
  envType: string; // 'dev' | 'staging' | 'prod' | 'all'
  vars: { name: string; value: Expression; secret: boolean }[];
}

// Docker configuration
export interface DockerNode extends BaseNode {
  type: 'Docker';
  baseImage: string;
  props: Record<string, Expression>;
}

// CI/CD pipeline
export interface CiNode extends BaseNode {
  type: 'Ci';
  provider: string; // 'github' | 'gitlab' | 'bitbucket'
  steps: { name: string; command: Expression }[];
  triggers: string[];
}

// Domain/SSL configuration
export interface DomainNode extends BaseNode {
  type: 'Domain';
  domain: string;
  props: Record<string, Expression>;
}

// CDN configuration
export interface CdnNode extends BaseNode {
  type: 'Cdn';
  provider: string;
  props: Record<string, Expression>;
}

// Monitoring/error tracking
export interface MonitorNode extends BaseNode {
  type: 'Monitor';
  provider: string; // 'sentry' | 'datadog' | 'newrelic' | 'custom'
  props: Record<string, Expression>;
}

// Backup configuration
export interface BackupNode extends BaseNode {
  type: 'Backup';
  strategy: string; // 'daily' | 'hourly' | 'realtime'
  props: Record<string, Expression>;
}

// API endpoint definition
export interface EndpointNode extends BaseNode {
  type: 'Endpoint';
  method: string;
  path: string;
  handler: Statement[];
  middleware: string[];
  props: Record<string, Expression>;
}

// Middleware definition
export interface MiddlewareNode extends BaseNode {
  type: 'Middleware';
  name: string;
  handler: Statement[];
  props: Record<string, Expression>;
}

// Background job queue
export interface QueueNode extends BaseNode {
  type: 'Queue';
  name: string;
  handler: Statement[];
  props: Record<string, Expression>;
}

// Scheduled tasks
export interface CronNode extends BaseNode {
  type: 'Cron';
  name: string;
  schedule: string;
  handler: Statement[];
}

// Cache configuration
export interface CacheNode extends BaseNode {
  type: 'Cache';
  name: string;
  strategy: string; // 'memory' | 'redis' | 'cdn'
  ttl: Expression | null;
  props: Record<string, Expression>;
}

// Database migration
export interface MigrateNode extends BaseNode {
  type: 'Migrate';
  name: string;
  up: Statement[];
  down: Statement[];
}

// Data seeding
export interface SeedNode extends BaseNode {
  type: 'Seed';
  model: string;
  data: Expression;
  count: Expression | null;
}

// Webhook handler
export interface WebhookNode extends BaseNode {
  type: 'Webhook';
  name: string;
  path: string;
  handler: Statement[];
  props: Record<string, Expression>;
}

// File storage
export interface StorageNode extends BaseNode {
  type: 'Storage';
  provider: string; // 's3' | 'r2' | 'gcs' | 'local'
  name: string;
  props: Record<string, Expression>;
}

// Test definition
export interface TestNode extends BaseNode {
  type: 'Test';
  name: string;
  testType: string; // 'unit' | 'integration' | 'component'
  body: Statement[];
}

// E2E test
export interface E2eNode extends BaseNode {
  type: 'E2e';
  name: string;
  steps: { action: string; target: Expression; value: Expression | null }[];
}

// Mock definition
export interface MockNode extends BaseNode {
  type: 'Mock';
  target: string;
  responses: { method: string; path: string; response: Expression }[];
}

// Test fixture
export interface FixtureNode extends BaseNode {
  type: 'Fixture';
  name: string;
  data: Expression;
}

// Error boundary / global error handling
export interface ErrorNode extends BaseNode {
  type: 'Error';
  errorType: string; // 'boundary' | 'global' | 'fallback'
  handler: Statement[];
  fallback: UINode[];
  props: Record<string, Expression>;
}

// Loading state configuration
export interface LoadingNode extends BaseNode {
  type: 'Loading';
  loadingType: string; // 'skeleton' | 'spinner' | 'shimmer' | 'global'
  props: Record<string, Expression>;
  body: UINode[];
}

// Offline mode
export interface OfflineNode extends BaseNode {
  type: 'Offline';
  strategy: string; // 'cache-first' | 'network-first' | 'stale-while-revalidate'
  props: Record<string, Expression>;
  fallback: UINode[];
}

// Retry logic
export interface RetryNode extends BaseNode {
  type: 'Retry';
  maxRetries: Expression;
  delay: Expression | null;
  backoff: string; // 'linear' | 'exponential'
  action: Expression;
}

// Logging configuration
export interface LogNode extends BaseNode {
  type: 'Log';
  level: string; // 'debug' | 'info' | 'warn' | 'error'
  message: Expression;
  data: Expression | null;
}

// Internationalization
export interface I18nNode extends BaseNode {
  type: 'I18n';
  defaultLocale: string;
  locales: string[];
  translations: { locale: string; entries: { key: string; value: string }[] }[];
}

// Locale formatting
export interface LocaleNode extends BaseNode {
  type: 'Locale';
  props: Record<string, Expression>;
}

// RTL support
export interface RtlNode extends BaseNode {
  type: 'Rtl';
  enabled: boolean;
  props: Record<string, Expression>;
}

// UI node union
export type UINode =
  | LayoutNode
  | TextNode
  | ButtonNode
  | InputNode
  | ImageNode
  | LinkNode
  | ToggleNode
  | SelectNode
  | IfBlock
  | ForBlock
  | ShowBlock
  | HideBlock
  | ComponentCall
  | CommentNode
  | TableNode
  | ChartNode
  | StatNode
  | NavNode
  | UploadNode
  | ModalNode
  | ToastNode
  | CrudNode
  | ListNode
  | LayoutShellNode
  | SlideOverNode
  | DrawerNode
  | CommandNode
  | ConfirmNode
  | PayNode
  | CartNode
  | MediaNode
  | NotificationNode
  | SearchNode
  | FilterNode
  | SocialNode
  | ProfileNode
  | HeroNode
  | FeaturesNode
  | PricingNode
  | FaqNode
  | TestimonialNode
  | FooterNode
  | AdminNode
  | SeoNode
  | A11yNode
  | AnimateNode
  | GestureNode
  | AiNode
  | AutomationNode
  | DevNode
  | EmitNode
  | ResponsiveNode
  | BreadcrumbNode
  | StatsGridNode
  | DividerNode
  | ProgressNode
  // Phase 4: Error/Loading
  | ErrorNode
  | LoadingNode
  | OfflineNode
  | RetryNode
  | LogNode;

// All AST nodes
export type ASTNode =
  | AppNode
  | PageNode
  | ComponentNode
  | StateDecl
  | DerivedDecl
  | PropDecl
  | TypeDecl
  | StoreDecl
  | ApiDecl
  | FnDecl
  | OnMount
  | OnDestroy
  | WatchBlock
  | CheckDecl
  | StyleDecl
  | JsImport
  | UseImport
  | JsBlock
  | ModelNode
  | DataDecl
  | FormDecl
  | AuthDecl
  | RealtimeDecl
  | RouteDecl
  | RoleDecl
  | AutomationNode
  | DevNode
  // Phase 4: Infrastructure
  | DeployNode
  | EnvNode
  | DockerNode
  | CiNode
  | DomainNode
  | CdnNode
  | MonitorNode
  | BackupNode
  // Phase 4: Backend
  | EndpointNode
  | MiddlewareNode
  | QueueNode
  | CronNode
  | CacheNode
  | MigrateNode
  | SeedNode
  | WebhookNode
  | StorageNode
  // Phase 4: Testing
  | TestNode
  | E2eNode
  | MockNode
  | FixtureNode
  // Phase 4: i18n
  | I18nNode
  | LocaleNode
  | RtlNode
  | UINode;

// Code generator interface
export interface CodeGenerator {
  target: string;
  generate(ast: PageNode | ComponentNode | AppNode): GeneratedCode;
}

export interface GeneratedCode {
  code: string;
  filename: string;
  imports: string[];
  lineCount: number;
  tokenCount: number;
}
