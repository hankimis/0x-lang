// 0x → React Code Generator

import type {
  ASTNode, PageNode, ComponentNode, AppNode,
  StateDecl, DerivedDecl, PropDecl, TypeDecl, StoreDecl, ApiDecl,
  FnDecl, OnMount, OnDestroy, WatchBlock, CheckDecl,
  LayoutNode, TextNode, ButtonNode, InputNode, ImageNode, LinkNode,
  ToggleNode, SelectNode, IfBlock, ForBlock, ShowBlock, HideBlock,
  StyleDecl, ComponentCall, CommentNode,
  JsImport, UseImport, JsBlock,
  ModelNode, DataDecl, FormDecl, TableNode,
  AuthDecl, ChartNode, StatNode, RealtimeDecl, RouteDecl, NavNode,
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
  Expression, Statement, UINode, GeneratedCode,
} from '../ast.js';
import { SIZE_MAP, unquote, capitalize } from './shared.js';

interface GenContext {
  imports: Set<string>; // React hooks to import
  states: Map<string, StateDecl>;
  derivedNames: Set<string>;
  styles: Map<string, StyleDecl>;
  indent: number;
}

function ctx(): GenContext {
  return {
    imports: new Set(),
    states: new Map(),
    derivedNames: new Set(),
    styles: new Map(),
    indent: 1,
  };
}

function ind(c: GenContext): string {
  return '  '.repeat(c.indent);
}

export function generateReact(ast: ASTNode[]): GeneratedCode {
  const parts: string[] = [];

  for (const node of ast) {
    if (node.type === 'Model') {
      parts.push(genModelCode(node));
    } else if (node.type === 'AuthDecl') {
      parts.push(genAuthCode(node));
    } else if (node.type === 'RouteDecl') {
      parts.push(genRouteCode(node));
    } else if (node.type === 'RoleDecl') {
      parts.push(genRoleCode(node));
    } else if (node.type === 'Automation') {
      parts.push(genAutomationCode(node));
    } else if (node.type === 'Dev') {
      parts.push(genDevCode(node));
    // Phase 4: Infrastructure
    } else if (node.type === 'Deploy') {
      parts.push(genDeployCode(node));
    } else if (node.type === 'Env') {
      parts.push(genEnvCode(node));
    } else if (node.type === 'Docker') {
      parts.push(genDockerCode(node));
    } else if (node.type === 'Ci') {
      parts.push(genCiCode(node));
    } else if (node.type === 'Domain') {
      parts.push(genDomainCode(node));
    } else if (node.type === 'Cdn') {
      parts.push(genCdnCode(node));
    } else if (node.type === 'Monitor') {
      parts.push(genMonitorCode(node));
    } else if (node.type === 'Backup') {
      parts.push(genBackupCode(node));
    // Phase 4: Backend
    } else if (node.type === 'Endpoint') {
      parts.push(genEndpointCode(node));
    } else if (node.type === 'Middleware') {
      parts.push(genMiddlewareCode(node));
    } else if (node.type === 'Queue') {
      parts.push(genQueueCode(node));
    } else if (node.type === 'Cron') {
      parts.push(genCronCode(node));
    } else if (node.type === 'Cache') {
      parts.push(genCacheCode(node));
    } else if (node.type === 'Migrate') {
      parts.push(genMigrateCode(node));
    } else if (node.type === 'Seed') {
      parts.push(genSeedCode(node));
    } else if (node.type === 'Webhook') {
      parts.push(genWebhookCode(node));
    } else if (node.type === 'Storage') {
      parts.push(genStorageCode(node));
    // Phase 4: Testing
    } else if (node.type === 'Test') {
      parts.push(genTestCode(node));
    } else if (node.type === 'E2e') {
      parts.push(genE2eCode(node));
    } else if (node.type === 'Mock') {
      parts.push(genMockCode(node));
    } else if (node.type === 'Fixture') {
      parts.push(genFixtureCode(node));
    // Phase 4: i18n
    } else if (node.type === 'I18n') {
      parts.push(genI18nCode(node));
    } else if (node.type === 'Locale') {
      parts.push(genLocaleCode(node));
    } else if (node.type === 'Rtl') {
      parts.push(genRtlCode(node));
    } else if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
      parts.push(generateTopLevel(node));
    }
  }

  const code = parts.join('\n\n');
  const importLines = code.match(/^import .+$/gm) || [];
  return {
    code,
    filename: 'Component.jsx',
    imports: importLines,
    lineCount: code.split('\n').length,
    tokenCount: code.split(/\s+/).length,
  };
}

/** Generate framework-agnostic backend/infrastructure code for a non-UI node. Returns null if unrecognized. */
export function generateBackendCode(node: ASTNode): string | null {
  switch (node.type) {
    case 'Model': return genModelCode(node);
    case 'AuthDecl': return genAuthCode(node);
    case 'RouteDecl': return genRouteCode(node);
    case 'RoleDecl': return genRoleCode(node);
    case 'Automation': return genAutomationCode(node);
    case 'Dev': return genDevCode(node);
    case 'Deploy': return genDeployCode(node);
    case 'Env': return genEnvCode(node);
    case 'Docker': return genDockerCode(node);
    case 'Ci': return genCiCode(node);
    case 'Domain': return genDomainCode(node);
    case 'Cdn': return genCdnCode(node);
    case 'Monitor': return genMonitorCode(node);
    case 'Backup': return genBackupCode(node);
    case 'Endpoint': return genEndpointCode(node);
    case 'Middleware': return genMiddlewareCode(node);
    case 'Queue': return genQueueCode(node);
    case 'Cron': return genCronCode(node);
    case 'Cache': return genCacheCode(node);
    case 'Migrate': return genMigrateCode(node);
    case 'Seed': return genSeedCode(node);
    case 'Webhook': return genWebhookCode(node);
    case 'Storage': return genStorageCode(node);
    case 'Test': return genTestCode(node);
    case 'E2e': return genE2eCode(node);
    case 'Mock': return genMockCode(node);
    case 'Fixture': return genFixtureCode(node);
    case 'I18n': return genI18nCode(node);
    case 'Locale': return genLocaleCode(node);
    case 'Rtl': return genRtlCode(node);
    default: return null;
  }
}

function generateTopLevel(node: PageNode | ComponentNode | AppNode): string {
  const c = ctx();

  // First pass: collect states, derived, styles
  for (const child of node.body) {
    if (child.type === 'StateDecl') c.states.set(child.name, child);
    if (child.type === 'DerivedDecl') c.derivedNames.add(child.name);
    if (child.type === 'StyleDecl') c.styles.set(child.name, child);
  }

  // Generate body parts
  const hookLines: string[] = [];
  const jsxParts: string[] = [];
  const fnLines: string[] = [];

  for (const child of node.body) {
    switch (child.type) {
      case 'StateDecl':
        hookLines.push(genState(child, c));
        break;
      case 'DerivedDecl':
        hookLines.push(genDerived(child, c));
        break;
      case 'PropDecl':
        // Handled in function signature
        break;
      case 'TypeDecl':
        // Type-only, skip in output (could generate JSDoc or TS type)
        break;
      case 'FnDecl':
        fnLines.push(genFunction(child, c));
        break;
      case 'OnMount':
        hookLines.push(genOnMount(child, c));
        break;
      case 'OnDestroy':
        hookLines.push(genOnDestroy(child, c));
        break;
      case 'WatchBlock':
        hookLines.push(genWatch(child, c));
        break;
      case 'CheckDecl':
        hookLines.push(genCheck(child, c));
        break;
      case 'ApiDecl':
        hookLines.push(genApi(child, c));
        break;
      case 'StoreDecl':
        hookLines.push(genStore(child, c));
        break;
      case 'DataDecl':
        hookLines.push(genDataDecl(child, c));
        break;
      case 'FormDecl':
        hookLines.push(genFormDecl(child, c));
        break;
      case 'RealtimeDecl':
        hookLines.push(genRealtimeDecl(child, c));
        break;
      case 'Model':
      case 'AuthDecl':
      case 'RouteDecl':
      case 'RoleDecl':
      case 'Deploy':
      case 'Env':
      case 'Docker':
      case 'Ci':
      case 'Domain':
      case 'Cdn':
      case 'Monitor':
      case 'Backup':
      case 'Endpoint':
      case 'Middleware':
      case 'Queue':
      case 'Cron':
      case 'Cache':
      case 'Migrate':
      case 'Seed':
      case 'Webhook':
      case 'Storage':
      case 'Test':
      case 'E2e':
      case 'Mock':
      case 'Fixture':
      case 'I18n':
      case 'Locale':
      case 'Rtl':
        // Handled at top level
        break;
      case 'StyleDecl':
        // Collected already, used by reference
        break;
      case 'Comment':
        // Skip
        break;
      default:
        // UI element
        jsxParts.push(genUINode(child as UINode, c));
        break;
    }
  }

  // Collect props
  const props = node.body.filter(n => n.type === 'PropDecl') as PropDecl[];
  const propsArg = props.length > 0
    ? `{ ${props.map(p => p.defaultValue ? `${p.name} = ${genExpr(p.defaultValue, c)}` : p.name).join(', ')} }`
    : '';

  // Build import line
  const reactImports = ['React'];
  const hookNames = Array.from(c.imports).sort();
  if (hookNames.length > 0) {
    reactImports.push(...hookNames);
  }
  const importLine = `import ${reactImports[0]}, { ${hookNames.join(', ')} } from 'react';`;

  // Build component
  const isComponent = node.type === 'Component';
  const exportKw = isComponent ? '' : 'export default ';
  const lines: string[] = [
    `// Generated by 0x`,
    hookNames.length > 0 ? importLine : `import React from 'react';`,
    '',
    `${exportKw}function ${node.name}(${propsArg}) {`,
    ...hookLines.map(l => `  ${l}`),
    ...fnLines.map(l => `  ${l}`),
    '',
    '  return (',
    ...jsxParts.map(l => `    ${l}`),
    '  );',
    '}',
  ];

  // If component, also export it
  if (isComponent) {
    lines.push('', `export { ${node.name} };`);
  }

  return lines.filter(l => l !== undefined).join('\n');
}

// ── State ───────────────────────────────────────────

function genState(node: StateDecl, c: GenContext): string {
  c.imports.add('useState');
  const setter = 'set' + capitalize(node.name);
  const init = genExpr(node.initial, c);
  return `const [${node.name}, ${setter}] = useState(${init});`;
}

function genDerived(node: DerivedDecl, c: GenContext): string {
  c.imports.add('useMemo');
  const expr = genExpr(node.expression, c);
  const deps = extractDeps(node.expression, c);
  return `const ${node.name} = useMemo(() => ${expr}, [${deps.join(', ')}]);`;
}

function genCheck(node: CheckDecl, c: GenContext): string {
  const cond = genExpr(node.condition, c);
  return `if (!(${cond})) console.error('0x check failed: ${node.message}');`;
}

function genApi(node: ApiDecl, c: GenContext): string {
  return `const ${node.name} = async (params) => {\n    const res = await fetch('${node.url}' + (params ? '?' + new URLSearchParams(params).toString() : ''), { method: '${node.method}' });\n    return res.json();\n  };`;
}

function genStore(node: StoreDecl, c: GenContext): string {
  c.imports.add('useState');
  c.imports.add('useEffect');
  const setter = 'set' + capitalize(node.name);
  const init = genExpr(node.initial, c);
  const key = node.name;
  const lines = [
    `const [${node.name}, ${setter}] = useState(() => {`,
    `    const stored = localStorage.getItem('${key}');`,
    `    return stored ? JSON.parse(stored) : ${init};`,
    `  });`,
  ];
  return lines.join('\n  ');
}

// ── Functions ───────────────────────────────────────

function genFunction(node: FnDecl, c: GenContext): string {
  const params = node.params.map(p => p.name).join(', ');
  const asyncKw = node.isAsync ? 'async ' : '';
  const body = node.body.map(s => genStatement(s, c)).join('\n    ');

  // requires
  const requireChecks = node.requires.map(r =>
    `if (!(${genExpr(r, c)})) throw new Error('Precondition failed');`
  ).join('\n    ');

  const allBody = [requireChecks, body].filter(Boolean).join('\n    ');
  return `const ${node.name} = ${asyncKw}(${params}) => {\n    ${allBody}\n  };`;
}

