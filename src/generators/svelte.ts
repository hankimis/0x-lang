// 0x → Svelte 5 Code Generator

import { SourceMapBuilder } from './source-map.js';
import type {
  ASTNode, PageNode, ComponentNode, AppNode,
  StateDecl, DerivedDecl, PropDecl, TypeDecl, FnDecl,
  OnMount, OnDestroy, WatchBlock, CheckDecl, ApiDecl, StoreDecl,
  DataDecl, FormDecl, RealtimeDecl, AuthDecl, RouteDecl, ModelNode,
  LayoutNode, TextNode, ButtonNode, InputNode, ImageNode, LinkNode,
  ToggleNode, SelectNode, IfBlock, ForBlock, ShowBlock, HideBlock,
  StyleDecl, ComponentCall, CommentNode,
  TableNode, ChartNode, StatNode, NavNode, UploadNode, ModalNode, ToastNode,
  HeroNode, CrudNode, ListNode, DrawerNode, CommandNode, ConfirmNode,
  PayNode, CartNode, MediaNode, NotificationNode, SearchNode, FilterNode,
  SocialNode, ProfileNode, FeaturesNode, PricingNode, FaqNode,
  TestimonialNode, FooterNode, AdminNode, SeoNode, AnimateNode,
  GestureNode, AiNode, EmitNode, ResponsiveNode, BreadcrumbNode, StatsGridNode, ProgressNode,
  LayoutShellNode, SlideOverNode,
  ErrorNode, LoadingNode, OfflineNode, RetryNode, LogNode,
  Expression, Statement, UINode, GeneratedCode,
} from '../ast.js';

import { SIZE_MAP, unquote, capitalize, parseGradient, addPx, getPassthroughProps, typeExprToJs, getFieldDefault, KNOWN_LAYOUT_PROPS, KNOWN_TEXT_PROPS, KNOWN_BUTTON_PROPS, KNOWN_INPUT_PROPS, KNOWN_IMAGE_PROPS, KNOWN_LINK_PROPS, KNOWN_TOGGLE_PROPS, KNOWN_SELECT_PROPS } from './shared.js';
import { generateBackendCode } from './react.js';
import { getSvelteThemeRenderer, type ThemeName, type ThemeHelpers } from './themes.js';

interface SvelteContext {
  states: Map<string, StateDecl>;
  styles: Map<string, StyleDecl>;
  needsOnMount: boolean;
  extraScriptLines: string[];
  props: PropDecl[];
  theme: ThemeName | null;
  themeImports: Set<string>;
  debug: boolean;
}

function newCtx(debug = false): SvelteContext {
  return { states: new Map(), styles: new Map(), needsOnMount: false, extraScriptLines: [], props: [], theme: null, themeImports: new Set(), debug };
}

export function generateSvelte(ast: ASTNode[], debug = false): GeneratedCode {
  const parts: string[] = [];
  const themeNode = ast.find(n => n.type === 'ThemeDecl') as any;
  const theme: ThemeName | null = themeNode ? themeNode.theme as ThemeName : null;

  for (const node of ast) {
    if (node.type === 'ThemeDecl') {
      // Handled above
    } else if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
      parts.push(generateSvelteComponent(node, theme, debug));
    } else if (node.type === 'Model') {
      parts.push(genSvelteModelCode(node as ModelNode));
    } else if (node.type === 'AuthDecl') {
      parts.push(genSvelteAuthCode(node as AuthDecl));
    } else if (node.type === 'RouteDecl') {
      parts.push(genSvelteRouteCode(node as RouteDecl));
    } else {
      const backend = generateBackendCode(node);
      if (backend) parts.push(backend);
    }
  }
  const code = parts.join('\n\n');

  // Build V3 source map from 0x:L### comments
  const sourceFile = ast.find(n => n.type === 'Page' || n.type === 'Component' || n.type === 'App') as any;
  const srcName = sourceFile?.name ? `${sourceFile.name}.0x` : 'source.0x';
  const smb = new SourceMapBuilder(srcName, 'Component.svelte');
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/<!-- 0x:L(\d+) -->/);
    if (match) {
      smb.addMapping(parseInt(match[1], 10), 0);
    }
    smb.advance(lines[i] + (i < lines.length - 1 ? '\n' : ''));
  }

  return {
    code,
    filename: 'Component.svelte',
    imports: [],
    lineCount: lines.length,
    tokenCount: code.split(/\s+/).length,
    sourceMap: smb.toJSON(),
  };
}

function generateSvelteComponent(node: PageNode | ComponentNode | AppNode, theme: ThemeName | null = null, debug = false): string {
  const c = newCtx(debug);
  c.theme = theme;

  for (const child of node.body) {
    if (child.type === 'StateDecl') c.states.set(child.name, child);
    if (child.type === 'StyleDecl') c.styles.set(child.name, child);
  }

  const scriptLines: string[] = [];
  const templateParts: string[] = [];

  for (const child of node.body) {
    switch (child.type) {
      case 'StateDecl': scriptLines.push(genState(child, c)); break;
      case 'DerivedDecl': scriptLines.push(genDerived(child, c)); break;
      case 'PropDecl': c.props.push(child); break;
      case 'FnDecl': scriptLines.push(genFunction(child, c)); break;
      case 'OnMount': scriptLines.push(genOnMount(child, c)); break;
      case 'OnDestroy': scriptLines.push(genOnDestroy(child, c)); break;
      case 'WatchBlock': scriptLines.push(genWatch(child, c)); break;
      case 'CheckDecl': scriptLines.push(genCheck(child, c)); break;
      case 'ApiDecl': scriptLines.push(genApi(child, c)); break;
      case 'JsImport': {
        const ji = child as any;
        if (ji.isDefault) c.extraScriptLines.push(`import ${ji.specifiers[0]} from '${ji.source}';`);
        else c.extraScriptLines.push(`import { ${ji.specifiers.join(', ')} } from '${ji.source}';`);
        break;
      }
      case 'UseImport': {
        const ui = child as any;
        c.extraScriptLines.push(`import ${ui.name} from '${ui.source}';`);
        scriptLines.push(`const ${ui.name}Data = ${ui.name}();`);
        break;
      }
      case 'JsBlock': scriptLines.push((child as any).code); break;
      case 'RawBlock': templateParts.push((child as any).code); break;
      case 'TopLevelVarDecl': {
        const tlv = child as any;
        scriptLines.push(`${tlv.keyword} ${tlv.name} = ${genExpr(tlv.value, c)};`);
        break;
      }
      case 'StoreDecl': scriptLines.push(genSvelteStore(child as StoreDecl, c)); break;
      case 'DataDecl': scriptLines.push(genSvelteDataDecl(child as DataDecl, c)); break;
      case 'FormDecl': scriptLines.push(genSvelteFormDecl(child as FormDecl, c)); break;
      case 'RealtimeDecl': scriptLines.push(genSvelteRealtimeDecl(child as RealtimeDecl, c)); break;
      case 'TypeDecl': case 'StyleDecl': case 'Comment':
      case 'Model': case 'AuthDecl': case 'RouteDecl': case 'ThemeDecl': break;
      default:
        templateParts.push(genUINode(child as UINode, c));
        break;
    }
  }

  // Generate merged props declaration
  if (c.props.length > 0) {
    const propEntries = c.props.map(p => {
      if (p.defaultValue) return `${p.name} = ${genExpr(p.defaultValue, c)}`;
      return p.name;
    }).join(', ');
    scriptLines.unshift(`let { ${propEntries} } = $props();`);
  }

  const imports: string[] = [];
  if (c.needsOnMount) imports.push("import { onMount } from 'svelte';");

  // Collect theme imports
  const themeImportLines = Array.from(c.themeImports).sort();

  const hasScript = imports.length > 0 || scriptLines.length > 0 || c.extraScriptLines.length > 0 || themeImportLines.length > 0;
  const scriptSection = hasScript ? [
    '<script>',
    ...imports,
    ...themeImportLines,
    '',
    ...scriptLines,
    ...c.extraScriptLines,
    '</script>',
    '',
  ] : [];

  return [
    `// Generated by 0x${c.theme ? ` (theme: ${c.theme})` : ''}`,
    ...scriptSection,
    ...templateParts,
  ].join('\n');
}

