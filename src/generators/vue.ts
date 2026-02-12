// 0x → Vue 3 (Composition API) Code Generator

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
import { getVueThemeRenderer, type ThemeName, type ThemeHelpers } from './themes.js';

interface VueContext {
  imports: Set<string>;
  states: Map<string, StateDecl>;
  derivedNames: Set<string>;
  styles: Map<string, StyleDecl>;
  extraScriptLines: string[];
  props: PropDecl[];
  theme: ThemeName | null;
  themeImports: Set<string>;
  debug: boolean;
}

function newCtx(debug = false): VueContext {
  return { imports: new Set(), states: new Map(), derivedNames: new Set(), styles: new Map(), extraScriptLines: [], props: [], theme: null, themeImports: new Set(), debug };
}

export function generateVue(ast: ASTNode[], debug = false): GeneratedCode {
  const parts: string[] = [];
  const themeNode = ast.find(n => n.type === 'ThemeDecl') as any;
  const theme: ThemeName | null = themeNode ? themeNode.theme as ThemeName : null;

  for (const node of ast) {
    if (node.type === 'ThemeDecl') {
      // Handled above
    } else if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
      parts.push(generateVueComponent(node, theme, debug));
    } else if (node.type === 'Model') {
      parts.push(genVueModelCode(node as ModelNode));
    } else if (node.type === 'AuthDecl') {
      parts.push(genVueAuthCode(node as AuthDecl));
    } else if (node.type === 'RouteDecl') {
      parts.push(genVueRouteCode(node as RouteDecl));
    } else {
      const backend = generateBackendCode(node);
      if (backend) parts.push(backend);
    }
  }
  const code = parts.join('\n\n');

  // Build V3 source map from 0x:L### comments
  const sourceFile = ast.find(n => n.type === 'Page' || n.type === 'Component' || n.type === 'App') as any;
  const srcName = sourceFile?.name ? `${sourceFile.name}.0x` : 'source.0x';
  const smb = new SourceMapBuilder(srcName, 'Component.vue');
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
    filename: 'Component.vue',
    imports: [],
    lineCount: lines.length,
    tokenCount: code.split(/\s+/).length,
    sourceMap: smb.toJSON(),
  };
}

function generateVueComponent(node: PageNode | ComponentNode | AppNode, theme: ThemeName | null = null, debug = false): string {
  const c = newCtx(debug);
  c.theme = theme;

  for (const child of node.body) {
    if (child.type === 'StateDecl') c.states.set(child.name, child);
    if (child.type === 'DerivedDecl') c.derivedNames.add(child.name);
    if (child.type === 'StyleDecl') c.styles.set(child.name, child);
  }

  // Generate script section
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
        scriptLines.push(`${tlv.keyword} ${tlv.name} = ${genExpr(tlv.value, c, true)};`);
        break;
      }
      case 'StoreDecl': scriptLines.push(genVueStore(child as StoreDecl, c)); break;
      case 'DataDecl': scriptLines.push(genVueDataDecl(child as DataDecl, c)); break;
      case 'FormDecl': scriptLines.push(genVueFormDecl(child as FormDecl, c)); break;
      case 'RealtimeDecl': scriptLines.push(genVueRealtimeDecl(child as RealtimeDecl, c)); break;
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
      const defaultStr = p.defaultValue ? `, default: ${genExpr(p.defaultValue, c)}` : '';
      return `${p.name}: { type: ${mapType(p.valueType)}${defaultStr} }`;
    }).join(', ');
    scriptLines.unshift(`const props = defineProps({ ${propEntries} });`);
  }

  const importItems = Array.from(c.imports).sort();
  const importLine = importItems.length > 0
    ? `import { ${importItems.join(', ')} } from 'vue';`
    : '';

  // Collect theme imports
  const themeImportLines = Array.from(c.themeImports).sort();

  const hasScript = importLine || scriptLines.length > 0 || c.extraScriptLines.length > 0 || themeImportLines.length > 0;
  const scriptSection = hasScript ? [
    '<script setup>',
    importLine,
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
    '<template>',
    ...templateParts.map(t => `  ${t}`),
    '</template>',
  ].filter(l => l !== undefined).join('\n');
}

// ── State ───────────────────────────────────────────

function genState(node: StateDecl, c: VueContext): string {
  c.imports.add('ref');
  if (c.debug) {
    c.imports.add('watch');
    return `const ${node.name} = ref(${genExpr(node.initial, c)});\nwatch(${node.name}, (v) => console.log('[0x] ${node.name} =', v));`;
  }
  return `const ${node.name} = ref(${genExpr(node.initial, c)});`;
}

function genDerived(node: DerivedDecl, c: VueContext): string {
  c.imports.add('computed');
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}const ${node.name} = computed(() => ${genExpr(node.expression, c, true)});`;
}

// genProp is now handled by merged declaration in generateVueComponent

function genFunction(node: FnDecl, c: VueContext): string {
  const params = node.params.map(p => p.name).join(', ');
  const asyncKw = node.isAsync ? 'async ' : '';
  const debugLog = c.debug ? `console.log('[0x] ${node.name}()', ${params ? `{${params}}` : ''});\n  ` : '';
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}${asyncKw}function ${node.name}(${params}) {\n  ${debugLog}${body}\n}`;
}

function genOnMount(node: OnMount, c: VueContext): string {
  c.imports.add('onMounted');
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const asyncKw = bodyContainsAwait(node.body) ? 'async ' : '';
  const debugLog = c.debug ? `console.log('[0x] mounted');\n  ` : '';
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}onMounted(${asyncKw}() => {\n  ${debugLog}${body}\n});`;
}

function genOnDestroy(node: OnDestroy, c: VueContext): string {
  c.imports.add('onUnmounted');
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const debugLog = c.debug ? `console.log('[0x] unmounting');\n  ` : '';
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  return `${sc}onUnmounted(() => {\n  ${debugLog}${body}\n});`;
}

function genWatch(node: WatchBlock, c: VueContext): string {
  c.imports.add('watch');
  const body = node.body.map(s => genStmt(s, c)).join('\n  ');
  const asyncKw = bodyContainsAwait(node.body) ? 'async ' : '';
  const vars = node.variables || [node.variable];
  const sc = node.loc?.line ? `// 0x:L${node.loc.line}\n` : '';
  if (vars.length === 1) {
    return `${sc}watch(${vars[0]}, ${asyncKw}() => {\n  ${body}\n});`;
  }
  return `${sc}watch([${vars.join(', ')}], ${asyncKw}() => {\n  ${body}\n});`;
}