// ── Lifecycle ───────────────────────────────────────

function genOnMount(node: OnMount, c: GenContext): string {
  c.imports.add('useEffect');
  const body = node.body.map(s => genStatement(s, c)).join('\n    ');
  return `useEffect(() => {\n    ${body}\n  }, []);`;
}

function genOnDestroy(node: OnDestroy, c: GenContext): string {
  c.imports.add('useEffect');
  const body = node.body.map(s => genStatement(s, c)).join('\n    ');
  return `useEffect(() => {\n    return () => {\n      ${body}\n    };\n  }, []);`;
}

function genWatch(node: WatchBlock, c: GenContext): string {
  c.imports.add('useEffect');
  const body = node.body.map(s => genStatement(s, c)).join('\n    ');
  return `useEffect(() => {\n    ${body}\n  }, [${node.variable}]);`;
}

// ── UI Nodes ────────────────────────────────────────

function genUINode(node: UINode, c: GenContext): string {
  switch (node.type) {
    case 'Layout': return genLayout(node, c);
    case 'Text': return genText(node, c);
    case 'Button': return genButton(node, c);
    case 'Input': return genInput(node, c);
    case 'Image': return genImage(node, c);
    case 'Link': return genLink(node, c);
    case 'Toggle': return genToggle(node, c);
    case 'Select': return genSelect(node, c);
    case 'IfBlock': return genIf(node, c);
    case 'ForBlock': return genFor(node, c);
    case 'ShowBlock': return genShow(node, c);
    case 'HideBlock': return genHide(node, c);
    case 'ComponentCall': return genComponentCall(node, c);
    case 'Table': return genTableUI(node, c);
    case 'Chart': return genChartUI(node as ChartNode, c);
    case 'Stat': return genStatUI(node as StatNode, c);
    case 'Nav': return genNavUI(node as NavNode, c);
    case 'Upload': return genUploadUI(node as UploadNode, c);
    case 'Modal': return genModalUI(node as ModalNode, c);
    case 'Toast': return genToastUI(node as ToastNode, c);
    case 'Comment': return `{/* ${(node as CommentNode).text} */}`;
    // Phase 3 nodes
    case 'Crud': return genCrudUI(node as CrudNode, c);
    case 'List': return genListUI(node as ListNode, c);
    case 'Drawer': return genDrawerUI(node as DrawerNode, c);
    case 'Command': return genCommandUI(node as CommandNode, c);
    case 'Confirm': return genConfirmUI(node as ConfirmNode, c);
    case 'Pay': return genPayUI(node as PayNode, c);
    case 'Cart': return genCartUI(node as CartNode, c);
    case 'Media': return genMediaUI(node as MediaNode, c);
    case 'Notification': return genNotificationUI(node as NotificationNode, c);
    case 'Search': return genSearchUI(node as SearchNode, c);
    case 'Filter': return genFilterUI(node as FilterNode, c);
    case 'Social': return genSocialUI(node as SocialNode, c);
    case 'Profile': return genProfileUI(node as ProfileNode, c);
    case 'Hero': return genHeroUI(node as HeroNode, c);
    case 'Features': return genFeaturesUI(node as FeaturesNode, c);
    case 'Pricing': return genPricingUI(node as PricingNode, c);
    case 'Faq': return genFaqUI(node as FaqNode, c);
    case 'Testimonial': return genTestimonialUI(node as TestimonialNode, c);
    case 'Footer': return genFooterUI(node as FooterNode, c);
    case 'Admin': return genAdminUI(node as AdminNode, c);
    case 'Seo': return genSeoUI(node as SeoNode, c);
    case 'A11y': return `{/* a11y configured */}`;
    case 'Animate': return genAnimateUI(node as AnimateNode, c);
    case 'Gesture': return genGestureUI(node as GestureNode, c);
    case 'Ai': return genAiUI(node as AiNode, c);
    case 'Emit': return `{/* emit: ${genExpr((node as EmitNode).channel, c)} */}`;
    case 'Responsive': return genResponsiveUI(node as ResponsiveNode, c);
    case 'Breadcrumb': return genBreadcrumbUI(node as BreadcrumbNode, c);
    case 'StatsGrid': return genStatsGridUI(node as StatsGridNode, c);
    case 'LayoutShell': return `<div className="layout-shell">${(node as LayoutShellNode).body.map(ch => genUINode(ch, c)).join('\n')}</div>`;
    case 'SlideOver': return genDrawerUI(node as any, c);
    case 'Automation': return `{/* automation configured */}`;
    case 'Dev': return `{/* dev tools configured */}`;
    // Phase 4: Error/Loading as UI
    case 'Error': return genErrorUI(node as ErrorNode, c);
    case 'Loading': return genLoadingUI(node as LoadingNode, c);
    case 'Offline': return genOfflineUI(node as OfflineNode, c);
    case 'Retry': return `{/* retry: max=${genExpr((node as RetryNode).maxRetries, c)} */}`;
    case 'Log': return `{/* log: ${genExpr((node as LogNode).message, c)} */}`;
    default: return `{/* unsupported: ${(node as any).type} */}`;
  }
}

function genLayout(node: LayoutNode, c: GenContext): string {
  const style: Record<string, string> = {};

  if (node.direction === 'grid') {
    style['display'] = 'grid';
    if (node.props['cols']) {
      const cols = genExpr(node.props['cols'], c);
      style['gridTemplateColumns'] = `repeat(${cols}, 1fr)`;
    }
  } else if (node.direction === 'stack') {
    style['position'] = 'relative';
  } else {
    style['display'] = 'flex';
    style['flexDirection'] = node.direction === 'row' ? 'row' : 'column';
  }

  // Process layout props
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'gap': style['gap'] = `${v}px`; break;
      case 'padding': style['padding'] = `${v}px`; break;
      case 'margin': style['margin'] = v; break;
      case 'maxWidth': style['maxWidth'] = `${v}px`; break;
      case 'height': style['height'] = v; break;
      case 'bg': style['backgroundColor'] = v; break;
      case 'center': style['alignItems'] = 'center'; break;
      case 'middle': style['justifyContent'] = 'center'; break;
      case 'between': style['justifyContent'] = 'space-between'; break;
      case 'end': style['justifyContent'] = 'flex-end'; break;
      case 'grow': style['flexGrow'] = v; break;
      case 'scroll': style['overflow' + (v === 'y' ? 'Y' : 'X')] = 'auto'; break;
      case 'radius': style['borderRadius'] = `${v}px`; break;
      case 'shadow':
        if (v === 'sm') style['boxShadow'] = '0 1px 2px rgba(0,0,0,0.1)';
        else if (v === 'md') style['boxShadow'] = '0 4px 6px rgba(0,0,0,0.1)';
        else if (v === 'lg') style['boxShadow'] = '0 10px 15px rgba(0,0,0,0.1)';
        break;
    }
  }

  // Apply style class
  if (node.styleClass && c.styles.has(node.styleClass)) {
    const styleDecl = c.styles.get(node.styleClass)!;
    for (const prop of styleDecl.properties) {
      if (!prop.responsive) {
        const key = cssPropToJs(prop.name);
        const val = genExpr(prop.value, c);
        style[key] = formatStyleValue(prop.name, val);
      }
    }
  }

  const styleStr = genStyleObj(style);
  const children = node.children.map(ch => genUINode(ch, c)).join('\n');
  return `<div style={${styleStr}}>\n${children}\n</div>`;
}

function genText(node: TextNode, c: GenContext): string {
  const style: Record<string, string> = {};

  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'size': { const uv = unquote(v); style['fontSize'] = SIZE_MAP[uv] || `${uv}px`; break; }
      case 'bold': style['fontWeight'] = 'bold'; break;
      case 'color': style['color'] = v; break;
      case 'bg': style['backgroundColor'] = v; break;
      case 'center': style['textAlign'] = 'center'; break;
      case 'end': style['textAlign'] = 'right'; break;
      case 'strike': {
        // strike={condition} → conditional textDecoration
        const cond = genExpr(val, c);
        style['textDecoration'] = `\${${cond} ? 'line-through' : 'none'}`;
        break;
      }
    }
  }

  const content = genTextContent(node.content, c);
  const styleStr = Object.keys(style).length > 0 ? ` style={${genStyleObj(style)}}` : '';
  return `<span${styleStr}>${content}</span>`;
}

function genButton(node: ButtonNode, c: GenContext): string {
  const label = genTextContent(node.label, c);
  const actionCode = genActionExpr(node.action, c);
  const styleProps: string[] = [];

  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'style': styleProps.push(`className="${v}"`); break;
      case 'disabled': styleProps.push(`disabled={${v}}`); break;
      case 'size': /* handled in style */ break;
    }
  }

  const propsStr = styleProps.join(' ');
  return `<button onClick={() => ${actionCode}}${propsStr ? ' ' + propsStr : ''}>${label}</button>`;
}

function genInput(node: InputNode, c: GenContext): string {
  const setter = 'set' + capitalize(node.binding);
  const props: string[] = [
    `value={${node.binding}}`,
    `onChange={e => ${setter}(e.target.value)}`,
  ];

  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'placeholder': props.push(`placeholder=${quoteJsx(v)}`); break;
      case 'type': props.push(`type=${quoteJsx(v)}`); break;
    }
  }

  // Check for @keypress event
  for (const [key, val] of Object.entries(node.props)) {
    if (key === '@keypress') {
      const handler = genExpr(val, c);
      props.push(`onKeyPress={e => ${handler}(e.key)}`);
    }
  }

  return `<input ${props.join(' ')} />`;
}

function genImage(node: ImageNode, c: GenContext): string {
  const src = genExpr(node.src, c);
  const props: string[] = [`src={${src}}`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'width': props.push(`width="${v}"`); break;
      case 'height': props.push(`height="${v}"`); break;
      case 'alt': props.push(`alt=${quoteJsx(v)}`); break;
    }
  }

  return `<img ${props.join(' ')} />`;
}

function genLink(node: LinkNode, c: GenContext): string {
  const label = genTextContent(node.label, c);
  const href = genExpr(node.href, c);
  return `<a href={${href}}>${label}</a>`;
}

function genToggle(node: ToggleNode, c: GenContext): string {
  const binding = node.binding;
  // Handle member expressions like item.done
  const parts = binding.split('.');
  let setter: string;
  if (parts.length === 1) {
    setter = `set${capitalize(parts[0])}(!${binding})`;
  } else {
    setter = `set${capitalize(parts[0])}(prev => ({...prev, ${parts.slice(1).join('.')}: !prev.${parts.slice(1).join('.')}}))`;
  }

  return `<input type="checkbox" checked={${binding}} onChange={() => ${setter}} />`;
}

function genSelect(node: SelectNode, c: GenContext): string {
  const setter = 'set' + capitalize(node.binding);
  const options = genExpr(node.options, c);
  return `<select value={${node.binding}} onChange={e => ${setter}(e.target.value)}>\n  {${options}.map(opt => <option key={opt} value={opt}>{opt}</option>)}\n</select>`;
}

function genComponentCall(node: ComponentCall, c: GenContext): string {
  const props = Object.entries(node.args)
    .map(([key, val]) => {
      if (key.startsWith('_arg')) {
        // Positional arg — use as spread or first prop
        return genExpr(val, c);
      }
      return `${key}={${genExpr(val, c)}}`;
    });

  // If positional args, treat first one as spread prop
  const posArgs = Object.entries(node.args).filter(([k]) => k.startsWith('_arg'));
  if (posArgs.length > 0) {
    const propsStr = posArgs.map(([, v]) => `{...${genExpr(v, c)}}`).join(' ');
    return `<${node.name} ${propsStr} />`;
  }

  return `<${node.name} ${props.join(' ')} />`;
}

// ── Control Flow ────────────────────────────────────

function genIf(node: IfBlock, c: GenContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');

  if (node.elseBody && node.elseBody.length > 0) {
    const elseBody = node.elseBody.map(ch => genUINode(ch, c)).join('\n');

    if (node.elifs.length > 0) {
      let result = `{${cond} ? (\n${body}\n)`;
      for (const elif of node.elifs) {
        const elifCond = genExpr(elif.condition, c);
        const elifBody = elif.body.map(ch => genUINode(ch, c)).join('\n');
        result += ` : ${elifCond} ? (\n${elifBody}\n)`;
      }
      result += ` : (\n${elseBody}\n)}`;
      return result;
    }

    return `{${cond} ? (\n${body}\n) : (\n${elseBody}\n)}`;
  }

  return `{${cond} && (\n${body}\n)}`;
}