// ── Declarations ────────────────────────────────────

function genState(node: StateDecl, c: SvelteContext): string {
  if (c.debug) {
    return `let ${node.name} = $state(${genExpr(node.initial, c)});\n$effect(() => { console.log('[0x] ${node.name} =', ${node.name}); });`;
  }
  return `let ${node.name} = $state(${genExpr(node.initial, c)});`;
}

function genDerived(node: DerivedDecl, c: SvelteContext): string {
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}let ${node.name} = $derived(${genExpr(node.expression, c)});`;
}

// genProp is now handled by merged declaration in generateSvelteComponent

function genFunction(node: FnDecl, c: SvelteContext): string {
  const params = node.params.map(p => p.name).join(', ');
  const asyncKw = node.isAsync ? 'async ' : '';
  const debugLog = c.debug ? `console.log('[0x] ${node.name}()', ${params ? `{${params}}` : ''});\n  ` : '';
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}${asyncKw}function ${node.name}(${params}) {\n  ${debugLog}${body}\n}`;
}

function genOnMount(node: OnMount, c: SvelteContext): string {
  c.needsOnMount = true;
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const asyncKw = bodyContainsAwait(node.body) ? 'async ' : '';
  const debugLog = c.debug ? `console.log('[0x] mounted');\n  ` : '';
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}onMount(${asyncKw}() => {\n  ${debugLog}${body}\n});`;
}

function genOnDestroy(node: OnDestroy, c: SvelteContext): string {
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const debugLog = c.debug ? `console.log('[0x] unmounting');\n    ` : '';
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}$effect(() => {\n  return () => {\n    ${debugLog}${body}\n  };\n});`;
}

function genWatch(node: WatchBlock, c: SvelteContext): string {
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const vars = node.variables || [node.variable];
  const varRefs = vars.map(v => `${v};`).join('\n  ');
  const hasAwait = bodyContainsAwait(node.body);
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  if (hasAwait) {
    return `${sc}$effect(() => {\n  ${varRefs}\n  (async () => {\n    ${body}\n  })();\n});`;
  }
  return `${sc}$effect(() => {\n  ${varRefs}\n  ${body}\n});`;
}

function genCheck(node: CheckDecl, c: SvelteContext): string {
  return `$effect(() => { if (!(${genExpr(node.condition, c)})) console.error('${node.message}'); });`;
}

function genApi(node: ApiDecl, c: SvelteContext): string {
  if (c.debug) {
    return `async function ${node.name}(params) {\n  console.log('[0x] ${node.method} ${node.url}', params);\n  const res = await fetch('${node.url}', { method: '${node.method}' });\n  const data = await res.json();\n  console.log('[0x] ${node.name} response:', data);\n  return data;\n}`;
  }
  return `async function ${node.name}(params) {\n  const res = await fetch('${node.url}', { method: '${node.method}' });\n  return res.json();\n}`;
}

// ── UI Nodes ────────────────────────────────────────

function srcComment(node: { loc?: { line: number } }): string {
  return node.loc?.line ? `<!-- 0x:L${node.loc.line} -->` : '';
}

function genUINode(node: UINode, c: SvelteContext): string {
  // Check for themed renderer
  if (c.theme) {
    const renderer = getSvelteThemeRenderer(c.theme, node.type);
    if (renderer) {
      const helpers: ThemeHelpers = { genExpr: (e, ctx) => genExpr(e, ctx || c), genTextContent: (e, ctx) => genExpr(e, ctx || c), genActionExpr: (a, ctx) => genActionExpr(a, ctx || c), genUINode: (n, ctx) => genUINode(n, ctx || c), srcComment: (n) => srcComment(n) };
      const result = renderer(node, c, helpers);
      for (const imp of result.imports) c.themeImports.add(imp);
      return result.jsx;
    }
  }

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
    case 'RawBlock': return (node as any).code;
    case 'Table': return genTableUI(node as TableNode, c);
    case 'Chart': return genChartUI(node as ChartNode, c);
    case 'Stat': return genStatUI(node as StatNode, c);
    case 'Nav': return genNavUI(node as NavNode, c);
    case 'Upload': return genUploadUI(node as UploadNode, c);
    case 'Modal': return genModalUI(node as ModalNode, c);
    case 'Toast': return genToastUI(node as ToastNode, c);
    case 'Hero': return genHeroUI(node as HeroNode, c);
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
    case 'Features': return genFeaturesUI(node as FeaturesNode, c);
    case 'Pricing': return genPricingUI(node as PricingNode, c);
    case 'Faq': return genFaqUI(node as FaqNode, c);
    case 'Testimonial': return genTestimonialUI(node as TestimonialNode, c);
    case 'Footer': return genFooterUI(node as FooterNode, c);
    case 'Admin': return genAdminUI(node as AdminNode, c);
    case 'Seo': return `<!-- SEO configured -->`;
    case 'A11y': return `<!-- a11y configured -->`;
    case 'Animate': return genAnimateUI(node as AnimateNode, c);
    case 'Gesture': return `<!-- gesture: ${(node as GestureNode).gestureType} -->`;
    case 'Ai': return genAiUI(node as AiNode, c);
    case 'Emit': return `<!-- emit: ${genExpr((node as EmitNode).channel, c)} -->`;
    case 'Responsive': return genResponsiveUI(node as ResponsiveNode, c);
    case 'Breadcrumb': return genBreadcrumbUI(node as BreadcrumbNode, c);
    case 'StatsGrid': return genStatsGridUI(node as StatsGridNode, c);
    case 'LayoutShell': return `<div class="layout-shell">${(node as LayoutShellNode).body.map(ch => genUINode(ch, c)).join('\n')}</div>`;
    case 'SlideOver': return genDrawerUI(node as any, c);
    case 'Automation': return `<!-- automation configured -->`;
    case 'Dev': return `<!-- dev tools configured -->`;
    case 'Error': return genErrorUI(node as ErrorNode, c);
    case 'Loading': return genLoadingUI(node as LoadingNode, c);
    case 'Offline': return genOfflineUI(node as OfflineNode, c);
    case 'Retry': return `<!-- retry: max=${genExpr((node as RetryNode).maxRetries, c)} -->`;
    case 'Log': return `<!-- log: ${genExpr((node as LogNode).message, c)} -->`;
    case 'Divider': return `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0" />`;
    case 'Progress': {
      const pn = node as ProgressNode;
      const val = genExpr(pn.value, c);
      const max = pn.props['max'] ? genExpr(pn.props['max'], c) : '100';
      return `<div style="width: 100%; background-color: #e2e8f0; border-radius: 9999px; height: 8px; overflow: hidden">\n<div style="width: {(${val} / ${max}) * 100}%; background-color: #3b82f6; height: 100%; border-radius: 9999px; transition: width 0.3s" />\n</div>`;
    }
    case 'Comment': return `<!-- ${(node as CommentNode).text} -->`;
    default: return `<!-- unsupported: ${(node as UINode).type} -->`;
  }
}