function genCheck(node: CheckDecl, c: VueContext): string {
  return `if (!(${genExpr(node.condition, c, true)})) console.error('${node.message}');`;
}

function genApi(node: ApiDecl, c: VueContext): string {
  if (c.debug) {
    return `async function ${node.name}(params) {\n  console.log('[0x] ${node.method} ${node.url}', params);\n  const res = await fetch('${node.url}', { method: '${node.method}' });\n  const data = await res.json();\n  console.log('[0x] ${node.name} response:', data);\n  return data;\n}`;
  }
  return `async function ${node.name}(params) {\n  const res = await fetch('${node.url}', { method: '${node.method}' });\n  return res.json();\n}`;
}

// ── UI Nodes ────────────────────────────────────────

function srcComment(node: { loc?: { line: number } }): string {
  return node.loc?.line ? `<!-- 0x:L${node.loc.line} -->` : '';
}

function genUINode(node: UINode, c: VueContext): string {
  // Check for themed renderer
  if (c.theme) {
    const renderer = getVueThemeRenderer(c.theme, node.type);
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
      return `<div style="width: 100%; background-color: #e2e8f0; border-radius: 9999px; height: 8px; overflow: hidden">\n<div :style="{ width: (${val} / ${max}) * 100 + '%', backgroundColor: '#3b82f6', height: '100%', borderRadius: '9999px', transition: 'width 0.3s' }" />\n</div>`;
    }
    case 'Comment': return `<!-- ${(node as CommentNode).text} -->`;
    default: return `<!-- unsupported: ${(node as UINode).type} -->`;
  }
}

function genLayout(node: LayoutNode, c: VueContext): string {
  const style: string[] = [];
  const dynamicEntries: string[] = [];

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
    const isDynamic = val.kind === 'braced' || val.kind === 'ternary' || val.kind === 'binary' || val.kind === 'member' || val.kind === 'call';
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
      case 'bg':
        if (isDynamic) {
          dynamicEntries.push(`backgroundColor: ${v}`);
        } else {
          style.push(`background-color: ${unquote(v)}`);
        }
        break;
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

  const styleStr = style.join('; ');
  let attrs = `style="${styleStr}"`;
  if (dynamicEntries.length > 0) {
    attrs += ` :style="{ ${dynamicEntries.join(', ')} }"`;
  }
  let className: string | null = null;
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { className = unquote(genExpr(val, c)); break; }
  }
  if (className) attrs = `class="${className}" ${attrs}`;
  const extra = getPassthroughProps(node.props, KNOWN_LAYOUT_PROPS, e => genExpr(e, c), 'vue');
  const children = node.children.map(ch => genUINode(ch, c)).join('\n  ');
  const sc = srcComment(node);
  return `${sc}<div ${attrs}${extra}>\n  ${children}\n</div>`;
}

function genText(node: TextNode, c: VueContext): string {
  const { staticStyle, dynamicStyle } = genTextStyle(node, c);
  let styleAttr = '';
  if (dynamicStyle) {
    // Has dynamic values — use :style binding with JS object
    styleAttr = ` :style="${dynamicStyle}"`;
  } else if (staticStyle) {
    styleAttr = ` style="${staticStyle}"`;
  }
  const content = genTextContent(node.content, c);
  let classAttr = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') { classAttr = ` class="${unquote(genExpr(val, c))}"`; break; }
  }
  const extra = getPassthroughProps(node.props, KNOWN_TEXT_PROPS, e => genExpr(e, c), 'vue');

  const badgeExpr = node.props['badge'];
  const tooltipExpr = node.props['tooltip'];
  const sc = srcComment(node);
  let result = `${sc}<span${classAttr}${styleAttr}${extra}>${content}</span>`;

  if (badgeExpr) {
    const badge = genExpr(badgeExpr, c);
    result = `<span style="position: relative; display: inline-flex; align-items: center">\n<span${styleAttr}>${content}</span>\n<span style="margin-left: 6px; padding: 2px 6px; font-size: 12px; font-weight: bold; border-radius: 9999px; background-color: #ef4444; color: #fff; min-width: 20px; text-align: center">{{ ${badge} }}</span>\n</span>`;
  }

  if (tooltipExpr) {
    const tooltip = genExpr(tooltipExpr, c);
    result = `<span title="${unquote(tooltip)}">${badgeExpr ? result : `<span${styleAttr}>${content}</span>`}</span>`;
  }

  return result;
}

function genButton(node: ButtonNode, c: VueContext): string {
  const label = genTextContent(node.label, c);
  const action = genActionExpr(node.action, c);
  const attrs: string[] = [];
  let className: string | null = null;
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'class': className = unquote(v); break;
      case 'style': {
        const sv = unquote(v);
        if (sv === 'primary') attrs.push('style="background-color: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer"');
        else if (sv === 'danger') attrs.push('style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer"');
        break;
      }
      case 'disabled': attrs.push(`:disabled="${v}"`); break;
    }
  }
  if (className) attrs.push(`class="${className}"`);
  const extra = getPassthroughProps(node.props, KNOWN_BUTTON_PROPS, e => genExpr(e, c), 'vue');
  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const sc = srcComment(node);
  return `${sc}<button @click="${action}"${attrStr}${extra}>${label}</button>`;
}

function genInput(node: InputNode, c: VueContext): string {
  const props: string[] = [`v-model="${node.binding}"`];
  let className: string | null = null;
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    if (key === 'class') className = unquote(v);
    else if (key === 'placeholder') props.push(`placeholder="${unquote(v)}"`);
    else if (key === 'type') props.push(`type="${unquote(v)}"`);
    else if (key === '@keypress') props.push(`@keypress="e => ${v}(e.key)"`);
    else if (key === 'grow') props.push(`style="flex-grow: ${v}"`);
  }
  if (className) props.push(`class="${className}"`);
  const extra = getPassthroughProps(node.props, KNOWN_INPUT_PROPS, e => genExpr(e, c), 'vue');
  const sc = srcComment(node);
  return `${sc}<input ${props.join(' ')}${extra} />`;
}

function genImage(node: ImageNode, c: VueContext): string {
  const src = genExpr(node.src, c);
  const style: string[] = [];
  let className: string | null = null;
  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    switch (key) {
      case 'class': className = unquote(v); break;
      case 'round': style.push('border-radius: 50%'); break;
      case 'radius': style.push(`border-radius: ${addPx(unquote(v))}`); break;
      case 'size': style.push(`width: ${addPx(unquote(v))}; height: ${addPx(unquote(v))}`); break;
    }
  }
  const alt = node.props['alt'] ? ` alt="${unquote(genExpr(node.props['alt'], c))}"` : '';
  const classAttr = className ? ` class="${className}"` : '';
  const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';
  const extra = getPassthroughProps(node.props, KNOWN_IMAGE_PROPS, e => genExpr(e, c), 'vue');
  return `<img :src="${src}"${classAttr}${alt}${styleAttr}${extra} />`;
}