function genFor(node: ForBlock, c: GenContext): string {
  const item = node.item;
  const iter = genExpr(node.iterable, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');

  const params = node.index ? `(${item}, ${node.index})` : `(${item})`;
  return `{${iter}.map(${params} => (\n${body}\n))}`;
}

function genShow(node: ShowBlock, c: GenContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  return `<div style={{ display: ${cond} ? 'block' : 'none' }}>\n${body}\n</div>`;
}

function genHide(node: HideBlock, c: GenContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  return `<div style={{ display: ${cond} ? 'none' : 'block' }}>\n${body}\n</div>`;
}

// ── Statements ──────────────────────────────────────

function genStatement(stmt: Statement, c: GenContext): string {
  switch (stmt.kind) {
    case 'expr_stmt':
      return genExpr(stmt.expression, c) + ';';
    case 'return':
      return stmt.value ? `return ${genExpr(stmt.value, c)};` : 'return;';
    case 'assignment_stmt': {
      const target = genExpr(stmt.target, c);
      const value = genExpr(stmt.value, c);
      // If target is a state, use setter
      const stateName = extractStateName(stmt.target);
      if (stateName && c.states.has(stateName)) {
        const setter = 'set' + capitalize(stateName);
        if (stmt.op === '=') {
          return `${setter}(${value});`;
        } else if (stmt.op === '+=') {
          return `${setter}(prev => prev + ${value});`;
        } else if (stmt.op === '-=') {
          return `${setter}(prev => prev - ${value});`;
        }
      }
      return `${target} ${stmt.op} ${value};`;
    }
    case 'var_decl':
      return `const ${stmt.name} = ${genExpr(stmt.value, c)};`;
    case 'if_stmt': {
      const cond = genExpr(stmt.condition, c);
      const body = stmt.body.map(s => genStatement(s, c)).join('\n    ');
      let result = `if (${cond}) {\n      ${body}\n    }`;
      for (const elif of stmt.elifs) {
        const ec = genExpr(elif.condition, c);
        const eb = elif.body.map(s => genStatement(s, c)).join('\n    ');
        result += ` else if (${ec}) {\n      ${eb}\n    }`;
      }
      if (stmt.elseBody) {
        const eb = stmt.elseBody.map(s => genStatement(s, c)).join('\n    ');
        result += ` else {\n      ${eb}\n    }`;
      }
      return result;
    }
    case 'for_stmt': {
      const iter = genExpr(stmt.iterable, c);
      const body = stmt.body.map(s => genStatement(s, c)).join('\n    ');
      return `for (const ${stmt.item} of ${iter}) {\n      ${body}\n    }`;
    }
  }
}

// ── Expressions ─────────────────────────────────────

function genExpr(expr: Expression, c: GenContext): string {
  switch (expr.kind) {
    case 'number': return String(expr.value);
    case 'string': return `'${expr.value}'`;
    case 'boolean': return String(expr.value);
    case 'null': return 'null';
    case 'identifier': return expr.name;
    case 'member': return `${genExpr(expr.object, c)}.${expr.property}`;
    case 'index': return `${genExpr(expr.object, c)}[${genExpr(expr.index, c)}]`;
    case 'call': {
      const callee = genExpr(expr.callee, c);
      const args = expr.args.map(a => genExpr(a, c)).join(', ');

      // Handle state mutation methods: items.push(), items.filter(), etc.
      if (expr.callee.kind === 'member') {
        const objName = extractStateName(expr.callee.object);
        const method = expr.callee.property;
        if (objName && c.states.has(objName)) {
          const setter = 'set' + capitalize(objName);
          if (method === 'push') {
            return `${setter}(prev => [...prev, ${args}])`;
          }
          if (method === 'filter') {
            return `${setter}(prev => prev.filter(${args}))`;
          }
          if (method === 'remove') {
            return `${setter}(prev => prev.filter(item => item.id !== ${args}))`;
          }
        }
      }

      return `${callee}(${args})`;
    }
    case 'binary': return `${genExpr(expr.left, c)} ${expr.op} ${genExpr(expr.right, c)}`;
    case 'unary': return `${expr.op}${genExpr(expr.operand, c)}`;
    case 'ternary': return `${genExpr(expr.condition, c)} ? ${genExpr(expr.consequent, c)} : ${genExpr(expr.alternate, c)}`;
    case 'arrow': {
      const params = expr.params.join(', ');
      if (Array.isArray(expr.body)) {
        const body = (expr.body as Statement[]).map(s => genStatement(s, c)).join('\n');
        return `(${params}) => { ${body} }`;
      }
      return `${params} => ${genExpr(expr.body as Expression, c)}`;
    }
    case 'array': {
      const els = expr.elements.map(e => genExpr(e, c)).join(', ');
      return `[${els}]`;
    }
    case 'object_expr': {
      const props = expr.properties.map(p => {
        if (p.key === p.value.kind && p.value.kind === 'identifier') {
          return p.key; // shorthand
        }
        return `${p.key}: ${genExpr(p.value, c)}`;
      }).join(', ');
      return `{ ${props} }`;
    }
    case 'template': {
      const parts = expr.parts.map(p => {
        if (typeof p === 'string') return p;
        return `\${${genExpr(p, c)}}`;
      }).join('');
      return '`' + parts + '`';
    }
    case 'assignment': {
      const target = genExpr(expr.target, c);
      const value = genExpr(expr.value, c);
      const stateName = extractStateName(expr.target);
      if (stateName && c.states.has(stateName)) {
        const setter = 'set' + capitalize(stateName);
        if (expr.op === '=') return `${setter}(${value})`;
        if (expr.op === '+=') return `${setter}(prev => prev + ${value})`;
        if (expr.op === '-=') return `${setter}(prev => prev - ${value})`;
      }
      return `${target} ${expr.op} ${value}`;
    }
    case 'await': return `await ${genExpr(expr.expression, c)}`;
    case 'old': return genExpr(expr.expression, c); // old() is for contracts, simplified
  }
}

function genTextContent(expr: Expression, c: GenContext): string {
  if (expr.kind === 'string') return expr.value;
  if (expr.kind === 'template') {
    return expr.parts.map(p => {
      if (typeof p === 'string') return p;
      return `{${genExpr(p, c)}}`;
    }).join('');
  }
  return `{${genExpr(expr, c)}}`;
}

function genActionExpr(expr: Expression | Statement[], c: GenContext): string {
  if (Array.isArray(expr)) {
    return `{ ${(expr as Statement[]).map(s => genStatement(s, c)).join('; ')} }`;
  }
  // Assignment expression for actions like count += 1
  if (expr.kind === 'assignment') {
    const stateName = extractStateName(expr.target);
    if (stateName && c.states.has(stateName)) {
      const setter = 'set' + capitalize(stateName);
      const value = genExpr(expr.value, c);
      if (expr.op === '+=') return `${setter}(prev => prev + ${value})`;
      if (expr.op === '-=') return `${setter}(prev => prev - ${value})`;
      if (expr.op === '=') return `${setter}(${value})`;
    }
  }
  if (expr.kind === 'call') {
    return genExpr(expr, c);
  }
  return genExpr(expr, c);
}

// ── Phase 1 Advanced: Model ─────────────────────────

function genModelCode(node: ModelNode): string {
  const name = node.name;
  const lines: string[] = [
    `// Generated by 0x — Model: ${name}`,
    '',
  ];

  // Generate TypeScript-style interface as JSDoc
  lines.push(`/** @typedef {Object} ${name}`);
  for (const f of node.fields) {
    lines.push(` * @property {${typeExprToJs(f.fieldType)}} ${f.name}`);
  }
  lines.push(' */');
  lines.push('');

  // Generate validation function
  if (node.validate.length > 0) {
    lines.push(`function validate${name}(data) {`);
    lines.push('  const errors = [];');
    for (const v of node.validate) {
      const cond = genExprStandalone(v.condition);
      lines.push(`  if (!(${cond.replace(/\b([a-zA-Z_]\w*)\.(\w+)/g, 'data.$1 && data.$1.$2').replace(/^(?!data\.)([a-zA-Z_]\w*)/gm, (m) => m.startsWith('data.') ? m : `data.${m}`)})) errors.push('${v.message}');`);
    }
    lines.push("  return errors;");
    lines.push('}');
    lines.push('');
  }

  // Generate CRUD API functions
  const lower = name.toLowerCase();
  lines.push(`// CRUD API for ${name}`);
  lines.push(`const ${name}API = {`);
  lines.push(`  findAll: async (params = {}) => {`);
  lines.push(`    const query = new URLSearchParams(params).toString();`);
  lines.push(`    const res = await fetch(\`/api/${lower}s\${query ? '?' + query : ''}\`);`);
  lines.push(`    return res.json();`);
  lines.push(`  },`);
  lines.push(`  findById: async (id) => {`);
  lines.push(`    const res = await fetch(\`/api/${lower}s/\${id}\`);`);
  lines.push(`    return res.json();`);
  lines.push(`  },`);
  lines.push(`  create: async (data) => {`);
  if (node.validate.length > 0) {
    lines.push(`    const errors = validate${name}(data);`);
    lines.push(`    if (errors.length > 0) throw new Error(errors.join(', '));`);
  }
  lines.push(`    const res = await fetch('/api/${lower}s', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });`);
  lines.push(`    return res.json();`);
  lines.push(`  },`);
  lines.push(`  update: async (id, data) => {`);
  lines.push(`    const res = await fetch(\`/api/${lower}s/\${id}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });`);
  lines.push(`    return res.json();`);
  lines.push(`  },`);
  lines.push(`  delete: async (id) => {`);
  lines.push(`    const res = await fetch(\`/api/${lower}s/\${id}\`, { method: 'DELETE' });`);
  lines.push(`    return res.json();`);
  lines.push(`  },`);
  lines.push(`};`);
  lines.push('');

  // React hooks for model
  lines.push(`// React hooks for ${name}`);
  lines.push('');
  lines.push(`function use${name}s(params = {}) {`);
  lines.push(`  const [data, setData] = useState([]);`);
  lines.push(`  const [loading, setLoading] = useState(true);`);
  lines.push(`  const [error, setError] = useState(null);`);
  lines.push(`  const fetch${name}s = useCallback(async () => {`);
  lines.push(`    setLoading(true);`);
  lines.push(`    try {`);
  lines.push(`      const result = await ${name}API.findAll(params);`);
  lines.push(`      setData(result);`);
  lines.push(`      setError(null);`);
  lines.push(`    } catch (e) {`);
  lines.push(`      setError(e.message);`);
  lines.push(`    } finally {`);
  lines.push(`      setLoading(false);`);
  lines.push(`    }`);
  lines.push(`  }, [JSON.stringify(params)]);`);
  lines.push(`  useEffect(() => { fetch${name}s(); }, [fetch${name}s]);`);
  lines.push(`  return { data, loading, error, refetch: fetch${name}s };`);
  lines.push(`}`);
  lines.push('');
  lines.push(`function useCreate${name}() {`);
  lines.push(`  const [loading, setLoading] = useState(false);`);
  lines.push(`  const create = async (data) => {`);
  lines.push(`    setLoading(true);`);
  lines.push(`    try { return await ${name}API.create(data); }`);
  lines.push(`    finally { setLoading(false); }`);
  lines.push(`  };`);
  lines.push(`  return { create, loading };`);
  lines.push(`}`);

  return lines.join('\n');
}

function typeExprToJs(t: import('../ast.js').TypeExpr): string {
  switch (t.kind) {
    case 'primitive': {
      const map: Record<string, string> = { int: 'number', float: 'number', str: 'string', bool: 'boolean', datetime: 'Date', date: 'Date', time: 'string' };
      return map[t.name] || t.name;
    }
    case 'list': return `${typeExprToJs(t.itemType)}[]`;
    case 'named': return t.name;
    case 'nullable': return `${typeExprToJs(t.inner)} | null`;
    default: return 'any';
  }
}

function genExprStandalone(expr: Expression): string {
  const c = ctx();
  return genExpr(expr, c);
}

// ── Phase 1 Advanced: Data Fetching ─────────────────

function genDataDecl(node: DataDecl, c: GenContext): string {
  c.imports.add('useState');
  c.imports.add('useEffect');

  const query = genExpr(node.query, c);
  const lines: string[] = [];

  lines.push(`const [${node.name}, set${capitalize(node.name)}] = useState([]);`);
  lines.push(`const [${node.name}Loading, set${capitalize(node.name)}Loading] = useState(true);`);
  lines.push(`const [${node.name}Error, set${capitalize(node.name)}Error] = useState(null);`);
  lines.push(`useEffect(() => {`);
  lines.push(`    let cancelled = false;`);
  lines.push(`    (async () => {`);
  lines.push(`      try {`);
  lines.push(`        const result = await ${query};`);
  lines.push(`        if (!cancelled) { set${capitalize(node.name)}(result); set${capitalize(node.name)}Error(null); }`);
  lines.push(`      } catch (e) {`);
  lines.push(`        if (!cancelled) set${capitalize(node.name)}Error(e.message);`);
  lines.push(`      } finally {`);
  lines.push(`        if (!cancelled) set${capitalize(node.name)}Loading(false);`);
  lines.push(`      }`);
  lines.push(`    })();`);
  lines.push(`    return () => { cancelled = true; };`);
  lines.push(`  }, []);`);

  // Register as state so JSX can reference it
  c.states.set(node.name, { type: 'StateDecl', name: node.name, valueType: { kind: 'primitive', name: 'any' }, initial: { kind: 'array', elements: [] }, loc: node.loc });

  return lines.join('\n  ');
}

// ── Phase 1 Advanced: Form ──────────────────────────

function genFormDecl(node: FormDecl, c: GenContext): string {
  c.imports.add('useState');
  c.imports.add('useCallback');

  const lines: string[] = [];

  // Form state: one state per field
  const initialValues: string[] = [];
  for (const f of node.fields) {
    const defaultVal = getFieldDefault(f.fieldType);
    initialValues.push(`${f.name}: ${defaultVal}`);
  }
  lines.push(`const [${node.name}, set${capitalize(node.name)}] = useState({ ${initialValues.join(', ')} });`);
  lines.push(`const [${node.name}Errors, set${capitalize(node.name)}Errors] = useState({});`);
  lines.push(`const [${node.name}Submitting, set${capitalize(node.name)}Submitting] = useState(false);`);

  // Update handler
  lines.push(`const update${capitalize(node.name)} = (field, value) => {`);
  lines.push(`    set${capitalize(node.name)}(prev => ({ ...prev, [field]: value }));`);
  lines.push(`    set${capitalize(node.name)}Errors(prev => ({ ...prev, [field]: null }));`);
  lines.push(`  };`);

  // Validate function
  lines.push(`const validate${capitalize(node.name)} = useCallback(() => {`);
  lines.push(`    const errors = {};`);
  for (const f of node.fields) {
    for (const v of f.validations) {
      switch (v.rule) {
        case 'required':
          lines.push(`    if (!${node.name}.${f.name}) errors.${f.name} = '${v.message}';`);
          break;
        case 'min':
          lines.push(`    if (${node.name}.${f.name}.length < ${genExprStandalone(v.value!)}) errors.${f.name} = '${v.message}';`);
          break;
        case 'max':
          lines.push(`    if (${node.name}.${f.name}.length > ${genExprStandalone(v.value!)}) errors.${f.name} = '${v.message}';`);
          break;
        case 'format':
          if (v.value?.kind === 'string' && v.value.value === 'email') {
            lines.push(`    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${node.name}.${f.name})) errors.${f.name} = '${v.message}';`);
          }
          break;
        case 'pattern':
          if (v.value?.kind === 'string') {
            lines.push(`    if (!/${v.value.value}/.test(${node.name}.${f.name})) errors.${f.name} = '${v.message}';`);
          }
          break;
      }
    }
  }
  lines.push(`    set${capitalize(node.name)}Errors(errors);`);
  lines.push(`    return Object.keys(errors).length === 0;`);
  lines.push(`  }, [${node.name}]);`);

  // Submit handler
  if (node.submit) {
    const action = genExpr(node.submit.action, c);
    lines.push(`const submit${capitalize(node.name)} = async () => {`);
    lines.push(`    if (!validate${capitalize(node.name)}()) return;`);
    lines.push(`    set${capitalize(node.name)}Submitting(true);`);
    lines.push(`    try {`);
    lines.push(`      await ${action};`);
    if (node.submit.success) {
      lines.push(`      ${genExpr(node.submit.success, c)};`);
    }
    lines.push(`    } catch (e) {`);
    if (node.submit.error) {
      lines.push(`      ${genExpr(node.submit.error, c)};`);
    }
    lines.push(`    } finally {`);
    lines.push(`      set${capitalize(node.name)}Submitting(false);`);
    lines.push(`    }`);
    lines.push(`  };`);
  }

  return lines.join('\n  ');
}

function getFieldDefault(t: import('../ast.js').TypeExpr): string {
  if (t.kind === 'primitive') {
    if (t.name === 'str') return "''";
    if (t.name === 'int' || t.name === 'float') return '0';
    if (t.name === 'bool') return 'false';
  }
  return "''";
}

// ── Phase 1 Advanced: Table ─────────────────────────

function genTableUI(node: TableNode, c: GenContext): string {
  const data = node.dataSource;
  const lines: string[] = [];

  // Sorting state
  const hasSortable = node.columns.some(col => col.sortable);
  if (hasSortable) {
    lines.push(`{(() => {`);
  }

  lines.push(`<table style={{ width: '100%', borderCollapse: 'collapse' }}>`);

  // Header
  lines.push(`<thead>`);
  lines.push(`<tr>`);
  for (const col of node.columns) {
    if (col.kind === 'select') {
      lines.push(`<th style={{ padding: '12px 8px', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}><input type="checkbox" /></th>`);
    } else if (col.kind === 'field') {
      const sortAttr = col.sortable ? ` style={{ cursor: 'pointer', padding: '12px 8px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: 600 }}` : ` style={{ padding: '12px 8px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontWeight: 600 }}`;
      lines.push(`<th${sortAttr}>${col.label || col.field}</th>`);
    } else if (col.kind === 'actions') {
      lines.push(`<th style={{ padding: '12px 8px', borderBottom: '2px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Actions</th>`);
    }
  }
  lines.push(`</tr>`);
  lines.push(`</thead>`);

  // Body
  lines.push(`<tbody>`);
  lines.push(`{${data}.map((row, idx) => (`);
  lines.push(`<tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>`);

  for (const col of node.columns) {
    if (col.kind === 'select') {
      lines.push(`<td style={{ padding: '12px 8px' }}><input type="checkbox" /></td>`);
    } else if (col.kind === 'field') {
      const fieldAccess = col.field!.includes('.') ? `row.${col.field}` : `row.${col.field}`;
      let content = `{${fieldAccess}}`;
      if (col.format) {
        if (col.format === 'date') content = `{new Date(${fieldAccess}).toLocaleDateString()}`;
        else if (col.format.startsWith('currency')) {
          const currency = col.format.match(/\((\w+)\)/)?.[1] || 'KRW';
          content = `{new Intl.NumberFormat('ko-KR', { style: 'currency', currency: '${currency}' }).format(${fieldAccess})}`;
        }
      }
      lines.push(`<td style={{ padding: '12px 8px' }}>${content}</td>`);
    } else if (col.kind === 'actions') {
      lines.push(`<td style={{ padding: '12px 8px', textAlign: 'right' }}>`);
      for (const action of (col.actions || [])) {
        if (action === 'edit') {
          lines.push(`<button onClick={() => onEdit(row)} style={{ marginRight: '4px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}>Edit</button>`);
        } else if (action === 'delete') {
          lines.push(`<button onClick={() => onDelete(row)} style={{ padding: '4px 8px', fontSize: '13px', cursor: 'pointer', color: '#e53e3e' }}>Delete</button>`);
        }
      }
      lines.push(`</td>`);
    }
  }

  lines.push(`</tr>`);
  lines.push(`))}`)
  lines.push(`</tbody>`);
  lines.push(`</table>`);

  // Pagination
  const paginationSize = node.features['pagination'];
  if (paginationSize) {
    const size = genExpr(paginationSize, c);
    lines.push(`{/* Pagination: ${size} per page */}`);
  }

  if (hasSortable) {
    lines.push(`})()}`);
  }

  return lines.join('\n');
}

// ── Phase 2 Advanced: Auth ──────────────────────────

function genAuthCode(node: AuthDecl): string {
  const lines: string[] = [
    `// Generated by 0x — Auth: ${node.provider}`,
    `import React, { useState, useContext, createContext, useCallback } from 'react';`,
    '',
  ];

  // Auth context
  lines.push(`const AuthContext = createContext(null);`);
  lines.push('');
  lines.push(`export function useAuth() {`);
  lines.push(`  const ctx = useContext(AuthContext);`);
  lines.push(`  if (!ctx) throw new Error('useAuth must be inside AuthProvider');`);
  lines.push(`  return ctx;`);
  lines.push(`}`);
  lines.push('');

  // Auth provider
  lines.push(`export function AuthProvider({ children }) {`);
  lines.push(`  const [user, setUser] = useState(null);`);
  lines.push(`  const [loading, setLoading] = useState(false);`);
  lines.push(`  const [error, setError] = useState(null);`);
  lines.push('');

  // Login function
  if (node.loginFields.length > 0) {
    const params = node.loginFields.join(', ');
    lines.push(`  const login = useCallback(async (${params}) => {`);
    lines.push(`    setLoading(true); setError(null);`);
    lines.push(`    try {`);
    lines.push(`      const res = await fetch('/api/auth/login', {`);
    lines.push(`        method: 'POST',`);
    lines.push(`        headers: { 'Content-Type': 'application/json' },`);
    lines.push(`        body: JSON.stringify({ ${params} }),`);
    lines.push(`      });`);
    lines.push(`      const data = await res.json();`);
    lines.push(`      if (!res.ok) throw new Error(data.message || 'Login failed');`);
    lines.push(`      setUser(data.user);`);
    lines.push(`      return data;`);
    lines.push(`    } catch (e) { setError(e.message); throw e; }`);
    lines.push(`    finally { setLoading(false); }`);
    lines.push(`  }, []);`);
    lines.push('');
  }

  // Signup function
  if (node.signupFields.length > 0) {
    const params = node.signupFields.join(', ');
    lines.push(`  const signup = useCallback(async (${params}) => {`);
    lines.push(`    setLoading(true); setError(null);`);
    lines.push(`    try {`);
    lines.push(`      const res = await fetch('/api/auth/signup', {`);
    lines.push(`        method: 'POST',`);
    lines.push(`        headers: { 'Content-Type': 'application/json' },`);
    lines.push(`        body: JSON.stringify({ ${params} }),`);
    lines.push(`      });`);
    lines.push(`      const data = await res.json();`);
    lines.push(`      if (!res.ok) throw new Error(data.message || 'Sign up failed');`);
    lines.push(`      setUser(data.user);`);
    lines.push(`      return data;`);
    lines.push(`    } catch (e) { setError(e.message); throw e; }`);
    lines.push(`    finally { setLoading(false); }`);
    lines.push(`  }, []);`);
    lines.push('');
  }

  // Logout function
  lines.push(`  const logout = useCallback(async () => {`);
  lines.push(`    await fetch('/api/auth/logout', { method: 'POST' });`);
  lines.push(`    setUser(null);`);
  lines.push(`  }, []);`);
  lines.push('');

  lines.push(`  const value = { user, loading, error, login, signup, logout };`);
  lines.push(`  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;`);
  lines.push(`}`);
  lines.push('');

  // Auth guard component
  for (const g of node.guards) {
    const guardName = `${capitalize(g.role)}Guard`;
    lines.push(`export function ${guardName}({ children }) {`);
    lines.push(`  const { user } = useAuth();`);
    if (g.role === 'auth') {
      lines.push(`  if (!user) {`);
    } else {
      lines.push(`  if (!user || user.role !== '${g.role}') {`);
    }
    if (g.redirect) {
      lines.push(`    window.location.href = '${g.redirect}';`);
      lines.push(`    return null;`);
    } else {
      lines.push(`    return <div>Access denied</div>;`);
    }
    lines.push(`  }`);
    lines.push(`  return children;`);
    lines.push(`}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Phase 2 Advanced: Chart ─────────────────────────

function genChartUI(node: ChartNode, c: GenContext): string {
  const lines: string[] = [];
  const data = node.props['data'] ? genExpr(node.props['data'], c) : '[]';
  const x = node.props['x'] ? genExpr(node.props['x'], c) : "'x'";
  const y = node.props['y'] ? genExpr(node.props['y'], c) : "'y'";
  const title = node.props['title'] ? genExpr(node.props['title'], c) : `'${node.name}'`;
  const color = node.props['color'] ? genExpr(node.props['color'], c) : null;
  const height = node.props['height'] ? genExpr(node.props['height'], c) : '300';

  lines.push(`<div className="chart-${node.name}" style={{ width: '100%', height: '${height}px' }}>`);
  lines.push(`  {/* Chart: ${node.chartType} - ${node.name} */}`);
  lines.push(`  {/* Data: ${data}, X: ${x}, Y: ${y} */}`);

  if (node.chartType === 'bar') {
    lines.push(`  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%', padding: '20px 0' }}>`);
    lines.push(`    <span style={{ fontSize: '14px', fontWeight: 'bold', position: 'absolute', top: 0 }}>{${title}}</span>`);
    lines.push(`    {${data}.map((item, i) => (`);
    lines.push(`      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>`);
    lines.push(`        <span style={{ fontSize: '12px', marginBottom: '4px' }}>{item[${y}]}</span>`);
    lines.push(`        <div style={{ width: '100%', backgroundColor: ${color ? `item[${color}] || '#3182ce'` : "'#3182ce'"}, height: \`\${(item[${y}] / Math.max(...${data}.map(d => d[${y}]))) * 100}%\`, borderRadius: '4px 4px 0 0', minHeight: '4px' }} />`);
    lines.push(`        <span style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>{item[${x}]}</span>`);
    lines.push(`      </div>`);
    lines.push(`    ))}`);
    lines.push(`  </div>`);
  } else if (node.chartType === 'pie') {
    lines.push(`  <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>`);
    lines.push(`    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{${title}}</span>`);
    lines.push(`    {/* Pie chart - use recharts/chart.js for production */}`);
    lines.push(`    {${data}.map((item, i) => (`);
    lines.push(`      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>`);
    lines.push(`        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: ['#3182ce','#38a169','#d69e2e','#e53e3e','#805ad5'][i % 5] }} />`);
    lines.push(`        <span>{item[${x}]}: {item[${y}]}</span>`);
    lines.push(`      </div>`);
    lines.push(`    ))}`);
    lines.push(`  </div>`);
  } else {
    // line, area, doughnut, etc — render placeholder with data info
    lines.push(`  <div style={{ padding: '20px' }}>`);
    lines.push(`    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{${title}}</span>`);
    lines.push(`    <div style={{ marginTop: '12px', color: '#666' }}>`);
    lines.push(`      {${data}.map((item, i) => (`);
    lines.push(`        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>`);
    lines.push(`          <span>{item[${x}]}</span>`);
    lines.push(`          <span style={{ fontWeight: 600 }}>{item[${y}]}</span>`);
    lines.push(`        </div>`);
    lines.push(`      ))}`);
    lines.push(`    </div>`);
    lines.push(`  </div>`);
  }

  lines.push(`</div>`);
  return lines.join('\n');
}

// ── Phase 2 Advanced: Stat Card ─────────────────────

function genStatUI(node: StatNode, c: GenContext): string {
  const value = genExpr(node.value, c);
  const change = node.change ? genExpr(node.change, c) : null;

  const lines: string[] = [];
  lines.push(`<div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', minWidth: '200px' }}>`);
  if (node.icon) {
    lines.push(`  <div style={{ fontSize: '24px', marginBottom: '8px' }}>${node.icon}</div>`);
  }
  lines.push(`  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>${node.label}</div>`);
  lines.push(`  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>{${value}}</div>`);
  if (change) {
    lines.push(`  <div style={{ fontSize: '13px', marginTop: '4px', color: String(${change}).startsWith('+') ? '#38a169' : '#e53e3e' }}>{${change}}</div>`);
  }
  lines.push(`</div>`);
  return lines.join('\n');
}

// ── Phase 2 Advanced: Realtime ──────────────────────

function genRealtimeDecl(node: RealtimeDecl, c: GenContext): string {
  c.imports.add('useState');
  c.imports.add('useEffect');
  c.imports.add('useRef');

  const channel = genExpr(node.channel, c);
  const lines: string[] = [];

  lines.push(`const [${node.name}, set${capitalize(node.name)}] = useState([]);`);
  lines.push(`const ${node.name}Ref = useRef(null);`);
  lines.push(`useEffect(() => {`);
  lines.push(`    const ws = new WebSocket(${channel});`);
  lines.push(`    ${node.name}Ref.current = ws;`);

  for (const handler of node.handlers) {
    if (handler.event === 'message') {
      lines.push(`    ws.onmessage = (event) => {`);
      lines.push(`      const ${handler.event} = JSON.parse(event.data);`);
      const body = handler.body.map(s => genStatement(s, c)).join('\n        ');
      lines.push(`      ${body}`);
      lines.push(`    };`);
    } else if (handler.event === 'error') {
      lines.push(`    ws.onerror = (event) => {`);
      const body = handler.body.map(s => genStatement(s, c)).join('\n        ');
      lines.push(`      ${body}`);
      lines.push(`    };`);
    } else if (handler.event === 'open') {
      lines.push(`    ws.onopen = () => {`);
      const body = handler.body.map(s => genStatement(s, c)).join('\n        ');
      lines.push(`      ${body}`);
      lines.push(`    };`);
    } else if (handler.event === 'close') {
      lines.push(`    ws.onclose = () => {`);
      const body = handler.body.map(s => genStatement(s, c)).join('\n        ');
      lines.push(`      ${body}`);
      lines.push(`    };`);
    }
  }

  lines.push(`    return () => { ws.close(); };`);
  lines.push(`  }, []);`);

  // Register as state
  c.states.set(node.name, {
    type: 'StateDecl', name: node.name,
    valueType: { kind: 'list', itemType: { kind: 'primitive', name: 'any' } },
    initial: { kind: 'array', elements: [] },
    loc: node.loc,
  });

  return lines.join('\n  ');
}

// ── Phase 2 Advanced: Route ─────────────────────────

function genRouteCode(node: RouteDecl): string {
  const lines: string[] = [];
  lines.push(`// Route: ${node.path} -> ${node.target}`);
  if (node.guard) {
    lines.push(`// Guard: ${node.guard}`);
    lines.push(`<Route path="${node.path}" element={<${capitalize(node.guard)}Guard><${node.target} /></${capitalize(node.guard)}Guard>} />`);
  } else {
    lines.push(`<Route path="${node.path}" element={<${node.target} />} />`);
  }
  return lines.join('\n');
}

// ── Phase 2 Advanced: Nav ───────────────────────────

function genNavUI(node: NavNode, c: GenContext): string {
  const lines: string[] = [];
  lines.push(`<nav style={{ display: 'flex', gap: '16px', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>`);

  for (const item of node.items) {
    const iconPart = item.icon ? `<span style={{ marginRight: '6px' }}>${item.icon}</span>` : '';
    lines.push(`  <a href="${item.href}" style={{ textDecoration: 'none', color: '#4a5568', fontWeight: 500, padding: '8px 12px', borderRadius: '6px', transition: 'background 0.2s' }}>${iconPart}${item.label}</a>`);
  }

  lines.push(`</nav>`);
  return lines.join('\n');
}

// ── Phase 2 Advanced: Upload ────────────────────────

function genUploadUI(node: UploadNode, c: GenContext): string {
  c.imports.add('useState');
  c.imports.add('useRef');
  c.imports.add('useCallback');

  const lines: string[] = [];
  const statePrefix = node.name;

  lines.push(`{(() => {`);
  lines.push(`  const [${statePrefix}File, set${capitalize(statePrefix)}File] = useState(null);`);
  lines.push(`  const [${statePrefix}Preview, set${capitalize(statePrefix)}Preview] = useState(null);`);
  lines.push(`  const [${statePrefix}Uploading, set${capitalize(statePrefix)}Uploading] = useState(false);`);
  lines.push(`  const ${statePrefix}Ref = useRef(null);`);
  lines.push(`  const handle${capitalize(statePrefix)}Change = (e) => {`);
  lines.push(`    const file = e.target.files[0];`);
  lines.push(`    if (!file) return;`);

  if (node.maxSize) {
    lines.push(`    if (file.size > ${node.maxSize} * 1024 * 1024) { alert('File too large (max ${node.maxSize}MB)'); return; }`);
  }

  lines.push(`    set${capitalize(statePrefix)}File(file);`);

  if (node.preview) {
    lines.push(`    const reader = new FileReader();`);
    lines.push(`    reader.onload = (ev) => set${capitalize(statePrefix)}Preview(ev.target.result);`);
    lines.push(`    reader.readAsDataURL(file);`);
  }

  lines.push(`  };`);

  if (node.action) {
    const action = genExpr(node.action, c);
    lines.push(`  const upload${capitalize(statePrefix)} = async () => {`);
    lines.push(`    if (!${statePrefix}File) return;`);
    lines.push(`    set${capitalize(statePrefix)}Uploading(true);`);
    lines.push(`    try {`);
    lines.push(`      const formData = new FormData();`);
    lines.push(`      formData.append('file', ${statePrefix}File);`);
    lines.push(`      await ${action};`);
    lines.push(`    } finally { set${capitalize(statePrefix)}Uploading(false); }`);
    lines.push(`  };`);
  }

  lines.push(`  return (`);
  lines.push(`    <div style={{ border: '2px dashed #cbd5e0', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer' }}`);
  lines.push(`      onClick={() => ${statePrefix}Ref.current?.click()}>`);
  lines.push(`      <input ref={${statePrefix}Ref} type="file"${node.accept ? ` accept="${node.accept}"` : ''} onChange={handle${capitalize(statePrefix)}Change} style={{ display: 'none' }} />`);

  if (node.preview) {
    lines.push(`      {${statePrefix}Preview ? <img src={${statePrefix}Preview} style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} /> : <span style={{ color: '#a0aec0' }}>Click to select file</span>}`);
  } else {
    lines.push(`      {${statePrefix}File ? <span>{${statePrefix}File.name}</span> : <span style={{ color: '#a0aec0' }}>Click to select file</span>}`);
  }

  if (node.action) {
    lines.push(`      {${statePrefix}File && <button onClick={upload${capitalize(statePrefix)}} disabled={${statePrefix}Uploading} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '6px', backgroundColor: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer' }}>{${statePrefix}Uploading ? 'Uploading...' : 'Upload'}</button>}`);
  }

  lines.push(`    </div>`);
  lines.push(`  );`);
  lines.push(`})()}`);

  return lines.join('\n');
}

// ── Phase 2 Advanced: Modal ─────────────────────────

function genModalUI(node: ModalNode, c: GenContext): string {
  c.imports.add('useState');

  const lines: string[] = [];
  const showVar = `show${capitalize(node.name)}`;

  lines.push(`{(() => {`);
  lines.push(`  const [${showVar}, set${capitalize(showVar)}] = useState(false);`);
  lines.push(`  return (`);
  lines.push(`    <>`);

  // Trigger button
  if (node.trigger) {
    lines.push(`      <button onClick={() => set${capitalize(showVar)}(true)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>${node.trigger}</button>`);
  }

  // Modal overlay
  lines.push(`      {${showVar} && (`);
  lines.push(`        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}`);
  lines.push(`          onClick={() => set${capitalize(showVar)}(false)}>`);
  lines.push(`          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', minWidth: '400px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}`);
  lines.push(`            onClick={e => e.stopPropagation()}>`);
  lines.push(`            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>`);
  lines.push(`              <h2 style={{ margin: 0, fontSize: '20px' }}>${node.title}</h2>`);
  lines.push(`              <button onClick={() => set${capitalize(showVar)}(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>&times;</button>`);
  lines.push(`            </div>`);

  // Modal body
  const bodyJsx = node.body.map(ch => genUINode(ch, c)).join('\n');
  lines.push(`            ${bodyJsx}`);

  lines.push(`          </div>`);
  lines.push(`        </div>`);
  lines.push(`      )}`);
  lines.push(`    </>`);
  lines.push(`  );`);
  lines.push(`})()}`);

  return lines.join('\n');
}

// ── Phase 2 Advanced: Toast ─────────────────────────

function genToastUI(node: ToastNode, c: GenContext): string {
  const message = genExpr(node.message, c);
  const colorMap: Record<string, string> = {
    success: '#38a169', error: '#e53e3e', warning: '#d69e2e', info: '#3182ce',
  };
  const bg = colorMap[node.toastType] || colorMap.info;
  const duration = node.duration || 3000;

  return `<div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '${bg}', color: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, animation: 'fadeIn 0.3s' }}>{${message}}</div>`;
}

// ── Phase 3: Top-level generators ───────────────────

function genRoleCode(node: RoleDecl): string {
  const lines: string[] = [
    `// Generated by 0x — Roles & Permissions`,
    '',
    `const ROLES = {`,
  ];
  for (const role of node.roles) {
    const inherits = role.inherits.length > 0 ? `, inherits: [${role.inherits.map(r => `'${r}'`).join(', ')}]` : '';
    lines.push(`  ${role.name}: { can: [${role.can.map(c => `'${c}'`).join(', ')}]${inherits} },`);
  }
  lines.push(`};`);
  lines.push('');
  lines.push(`function resolvePermissions(roleName) {`);
  lines.push(`  const role = ROLES[roleName];`);
  lines.push(`  if (!role) return [];`);
  lines.push(`  const perms = new Set(role.can || []);`);
  lines.push(`  for (const parent of (role.inherits || [])) {`);
  lines.push(`    for (const p of resolvePermissions(parent)) perms.add(p);`);
  lines.push(`  }`);
  lines.push(`  return [...perms];`);
  lines.push(`}`);
  lines.push('');
  lines.push(`function hasPermission(userRole, action) {`);
  lines.push(`  return resolvePermissions(userRole).includes(action);`);
  lines.push(`}`);
  return lines.join('\n');
}

function genAutomationCode(node: AutomationNode): string {
  const lines: string[] = [
    `// Generated by 0x — Automation`,
    '',
  ];
  for (const trigger of node.triggers) {
    const actions = trigger.actions.map(a => genExprStandalone(a)).join('; ');
    lines.push(`document.addEventListener('${trigger.event}', async () => { ${actions}; });`);
  }
  for (const schedule of node.schedules) {
    const actions = schedule.actions.map(a => genExprStandalone(a)).join('; ');
    lines.push(`// cron('${schedule.cron}', async () => { ${actions}; });`);
  }
  return lines.join('\n');
}

function genDevCode(node: DevNode): string {
  const c = ctx();
  const lines: string[] = [
    `// Generated by 0x — Dev Tools`,
    '',
  ];
  if (node.props['mock']) {
    lines.push(`const USE_MOCK = process.env.NODE_ENV === 'development';`);
  }
  if (node.props['seed']) {
    const seed = genExpr(node.props['seed'], c);
    lines.push(`// Seed data: ${seed}`);
  }
  return lines.join('\n');
}

// ── Phase 3: UI generators ──────────────────────────

function genHeroUI(node: HeroNode, c: GenContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<section style={{ textAlign: 'center', padding: '80px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>\n  ${body}\n</section>`;
}

function genCrudUI(node: CrudNode, c: GenContext): string {
  return `<div className="crud-${node.model.toLowerCase()}">\n  {/* CRUD: ${node.model} - auto-generated list + create + edit + delete */}\n  <h2>${node.model} Management</h2>\n</div>`;
}

function genListUI(node: ListNode, c: GenContext): string {
  const data = genExpr(node.dataSource, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  if (node.listType === 'grid') {
    return `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>\n  {${data}.map((item, i) => (\n    <div key={i}>\n      ${body}\n    </div>\n  ))}\n</div>`;
  }
  return `<div className="list-${node.listType}">\n  {${data}.map((item, i) => (\n    <div key={i}>${body}</div>\n  ))}\n</div>`;
}

function genDrawerUI(node: DrawerNode, c: GenContext): string {
  c.imports.add('useState');
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  return `{(() => {\n  const [open, setOpen] = useState(false);\n  return (\n    <>\n      <button onClick={() => setOpen(true)}>Menu</button>\n      {open && <div style={{ position: 'fixed', top: 0, left: 0, width: '300px', height: '100vh', backgroundColor: '#fff', boxShadow: '2px 0 8px rgba(0,0,0,0.1)', zIndex: 1000, padding: '20px' }}>\n        <button onClick={() => setOpen(false)} style={{ float: 'right' }}>&times;</button>\n        ${body}\n      </div>}\n    </>\n  );\n})()}`;
}

function genCommandUI(node: CommandNode, c: GenContext): string {
  return `{/* Command Palette: ${node.shortcut} */}`;
}

function genConfirmUI(node: ConfirmNode, c: GenContext): string {
  const danger = node.danger ? ", color: '#e53e3e'" : '';
  return `<div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>\n  <p style={{ fontWeight: 600${danger} }}>${node.message}</p>\n  ${node.description ? `<p style={{ color: '#718096' }}>${node.description}</p>` : ''}\n  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>\n    <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>${node.cancelLabel}</button>\n    <button style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '${node.danger ? '#e53e3e' : '#3182ce'}', color: '#fff', border: 'none' }}>${node.confirmLabel}</button>\n  </div>\n</div>`;
}

function genPayUI(node: PayNode, c: GenContext): string {
  return `<div className="pay-${node.payType}" style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>\n  {/* Payment: ${node.provider} ${node.payType} */}\n  <button style={{ padding: '12px 24px', backgroundColor: '#635bff', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '16px', cursor: 'pointer' }}>Pay</button>\n</div>`;
}

function genCartUI(node: CartNode, c: GenContext): string {
  return `<div className="cart" style={{ padding: '20px' }}>\n  {/* Shopping Cart */}\n  <h3>Cart</h3>\n</div>`;
}

function genMediaUI(node: MediaNode, c: GenContext): string {
  const src = genExpr(node.src, c);
  if (node.mediaType === 'gallery') {
    const cols = node.props['cols'] ? genExpr(node.props['cols'], c) : '3';
    return `<div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${${cols}}, 1fr)\`, gap: '8px' }}>\n  {${src}.map((img, i) => <img key={i} src={img} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />)}\n</div>`;
  }
  if (node.mediaType === 'video') {
    return `<video src={${src}} controls style={{ width: '100%', borderRadius: '12px' }} />`;
  }
  return `<div className="media-${node.mediaType}">{/* Media: ${node.mediaType} */}</div>`;
}

function genNotificationUI(node: NotificationNode, c: GenContext): string {
  return `<div className="notifications">{/* Notification: ${node.notifType} */}</div>`;
}

function genSearchUI(node: SearchNode, c: GenContext): string {
  c.imports.add('useState');
  return `{(() => {\n  const [query, setQuery] = useState('');\n  return (\n    <div style={{ position: 'relative' }}>\n      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />\n    </div>\n  );\n})()}`;
}

function genFilterUI(node: FilterNode, c: GenContext): string {
  return `<div className="filter-panel">{/* Filter: ${node.target} */}</div>`;
}

function genSocialUI(node: SocialNode, c: GenContext): string {
  const target = genExpr(node.target, c);
  if (node.socialType === 'like') {
    return `<button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>❤️ Like</button>`;
  }
  return `<div className="social-${node.socialType}">{/* Social: ${node.socialType} */}</div>`;
}

function genProfileUI(node: ProfileNode, c: GenContext): string {
  const user = genExpr(node.user, c);
  return `<div style={{ textAlign: 'center', padding: '24px' }}>\n  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', margin: '0 auto 12px' }} />\n  <h2>{${user}.name}</h2>\n</div>`;
}

function genFeaturesUI(node: FeaturesNode, c: GenContext): string {
  return `<section style={{ padding: '60px 20px' }}>\n  <h2 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '40px' }}>Features</h2>\n  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>\n    {/* Features items */}\n  </div>\n</section>`;
}

function genPricingUI(node: PricingNode, c: GenContext): string {
  return `<section style={{ padding: '60px 20px' }}>\n  <h2 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '40px' }}>Pricing</h2>\n  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>\n    {/* Pricing plans */}\n  </div>\n</section>`;
}

function genFaqUI(node: FaqNode, c: GenContext): string {
  return `<section style={{ padding: '60px 20px', maxWidth: '700px', margin: '0 auto' }}>\n  <h2 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '40px' }}>FAQ</h2>\n  {/* FAQ items */}\n</section>`;
}

function genTestimonialUI(node: TestimonialNode, c: GenContext): string {
  return `<section style={{ padding: '60px 20px' }}>\n  <h2 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '40px' }}>Testimonials</h2>\n  {/* Testimonial items */}\n</section>`;
}

function genFooterUI(node: FooterNode, c: GenContext): string {
  return `<footer style={{ padding: '40px 20px', backgroundColor: '#1a202c', color: '#a0aec0' }}>\n  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>\n    {/* Footer columns */}\n  </div>\n</footer>`;
}

function genAdminUI(node: AdminNode, c: GenContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  return `<div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>\n  <aside style={{ backgroundColor: '#1a202c', color: '#fff', padding: '20px' }}>\n    <h3>Admin</h3>\n  </aside>\n  <main style={{ padding: '24px' }}>\n    ${body}\n  </main>\n</div>`;
}

function genSeoUI(node: SeoNode, c: GenContext): string {
  const title = node.props['title'] ? genExpr(node.props['title'], c) : "''";
  const desc = node.props['description'] ? genExpr(node.props['description'], c) : "''";
  return `{/* SEO: title=${title}, description=${desc} */}`;
}

function genAnimateUI(node: AnimateNode, c: GenContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  return `<div className="animate-${node.animType}" style={{ animation: '${node.animType === 'enter' ? 'fadeIn 0.3s ease-in' : 'fadeOut 0.3s ease-out'}' }}>\n  ${body}\n</div>`;
}

function genGestureUI(node: GestureNode, c: GenContext): string {
  return `{/* Gesture: ${node.gestureType} */}`;
}

function genAiUI(node: AiNode, c: GenContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  if (node.aiType === 'chat') {
    return `<div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>\n  <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>\n    ${body}\n  </div>\n  <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>\n    <input placeholder="Type a message..." style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />\n    <button style={{ padding: '8px 16px', backgroundColor: '#3182ce', color: '#fff', borderRadius: '8px', border: 'none' }}>Send</button>\n  </div>\n</div>`;
  }
  return `<div className="ai-${node.aiType}">{/* AI: ${node.aiType} */}\n  ${body}\n</div>`;
}

function genResponsiveUI(node: ResponsiveNode, c: GenContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n');
  const display = node.action === 'show' ? 'block' : 'none';
  const mediaQuery = node.breakpoint === 'mobile' ? '768' : node.breakpoint === 'tablet' ? '1024' : '1200';
  return `<div className="${node.breakpoint}-${node.action}" data-breakpoint="${node.breakpoint}">\n  ${body}\n</div>`;
}

function genBreadcrumbUI(node: BreadcrumbNode, c: GenContext): string {
  return `<nav style={{ display: 'flex', gap: '8px', fontSize: '14px', color: '#718096', padding: '8px 0' }}>\n  <a href="/" style={{ color: '#3182ce' }}>Home</a>\n  <span>/</span>\n  <span>Current page</span>\n</nav>`;
}

function genStatsGridUI(node: StatsGridNode, c: GenContext): string {
  const stats = node.stats.map(s => genStatUI(s, c)).join('\n');
  return `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(${node.cols}, 1fr)', gap: '16px' }}>\n  ${stats}\n</div>`;
}

// ── Phase 4: Infrastructure code generators ─────────

function genDeployCode(node: DeployNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Deploy: ${node.provider}`, ''];
  if (node.provider === 'vercel') {
    lines.push(`// vercel.json`);
    lines.push(`const vercelConfig = {`);
    for (const [k, v] of Object.entries(node.props)) {
      lines.push(`  ${k}: ${genExpr(v, c)},`);
    }
    lines.push(`};`);
    lines.push(`// Run: npx vercel deploy`);
  } else if (node.provider === 'docker') {
    lines.push(`// Dockerfile generated — see docker.config.js`);
  } else if (node.provider === 'netlify') {
    lines.push(`// netlify.toml`);
    lines.push(`const netlifyConfig = {`);
    lines.push(`  build: { command: 'npm run build', publish: 'dist' },`);
    for (const [k, v] of Object.entries(node.props)) {
      lines.push(`  ${k}: ${genExpr(v, c)},`);
    }
    lines.push(`};`);
  } else {
    lines.push(`const deployConfig = {`);
    lines.push(`  provider: '${node.provider}',`);
    for (const [k, v] of Object.entries(node.props)) {
      lines.push(`  ${k}: ${genExpr(v, c)},`);
    }
    lines.push(`};`);
  }
  return lines.join('\n');
}

function genEnvCode(node: EnvNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Environment: ${node.envType}`, ''];
  lines.push(`const ENV = {`);
  for (const v of node.vars) {
    if (v.secret) {
      lines.push(`  // [SECRET] ${v.name}`);
      lines.push(`  ${v.name}: process.env.${v.name.toUpperCase()},`);
    } else {
      lines.push(`  ${v.name}: ${genExpr(v.value, c)},`);
    }
  }
  lines.push(`};`);
  lines.push('');
  lines.push(`function getEnv(key) {`);
  lines.push(`  const value = ENV[key] ?? process.env[key];`);
  lines.push(`  if (value === undefined) throw new Error(\`Missing env: \${key}\`);`);
  lines.push(`  return value;`);
  lines.push(`}`);
  return lines.join('\n');
}

function genDockerCode(node: DockerNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Docker`, ''];
  lines.push(`// Dockerfile`);
  lines.push(`const dockerfile = \``);
  lines.push(`FROM ${node.baseImage}`);
  lines.push(`WORKDIR /app`);
  lines.push(`COPY package*.json ./`);
  lines.push(`RUN npm ci --production`);
  lines.push(`COPY . .`);
  lines.push(`RUN npm run build`);
  const port = node.props['port'] ? genExpr(node.props['port'], c) : '3000';
  lines.push(`EXPOSE ${port}`);
  lines.push(`CMD ["npm", "start"]`);
  lines.push(`\`;`);
  return lines.join('\n');
}

function genCiCode(node: CiNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — CI/CD: ${node.provider}`, ''];
  if (node.provider === 'github') {
    lines.push(`// .github/workflows/ci.yml`);
    lines.push(`const ciConfig = {`);
    lines.push(`  name: 'CI',`);
    lines.push(`  on: { ${node.triggers.map(t => `${t}: { branches: ['main'] }`).join(', ')} },`);
    lines.push(`  jobs: {`);
    lines.push(`    build: {`);
    lines.push(`      'runs-on': 'ubuntu-latest',`);
    lines.push(`      steps: [`);
    lines.push(`        { uses: 'actions/checkout@v4' },`);
    lines.push(`        { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },`);
    lines.push(`        { run: 'npm ci' },`);
    for (const step of node.steps) {
      lines.push(`        { name: '${step.name}', run: ${genExpr(step.command, c)} },`);
    }
    lines.push(`      ],`);
    lines.push(`    },`);
    lines.push(`  },`);
    lines.push(`};`);
  }
  return lines.join('\n');
}

function genDomainCode(node: DomainNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Domain: ${node.domain}`, ''];
  lines.push(`const domainConfig = {`);
  lines.push(`  domain: '${node.domain}',`);
  lines.push(`  ssl: true,`);
  for (const [k, v] of Object.entries(node.props)) {
    lines.push(`  ${k}: ${genExpr(v, c)},`);
  }
  lines.push(`};`);
  return lines.join('\n');
}

function genCdnCode(node: CdnNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — CDN: ${node.provider}`, ''];
  lines.push(`const cdnConfig = {`);
  lines.push(`  provider: '${node.provider}',`);
  for (const [k, v] of Object.entries(node.props)) {
    lines.push(`  ${k}: ${genExpr(v, c)},`);
  }
  lines.push(`};`);
  return lines.join('\n');
}

function genMonitorCode(node: MonitorNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Monitoring: ${node.provider}`, ''];
  if (node.provider === 'sentry') {
    const dsn = node.props['dsn'] ? genExpr(node.props['dsn'], c) : "process.env.SENTRY_DSN";
    lines.push(`import * as Sentry from '@sentry/react';`);
    lines.push('');
    lines.push(`Sentry.init({`);
    lines.push(`  dsn: ${dsn},`);
    lines.push(`  environment: process.env.NODE_ENV,`);
    lines.push(`  tracesSampleRate: 1.0,`);
    lines.push(`});`);
    lines.push('');
    lines.push(`export const ErrorBoundary = Sentry.ErrorBoundary;`);
  } else {
    lines.push(`const monitorConfig = {`);
    lines.push(`  provider: '${node.provider}',`);
    for (const [k, v] of Object.entries(node.props)) {
      lines.push(`  ${k}: ${genExpr(v, c)},`);
    }
    lines.push(`};`);
  }
  return lines.join('\n');
}

function genBackupCode(node: BackupNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Backup: ${node.strategy}`, ''];
  lines.push(`const backupConfig = {`);
  lines.push(`  strategy: '${node.strategy}',`);
  for (const [k, v] of Object.entries(node.props)) {
    lines.push(`  ${k}: ${genExpr(v, c)},`);
  }
  lines.push(`};`);
  return lines.join('\n');
}