function genLayout(node: LayoutNode, c: SvelteContext): string {
  const style: string[] = [];
  if (node.direction === 'grid') {
    style.push('display: grid');
    if (node.props['cols']) style.push(`grid-template-columns: repeat(${genExpr(node.props['cols'], c)}, 1fr)`);
  } else if (node.direction === 'stack') {
    style.push('position: relative');
  } else {
    style.push('display: flex');
    style.push(`flex-direction: ${node.direction === 'row' ? 'row' : 'column'}`);
  }

  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'gap': style.push(`gap: ${addPx(v)}`); break;
      case 'padding': style.push(`padding: ${addPx(v)}`); break;
      case 'margin': style.push(`margin: ${unquote(v)}`); break;
      case 'maxWidth': style.push(`max-width: ${addPx(v)}`); break;
      case 'height': style.push(`height: ${unquote(v)}`); break;
      case 'center': style.push('align-items: center'); break;
      case 'middle': style.push('justify-content: center'); break;
      case 'between': style.push('justify-content: space-between'); break;
      case 'end': style.push('justify-content: flex-end'); break;
      case 'grow': style.push(`flex-grow: ${v}`); break;
      case 'scroll': style.push(`overflow-${unquote(v) === 'y' ? 'y' : 'x'}: auto`); break;
      case 'radius': style.push(`border-radius: ${addPx(v)}`); break;
      case 'shadow': {
        const sv = unquote(v);
        if (sv === 'sm') style.push('box-shadow: 0 1px 2px rgba(0,0,0,0.1)');
        else if (sv === 'md') style.push('box-shadow: 0 4px 6px rgba(0,0,0,0.1)');
        else if (sv === 'lg') style.push('box-shadow: 0 10px 15px rgba(0,0,0,0.1)');
        break;
      }
      case 'bg': {
        const isDynamic = val.kind === 'braced' || val.kind === 'ternary' || val.kind === 'binary' || val.kind === 'member' || val.kind === 'call';
        if (isDynamic) {
          style.push(`background-color: {${v}}`);
        } else {
          style.push(`background-color: ${unquote(v)}`);
        }
        break;
      }
      case 'gradient': style.push(`background: ${parseGradient(v)}`); break;
    }
  }

  // Apply style class
  if (node.styleClass && c.styles.has(node.styleClass)) {
    const styleDecl = c.styles.get(node.styleClass)!;
    for (const prop of styleDecl.properties) {
      if (!prop.responsive) {
        const val = genExpr(prop.value, c);
        const cssVal = formatCssValue(prop.name, val);
        style.push(`${cssPropToCss(prop.name)}: ${cssVal}`);
      }
    }
  }

  let className: string | null = null;
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { className = unquote(genExpr(val, c)); break; }
  }
  const classAttr = className ? ` class="${className}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_LAYOUT_PROPS, e => genExpr(e, c), 'svelte');
  const children = node.children.map(ch => genUINode(ch, c)).join('\n  ');
  const sc = srcComment(node);
  return `${sc}<div${classAttr} style="${style.join('; ')}"${extra}>\n  ${children}\n</div>`;
}

function genText(node: TextNode, c: SvelteContext): string {
  const style = genTextStyle(node, c);
  const styleAttr = style ? ` style="${style}"` : '';
  const content = genTextContent(node.content, c);
  let textClassAttr = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { textClassAttr = ` class="${unquote(genExpr(val, c))}"`; break; }
  }
  const textExtra = getPassthroughProps(node.props, KNOWN_TEXT_PROPS, e => genExpr(e, c), 'svelte');

  const badgeExpr = node.props['badge'];
  const tooltipExpr = node.props['tooltip'];
  const sc = srcComment(node);
  let result = `${sc}<span${textClassAttr}${styleAttr}${textExtra}>${content}</span>`;

  if (badgeExpr) {
    const badge = genExpr(badgeExpr, c);
    result = `${sc}<span style="position: relative; display: inline-flex; align-items: center">\n<span${styleAttr}>${content}</span>\n<span style="margin-left: 6px; padding: 2px 6px; font-size: 12px; font-weight: bold; border-radius: 9999px; background-color: #ef4444; color: #fff; min-width: 20px; text-align: center">{${badge}}</span>\n</span>`;
  }

  if (tooltipExpr) {
    const tooltip = genExpr(tooltipExpr, c);
    result = `<span title="${unquote(tooltip)}">${badgeExpr ? result : `<span${styleAttr}>${content}</span>`}</span>`;
  }

  return result;
}

function genButton(node: ButtonNode, c: SvelteContext): string {
  const label = genTextContent(node.label, c);
  const action = genActionExpr(node.action, c);
  const attrs: string[] = [];
  let btnClassName = '';
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'class':
      case 'style': {
        const uv = unquote(v);
        if (key === 'class') { btnClassName = uv; }
        else if (uv === 'primary') attrs.push('style="background-color: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer"');
        else if (uv === 'danger') attrs.push('style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer"');
        break;
      }
      case 'disabled': attrs.push(`disabled={${v}}`); break;
    }
  }
  const classAttr = btnClassName ? ` class="${btnClassName}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_BUTTON_PROPS, e => genExpr(e, c), 'svelte');
  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const sc = srcComment(node);
  return `${sc}<button onclick={() => ${action}}${classAttr}${attrStr}${extra}>${label}</button>`;
}

function genInput(node: InputNode, c: SvelteContext): string {
  const props: string[] = [`bind:value={${node.binding}}`];
  let inputClassName = '';
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    if (key === 'class') { inputClassName = unquote(v); }
    else if (key === 'placeholder') props.push(`placeholder="${unquote(v)}"`);
    else if (key === 'type') props.push(`type="${unquote(v)}"`);
    else if (key === '@keypress') props.push(`onkeypress={e => ${v}(e.key)}`);
    else if (key === 'grow') props.push(`style="flex-grow: ${v}"`);
  }
  const classAttr = inputClassName ? ` class="${inputClassName}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_INPUT_PROPS, e => genExpr(e, c), 'svelte');
  const sc = srcComment(node);
  return `${sc}<input ${props.join(' ')}${classAttr}${extra} />`;
}

function genImage(node: ImageNode, c: SvelteContext): string {
  const src = genExpr(node.src, c);
  const style: string[] = [];
  let imgClassName = '';
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'class': imgClassName = unquote(v); break;
      case 'round': style.push('border-radius: 50%'); break;
      case 'radius': style.push(`border-radius: ${addPx(unquote(v))}`); break;
      case 'size': style.push(`width: ${addPx(unquote(v))}; height: ${addPx(unquote(v))}`); break;
    }
  }
  const alt = node.props['alt'] ? ` alt="${unquote(genExpr(node.props['alt'], c))}"` : '';
  const classAttr = imgClassName ? ` class="${imgClassName}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_IMAGE_PROPS, e => genExpr(e, c), 'svelte');
  const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';
  const sc = srcComment(node);
  return `${sc}<img src={${src}}${alt}${classAttr}${styleAttr}${extra} />`;
}

function genLink(node: LinkNode, c: SvelteContext): string {
  const label = genTextContent(node.label, c);
  const href = genExpr(node.href, c);
  let linkClassName = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { linkClassName = unquote(genExpr(val, c)); break; }
  }
  const classAttr = linkClassName ? ` class="${linkClassName}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_LINK_PROPS, e => genExpr(e, c), 'svelte');
  const sc = srcComment(node);
  return `${sc}<a href={${href}}${classAttr}${extra}>${label}</a>`;
}

function genToggle(node: ToggleNode, c: SvelteContext): string {
  let toggleClassName = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { toggleClassName = unquote(genExpr(val, c)); break; }
  }
  const classAttr = toggleClassName ? ` class="${toggleClassName}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_TOGGLE_PROPS, e => genExpr(e, c), 'svelte');
  const sc = srcComment(node);
  return `${sc}<input type="checkbox" bind:checked={${node.binding}}${classAttr}${extra} />`;
}