function genLink(node: LinkNode, c: VueContext): string {
  const label = genTextContent(node.label, c);
  const href = genExpr(node.href, c);
  let classAttr = '';
  for (const [key, val] of Object.entries(node.props || {})) {
    if (key === 'class') { classAttr = ` class="${unquote(genExpr(val, c))}"`; break; }
  }
  const extra = getPassthroughProps(node.props || {}, KNOWN_LINK_PROPS, e => genExpr(e, c), 'vue');
  return `<a :href="${href}"${classAttr}${extra}>${label}</a>`;
}

function genToggle(node: ToggleNode, c: VueContext): string {
  let classAttr = '';
  for (const [key, val] of Object.entries(node.props || {})) {
    if (key === 'class') { classAttr = ` class="${unquote(genExpr(val, c))}"`; break; }
  }
  const extra = getPassthroughProps(node.props || {}, KNOWN_TOGGLE_PROPS, e => genExpr(e, c), 'vue');
  return `<input type="checkbox" v-model="${node.binding}"${classAttr}${extra} />`;
}

function genSelect(node: SelectNode, c: VueContext): string {
  const options = genExpr(node.options, c);
  let classAttr = '';
  for (const [key, val] of Object.entries(node.props || {})) {
    if (key === 'class') { classAttr = ` class="${unquote(genExpr(val, c))}"`; break; }
  }
  const extra = getPassthroughProps(node.props || {}, KNOWN_SELECT_PROPS, e => genExpr(e, c), 'vue');
  return `<select v-model="${node.binding}"${classAttr}${extra}>\n  <option v-for="opt in ${options}" :key="opt" :value="opt">{{ opt }}</option>\n</select>`;
}

function genComponentCall(node: ComponentCall, c: VueContext): string {
  const props = Object.entries(node.args)
    .filter(([k]) => !k.startsWith('_arg'))
    .map(([k, v]) => `:${k}="${genExpr(v, c)}"`);
  const propsStr = props.length > 0 ? ` ${props.join(' ')}` : '';

  if (node.children && node.children.length > 0) {
    const childrenHtml = node.children.map(ch => genUINode(ch, c)).join('\n  ');
    return `<${node.name}${propsStr}>\n  ${childrenHtml}\n</${node.name}>`;
  }

  return `<${node.name}${propsStr} />`;
}

function genIf(node: IfBlock, c: VueContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  let result = `<div v-if="${cond}">\n  ${body}\n</div>`;

  for (const elif of node.elifs) {
    const ec = genExpr(elif.condition, c);
    const eb = elif.body.map(ch => genUINode(ch, c)).join('\n  ');
    result += `\n<div v-else-if="${ec}">\n  ${eb}\n</div>`;
  }

  if (node.elseBody) {
    const eb = node.elseBody.map(ch => genUINode(ch, c)).join('\n  ');
    result += `\n<div v-else>\n  ${eb}\n</div>`;
  }

  return result;
}