// ── Phase 4: Backend code generators ────────────────

function genEndpointCode(node: EndpointNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Endpoint: ${node.method} ${node.path}`, ''];
  lines.push(`export async function handle${node.method}${node.path.replace(/[^a-zA-Z]/g, '_')}(req, res) {`);
  if (node.middleware.length > 0) {
    lines.push(`  // Middleware: ${node.middleware.join(', ')}`);
  }
  lines.push(`  try {`);
  for (const stmt of node.handler) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`  } catch (error) {`);
  lines.push(`    res.status(500).json({ error: error.message });`);
  lines.push(`  }`);
  lines.push(`}`);
  return lines.join('\n');
}

function genMiddlewareCode(node: MiddlewareNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Middleware: ${node.name}`, ''];
  lines.push(`export function ${node.name}(req, res, next) {`);
  lines.push(`  try {`);
  for (const stmt of node.handler) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`    next();`);
  lines.push(`  } catch (error) {`);
  lines.push(`    res.status(403).json({ error: error.message });`);
  lines.push(`  }`);
  lines.push(`}`);
  return lines.join('\n');
}

function genQueueCode(node: QueueNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Queue: ${node.name}`, ''];
  lines.push(`const ${node.name}Queue = {`);
  lines.push(`  name: '${node.name}',`);
  lines.push(`  process: async (job) => {`);
  for (const stmt of node.handler) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`  },`);
  lines.push(`  add: async (data, opts = {}) => {`);
  lines.push(`    console.log('[Queue:${node.name}] Job added:', data);`);
  lines.push(`    return ${node.name}Queue.process({ data });`);
  lines.push(`  },`);
  lines.push(`};`);
  return lines.join('\n');
}