function genSelect(node: SelectNode, c: SvelteContext): string {
  const options = genExpr(node.options, c);
  let selectClassName = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { selectClassName = unquote(genExpr(val, c)); break; }
  }
  const classAttr = selectClassName ? ` class="${selectClassName}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_SELECT_PROPS, e => genExpr(e, c), 'svelte');
  const sc = srcComment(node);
  return `${sc}<select bind:value={${node.binding}}${classAttr}${extra}>\n  {#each ${options} as opt}\n    <option value={opt}>{opt}</option>\n  {/each}\n</select>`;
}

function genComponentCall(node: ComponentCall, c: SvelteContext): string {
  const props = Object.entries(node.args)
    .filter(([k]) => !k.startsWith('_arg'))
    .map(([k, v]) => `${k}={${genExpr(v, c)}}`);
  const propsStr = props.length > 0 ? ` ${props.join(' ')}` : '';

  if (node.children && node.children.length > 0) {
    const childrenHtml = node.children.map(ch => genUINode(ch, c)).join('\n  ');
    return `<${node.name}${propsStr}>\n  ${childrenHtml}\n</${node.name}>`;
  }

  return `<${node.name}${propsStr} />`;
}

function genIf(node: IfBlock, c: SvelteContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  let result = `{#if ${cond}}\n  ${body}`;

  for (const elif of node.elifs) {
    const ec = genExpr(elif.condition, c);
    const eb = elif.body.map(ch => genUINode(ch, c)).join('\n  ');
    result += `\n{:else if ${ec}}\n  ${eb}`;
  }

  if (node.elseBody) {
    const eb = node.elseBody.map(ch => genUINode(ch, c)).join('\n  ');
    result += `\n{:else}\n  ${eb}`;
  }

  result += '\n{/if}';
  return result;
}