function genFor(node: ForBlock, c: VueContext): string {
  const iter = genExpr(node.iterable, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  const binding = node.index ? `(${node.item}, ${node.index})` : node.item;
  return `<div v-for="${binding} in ${iter}" :key="${node.item}">\n  ${body}\n</div>`;
}

function genShow(node: ShowBlock, c: VueContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<div v-show="${cond}">\n  ${body}\n</div>`;
}

function genHide(node: HideBlock, c: VueContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<div v-show="!${cond}">\n  ${body}\n</div>`;
}

// ── Advanced UI Components ──────────────────────────

function genTableUI(node: TableNode, c: VueContext): string {
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
  lines.push(`<tr v-for="(row, idx) in ${data}" :key="idx" style="border-bottom: 1px solid #e2e8f0">`);
  for (const col of node.columns) {
    if (col.kind === 'select') {
      lines.push(`<td style="padding: 12px 8px"><input type="checkbox" /></td>`);
    } else if (col.kind === 'field') {
      let content = `{{ row.${col.field} }}`;
      if (col.format === 'date') content = `{{ new Date(row.${col.field}).toLocaleDateString() }}`;
      lines.push(`<td style="padding: 12px 8px">${content}</td>`);
    } else if (col.kind === 'actions') {
      lines.push(`<td style="padding: 12px 8px; text-align: right">`);
      for (const action of (col.actions || [])) {
        if (action === 'edit') lines.push(`<button @click="onEdit(row)" style="margin-right: 4px; padding: 4px 8px; font-size: 13px; cursor: pointer">Edit</button>`);
        if (action === 'delete') lines.push(`<button @click="onDelete(row)" style="padding: 4px 8px; font-size: 13px; cursor: pointer; color: #e53e3e">Delete</button>`);
      }
      lines.push(`</td>`);
    }
  }
  lines.push(`</tr>`);
  lines.push(`</tbody></table>`);
  return lines.join('\n');
}

function genChartUI(node: ChartNode, c: VueContext): string {
  return `<div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px"><!-- Chart: ${node.chartType} --><canvas ref="${node.name}Chart"></canvas></div>`;
}

function genStatUI(node: StatNode, c: VueContext): string {
  const value = genExpr(node.value, c);
  return `<div style="padding: 20px; border-radius: 12px; background: #f7fafc; border: 1px solid #e2e8f0"><div style="font-size: 14px; color: #718096">${node.label}</div><div style="font-size: 32px; font-weight: bold; margin-top: 4px">{{ ${value} }}</div></div>`;
}

function genNavUI(node: NavNode, c: VueContext): string {
  const lines: string[] = [];
  lines.push(`<nav style="display: flex; gap: 16px; padding: 12px 24px; background-color: #fff; border-bottom: 1px solid #e2e8f0; align-items: center">`);
  for (const item of node.items) {
    const iconPart = item.icon ? `<span style="margin-right: 6px">${item.icon}</span>` : '';
    lines.push(`<a href="${item.href}" style="text-decoration: none; color: #4a5568; font-weight: 500; padding: 8px 12px; border-radius: 6px">${iconPart}${item.label}</a>`);
  }
  lines.push(`</nav>`);
  return lines.join('\n');
}

function genUploadUI(node: UploadNode, c: VueContext): string {
  c.imports.add('ref');
  const name = node.name;
  return `<div style="border: 2px dashed #cbd5e0; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer" @click="$refs.${name}Input?.click()"><input ref="${name}Input" type="file"${node.accept ? ` accept="${node.accept}"` : ''} style="display: none" /><span style="color: #a0aec0">Click to select file</span></div>`;
}

function genModalUI(node: ModalNode, c: VueContext): string {
  c.imports.add('ref');
  const showVar = `show${capitalize(node.name)}`;
  c.extraScriptLines.push(`const ${showVar} = ref(false);`);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  const lines: string[] = [];
  if (node.trigger) {
    lines.push(`<button @click="${showVar} = true" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer">${node.trigger}</button>`);
  }
  lines.push(`<Teleport to="body">`);
  lines.push(`<div v-if="${showVar}" style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000" @click="${showVar} = false">`);
  lines.push(`  <div style="background-color: #fff; border-radius: 12px; padding: 24px; min-width: 400px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15)" @click.stop>`);
  lines.push(`    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">`);
  lines.push(`      <h2 style="margin: 0; font-size: 20px">${capitalize(node.title)}</h2>`);
  lines.push(`      <button @click="${showVar} = false" style="border: none; background: none; font-size: 20px; cursor: pointer; padding: 4px">&times;</button>`);
  lines.push(`    </div>`);
  lines.push(`    ${body}`);
  lines.push(`  </div>`);
  lines.push(`</div>`);
  lines.push(`</Teleport>`);
  return lines.join('\n');
}

function genToastUI(node: ToastNode, c: VueContext): string {
  return `<div v-if="toast.visible" style="position: fixed; top: 16px; right: 16px; padding: 12px 20px; border-radius: 8px; background-color: #333; color: #fff; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15)">{{ toast.message }}</div>`;
}

function genHeroUI(node: HeroNode, c: VueContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<section style="text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff">\n  ${body}\n</section>`;
}

function genCrudUI(node: CrudNode, c: VueContext): string {
  return `<div class="crud-${node.model.toLowerCase()}"><!-- CRUD: ${node.model} --><h2>${node.model} Management</h2></div>`;
}

function genListUI(node: ListNode, c: VueContext): string {
  const data = genExpr(node.dataSource, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  return `<div style="display: flex; flex-direction: column; gap: 8px"><div v-for="item in ${data}" :key="item.id" style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px">\n    ${body}\n  </div></div>`;
}

function genDrawerUI(node: DrawerNode, c: VueContext): string {
  c.imports.add('ref');
  const showVar = `show${capitalize(node.name)}`;
  c.extraScriptLines.push(`const ${showVar} = ref(false);`);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  return `<Teleport to="body"><div v-if="${showVar}" style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); z-index: 1000" @click="${showVar} = false"><div style="position: fixed; top: 0; right: 0; bottom: 0; width: 320px; background-color: #fff; padding: 24px; box-shadow: -2px 0 8px rgba(0,0,0,0.1); overflow-y: auto" @click.stop>\n    ${body}\n  </div></div></Teleport>`;
}

function genCommandUI(node: CommandNode, c: VueContext): string {
  return `<div style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); width: 500px; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); z-index: 1000; padding: 8px"><input placeholder="Type a command..." style="width: 100%; padding: 12px 16px; border: none; font-size: 16px; outline: none" /></div>`;
}

function genConfirmUI(node: ConfirmNode, c: VueContext): string {
  const desc = node.description ? `<p style="color: #718096; margin: 8px 0 0 0">${node.description}</p>` : '';
  const dangerStyle = node.danger ? 'background-color: #e53e3e' : 'background-color: #3182ce';
  return `<div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000"><div style="background: #fff; border-radius: 12px; padding: 24px; max-width: 400px"><p style="font-weight: 600; margin: 0">${node.message}</p>${desc}<div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px"><button @click="onCancel" style="padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer">${node.cancelLabel}</button><button @click="onConfirm" style="padding: 8px 16px; border-radius: 6px; ${dangerStyle}; color: #fff; border: none; cursor: pointer">${node.confirmLabel}</button></div></div></div>`;
}

function genPayUI(node: PayNode, c: VueContext): string {
  return `<div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px"><!-- Payment: ${node.provider} --><button style="width: 100%; padding: 12px; background: #635bff; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer">Pay Now</button></div>`;
}

function genCartUI(node: CartNode, c: VueContext): string {
  return `<div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px"><!-- Cart --><h3 style="margin: 0 0 12px 0">Shopping Cart</h3><div v-for="item in cartItems" :key="item.id" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0"><span>{{ item.name }}</span><span>{{ item.price }}</span></div></div>`;
}

function genMediaUI(node: MediaNode, c: VueContext): string {
  return `<div style="border-radius: 12px; overflow: hidden"><!-- Media: ${node.mediaType} --></div>`;
}

function genNotificationUI(node: NotificationNode, c: VueContext): string {
  return `<div style="position: fixed; top: 16px; right: 16px; z-index: 2000; display: flex; flex-direction: column; gap: 8px"><div v-for="n in notifications" :key="n.id" style="padding: 12px 20px; border-radius: 8px; background-color: #333; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15)">{{ n.message }}</div></div>`;
}

function genSearchUI(node: SearchNode, c: VueContext): string {
  c.imports.add('ref');
  return `<div style="position: relative"><input v-model="searchQuery" placeholder="Search..." style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px" /></div>`;
}

function genFilterUI(node: FilterNode, c: VueContext): string {
  return `<div style="display: flex; gap: 8px; flex-wrap: wrap"><!-- Filter: ${node.target} --></div>`;
}

function genSocialUI(node: SocialNode, c: VueContext): string {
  return `<div style="display: flex; gap: 12px; align-items: center"><!-- Social: ${node.socialType} --><button style="padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; cursor: pointer">Like</button></div>`;
}

function genProfileUI(node: ProfileNode, c: VueContext): string {
  return `<div style="display: flex; gap: 16px; align-items: center; padding: 20px"><!-- Profile --><div style="width: 64px; height: 64px; border-radius: 50%; background-color: #e2e8f0"></div><div><div style="font-weight: 600">User Profile</div></div></div>`;
}

function genFeaturesUI(node: FeaturesNode, c: VueContext): string {
  const items = node.items.map(item => `<div style="padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0"><div style="font-size: 24px; margin-bottom: 12px">${item.icon}</div><h3 style="margin: 0 0 8px 0">${item.title}</h3><p style="color: #718096; margin: 0">${item.description}</p></div>`).join('\n  ');
  return `<section style="padding: 60px 20px"><h2 style="text-align: center; margin-bottom: 40px">Features</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">\n  ${items}\n</div></section>`;
}

function genPricingUI(node: PricingNode, c: VueContext): string {
  const plans = node.plans.map(plan => {
    const features = plan.features.map(f => `<li style="padding: 4px 0">${f}</li>`).join('');
    const hl = plan.highlighted ? 'border: 2px solid #3182ce; transform: scale(1.05)' : 'border: 1px solid #e2e8f0';
    return `<div style="padding: 32px; border-radius: 12px; ${hl}"><h3 style="margin: 0">${plan.name}</h3><div style="font-size: 32px; font-weight: bold; margin: 16px 0">${genExpr(plan.price, c)}</div><ul style="list-style: none; padding: 0; margin: 16px 0">${features}</ul><button style="width: 100%; padding: 10px; border-radius: 6px; background-color: #3182ce; color: #fff; border: none; cursor: pointer">${plan.cta}</button></div>`;
  }).join('\n  ');
  return `<section style="padding: 60px 20px"><h2 style="text-align: center; margin-bottom: 40px">Pricing</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 0 auto">\n  ${plans}\n</div></section>`;
}

function genFaqUI(node: FaqNode, c: VueContext): string {
  const items = node.items.map(item => `<details style="border-bottom: 1px solid #e2e8f0; padding: 16px 0"><summary style="cursor: pointer; font-weight: 600">${item.question}</summary><p style="color: #718096; margin: 8px 0 0 0">${item.answer}</p></details>`).join('\n  ');
  return `<section style="padding: 60px 20px; max-width: 700px; margin: 0 auto"><h2 style="text-align: center; margin-bottom: 40px">FAQ</h2>\n  ${items}\n</section>`;
}

function genTestimonialUI(node: TestimonialNode, c: VueContext): string {
  const items = node.items.map(item => `<div style="padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0"><p style="margin: 0 0 16px 0; font-style: italic">"${item.text}"</p><div style="display: flex; align-items: center; gap: 12px"><div style="width: 40px; height: 40px; border-radius: 50%; background-color: #e2e8f0"></div><div><div style="font-weight: 600">${item.name}</div><div style="font-size: 14px; color: #718096">${item.role}</div></div></div></div>`).join('\n  ');
  return `<section style="padding: 60px 20px"><h2 style="text-align: center; margin-bottom: 40px">Testimonials</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">\n  ${items}\n</div></section>`;
}

function genFooterUI(node: FooterNode, c: VueContext): string {
  const cols = node.columns.map(col => {
    const links = col.links.map(l => `<a href="${l.href}" style="display: block; color: #a0aec0; text-decoration: none; padding: 4px 0">${l.label}</a>`).join('');
    return `<div><h4 style="color: #fff; margin: 0 0 12px 0">${col.title}</h4>${links}</div>`;
  }).join('\n  ');
  return `<footer style="padding: 40px 20px; background-color: #1a202c; color: #a0aec0"><div style="display: grid; grid-template-columns: repeat(${node.columns.length}, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto">\n  ${cols}\n</div></footer>`;
}

function genAdminUI(node: AdminNode, c: VueContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n    ');
  return `<div style="display: grid; grid-template-columns: 240px 1fr; min-height: 100vh"><aside style="background-color: #1a202c; color: #fff; padding: 20px"><h3 style="margin: 0 0 20px 0">Admin</h3></aside><main style="padding: 24px">\n    ${body}\n  </main></div>`;
}

function genAnimateUI(node: AnimateNode, c: VueContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<Transition name="${node.animType}">\n  ${body}\n</Transition>`;
}

function genAiUI(node: AiNode, c: VueContext): string {
  return `<div style="display: flex; flex-direction: column; height: 100%"><!-- AI: ${node.aiType} --><div style="flex: 1; overflow-y: auto; padding: 16px"></div><div style="padding: 16px; border-top: 1px solid #e2e8f0"><input placeholder="Type a message..." style="width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0" /></div></div>`;
}

function genResponsiveUI(node: ResponsiveNode, c: VueContext): string {
  const body = node.body.map(ch => genUINode(ch, c)).join('\n  ');
  return `<div class="responsive-container">\n  ${body}\n</div>`;
}

function genBreadcrumbUI(node: BreadcrumbNode, c: VueContext): string {
  return `<nav style="display: flex; align-items: center; padding: 12px 0; font-size: 14px"><!-- Breadcrumb --></nav>`;
}

function genStatsGridUI(node: StatsGridNode, c: VueContext): string {
  const stats = node.stats.map(s => genStatUI(s, c)).join('\n  ');
  return `<div style="display: grid; grid-template-columns: repeat(${node.cols || 4}, 1fr); gap: 16px">\n  ${stats}\n</div>`;
}

function genErrorUI(node: ErrorNode, c: VueContext): string {
  const fallback = node.fallback.map(ch => genUINode(ch, c)).join('\n    ');
  if (node.errorType === 'boundary') {
    return `<div v-if="hasError" style="padding: 24px; text-align: center; color: #e53e3e">\n    ${fallback || '<p>An error occurred</p>'}\n  </div>`;
  }
  return `<!-- Error handler: ${node.errorType} -->`;
}

function genLoadingUI(node: LoadingNode, c: VueContext): string {
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

function genOfflineUI(node: OfflineNode, c: VueContext): string {
  return `<div v-if="!navigator.onLine" style="padding: 24px; text-align: center; background-color: #fff3cd; border-radius: 8px"><p style="margin: 0; color: #856404">You are currently offline</p></div>`;
}

// ── Helpers ─────────────────────────────────────────

function genExpr(expr: Expression, c: VueContext, useValue: boolean = false): string {
  const suffix = useValue ? '.value' : '';
  switch (expr.kind) {
    case 'number': return String(expr.value);
    case 'string': return `'${expr.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    case 'boolean': return String(expr.value);
    case 'null': return 'null';
    case 'identifier':
      if (useValue && (c.states.has(expr.name) || c.derivedNames.has(expr.name))) return `${expr.name}.value`;
      return expr.name;
    case 'member': return `${genExpr(expr.object, c, useValue)}.${expr.property}`;
    case 'index': return `${genExpr(expr.object, c, useValue)}[${genExpr(expr.index, c, useValue)}]`;
    case 'call': {
      const callee = genExpr(expr.callee, c, useValue);
      const args = expr.args.map(a => genExpr(a, c, useValue)).join(', ');
      return `${callee}(${args})`;
    }
    case 'binary': return `${genExpr(expr.left, c, useValue)} ${expr.op} ${genExpr(expr.right, c, useValue)}`;
    case 'unary': return `${expr.op}${genExpr(expr.operand, c, useValue)}`;
    case 'ternary': return `${genExpr(expr.condition, c, useValue)} ? ${genExpr(expr.consequent, c, useValue)} : ${genExpr(expr.alternate, c, useValue)}`;
    case 'arrow': {
      const params = expr.params.join(', ');
      if (!Array.isArray(expr.body)) return `(${params}) => ${genExpr(expr.body as Expression, c, useValue)}`;
      const body = (expr.body as Statement[]).map(s => genStmt(s, c)).join('\n');
      return `(${params}) => { ${body} }`;
    }
    case 'array': return `[${expr.elements.map(e => genExpr(e, c, useValue)).join(', ')}]`;
    case 'object_expr': {
      if (expr.properties.length === 0) return '{}';
      const ps = expr.properties.map(p => `${p.key}: ${genExpr(p.value, c, useValue)}`).join(', ');
      return `{ ${ps} }`;
    }
    case 'template': {
      const inner = expr.parts.map(p => typeof p === 'string' ? p : `\${${genExpr(p, c, useValue)}}`).join('');
      return `\`${inner}\``;
    }
    case 'assignment': {
      const target = genExpr(expr.target, c);
      const value = genExpr(expr.value, c);
      if (c.states.has(extractName(expr.target))) {
        return `${extractName(expr.target)}.value ${expr.op} ${value}`;
      }
      return `${target} ${expr.op} ${value}`;
    }
    case 'await': return `await ${genExpr(expr.expression, c, useValue)}`;
    case 'old': return genExpr(expr.expression, c, useValue);
    case 'braced': return genExpr(expr.expression, c, useValue);
  }
}