function genCronCode(node: CronNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Cron: ${node.name} (${node.schedule})`, ''];
  lines.push(`// Schedule: ${node.schedule}`);
  lines.push(`async function ${node.name}Job() {`);
  for (const stmt of node.handler) {
    lines.push(`  ${genStatement(stmt, c)}`);
  }
  lines.push(`}`);
  lines.push('');
  lines.push(`// Register: cron('${node.schedule}', ${node.name}Job);`);
  return lines.join('\n');
}

function genCacheCode(node: CacheNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Cache: ${node.name} (${node.strategy})`, ''];
  const ttl = node.ttl ? genExpr(node.ttl, c) : '300';
  if (node.strategy === 'memory') {
    lines.push(`const ${node.name}Cache = new Map();`);
    lines.push(`const ${node.name}Timestamps = new Map();`);
    lines.push('');
    lines.push(`function ${node.name}Get(key) {`);
    lines.push(`  const ts = ${node.name}Timestamps.get(key);`);
    lines.push(`  if (ts && Date.now() - ts > ${ttl} * 1000) {`);
    lines.push(`    ${node.name}Cache.delete(key);`);
    lines.push(`    ${node.name}Timestamps.delete(key);`);
    lines.push(`    return null;`);
    lines.push(`  }`);
    lines.push(`  return ${node.name}Cache.get(key) ?? null;`);
    lines.push(`}`);
    lines.push('');
    lines.push(`function ${node.name}Set(key, value) {`);
    lines.push(`  ${node.name}Cache.set(key, value);`);
    lines.push(`  ${node.name}Timestamps.set(key, Date.now());`);
    lines.push(`}`);
  } else {
    lines.push(`const ${node.name}Config = {`);
    lines.push(`  strategy: '${node.strategy}',`);
    lines.push(`  ttl: ${ttl},`);
    for (const [k, v] of Object.entries(node.props)) {
      if (k !== 'ttl') lines.push(`  ${k}: ${genExpr(v, c)},`);
    }
    lines.push(`};`);
  }
  return lines.join('\n');
}

function genMigrateCode(node: MigrateNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Migration: ${node.name}`, ''];
  lines.push(`export const migration_${node.name} = {`);
  lines.push(`  name: '${node.name}',`);
  lines.push(`  async up(db) {`);
  for (const stmt of node.up) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`  },`);
  lines.push(`  async down(db) {`);
  for (const stmt of node.down) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`  },`);
  lines.push(`};`);
  return lines.join('\n');
}