function genFor(node: ForBlock, c: SvelteContext): string {
  const iter = genExpr(node.iterable, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  const binding = node.index ? `${node.item}, ${node.index}` : node.item;
  return `{#each ${iter} as ${binding}}\n  ${body}\n{/each}`;
}

function genShow(node: ShowBlock, c: SvelteContext): string {
  return genIf({ ...node, type: 'IfBlock', elifs: [], elseBody: null } as IfBlock, c);
}

function genHide(node: HideBlock, c: SvelteContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `{#if !${cond}}\n  ${body}\n{/if}`;
}

// ── Advanced UI Components ──────────────────────────

function genTableUI(node: TableNode, c: SvelteContext): string {
  const data = node.dataSource;
  const lines: string[] = [];
  lines.push(`<table style="width: 100%; border-collapse: collapse">`);
  lines.push(`<thead><tr>`);
  for (const col of node.columns) {
    if (col.kind === 'select') {
      lines.push(`<th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0"><input type="checkbox" /></th>`);
    } else if (col.kind === 'field') {
      lines.push(`<th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; text-align: left; font-weight: 600">${col.label || col.field}</th>`);
    } else if (col.kind === 'actions') {
      lines.push(`<th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; text-align: right; font-weight: 600">Actions</th>`);
    }
  }
  lines.push(`</tr></thead>`);
  lines.push(`<tbody>`);
  lines.push(`{#each ${data} as row, idx}`);
  lines.push(`<tr style="border-bottom: 1px solid #e2e8f0">`);
  for (const col of node.columns) {
    if (col.kind === 'select') {
      lines.push(`<td style="padding: 12px 8px"><input type="checkbox" /></td>`);
    } else if (col.kind === 'field') {
      let content = `{row.${col.field}}`;
      if (col.format === 'date') content = `{new Date(row.${col.field}).toLocaleDateString()}`;
      lines.push(`<td style="padding: 12px 8px">${content}</td>`);
    } else if (col.kind === 'actions') {
      lines.push(`<td style="padding: 12px 8px; text-align: right">`);
      for (const action of (col.actions || [])) {
        if (action === 'edit') lines.push(`<button onclick={() => onEdit(row)} style="margin-right: 4px; padding: 4px 8px; font-size: 13px; cursor: pointer">Edit</button>`);
        if (action === 'delete') lines.push(`<button onclick={() => onDelete(row)} style="padding: 4px 8px; font-size: 13px; cursor: pointer; color: #e53e3e">Delete</button>`);
      }
      lines.push(`</td>`);
    }
  }
  lines.push(`</tr>`);
  lines.push(`{/each}`);
  lines.push(`</tbody></table>`);
  return lines.join('\n');
}

function genChartUI(node: ChartNode, c: SvelteContext): string {
  return `<div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px"><!-- Chart: ${node.chartType} --><canvas bind:this={${node.name}Chart}></canvas></div>`;
}

function genStatUI(node: StatNode, c: SvelteContext): string {
  const value = genExpr(node.value, c);
  return `<div style="padding: 20px; border-radius: 12px; background: #f7fafc; border: 1px solid #e2e8f0"><div style="font-size: 14px; color: #718096">${node.label}</div><div style="font-size: 32px; font-weight: bold; margin-top: 4px">{${value}}</div></div>`;
}

function genNavUI(node: NavNode, c: SvelteContext): string {
  const lines: string[] = [];
  lines.push(`<nav style="display: flex; gap: 16px; padding: 12px 24px; background-color: #fff; border-bottom: 1px solid #e2e8f0; align-items: center">`);
  for (const item of node.items) {
    const iconPart = item.icon ? `<span style="margin-right: 6px">${item.icon}</span>` : '';
    lines.push(`<a href="${item.href}" style="text-decoration: none; color: #4a5568; font-weight: 500; padding: 8px 12px; border-radius: 6px">${iconPart}${item.label}</a>`);
  }
  lines.push(`</nav>`);
  return lines.join('\n');
}

function genUploadUI(node: UploadNode, c: SvelteContext): string {
  const name = node.name;
  return `<div style="border: 2px dashed #cbd5e0; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer" onclick={() => ${name}Input?.click()}><input bind:this={${name}Input} type="file"${node.accept ? ` accept="${node.accept}"` : ''} style="display: none" /><span style="color: #a0aec0">Click to select file</span></div>`;
}

function genModalUI(node: ModalNode, c: SvelteContext): string {
  const showVar = `show${capitalize(node.name)}`;
  c.extraScriptLines.push(`let ${showVar} = $state(false);`);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  const lines: string[] = [];
  if (node.trigger) {
    lines.push(`<button onclick={() => ${showVar} = true} style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer">${node.trigger}</button>`);
  }
  lines.push(`{#if ${showVar}}`);
  lines.push(`<div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000" onclick={() => ${showVar} = false}>`);
  lines.push(`  <div style="background-color: #fff; border-radius: 12px; padding: 24px; min-width: 400px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15)" onclick={e => e.stopPropagation()}>`);
  lines.push(`    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">`);
  lines.push(`      <h2 style="margin: 0; font-size: 20px">${capitalize(node.title)}</h2>`);
  lines.push(`      <button onclick={() => ${showVar} = false} style="border: none; background: none; font-size: 20px; cursor: pointer; padding: 4px">&times;</button>`);
  lines.push(`    </div>`);
  lines.push(`    ${body}`);
  lines.push(`  </div>`);
  lines.push(`</div>`);
  lines.push(`{/if}`);
  return lines.join('\n');
}

function genToastUI(node: ToastNode, c: SvelteContext): string {
  return `{#if toast.visible}<div style="position: fixed; top: 16px; right: 16px; padding: 12px 20px; border-radius: 8px; background-color: #333; color: #fff; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15)">{toast.message}</div>{/if}`;
}

function genHeroUI(node: HeroNode, c: SvelteContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<section style="text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff">\n  ${body}\n</section>`;
}

function genCrudUI(node: CrudNode, c: SvelteContext): string {
  return `<div class="crud-${node.model.toLowerCase()}"><!-- CRUD: ${node.model} --><h2>${node.model} Management</h2></div>`;
}

function genListUI(node: ListNode, c: SvelteContext): string {
  const data = genExpr(node.dataSource, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  return `<div style="display: flex; flex-direction: column; gap: 8px">{#each ${data} as item}<div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px">\n    ${body}\n  </div>{/each}</div>`;
}

function genDrawerUI(node: DrawerNode, c: SvelteContext): string {
  const showVar = `show${capitalize(node.name)}`;
  c.extraScriptLines.push(`let ${showVar} = $state(false);`);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  return `{#if ${showVar}}<div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); z-index: 1000" onclick={() => ${showVar} = false}><div style="position: fixed; top: 0; right: 0; bottom: 0; width: 320px; background-color: #fff; padding: 24px; box-shadow: -2px 0 8px rgba(0,0,0,0.1); overflow-y: auto" onclick={e => e.stopPropagation()}>\n    ${body}\n  </div></div>{/if}`;
}

function genCommandUI(node: CommandNode, c: SvelteContext): string {
  return `<div style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); width: 500px; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); z-index: 1000; padding: 8px"><input placeholder="Type a command..." style="width: 100%; padding: 12px 16px; border: none; font-size: 16px; outline: none" /></div>`;
}

function genConfirmUI(node: ConfirmNode, c: SvelteContext): string {
  const desc = node.description ? `<p style="color: #718096; margin: 8px 0 0 0">${node.description}</p>` : '';
  const dangerStyle = node.danger ? 'background-color: #e53e3e' : 'background-color: #3182ce';
  return `<div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000"><div style="background: #fff; border-radius: 12px; padding: 24px; max-width: 400px"><p style="font-weight: 600; margin: 0">${node.message}</p>${desc}<div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px"><button onclick={onCancel} style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer">${node.cancelLabel}</button><button onclick={onConfirm} style="padding: 8px 16px; border-radius: 6px; ${dangerStyle}; color: #fff; border: none; cursor: pointer">${node.confirmLabel}</button></div></div></div>`;
}

function genPayUI(node: PayNode, c: SvelteContext): string {
  return `<div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px"><!-- Payment: ${node.provider} --><button style="width: 100%; padding: 12px; background: #635bff; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer">Pay Now</button></div>`;
}

function genCartUI(node: CartNode, c: SvelteContext): string {
  return `<div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px"><!-- Cart --><h3 style="margin: 0 0 12px 0">Shopping Cart</h3>{#each cartItems as item}<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0"><span>{item.name}</span><span>{item.price}</span></div>{/each}</div>`;
}

function genMediaUI(node: MediaNode, c: SvelteContext): string {
  return `<div style="border-radius: 12px; overflow: hidden"><!-- Media: ${node.mediaType} --></div>`;
}

function genNotificationUI(node: NotificationNode, c: SvelteContext): string {
  return `<div style="position: fixed; top: 16px; right: 16px; z-index: 2000; display: flex; flex-direction: column; gap: 8px">{#each notifications as n}<div style="padding: 12px 20px; border-radius: 8px; background-color: #333; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15)">{n.message}</div>{/each}</div>`;
}

function genSearchUI(node: SearchNode, c: SvelteContext): string {
  return `<div style="position: relative"><input bind:value={searchQuery} placeholder="Search..." style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px" /></div>`;
}

function genFilterUI(node: FilterNode, c: SvelteContext): string {
  return `<div style="display: flex; gap: 8px; flex-wrap: wrap"><!-- Filter: ${node.target} --></div>`;
}

function genSocialUI(node: SocialNode, c: SvelteContext): string {
  return `<div style="display: flex; gap: 12px; align-items: center"><!-- Social: ${node.socialType} --><button style="padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; cursor: pointer">Like</button></div>`;
}

function genProfileUI(node: ProfileNode, c: SvelteContext): string {
  return `<div style="display: flex; gap: 16px; align-items: center; padding: 20px"><!-- Profile --><div style="width: 64px; height: 64px; border-radius: 50%; background-color: #e2e8f0"></div><div><div style="font-weight: 600">User Profile</div></div></div>`;
}

function genFeaturesUI(node: FeaturesNode, c: SvelteContext): string {
  const items = node.items.map(item => `<div style="padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0"><div style="font-size: 24px; margin-bottom: 12px">${item.icon}</div><h3 style="margin: 0 0 8px 0">${item.title}</h3><p style="color: #718096; margin: 0">${item.description}</p></div>`).join('\n  ');
  return `<section style="padding: 60px 20px"><h2 style="text-align: center; margin-bottom: 40px">Features</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">\n  ${items}\n</div></section>`;
}

function genPricingUI(node: PricingNode, c: SvelteContext): string {
  const plans = node.plans.map(plan => {
    const features = plan.features.map(f => `<li style="padding: 4px 0">${f}</li>`).join('');
    const hl = plan.highlighted ? 'border: 2px solid #3182ce; transform: scale(1.05)' : 'border: 1px solid #e2e8f0';
    return `<div style="padding: 32px; border-radius: 12px; ${hl}"><h3 style="margin: 0">${plan.name}</h3><div style="font-size: 32px; font-weight: bold; margin: 16px 0">${genExpr(plan.price, c)}</div><ul style="list-style: none; padding: 0; margin: 16px 0">${features}</ul><button style="width: 100%; padding: 10px; border-radius: 6px; background-color: #3182ce; color: #fff; border: none; cursor: pointer">${plan.cta}</button></div>`;
  }).join('\n  ');
  return `<section style="padding: 60px 20px"><h2 style="text-align: center; margin-bottom: 40px">Pricing</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 0 auto">\n  ${plans}\n</div></section>`;
}

function genFaqUI(node: FaqNode, c: SvelteContext): string {
  const items = node.items.map(item => `<details style="border-bottom: 1px solid #e2e8f0; padding: 16px 0"><summary style="cursor: pointer; font-weight: 600">${item.question}</summary><p style="color: #718096; margin: 8px 0 0 0">${item.answer}</p></details>`).join('\n  ');
  return `<section style="padding: 60px 20px; max-width: 700px; margin: 0 auto"><h2 style="text-align: center; margin-bottom: 40px">FAQ</h2>\n  ${items}\n</section>`;
}

function genTestimonialUI(node: TestimonialNode, c: SvelteContext): string {
  const items = node.items.map(item => `<div style="padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0"><p style="margin: 0 0 16px 0; font-style: italic">"${item.text}"</p><div style="display: flex; align-items: center; gap: 12px"><div style="width: 40px; height: 40px; border-radius: 50%; background-color: #e2e8f0"></div><div><div style="font-weight: 600">${item.name}</div><div style="font-size: 14px; color: #718096">${item.role}</div></div></div></div>`).join('\n  ');
  return `<section style="padding: 60px 20px"><h2 style="text-align: center; margin-bottom: 40px">Testimonials</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">\n  ${items}\n</div></section>`;
}

function genFooterUI(node: FooterNode, c: SvelteContext): string {
  const cols = node.columns.map(col => {
    const links = col.links.map(l => `<a href="${l.href}" style="display: block; color: #a0aec0; text-decoration: none; padding: 4px 0">${l.label}</a>`).join('');
    return `<div><h4 style="color: #fff; margin: 0 0 12px 0">${col.title}</h4>${links}</div>`;
  }).join('\n  ');
  return `<footer style="padding: 40px 20px; background-color: #1a202c; color: #a0aec0"><div style="display: grid; grid-template-columns: repeat(${node.columns.length}, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto">\n  ${cols}\n</div></footer>`;
}

function genAdminUI(node: AdminNode, c: SvelteContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  return `<div style="display: grid; grid-template-columns: 240px 1fr; min-height: 100vh"><aside style="background-color: #1a202c; color: #fff; padding: 20px"><h3 style="margin: 0 0 20px 0">Admin</h3></aside><main style="padding: 24px">\n    ${body}\n  </main></div>`;
}

function genAnimateUI(node: AnimateNode, c: SvelteContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<div transition:${node.animType}>\n  ${body}\n</div>`;
}

function genAiUI(node: AiNode, c: SvelteContext): string {
  return `<div style="display: flex; flex-direction: column; height: 100%"><!-- AI: ${node.aiType} --><div style="flex: 1; overflow-y: auto; padding: 16px"></div><div style="padding: 16px; border-top: 1px solid #e2e8f0"><input placeholder="Type a message..." style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0" /></div></div>`;
}

function genResponsiveUI(node: ResponsiveNode, c: SvelteContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<div class="responsive-container">\n  ${body}\n</div>`;
}

function genBreadcrumbUI(node: BreadcrumbNode, c: SvelteContext): string {
  return `<nav style="display: flex; align-items: center; padding: 12px 0; font-size: 14px"><!-- Breadcrumb --></nav>`;
}

function genStatsGridUI(node: StatsGridNode, c: SvelteContext): string {
  const stats = node.stats.map(s => genStatUI(s, c)).join('\n  ');
  return `<div style="display: grid; grid-template-columns: repeat(${node.cols || 4}, 1fr); gap: 16px">\n  ${stats}\n</div>`;
}

function genErrorUI(node: ErrorNode, c: SvelteContext): string {
  const fallback = node.fallback.map(ch => genUINode(ch, c)).join('\n    ');
  if (node.errorType === 'boundary') {
    return `{#if hasError}<div style="padding: 24px; text-align: center; color: #e53e3e">\n    ${fallback || '<p>An error occurred</p>'}\n  </div>{/if}`;
  }
  return `<!-- Error handler: ${node.errorType} -->`;
}

function genLoadingUI(node: LoadingNode, c: SvelteContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  if (node.loadingType === 'skeleton') {
    return `<div style="animation: pulse 1.5s infinite; background-color: #e2e8f0; border-radius: 8px">\n  ${body || '<div style="height: 20px; margin-bottom: 8px"></div><div style="height: 20px; width: 60%"></div>'}\n</div>`;
  }
  if (node.loadingType === 'spinner') {
    return `<div style="display: flex; justify-content: center; align-items: center; padding: 40px"><div style="width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top: 3px solid #3182ce; border-radius: 50%; animation: spin 0.8s linear infinite"></div></div>`;
  }
  if (node.loadingType === 'shimmer') {
    return `<div style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; height: 100px"></div>`;
  }
  return `<div style="text-align: center; padding: 20px; color: #718096">Loading...</div>`;
}

function genOfflineUI(node: OfflineNode, c: SvelteContext): string {
  return `{#if !navigator.onLine}<div style="padding: 24px; text-align: center; background-color: #fff3cd; border-radius: 8px"><p style="margin: 0; color: #856404">You are currently offline</p></div>{/if}`;
}

// ── Helpers ─────────────────────────────────────────

function genExpr(expr: Expression, c: SvelteContext): string {
  switch (expr.kind) {
    case 'number': return String(expr.value);
    case 'string': return `'${expr.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    case 'boolean': return String(expr.value);
    case 'null': return 'null';
    case 'identifier': return expr.name;
    case 'member': return `${genExpr(expr.object, c)}.${expr.property}`;
    case 'index': return `${genExpr(expr.object, c)}[${genExpr(expr.index, c)}]`;
    case 'call': {
      const callee = genExpr(expr.callee, c);
      const args = expr.args.map(a => genExpr(a, c)).join(', ');
      return `${callee}(${args})`;
    }
    case 'binary': return `${genExpr(expr.left, c)} ${expr.op} ${genExpr(expr.right, c)}`;
    case 'unary': return `${expr.op}${genExpr(expr.operand, c)}`;
    case 'ternary': return `${genExpr(expr.condition, c)} ? ${genExpr(expr.consequent, c)} : ${genExpr(expr.alternate, c)}`;
    case 'arrow': {
      const params = expr.params.join(', ');
      if (!Array.isArray(expr.body)) return `(${params}) => ${genExpr(expr.body as Expression, c)}`;
      const body = (expr.body as Statement[]).map(s => genStmt(s, c)).join('\n');
      return `(${params}) => { ${body} }`;
    }
    case 'array': return `[${expr.elements.map(e => genExpr(e, c)).join(', ')}]`;
    case 'object_expr': {
      if (expr.properties.length === 0) return '{}';
      const ps = expr.properties.map(p => `${p.key}: ${genExpr(p.value, c)}`).join(', ');
      return `{ ${ps} }`;
    }
    case 'template': {
      const inner = expr.parts.map(p => typeof p === 'string' ? p : `\${${genExpr(p, c)}}`).join('');
      return `\`${inner}\``;
    }
    case 'assignment': {
      return `${genExpr(expr.target, c)} ${expr.op} ${genExpr(expr.value, c)}`;
    }
    case 'await': return `await ${genExpr(expr.expression, c)}`;
    case 'old': return genExpr(expr.expression, c);
    case 'braced': return genExpr(expr.expression, c);
  }
}

function genStmt(stmt: Statement, c: SvelteContext): string {
  switch (stmt.kind) {
    case 'expr_stmt': return genExpr(stmt.expression, c) + ';';
    case 'return': return stmt.value ? `return ${genExpr(stmt.value, c)};` : 'return;';
    case 'assignment_stmt': return `${genExpr(stmt.target, c)} ${stmt.op} ${genExpr(stmt.value, c)};`;
    case 'var_decl': return `const ${stmt.name} = ${genExpr(stmt.value, c)};`;
    case 'if_stmt': {
      const body = stmt.body.map(s => genStmt(s, c)).join('\n  ');
      return `if (${genExpr(stmt.condition, c)}) {\n  ${body}\n}`;
    }
    case 'for_stmt': {
      const body = stmt.body.map(s => genStmt(s, c)).join('\n  ');
      return `for (const ${stmt.item} of ${genExpr(stmt.iterable, c)}) {\n  ${body}\n}`;
    }
  }
}

function genActionExpr(expr: Expression | Statement[], c: SvelteContext): string {
  if (Array.isArray(expr)) {
    return `{ ${expr.map(s => genStmt(s, c)).join(' ')} }`;
  }
  return genExpr(expr, c);
}

function genTextContent(expr: Expression, c: SvelteContext): string {
  if (expr.kind === 'string') return expr.value;
  if (expr.kind === 'template') {
    return expr.parts.map(p => typeof p === 'string' ? p : `{${genExpr(p, c)}}`).join('');
  }
  return `{${genExpr(expr, c)}}`;
}

function genTextStyle(node: TextNode, c: SvelteContext): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    const isDynamic = val.kind === 'braced' || val.kind === 'ternary' || val.kind === 'binary' || val.kind === 'member' || val.kind === 'call';
    if (key === 'size') { const uv = unquote(v); parts.push(`font-size: ${SIZE_MAP[uv] || uv}`); }
    if (key === 'bold') parts.push('font-weight: bold');
    if (key === 'color') {
      if (isDynamic) {
        parts.push(`color: {${v}}`);
      } else {
        parts.push(`color: ${unquote(v)}`);
      }
    }
    if (key === 'gradient') { const g = parseGradient(v); parts.push(`background: ${g}; -webkit-background-clip: text; -webkit-text-fill-color: transparent`); }
    if (key === 'center') parts.push('text-align: center');
    if (key === 'italic') parts.push('font-style: italic');
    if (key === 'underline') parts.push('text-decoration: underline');
    if (key === 'strike') {
      if (isDynamic) {
        parts.push(`text-decoration: {${v} ? 'line-through' : 'none'}`);
      } else {
        parts.push('text-decoration: line-through');
      }
    }
    if (key === 'end') parts.push('text-align: right');
  }
  return parts.join('; ');
}