function genStmt(stmt: Statement, c: VueContext): string {
  switch (stmt.kind) {
    case 'expr_stmt': return genExpr(stmt.expression, c, true) + ';';
    case 'return': return stmt.value ? `return ${genExpr(stmt.value, c, true)};` : 'return;';
    case 'assignment_stmt': {
      const name = extractName(stmt.target);
      if (c.states.has(name)) {
        const target = genExpr(stmt.target, c, true);
        const value = genExpr(stmt.value, c, true);
        return `${target} ${stmt.op} ${value};`;
      }
      return `${genExpr(stmt.target, c)} ${stmt.op} ${genExpr(stmt.value, c)};`;
    }
    case 'var_decl': return `const ${stmt.name} = ${genExpr(stmt.value, c)};`;
    case 'if_stmt': {
      const cond = genExpr(stmt.condition, c, true);
      const body = stmt.body.map(s => genStmt(s, c)).join('\n  ');
      return `if (${cond}) {\n  ${body}\n}`;
    }
    case 'for_stmt': {
      const iter = genExpr(stmt.iterable, c, true);
      const body = stmt.body.map(s => genStmt(s, c)).join('\n  ');
      return `for (const ${stmt.item} of ${iter}) {\n  ${body}\n}`;
    }
  }
}

function genActionExpr(expr: Expression | Statement[], c: VueContext): string {
  if (Array.isArray(expr)) return '';
  if (expr.kind === 'assignment') {
    const name = extractName(expr.target);
    if (c.states.has(name)) {
      // In templates, refs auto-unwrap — use full target path without .value
      return `${genExpr(expr.target, c)} ${expr.op} ${genExpr(expr.value, c)}`;
    }
  }
  if (expr.kind === 'call') return genExpr(expr, c);
  return genExpr(expr, c);
}