function genSeedCode(node: SeedNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Seed: ${node.model}`, ''];
  const data = genExpr(node.data, c);
  const count = node.count ? genExpr(node.count, c) : null;
  lines.push(`export async function seed${capitalize(node.model)}(db) {`);
  if (count) {
    lines.push(`  const seedData = Array.from({ length: ${count} }, (_, i) => ({`);
    lines.push(`    ...${data},`);
    lines.push(`    id: i + 1,`);
    lines.push(`  }));`);
  } else {
    lines.push(`  const seedData = ${data};`);
  }
  lines.push(`  for (const item of ${count ? 'seedData' : `Array.isArray(${data}) ? ${data} : [${data}]`}) {`);
  lines.push(`    await db.${node.model.toLowerCase()}.create(item);`);
  lines.push(`  }`);
  lines.push(`  console.log('Seeded ${node.model}:', ${count ? 'seedData.length' : '1'});`);
  lines.push(`}`);
  return lines.join('\n');
}

function genWebhookCode(node: WebhookNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Webhook: ${node.name} (${node.path})`, ''];
  lines.push(`export async function webhook_${node.name}(req, res) {`);
  lines.push(`  const payload = req.body;`);
  lines.push(`  try {`);
  for (const stmt of node.handler) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`    res.status(200).json({ ok: true });`);
  lines.push(`  } catch (error) {`);
  lines.push(`    console.error('[Webhook:${node.name}]', error);`);
  lines.push(`    res.status(500).json({ error: error.message });`);
  lines.push(`  }`);
  lines.push(`}`);
  return lines.join('\n');
}