function cssPropToCss(prop: string): string {
  const map: Record<string, string> = {
    'padding': 'padding', 'margin': 'margin', 'radius': 'border-radius',
    'shadow': 'box-shadow', 'bg': 'background-color', 'color': 'color',
  };
  return map[prop] || prop;
}

function formatCssValue(prop: string, val: string): string {
  const v = unquote(val);
  if (['padding', 'margin', 'radius', 'gap'].includes(prop)) return addPx(v);
  if (prop === 'shadow') {
    if (v === 'sm') return '0 1px 2px rgba(0,0,0,0.1)';
    if (v === 'md') return '0 4px 6px rgba(0,0,0,0.1)';
    if (v === 'lg') return '0 10px 15px rgba(0,0,0,0.1)';
  }
  return v;
}

// ── Await Detection Helpers ─────────────────────────

function bodyContainsAwait(body: Statement[]): boolean {
  return body.some(s => stmtHasAwait(s));
}

function stmtHasAwait(s: Statement): boolean {
  switch (s.kind) {
    case 'expr_stmt': return exprHasAwait(s.expression);
    case 'assignment_stmt': return exprHasAwait(s.value) || exprHasAwait(s.target);
    case 'if_stmt':
      return exprHasAwait(s.condition)
        || s.body.some(st => stmtHasAwait(st))
        || (s.elseBody ? s.elseBody.some(st => stmtHasAwait(st)) : false);
    case 'for_stmt': return exprHasAwait(s.iterable) || s.body.some(st => stmtHasAwait(st));
    case 'return': return s.value ? exprHasAwait(s.value) : false;
    default: return false;
  }
}