function genTextContent(expr: Expression, c: VueContext): string {
  if (expr.kind === 'string') return expr.value;
  if (expr.kind === 'template') {
    return expr.parts.map(p => typeof p === 'string' ? p : `{{ ${genExpr(p, c)} }}`).join('');
  }
  return `{{ ${genExpr(expr, c)} }}`;
}

function genTextStyle(node: TextNode, c: VueContext): { staticStyle: string; dynamicStyle: string } {
  const staticParts: string[] = [];
  const dynamicEntries: string[] = [];
  let hasDynamic = false;

  for (const [key, val] of Object.entries(node.props)) {
    const v = genExpr(val, c);
    const isDynamic = val.kind === 'braced' || val.kind === 'ternary' || val.kind === 'binary' || val.kind === 'member' || val.kind === 'call';
    if (key === 'size') { const uv = unquote(v); staticParts.push(`font-size: ${SIZE_MAP[uv] || uv}`); }
    if (key === 'bold') staticParts.push('font-weight: bold');
    if (key === 'color') {
      if (isDynamic) {
        hasDynamic = true;
        dynamicEntries.push(`color: ${v}`);
      } else {
        staticParts.push(`color: ${unquote(v)}`);
      }
    }
    if (key === 'gradient') { const g = parseGradient(v); staticParts.push(`background: ${g}; -webkit-background-clip: text; -webkit-text-fill-color: transparent`); }
    if (key === 'center') staticParts.push('text-align: center');
    if (key === 'italic') staticParts.push('font-style: italic');
    if (key === 'underline') staticParts.push('text-decoration: underline');
    if (key === 'strike') {
      if (isDynamic) {
        hasDynamic = true;
        dynamicEntries.push(`textDecoration: ${v} ? 'line-through' : 'none'`);
      } else {
        staticParts.push('text-decoration: line-through');
      }
    }
    if (key === 'end') staticParts.push('text-align: right');
  }

  if (hasDynamic) {
    // Merge static and dynamic into a JS object for :style binding
    const allEntries: string[] = [];
    for (const part of staticParts) {
      const [prop, ...rest] = part.split(':');
      const jsKey = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      allEntries.push(`${jsKey}: '${rest.join(':').trim()}'`);
    }
    allEntries.push(...dynamicEntries);
    return { staticStyle: '', dynamicStyle: `{ ${allEntries.join(', ')} }` };
  }

  return { staticStyle: staticParts.join('; '), dynamicStyle: '' };
}

function mapType(t: { kind: string; name?: string }): string {
  if (t.kind === 'primitive') {
    switch (t.name) {
      case 'str': return 'String';
      case 'int': case 'float': return 'Number';
      case 'bool': return 'Boolean';
    }
  }
  return 'Object';
}

function extractName(expr: Expression): string {
  if (expr.kind === 'identifier') return expr.name;
  if (expr.kind === 'member') return extractName(expr.object);
  return '';
}

function bodyContainsAwait(stmts: Statement[]): boolean {
  return stmts.some(s => stmtHasAwait(s));
}