function genStorageCode(node: StorageNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Storage: ${node.name} (${node.provider})`, ''];
  const bucket = node.props['bucket'] ? genExpr(node.props['bucket'], c) : `'${node.name}'`;
  if (node.provider === 's3') {
    lines.push(`import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';`);
    lines.push('');
    lines.push(`const ${node.name}Client = new S3Client({`);
    lines.push(`  region: process.env.AWS_REGION || 'us-east-1',`);
    lines.push(`});`);
    lines.push(`const ${node.name}Bucket = ${bucket};`);
  } else {
    lines.push(`const ${node.name}Config = {`);
    lines.push(`  provider: '${node.provider}',`);
    lines.push(`  bucket: ${bucket},`);
    for (const [k, v] of Object.entries(node.props)) {
      if (k !== 'bucket') lines.push(`  ${k}: ${genExpr(v, c)},`);
    }
    lines.push(`};`);
  }
  lines.push('');
  lines.push(`const ${node.name} = {`);
  lines.push(`  async upload(key, data, contentType) {`);
  lines.push(`    console.log('[Storage:${node.name}] upload:', key);`);
  lines.push(`    // Implement based on provider`);
  lines.push(`  },`);
  lines.push(`  async download(key) {`);
  lines.push(`    console.log('[Storage:${node.name}] download:', key);`);
  lines.push(`  },`);
  lines.push(`  async remove(key) {`);
  lines.push(`    console.log('[Storage:${node.name}] delete:', key);`);
  lines.push(`  },`);
  lines.push(`  getUrl(key) {`);
  lines.push(`    return \`/storage/${node.name}/\${key}\`;`);
  lines.push(`  },`);
  lines.push(`};`);
  return lines.join('\n');
}