function exprHasAwait(e: Expression): boolean {
  switch (e.kind) {
    case 'await': return true;
    case 'call': return exprHasAwait(e.callee) || e.args.some(a => exprHasAwait(a));
    case 'binary': return exprHasAwait(e.left) || exprHasAwait(e.right);
    case 'unary': return exprHasAwait(e.operand);
    case 'member': return exprHasAwait(e.object);
    case 'ternary': return exprHasAwait(e.condition) || exprHasAwait(e.consequent) || exprHasAwait(e.alternate);
    case 'template': return e.parts.some(p => typeof p !== 'string' && exprHasAwait(p));
    case 'assignment': return exprHasAwait(e.value);
    case 'array': return e.elements.some(el => exprHasAwait(el));
    case 'object_expr': return e.properties.some(p => exprHasAwait(p.value));
    default: return false;
  }
}

// ── Phase 2: Store (localStorage persistence) ───────

function genSvelteStore(node: StoreDecl, c: SvelteContext): string {
  const init = genExpr(node.initial, c);
  const lines = [
    `let ${node.name} = $state(JSON.parse(localStorage.getItem('${node.name}') ?? 'null') ?? ${init});`,
    `$effect(() => { localStorage.setItem('${node.name}', JSON.stringify(${node.name})); });`,
  ];
  c.states.set(node.name, node as any);
  return lines.join('\n');
}

// ── Phase 2: Data Fetching ──────────────────────────

function genSvelteDataDecl(node: DataDecl, c: SvelteContext): string {
  c.needsOnMount = true;
  const query = genExpr(node.query, c);
  const lines: string[] = [];
  lines.push(`let ${node.name} = $state([]);`);
  lines.push(`let ${node.name}Loading = $state(true);`);
  lines.push(`let ${node.name}Error = $state(null);`);
  lines.push(`onMount(async () => {`);
  lines.push(`  try {`);
  lines.push(`    ${node.name} = await ${query};`);
  lines.push(`    ${node.name}Error = null;`);
  lines.push(`  } catch (e) {`);
  lines.push(`    ${node.name}Error = e.message;`);
  lines.push(`  } finally {`);
  lines.push(`    ${node.name}Loading = false;`);
  lines.push(`  }`);
  lines.push(`});`);
  c.states.set(node.name, { type: 'StateDecl', name: node.name, valueType: { kind: 'primitive', name: 'any' }, initial: { kind: 'array', elements: [] }, loc: node.loc } as any);
  return lines.join('\n');
}

// ── Phase 2: Form ───────────────────────────────────

function genSvelteFormDecl(node: FormDecl, c: SvelteContext): string {
  const lines: string[] = [];

  const initialValues = node.fields.map(f => `${f.name}: ${getFieldDefault(f.fieldType)}`).join(', ');
  lines.push(`let ${node.name} = $state({ ${initialValues} });`);
  lines.push(`let ${node.name}Errors = $state({});`);
  lines.push(`let ${node.name}Submitting = $state(false);`);

  lines.push(`function update${capitalize(node.name)}(field, value) {`);
  lines.push(`  ${node.name}[field] = value;`);
  lines.push(`  ${node.name}Errors[field] = null;`);
  lines.push(`}`);

  lines.push(`function validate${capitalize(node.name)}() {`);
  lines.push(`  const errors = {};`);
  for (const f of node.fields) {
    for (const v of f.validations) {
      switch (v.rule) {
        case 'required':
          lines.push(`  if (!${node.name}.${f.name}) errors.${f.name} = '${v.message}';`);
          break;
        case 'min':
          lines.push(`  if (${node.name}.${f.name}.length < ${genExprStandalone(v.value!)}) errors.${f.name} = '${v.message}';`);
          break;
        case 'max':
          lines.push(`  if (${node.name}.${f.name}.length > ${genExprStandalone(v.value!)}) errors.${f.name} = '${v.message}';`);
          break;
        case 'format':
          if (v.value?.kind === 'string' && v.value.value === 'email') {
            lines.push(`  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${node.name}.${f.name})) errors.${f.name} = '${v.message}';`);
          }
          break;
        case 'pattern':
          if (v.value?.kind === 'string') {
            lines.push(`  if (!/${v.value.value}/.test(${node.name}.${f.name})) errors.${f.name} = '${v.message}';`);
          }
          break;
      }
    }
  }
  lines.push(`  ${node.name}Errors = errors;`);
  lines.push(`  return Object.keys(errors).length === 0;`);
  lines.push(`}`);

  if (node.submit) {
    const action = genExpr(node.submit.action, c);
    lines.push(`async function submit${capitalize(node.name)}() {`);
    lines.push(`  if (!validate${capitalize(node.name)}()) return;`);
    lines.push(`  ${node.name}Submitting = true;`);
    lines.push(`  try {`);
    lines.push(`    await ${action};`);
    if (node.submit.success) {
      lines.push(`    ${genExpr(node.submit.success, c)};`);
    }
    lines.push(`  } catch (e) {`);
    if (node.submit.error) {
      lines.push(`    ${genExpr(node.submit.error, c)};`);
    }
    lines.push(`  } finally {`);
    lines.push(`    ${node.name}Submitting = false;`);
    lines.push(`  }`);
    lines.push(`}`);
  }

  return lines.join('\n');
}