function stmtHasAwait(stmt: Statement): boolean {
  switch (stmt.kind) {
    case 'expr_stmt': return exprHasAwait(stmt.expression);
    case 'assignment_stmt': return exprHasAwait(stmt.value);
    case 'var_decl': return exprHasAwait(stmt.value);
    case 'return': return stmt.value ? exprHasAwait(stmt.value) : false;
    case 'if_stmt':
      return stmt.body.some(s => stmtHasAwait(s))
        || stmt.elifs.some(e => e.body.some(s => stmtHasAwait(s)))
        || (stmt.elseBody?.some(s => stmtHasAwait(s)) ?? false);
    case 'for_stmt': return stmt.body.some(s => stmtHasAwait(s));
    default: return false;
  }
}

function exprHasAwait(expr: Expression): boolean {
  if (expr.kind === 'await') return true;
  switch (expr.kind) {
    case 'binary': return exprHasAwait(expr.left) || exprHasAwait(expr.right);
    case 'unary': return exprHasAwait(expr.operand);
    case 'call': return exprHasAwait(expr.callee) || expr.args.some(a => exprHasAwait(a));
    case 'member': return exprHasAwait(expr.object);
    case 'index': return exprHasAwait(expr.object) || exprHasAwait(expr.index);
    case 'ternary': return exprHasAwait(expr.condition) || exprHasAwait(expr.consequent) || exprHasAwait(expr.alternate);
    case 'assignment': return exprHasAwait(expr.value);
    default: return false;
  }
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

// ── Phase 2: Store (localStorage persistence) ───────

function genVueStore(node: StoreDecl, c: VueContext): string {
  c.imports.add('ref');
  c.imports.add('watch');
  const init = genExpr(node.initial, c, true);
  const lines = [
    `const ${node.name} = ref(JSON.parse(localStorage.getItem('${node.name}') ?? 'null') ?? ${init});`,
    `watch(${node.name}, (val) => { localStorage.setItem('${node.name}', JSON.stringify(val)); }, { deep: true });`,
  ];
  c.states.set(node.name, node as any);
  return lines.join('\n');
}

// ── Phase 2: Data Fetching ──────────────────────────

function genVueDataDecl(node: DataDecl, c: VueContext): string {
  c.imports.add('ref');
  c.imports.add('onMounted');
  const query = genExpr(node.query, c, true);
  const lines: string[] = [];
  lines.push(`const ${node.name} = ref([]);`);
  lines.push(`const ${node.name}Loading = ref(true);`);
  lines.push(`const ${node.name}Error = ref(null);`);
  lines.push(`onMounted(async () => {`);
  lines.push(`  try {`);
  lines.push(`    ${node.name}.value = await ${query};`);
  lines.push(`    ${node.name}Error.value = null;`);
  lines.push(`  } catch (e) {`);
  lines.push(`    ${node.name}Error.value = e.message;`);
  lines.push(`  } finally {`);
  lines.push(`    ${node.name}Loading.value = false;`);
  lines.push(`  }`);
  lines.push(`});`);
  c.states.set(node.name, { type: 'StateDecl', name: node.name, valueType: { kind: 'primitive', name: 'any' }, initial: { kind: 'array', elements: [] }, loc: node.loc } as any);
  return lines.join('\n');
}

// ── Phase 2: Form ───────────────────────────────────

function genVueFormDecl(node: FormDecl, c: VueContext): string {
  c.imports.add('ref');
  const lines: string[] = [];

  const initialValues = node.fields.map(f => `${f.name}: ${getFieldDefault(f.fieldType)}`).join(', ');
  lines.push(`const ${node.name} = ref({ ${initialValues} });`);
  lines.push(`const ${node.name}Errors = ref({});`);
  lines.push(`const ${node.name}Submitting = ref(false);`);

  lines.push(`function update${capitalize(node.name)}(field, value) {`);
  lines.push(`  ${node.name}.value[field] = value;`);
  lines.push(`  ${node.name}Errors.value[field] = null;`);
  lines.push(`}`);

  lines.push(`function validate${capitalize(node.name)}() {`);
  lines.push(`  const errors = {};`);
  for (const f of node.fields) {
    for (const v of f.validations) {
      switch (v.rule) {
        case 'required':
          lines.push(`  if (!${node.name}.value.${f.name}) errors.${f.name} = '${v.message}';`);
          break;
        case 'min':
          lines.push(`  if (${node.name}.value.${f.name}.length < ${genExprStandalone(v.value!)}) errors.${f.name} = '${v.message}';`);
          break;
        case 'max':
          lines.push(`  if (${node.name}.value.${f.name}.length > ${genExprStandalone(v.value!)}) errors.${f.name} = '${v.message}';`);
          break;
        case 'format':
          if (v.value?.kind === 'string' && v.value.value === 'email') {
            lines.push(`  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${node.name}.value.${f.name})) errors.${f.name} = '${v.message}';`);
          }
          break;
        case 'pattern':
          if (v.value?.kind === 'string') {
            lines.push(`  if (!/${v.value.value}/.test(${node.name}.value.${f.name})) errors.${f.name} = '${v.message}';`);
          }
          break;
      }
    }
  }
  lines.push(`  ${node.name}Errors.value = errors;`);
  lines.push(`  return Object.keys(errors).length === 0;`);
  lines.push(`}`);

  if (node.submit) {
    const action = genExpr(node.submit.action, c, true);
    lines.push(`async function submit${capitalize(node.name)}() {`);
    lines.push(`  if (!validate${capitalize(node.name)}()) return;`);
    lines.push(`  ${node.name}Submitting.value = true;`);
    lines.push(`  try {`);
    lines.push(`    await ${action};`);
    if (node.submit.success) {
      lines.push(`    ${genExpr(node.submit.success, c, true)};`);
    }
    lines.push(`  } catch (e) {`);
    if (node.submit.error) {
      lines.push(`    ${genExpr(node.submit.error, c, true)};`);
    }
    lines.push(`  } finally {`);
    lines.push(`    ${node.name}Submitting.value = false;`);
    lines.push(`  }`);
    lines.push(`}`);
  }

  return lines.join('\n');
}

// ── Phase 2: Realtime (WebSocket) ───────────────────

function genVueRealtimeDecl(node: RealtimeDecl, c: VueContext): string {
  c.imports.add('ref');
  c.imports.add('onMounted');
  c.imports.add('onUnmounted');
  const channel = genExpr(node.channel, c, true);
  const lines: string[] = [];

  lines.push(`const ${node.name} = ref([]);`);
  lines.push(`let ${node.name}Ws = null;`);
  lines.push(`onMounted(() => {`);
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

  lines.push(`});`);
  lines.push(`onUnmounted(() => { if (${node.name}Ws) ${node.name}Ws.close(); });`);

  c.states.set(node.name, { type: 'StateDecl', name: node.name, valueType: { kind: 'list', itemType: { kind: 'primitive', name: 'any' } }, initial: { kind: 'array', elements: [] }, loc: node.loc } as any);
  return lines.join('\n');
}

// ── Phase 2: Auth (provide/inject) ──────────────────

function genVueAuthCode(node: AuthDecl): string {
  const lines: string[] = [
    `// Generated by 0x — Vue Auth: ${node.provider}`,
    `import { ref, provide, inject, readonly } from 'vue';`,
    '',
    `const AuthSymbol = Symbol('auth');`,
    '',
    `export function useAuth() {`,
    `  const ctx = inject(AuthSymbol);`,
    `  if (!ctx) throw new Error('useAuth must be inside AuthProvider');`,
    `  return ctx;`,
    `}`,
    '',
    `export const AuthProvider = {`,
    `  setup(props, { slots }) {`,
    `    const user = ref(null);`,
    `    const loading = ref(false);`,
    `    const error = ref(null);`,
    '',
  ];

  if (node.loginFields.length > 0) {
    const params = node.loginFields.join(', ');
    lines.push(`    async function login(${params}) {`);
    lines.push(`      loading.value = true; error.value = null;`);
    lines.push(`      try {`);
    lines.push(`        const res = await fetch('/api/auth/login', {`);
    lines.push(`          method: 'POST',`);
    lines.push(`          headers: { 'Content-Type': 'application/json' },`);
    lines.push(`          body: JSON.stringify({ ${params} }),`);
    lines.push(`        });`);
    lines.push(`        const data = await res.json();`);
    lines.push(`        if (!res.ok) throw new Error(data.message || 'Login failed');`);
    lines.push(`        user.value = data.user;`);
    lines.push(`        return data;`);
    lines.push(`      } catch (e) { error.value = e.message; throw e; }`);
    lines.push(`      finally { loading.value = false; }`);
    lines.push(`    }`);
    lines.push('');
  }

  if (node.signupFields.length > 0) {
    const params = node.signupFields.join(', ');
    lines.push(`    async function signup(${params}) {`);
    lines.push(`      loading.value = true; error.value = null;`);
    lines.push(`      try {`);
    lines.push(`        const res = await fetch('/api/auth/signup', {`);
    lines.push(`          method: 'POST',`);
    lines.push(`          headers: { 'Content-Type': 'application/json' },`);
    lines.push(`          body: JSON.stringify({ ${params} }),`);
    lines.push(`        });`);
    lines.push(`        const data = await res.json();`);
    lines.push(`        if (!res.ok) throw new Error(data.message || 'Sign up failed');`);
    lines.push(`        user.value = data.user;`);
    lines.push(`        return data;`);
    lines.push(`      } catch (e) { error.value = e.message; throw e; }`);
    lines.push(`      finally { loading.value = false; }`);
    lines.push(`    }`);
    lines.push('');
  }

  lines.push(`    async function logout() {`);
  lines.push(`      await fetch('/api/auth/logout', { method: 'POST' });`);
  lines.push(`      user.value = null;`);
  lines.push(`    }`);
  lines.push('');
  lines.push(`    const auth = { user: readonly(user), loading: readonly(loading), error: readonly(error), login, signup, logout };`);
  lines.push(`    provide(AuthSymbol, auth);`);
  lines.push(`    return () => slots.default?.();`);
  lines.push(`  },`);
  lines.push(`};`);
  lines.push('');

  for (const g of node.guards) {
    const guardName = `${capitalize(g.role)}Guard`;
    lines.push(`export const ${guardName} = {`);
    lines.push(`  setup(props, { slots }) {`);
    lines.push(`    const { user } = useAuth();`);
    if (g.role === 'auth') {
      lines.push(`    if (!user.value) {`);
    } else {
      lines.push(`    if (!user.value || user.value.role !== '${g.role}') {`);
    }
    if (g.redirect) {
      lines.push(`      window.location.href = '${g.redirect}';`);
      lines.push(`      return () => null;`);
    } else {
      lines.push(`      return () => 'Access denied';`);
    }
    lines.push(`    }`);
    lines.push(`    return () => slots.default?.();`);
    lines.push(`  },`);
    lines.push(`};`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Phase 2: Route (vue-router config) ──────────────

function genVueRouteCode(node: RouteDecl): string {
  const lines: string[] = [];
  lines.push(`// Route: ${node.path} -> ${node.target}`);
  if (node.guard) {
    lines.push(`{`);
    lines.push(`  path: '${node.path}',`);
    lines.push(`  component: ${node.target},`);
    lines.push(`  beforeEnter: (to, from, next) => {`);
    lines.push(`    // Guard: ${node.guard}`);
    lines.push(`    next();`);
    lines.push(`  },`);
    lines.push(`},`);
  } else {
    lines.push(`{ path: '${node.path}', component: ${node.target} },`);
  }
  return lines.join('\n');
}

// ── Phase 2: Model (CRUD API + Vue composables) ─────

function genVueModelCode(node: ModelNode): string {
  const name = node.name;
  const lower = name.toLowerCase();
  const lines: string[] = [
    `// Generated by 0x — Vue Model: ${name}`,
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

  // Vue composables
  lines.push(`import { ref, onMounted } from 'vue';`);
  lines.push('');
  lines.push(`function use${name}s(params = {}) {`);
  lines.push(`  const data = ref([]);`);
  lines.push(`  const loading = ref(true);`);
  lines.push(`  const error = ref(null);`);
  lines.push(`  async function fetch${name}s() {`);
  lines.push(`    loading.value = true;`);
  lines.push(`    try {`);
  lines.push(`      data.value = await ${name}API.findAll(params);`);
  lines.push(`      error.value = null;`);
  lines.push(`    } catch (e) {`);
  lines.push(`      error.value = e.message;`);
  lines.push(`    } finally {`);
  lines.push(`      loading.value = false;`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`  onMounted(() => fetch${name}s());`);
  lines.push(`  return { data, loading, error, refetch: fetch${name}s };`);
  lines.push(`}`);
  lines.push('');
  lines.push(`function useCreate${name}() {`);
  lines.push(`  const loading = ref(false);`);
  lines.push(`  const create = async (data) => {`);
  lines.push(`    loading.value = true;`);
  lines.push(`    try { return await ${name}API.create(data); }`);
  lines.push(`    finally { loading.value = false; }`);
  lines.push(`  };`);
  lines.push(`  return { create, loading };`);
  lines.push(`}`);

  return lines.join('\n');
}

// ── Standalone expression helper ────────────────────

function genExprStandalone(expr: Expression): string {
  const c = newCtx();
  return genExpr(expr, c);
}