// ── Phase 4: Testing code generators ────────────────

function genTestCode(node: TestNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Test: ${node.name} (${node.testType})`, ''];
  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push('');
  lines.push(`describe('${node.name}', () => {`);
  lines.push(`  it('should pass', async () => {`);
  for (const stmt of node.body) {
    lines.push(`    ${genStatement(stmt, c)}`);
  }
  lines.push(`  });`);
  lines.push(`});`);
  return lines.join('\n');
}

function genE2eCode(node: E2eNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — E2E Test: ${node.name}`, ''];
  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push('');
  lines.push(`test('${node.name}', async ({ page }) => {`);
  for (const step of node.steps) {
    const target = genExpr(step.target, c);
    const value = step.value ? genExpr(step.value, c) : null;
    switch (step.action) {
      case 'visit':
      case 'goto':
        lines.push(`  await page.goto(${target});`);
        break;
      case 'click':
        lines.push(`  await page.click(${target});`);
        break;
      case 'fill':
      case 'type':
        lines.push(`  await page.fill(${target}, ${value || "''"});`);
        break;
      case 'see':
      case 'expect':
        lines.push(`  await expect(page.locator(${target})).toBeVisible();`);
        break;
      case 'wait':
        lines.push(`  await page.waitForSelector(${target});`);
        break;
      default:
        lines.push(`  // ${step.action}: ${target}`);
    }
  }
  lines.push(`});`);
  return lines.join('\n');
}

function genMockCode(node: MockNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Mock: ${node.target}`, ''];
  lines.push(`const ${node.target}Mock = {`);
  for (const resp of node.responses) {
    const response = genExpr(resp.response, c);
    lines.push(`  '${resp.method} ${resp.path}': ${response},`);
  }
  lines.push(`};`);
  lines.push('');
  lines.push(`function mock${capitalize(node.target)}(method, path) {`);
  lines.push(`  const key = \`\${method} \${path}\`;`);
  lines.push(`  return ${node.target}Mock[key] ?? { status: 404, body: { error: 'Not found' } };`);
  lines.push(`}`);
  return lines.join('\n');
}

function genFixtureCode(node: FixtureNode): string {
  const c = ctx();
  const data = genExpr(node.data, c);
  const lines = [`// Generated by 0x — Fixture: ${node.name}`, ''];
  lines.push(`export const ${node.name}Fixture = ${data};`);
  return lines.join('\n');
}

// ── Phase 4: Error/Loading UI generators ────────────

function genErrorUI(node: ErrorNode, c: GenContext): string {
  const fallback = node.fallback.map(ch => genUINode(ch, c)).join('\n    ');
  if (node.errorType === 'boundary') {
    return `<ErrorBoundary fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#e53e3e' }}>\n    ${fallback || '<p>An error occurred</p>'}\n  </div>}>\n  {children}\n</ErrorBoundary>`;
  }
  return `{/* Error handler: ${node.errorType} */}`;
}

function genLoadingUI(node: LoadingNode, c: GenContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  if (node.loadingType === 'skeleton') {
    return `<div style={{ animation: 'pulse 1.5s infinite', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>\n  ${body || '<div style={{ height: "20px", marginBottom: "8px" }} /><div style={{ height: "20px", width: "60%" }} />'}\n</div>`;
  }
  if (node.loadingType === 'spinner') {
    return `<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>\n  <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTop: '3px solid #3182ce', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />\n</div>`;
  }
  if (node.loadingType === 'shimmer') {
    return `<div style={{ background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '8px', height: '100px' }} />`;
  }
  return `<div style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>Loading...</div>`;
}

function genOfflineUI(node: OfflineNode, c: GenContext): string {
  const fallback = node.fallback.map(ch => genUINode(ch, c)).join('\n    ');
  c.imports.add('useState');
  c.imports.add('useEffect');
  return `{(() => {\n  const [online, setOnline] = useState(navigator.onLine);\n  useEffect(() => {\n    const on = () => setOnline(true);\n    const off = () => setOnline(false);\n    window.addEventListener('online', on);\n    window.addEventListener('offline', off);\n    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };\n  }, []);\n  if (!online) return (\n    <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fefcbf', borderRadius: '8px' }}>\n      <p style={{ fontWeight: 600 }}>You are offline</p>\n      ${fallback || "<p style={{ color: '#718096' }}>Please check your internet connection</p>"}\n    </div>\n  );\n  return null;\n})()}`;
}

// ── Phase 4: i18n code generators ───────────────────

function genI18nCode(node: I18nNode): string {
  const lines = [`// Generated by 0x — i18n`, ''];
  lines.push(`const translations = {`);
  for (const t of node.translations) {
    lines.push(`  '${t.locale}': {`);
    for (const e of t.entries) {
      lines.push(`    '${e.key}': '${e.value}',`);
    }
    lines.push(`  },`);
  }
  lines.push(`};`);
  lines.push('');
  lines.push(`let currentLocale = '${node.defaultLocale}';`);
  lines.push('');
  lines.push(`function t(key) {`);
  lines.push(`  return translations[currentLocale]?.[key] ?? translations['${node.defaultLocale}']?.[key] ?? key;`);
  lines.push(`}`);
  lines.push('');
  lines.push(`function setLocale(locale) {`);
  lines.push(`  if ([${node.locales.map(l => `'${l}'`).join(', ')}].includes(locale)) {`);
  lines.push(`    currentLocale = locale;`);
  lines.push(`    document.documentElement.lang = locale;`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');
  lines.push(`import React, { createContext, useContext, useState } from 'react';`);
  lines.push('');
  lines.push(`const I18nContext = createContext({ locale: '${node.defaultLocale}', t, setLocale });`);
  lines.push('');
  lines.push(`export function I18nProvider({ children }) {`);
  lines.push(`  const [locale, _setLocale] = useState('${node.defaultLocale}');`);
  lines.push(`  const changeLocale = (l) => { _setLocale(l); setLocale(l); };`);
  lines.push(`  return <I18nContext.Provider value={{ locale, t, setLocale: changeLocale }}>{children}</I18nContext.Provider>;`);
  lines.push(`}`);
  lines.push('');
  lines.push(`export function useI18n() { return useContext(I18nContext); }`);
  return lines.join('\n');
}

function genLocaleCode(node: LocaleNode): string {
  const c = ctx();
  const lines = [`// Generated by 0x — Locale`, ''];
  const dateFormat = node.props['date'] ? genExpr(node.props['date'], c) : "'ko-KR'";
  const numberFormat = node.props['number'] ? genExpr(node.props['number'], c) : "'ko-KR'";
  const currency = node.props['currency'] ? genExpr(node.props['currency'], c) : "'KRW'";
  lines.push(`const formatters = {`);
  lines.push(`  date: (d) => new Intl.DateTimeFormat(${dateFormat}).format(new Date(d)),`);
  lines.push(`  number: (n) => new Intl.NumberFormat(${numberFormat}).format(n),`);
  lines.push(`  currency: (n) => new Intl.NumberFormat(${numberFormat}, { style: 'currency', currency: ${currency} }).format(n),`);
  lines.push(`  relative: (d) => {`);
  lines.push(`    const rtf = new Intl.RelativeTimeFormat(${dateFormat}, { numeric: 'auto' });`);
  lines.push(`    const diff = (new Date(d).getTime() - Date.now()) / 1000;`);
  lines.push(`    if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');`);
  lines.push(`    if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');`);
  lines.push(`    if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');`);
  lines.push(`    return rtf.format(Math.round(diff / 86400), 'day');`);
  lines.push(`  },`);
  lines.push(`};`);
  return lines.join('\n');
}

function genRtlCode(node: RtlNode): string {
  const lines = [`// Generated by 0x — RTL Support`, ''];
  if (node.enabled) {
    lines.push(`document.documentElement.dir = 'rtl';`);
    lines.push(`document.documentElement.style.direction = 'rtl';`);
  }
  lines.push('');
  lines.push(`function setDirection(dir) {`);
  lines.push(`  document.documentElement.dir = dir;`);
  lines.push(`  document.documentElement.style.direction = dir;`);
  lines.push(`}`);
  return lines.join('\n');
}

// ── Helpers ─────────────────────────────────────────

function extractStateName(expr: Expression): string | null {
  if (expr.kind === 'identifier') return expr.name;
  if (expr.kind === 'member') return extractStateName(expr.object);
  return null;
}

function extractDeps(expr: Expression, c: GenContext): string[] {
  const deps = new Set<string>();
  walkExpr(expr, e => {
    if (e.kind === 'identifier' && (c.states.has(e.name) || c.derivedNames.has(e.name))) {
      deps.add(e.name);
    }
  });
  return Array.from(deps);
}

function walkExpr(expr: Expression, fn: (e: Expression) => void): void {
  fn(expr);
  switch (expr.kind) {
    case 'binary': walkExpr(expr.left, fn); walkExpr(expr.right, fn); break;
    case 'unary': walkExpr(expr.operand, fn); break;
    case 'call':
      walkExpr(expr.callee, fn);
      expr.args.forEach(a => walkExpr(a, fn));
      break;
    case 'member': walkExpr(expr.object, fn); break;
    case 'index': walkExpr(expr.object, fn); walkExpr(expr.index, fn); break;
    case 'ternary': walkExpr(expr.condition, fn); walkExpr(expr.consequent, fn); walkExpr(expr.alternate, fn); break;
    case 'array': expr.elements.forEach(e => walkExpr(e, fn)); break;
    case 'object_expr': expr.properties.forEach(p => walkExpr(p.value, fn)); break;
    case 'arrow':
      if (!Array.isArray(expr.body)) walkExpr(expr.body as Expression, fn);
      break;
    case 'template':
      expr.parts.forEach(p => { if (typeof p !== 'string') walkExpr(p, fn); });
      break;
    case 'assignment': walkExpr(expr.target, fn); walkExpr(expr.value, fn); break;
    case 'await': walkExpr(expr.expression, fn); break;
  }
}


function genStyleObj(style: Record<string, string>): string {
  if (Object.keys(style).length === 0) return '{}';
  const entries = Object.entries(style).map(([k, v]) => {
    // If value contains template literal, don't quote
    if (v.startsWith('${') || v.startsWith('`')) return `${k}: ${v}`;
    // If value is a number-like
    if (/^\d+$/.test(v)) return `${k}: ${v}`;
    return `${k}: '${v}'`;
  });
  return `{ ${entries.join(', ')} }`;
}

function cssPropToJs(prop: string): string {
  const map: Record<string, string> = {
    'padding': 'padding',
    'margin': 'margin',
    'radius': 'borderRadius',
    'shadow': 'boxShadow',
    'bg': 'backgroundColor',
    'color': 'color',
  };
  return map[prop] || prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function formatStyleValue(prop: string, val: string): string {
  if (['padding', 'margin', 'radius', 'gap'].includes(prop)) {
    return `${val}px`;
  }
  if (prop === 'shadow') {
    if (val === 'sm') return '0 1px 2px rgba(0,0,0,0.1)';
    if (val === 'md') return '0 4px 6px rgba(0,0,0,0.1)';
    if (val === 'lg') return '0 10px 15px rgba(0,0,0,0.1)';
  }
  return val;
}

function quoteJsx(v: string): string {
  // If the value is already a quoted string literal like 'xxx', extract it and use double quotes
  if (v.startsWith("'") && v.endsWith("'")) {
    const inner = v.slice(1, -1);
    return `"${inner}"`;
  }
  if (v.startsWith('"') || v.startsWith('`') || v.startsWith('{')) {
    return `{${v}}`;
  }
  return `"${v}"`;
}