// ── Phase 2: Realtime (WebSocket) ───────────────────

function genSvelteRealtimeDecl(node: RealtimeDecl, c: SvelteContext): string {
  c.needsOnMount = true;
  const channel = genExpr(node.channel, c);
  const lines: string[] = [];

  lines.push(`let ${node.name} = $state([]);`);
  lines.push(`let ${node.name}Ws = null;`);
  lines.push(`onMount(() => {`);
  lines.push(`  const ws = new WebSocket(${channel});`);
  lines.push(`  ${node.name}Ws = ws;`);

  for (const handler of node.handlers) {
    if (handler.event === 'message') {
      lines.push(`  ws.onmessage = (event) => {`);
      lines.push(`    const message = JSON.parse(event.data);`);
      const body = handler.body.map(s => genStmt(s, c)).join('\n    ');
      lines.push(`    ${body}`);
      lines.push(`  };`);
    } else if (handler.event === 'error') {
      lines.push(`  ws.onerror = (event) => {`);
      const body = handler.body.map(s => genStmt(s, c)).join('\n    ');
      lines.push(`    ${body}`);
      lines.push(`  };`);
    } else if (handler.event === 'open') {
      lines.push(`  ws.onopen = () => {`);
      const body = handler.body.map(s => genStmt(s, c)).join('\n    ');
      lines.push(`    ${body}`);
      lines.push(`  };`);
    } else if (handler.event === 'close') {
      lines.push(`  ws.onclose = () => {`);
      const body = handler.body.map(s => genStmt(s, c)).join('\n    ');
      lines.push(`    ${body}`);
      lines.push(`  };`);
    }
  }

  lines.push(`  return () => { ws.close(); };`);
  lines.push(`});`);

  c.states.set(node.name, { type: 'StateDecl', name: node.name, valueType: { kind: 'list', itemType: { kind: 'primitive', name: 'any' } }, initial: { kind: 'array', elements: [] }, loc: node.loc } as any);
  return lines.join('\n');
}

// ── Phase 2: Auth (Svelte context) ──────────────────

function genSvelteAuthCode(node: AuthDecl): string {
  const lines: string[] = [
    `// Generated by 0x — Svelte Auth: ${node.provider}`,
    `<script>`,
    `  import { setContext, getContext } from 'svelte';`,
    '',
    `  const AUTH_KEY = Symbol('auth');`,
    '',
    `  export function createAuth() {`,
    `    let user = $state(null);`,
    `    let loading = $state(false);`,
    `    let error = $state(null);`,
    '',
  ];

  if (node.loginFields.length > 0) {
    const params = node.loginFields.join(', ');
    lines.push(`    async function login(${params}) {`);
    lines.push(`      loading = true; error = null;`);
    lines.push(`      try {`);
    lines.push(`        const res = await fetch('/api/auth/login', {`);
    lines.push(`          method: 'POST',`);
    lines.push(`          headers: { 'Content-Type': 'application/json' },`);
    lines.push(`          body: JSON.stringify({ ${params} }),`);
    lines.push(`        });`);
    lines.push(`        const data = await res.json();`);
    lines.push(`        if (!res.ok) throw new Error(data.message || 'Login failed');`);
    lines.push(`        user = data.user;`);
    lines.push(`        return data;`);
    lines.push(`      } catch (e) { error = e.message; throw e; }`);
    lines.push(`      finally { loading = false; }`);
    lines.push(`    }`);
    lines.push('');
  }

  if (node.signupFields.length > 0) {
    const params = node.signupFields.join(', ');
    lines.push(`    async function signup(${params}) {`);
    lines.push(`      loading = true; error = null;`);
    lines.push(`      try {`);
    lines.push(`        const res = await fetch('/api/auth/signup', {`);
    lines.push(`          method: 'POST',`);
    lines.push(`          headers: { 'Content-Type': 'application/json' },`);
    lines.push(`          body: JSON.stringify({ ${params} }),`);
    lines.push(`        });`);
    lines.push(`        const data = await res.json();`);
    lines.push(`        if (!res.ok) throw new Error(data.message || 'Sign up failed');`);
    lines.push(`        user = data.user;`);
    lines.push(`        return data;`);
    lines.push(`      } catch (e) { error = e.message; throw e; }`);
    lines.push(`      finally { loading = false; }`);
    lines.push(`    }`);
    lines.push('');
  }

  lines.push(`    async function logout() {`);
  lines.push(`      await fetch('/api/auth/logout', { method: 'POST' });`);
  lines.push(`      user = null;`);
  lines.push(`    }`);
  lines.push('');
  lines.push(`    const auth = {`);
  lines.push(`      get user() { return user; },`);
  lines.push(`      get loading() { return loading; },`);
  lines.push(`      get error() { return error; },`);
  lines.push(`      login, signup, logout,`);
  lines.push(`    };`);
  lines.push(`    setContext(AUTH_KEY, auth);`);
  lines.push(`    return auth;`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  export function useAuth() {`);
  lines.push(`    return getContext(AUTH_KEY);`);
  lines.push(`  }`);
  lines.push(`</script>`);

  return lines.join('\n');
}

// ── Phase 2: Route (SvelteKit-compatible config) ────

function genSvelteRouteCode(node: RouteDecl): string {
  const lines: string[] = [];
  lines.push(`// Route: ${node.path} -> ${node.target}`);
  if (node.guard) {
    lines.push(`// Guard: ${node.guard}`);
    lines.push(`// SvelteKit: create src/routes${node.path}/+page.svelte with ${node.target} component`);
    lines.push(`// Add load guard in +page.server.js`);
  } else {
    lines.push(`// SvelteKit: create src/routes${node.path}/+page.svelte with ${node.target} component`);
  }
  return lines.join('\n');
}

// ── Phase 2: Model (CRUD API + Svelte stores) ───────

function genSvelteModelCode(node: ModelNode): string {
  const name = node.name;
  const lower = name.toLowerCase();
  const lines: string[] = [
    `// Generated by 0x — Svelte Model: ${name}`,
    '',
  ];

  // JSDoc type
  lines.push(`/** @typedef {Object} ${name}`);
  for (const f of node.fields) {
    lines.push(` * @property {${typeExprToJs(f.fieldType)}} ${f.name}`);
  }
  lines.push(' */');
  lines.push('');

  // CRUD API (framework-agnostic)
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

  // Svelte store-like functions using $state
  lines.push(`function create${name}Store(params = {}) {`);
  lines.push(`  let data = $state([]);`);
  lines.push(`  let loading = $state(true);`);
  lines.push(`  let error = $state(null);`);
  lines.push(`  async function fetch${name}s() {`);
  lines.push(`    loading = true;`);
  lines.push(`    try {`);
  lines.push(`      data = await ${name}API.findAll(params);`);
  lines.push(`      error = null;`);
  lines.push(`    } catch (e) {`);
  lines.push(`      error = e.message;`);
  lines.push(`    } finally {`);
  lines.push(`      loading = false;`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`  return {`);
  lines.push(`    get data() { return data; },`);
  lines.push(`    get loading() { return loading; },`);
  lines.push(`    get error() { return error; },`);
  lines.push(`    refetch: fetch${name}s,`);
  lines.push(`  };`);
  lines.push(`}`);

  return lines.join('\n');
}

// ── Standalone expression helper ────────────────────

function genExprStandalone(expr: Expression): string {
  const c = newCtx();
  return genExpr(expr, c);
}

