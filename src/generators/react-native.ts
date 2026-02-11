// 0x → React Native Code Generator
// Converts UI AST nodes to React Native components with StyleSheet

import type {
  ASTNode, PageNode, ComponentNode, AppNode,
  StateDecl, DerivedDecl, PropDecl, StoreDecl, ApiDecl,
  FnDecl, OnMount, OnDestroy, WatchBlock, CheckDecl,
  LayoutNode, TextNode, ButtonNode, InputNode, ImageNode, LinkNode,
  ToggleNode, SelectNode, IfBlock, ForBlock, ShowBlock, HideBlock,
  StyleDecl, ComponentCall, CommentNode,
  JsImport, UseImport, JsBlock, TopLevelVarDecl,
  FormDecl, ModalNode, DataDecl,
  Expression, Statement, UINode, GeneratedCode, Param,
} from '../ast.js';
import { genExpr, genStatement, ctx, GenContext, bodyContainsAwait } from './react.js';
import { generateBackendCode } from './react.js';
import { capitalize } from './shared.js';

// React Native size mapping (numbers, not px strings)
const RN_SIZE_MAP: Record<string, number> = {
  xs: 12, sm: 14, md: 16, lg: 20, xl: 24, '2xl': 30, '3xl': 36,
};

export function generateReactNative(ast: ASTNode[]): GeneratedCode {
  const parts: string[] = [];

  for (const node of ast) {
    if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
      parts.push(generateTopLevel(node));
    } else {
      const backend = generateBackendCode(node);
      if (backend) parts.push(backend);
    }
  }

  const code = parts.join('\n\n');
  return {
    code,
    filename: 'Component.tsx',
    imports: code.match(/^import .+$/gm) || [],
    lineCount: code.split('\n').length,
    tokenCount: code.split(/\s+/).filter(t => t.length > 0).length,
  };
}

// Track which RN components are used
interface RNContext extends GenContext {
  rnImports: Set<string>;
  styleEntries: Map<string, Record<string, string>>;
  styleCounter: number;
}

function rnCtx(): RNContext {
  const c = ctx() as RNContext;
  c.rnImports = new Set<string>();
  c.styleEntries = new Map();
  c.styleCounter = 0;
  return c;
}

function generateTopLevel(node: PageNode | ComponentNode | AppNode): string {
  const c = rnCtx();

  // First pass: collect states, derived, props, styles
  for (const child of node.body) {
    if (child.type === 'StateDecl') c.states.set(child.name, child);
    if (child.type === 'DerivedDecl') c.derivedNames.add(child.name);
    if (child.type === 'PropDecl') c.propNames.add((child as PropDecl).name);
    if (child.type === 'StyleDecl') c.styles.set(child.name, child);
  }

  const hookLines: string[] = [];
  const jsxParts: string[] = [];
  const fnLines: string[] = [];

  for (const child of node.body) {
    switch (child.type) {
      case 'StateDecl':
        c.imports.add('useState');
        hookLines.push(genState(child, c));
        break;
      case 'DerivedDecl':
        c.imports.add('useMemo');
        hookLines.push(genDerived(child, c));
        break;
      case 'PropDecl':
        break;
      case 'FnDecl':
        fnLines.push(genFunction(child, c));
        break;
      case 'OnMount':
        c.imports.add('useEffect');
        hookLines.push(genOnMount(child, c));
        break;
      case 'OnDestroy':
        c.imports.add('useEffect');
        hookLines.push(genOnDestroy(child, c));
        break;
      case 'WatchBlock':
        c.imports.add('useEffect');
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
        c.imports.add('useState');
        c.imports.add('useEffect');
        hookLines.push(genDataDecl(child, c));
        break;
      case 'JsImport':
        break;
      case 'UseImport':
        hookLines.push(`const ${(child as UseImport).name} = ${(child as UseImport).name}();`);
        break;
      case 'JsBlock':
        hookLines.push((child as JsBlock).code);
        break;
      case 'TopLevelVarDecl': {
        const tlv = child as TopLevelVarDecl;
        hookLines.push(`${tlv.keyword} ${tlv.name} = ${genExpr(tlv.value, c)};`);
        break;
      }
      case 'StyleDecl':
      case 'Comment':
      case 'TypeDecl':
        break;
      default:
        if (isUINode(child)) {
          jsxParts.push(genUINode(child as UINode, c));
        }
        break;
    }
  }

  // Collect props
  const props = node.body.filter(n => n.type === 'PropDecl') as PropDecl[];
  const propsArg = props.length > 0
    ? `{ ${props.map(p => p.defaultValue ? `${p.name} = ${genExpr(p.defaultValue, c)}` : p.name).join(', ')} }`
    : '';

  // Build imports
  const hookNames = Array.from(c.imports).sort();
  const rnComponentNames = Array.from(c.rnImports).sort();

  const importLine = hookNames.length > 0
    ? `import React, { ${hookNames.join(', ')} } from 'react';`
    : `import React from 'react';`;

  // Always include StyleSheet
  if (!c.rnImports.has('StyleSheet')) c.rnImports.add('StyleSheet');
  const rnImportLine = `import { ${Array.from(c.rnImports).sort().join(', ')} } from 'react-native';`;

  // User imports
  const userImports: string[] = [];
  for (const child of node.body) {
    if (child.type === 'JsImport') {
      const ji = child as JsImport;
      if (ji.isDefault) {
        userImports.push(`import ${ji.specifiers[0]} from '${ji.source}';`);
      } else {
        userImports.push(`import { ${ji.specifiers.join(', ')} } from '${ji.source}';`);
      }
    } else if (child.type === 'UseImport') {
      const ui = child as UseImport;
      userImports.push(`import ${ui.name} from '${ui.source}';`);
    }
  }

  const isComponent = node.type === 'Component';
  const exportKw = isComponent ? '' : 'export default ';

  const lines: string[] = [
    `// Generated by 0x — React Native`,
    importLine,
    rnImportLine,
    ...userImports,
    '',
    `${exportKw}function ${node.name}(${propsArg}) {`,
  ];

  for (const h of hookLines) {
    for (const l of h.split('\n')) lines.push(`  ${l}`);
  }
  if (hookLines.length > 0) lines.push('');
  for (const f of fnLines) {
    for (const l of f.split('\n')) lines.push(`  ${l}`);
  }
  if (fnLines.length > 0) lines.push('');

  if (jsxParts.length === 0) {
    lines.push(`  return <View />;`);
  } else if (jsxParts.length === 1) {
    lines.push(`  return (`);
    lines.push(`    ${jsxParts[0]}`);
    lines.push(`  );`);
  } else {
    lines.push(`  return (`);
    lines.push(`    <View style={styles.container}>`);
    for (const p of jsxParts) lines.push(`      ${p}`);
    lines.push(`    </View>`);
    lines.push(`  );`);
  }

  lines.push(`}`);
  lines.push('');

  // StyleSheet
  lines.push(genStyleSheet(c));

  return lines.join('\n');
}

// ── UI Node Generation ──────────────────────────────

function genUINode(node: UINode, c: RNContext): string {
  switch (node.type) {
    case 'Layout': return genLayout(node as LayoutNode, c);
    case 'Text': return genText(node as TextNode, c);
    case 'Button': return genButton(node as ButtonNode, c);
    case 'Input': return genInput(node as InputNode, c);
    case 'Image': return genImage(node as ImageNode, c);
    case 'Link': return genLink(node as LinkNode, c);
    case 'Toggle': return genToggle(node as ToggleNode, c);
    case 'Select': return genSelect(node as SelectNode, c);
    case 'IfBlock': return genIf(node as IfBlock, c);
    case 'ForBlock': return genFor(node as ForBlock, c);
    case 'ShowBlock': return genShow(node as ShowBlock, c);
    case 'HideBlock': return genHide(node as HideBlock, c);
    case 'Modal': return genModal(node as ModalNode, c);
    case 'ComponentCall': return genComponentCall(node as ComponentCall, c);
    default: return `{/* Unsupported: ${node.type} */}`;
  }
}

function getStyleName(c: RNContext, baseStyle: Record<string, string>): string {
  c.styleCounter++;
  const name = `s${c.styleCounter}`;
  c.styleEntries.set(name, baseStyle);
  return name;
}

function buildRNStyle(props: Record<string, Expression>, c: RNContext): Record<string, string> {
  const style: Record<string, string> = {};
  for (const [key, expr] of Object.entries(props)) {
    switch (key) {
      case 'padding': case 'margin':
        style[key] = toRNValue(expr, c);
        break;
      case 'gap':
        style['gap'] = toRNValue(expr, c);
        break;
      case 'radius':
        style['borderRadius'] = toRNValue(expr, c);
        break;
      case 'bg':
        style['backgroundColor'] = toRNStringValue(expr, c);
        break;
      case 'color':
        style['color'] = toRNStringValue(expr, c);
        break;
      case 'width': case 'height':
        style[key] = toRNValue(expr, c);
        break;
      case 'shadow':
        style['elevation'] = '4';
        break;
      case 'border':
        style['borderWidth'] = '1';
        style['borderColor'] = toRNStringValue(expr, c);
        break;
      case 'opacity':
        style['opacity'] = toRNValue(expr, c);
        break;
    }
  }
  return style;
}

function toRNValue(expr: Expression, c: RNContext): string {
  if (expr.kind === 'number') return String(expr.value);
  if (expr.kind === 'string') {
    const v = expr.value;
    if (v.endsWith('px')) return v.slice(0, -2);
    if (/^\d+$/.test(v)) return v;
    return `'${v}'`;
  }
  return genExpr(expr, c);
}

function toRNStringValue(expr: Expression, c: RNContext): string {
  if (expr.kind === 'string') return `'${expr.value}'`;
  return genExpr(expr, c);
}

function toRNSizeValue(expr: Expression, c: RNContext): string {
  if (expr.kind === 'string' && RN_SIZE_MAP[expr.value]) {
    return String(RN_SIZE_MAP[expr.value]);
  }
  if (expr.kind === 'identifier' && RN_SIZE_MAP[expr.name]) {
    return String(RN_SIZE_MAP[expr.name]);
  }
  return toRNValue(expr, c);
}

function genLayout(node: LayoutNode, c: RNContext): string {
  c.rnImports.add('View');
  const style: Record<string, string> = {};

  if (node.direction === 'row') {
    style['flexDirection'] = "'row'";
    style['alignItems'] = "'center'";
  } else if (node.direction === 'grid') {
    style['flexDirection'] = "'row'";
    style['flexWrap'] = "'wrap'";
  }

  Object.assign(style, buildRNStyle(node.props, c));

  const styleName = getStyleName(c, style);
  const children = node.children.map(ch => genUINode(ch, c)).join('\n      ');

  return `<View style={styles.${styleName}}>\n      ${children}\n    </View>`;
}

function genText(node: TextNode, c: RNContext): string {
  c.rnImports.add('Text');
  const style: Record<string, string> = {};

  if (node.props['size']) {
    style['fontSize'] = toRNSizeValue(node.props['size'], c);
  }
  if (node.props['color']) {
    style['color'] = toRNStringValue(node.props['color'], c);
  }
  if (node.props['bold']) {
    style['fontWeight'] = "'bold'";
  }
  if (node.props['italic']) {
    style['fontStyle'] = "'italic'";
  }
  if (node.props['align']) {
    const align = node.props['align'];
    style['textAlign'] = align.kind === 'string' ? `'${align.value}'` : genExpr(align, c);
  }

  const content = genRNTextContent(node.content, c);
  if (Object.keys(style).length > 0) {
    const styleName = getStyleName(c, style);
    return `<Text style={styles.${styleName}}>${content}</Text>`;
  }
  return `<Text>${content}</Text>`;
}

function genButton(node: ButtonNode, c: RNContext): string {
  c.rnImports.add('TouchableOpacity');
  c.rnImports.add('Text');

  const label = genRNTextContent(node.label, c);
  const handler = genRNAction(node.action, c);
  const style: Record<string, string> = {
    padding: '12',
    borderRadius: '8',
    backgroundColor: "'#007AFF'",
    alignItems: "'center'",
  };

  Object.assign(style, buildRNStyle(node.props, c));

  const styleName = getStyleName(c, style);
  return `<TouchableOpacity style={styles.${styleName}} onPress={${handler}}>\n        <Text style={{ color: '#fff', fontWeight: 'bold' }}>${label}</Text>\n      </TouchableOpacity>`;
}

function genInput(node: InputNode, c: RNContext): string {
  c.rnImports.add('TextInput');
  const attrs: string[] = [];
  const style: Record<string, string> = {
    borderWidth: '1',
    borderColor: "'#ddd'",
    borderRadius: '8',
    padding: '12',
    fontSize: '16',
  };

  if (node.binding) {
    const bindName = node.binding;
    const setter = 'set' + capitalize(bindName);
    attrs.push(`value={${bindName}}`);
    attrs.push(`onChangeText={${setter}}`);
  }

  if (node.props['placeholder']) {
    const ph = genExpr(node.props['placeholder'], c);
    attrs.push(`placeholder={${ph}}`);
  }
  if (node.props['type']) {
    const t = node.props['type'];
    const tv = t.kind === 'string' ? t.value : '';
    if (tv === 'password') {
      attrs.push('secureTextEntry');
    } else if (tv === 'number') {
      attrs.push('keyboardType="numeric"');
    } else if (tv === 'email') {
      attrs.push('keyboardType="email-address"');
    }
  }

  Object.assign(style, buildRNStyle(node.props, c));
  const styleName = getStyleName(c, style);

  return `<TextInput style={styles.${styleName}} ${attrs.join(' ')} />`;
}

function genImage(node: ImageNode, c: RNContext): string {
  c.rnImports.add('Image');
  const src = genExpr(node.src, c);
  const style: Record<string, string> = {};

  if (node.props['width']) style['width'] = toRNValue(node.props['width'], c);
  if (node.props['height']) style['height'] = toRNValue(node.props['height'], c);
  if (node.props['size']) {
    const sz = toRNValue(node.props['size'], c);
    style['width'] = sz;
    style['height'] = sz;
  }
  if (node.props['radius']) style['borderRadius'] = toRNValue(node.props['radius'], c);

  const styleName = Object.keys(style).length > 0 ? getStyleName(c, style) : null;

  if (styleName) {
    return `<Image source={{ uri: ${src} }} style={styles.${styleName}} />`;
  }
  return `<Image source={{ uri: ${src} }} />`;
}

function genLink(node: LinkNode, c: RNContext): string {
  c.rnImports.add('TouchableOpacity');
  c.rnImports.add('Text');
  c.rnImports.add('Linking');

  const label = genRNTextContent(node.label, c);
  const href = genExpr(node.href, c);

  return `<TouchableOpacity onPress={() => Linking.openURL(${href})}>\n        <Text style={{ color: '#007AFF' }}>${label}</Text>\n      </TouchableOpacity>`;
}

function genToggle(node: ToggleNode, c: RNContext): string {
  c.rnImports.add('Switch');
  const bindName = node.binding;
  const setter = 'set' + capitalize(bindName);
  return `<Switch value={${bindName}} onValueChange={${setter}} />`;
}

function genSelect(node: SelectNode, c: RNContext): string {
  c.rnImports.add('View');
  c.rnImports.add('TouchableOpacity');
  c.rnImports.add('Text');

  const bindName = node.binding;
  const setter = 'set' + capitalize(bindName);
  const options = genExpr(node.options, c);

  return `<View>\n        {${options}.map((opt) => (\n          <TouchableOpacity key={opt} onPress={() => ${setter}(opt)}>\n            <Text style={{ padding: 8, backgroundColor: ${bindName} === opt ? '#007AFF' : '#f0f0f0' }}>{opt}</Text>\n          </TouchableOpacity>\n        ))}\n      </View>`;
}

function genIf(node: IfBlock, c: RNContext): string {
  const cond = genExpr(node.condition, c);
  const body = node.body.map(ch => genUINode(ch, c)).join('\n      ');

  if (node.elseBody && node.elseBody.length > 0) {
    const elseBody = node.elseBody.map(ch => genUINode(ch, c)).join('\n      ');
    return `{${cond} ? (\n      ${body}\n    ) : (\n      ${elseBody}\n    )}`;
  }
  return `{${cond} && (\n      ${body}\n    )}`;
}

function genFor(node: ForBlock, c: RNContext): string {
  const iter = genExpr(node.iterable, c);
  const children = node.body.map(ch => genUINode(ch, c)).join('\n        ');
  const indexVar = node.index || 'index';

  return `{${iter}.map((${node.item}, ${indexVar}) => (\n        <React.Fragment key={${indexVar}}>\n          ${children}\n        </React.Fragment>\n      ))}`;
}

function genShow(node: ShowBlock, c: RNContext): string {
  const cond = genExpr(node.condition, c);
  const children = node.body.map(ch => genUINode(ch, c)).join('\n      ');
  return `{${cond} && (\n      ${children}\n    )}`;
}

function genHide(node: HideBlock, c: RNContext): string {
  const cond = genExpr(node.condition, c);
  const children = node.body.map(ch => genUINode(ch, c)).join('\n      ');
  return `{!(${cond}) && (\n      ${children}\n    )}`;
}

function genModal(node: ModalNode, c: RNContext): string {
  c.rnImports.add('Modal');
  c.rnImports.add('View');
  c.rnImports.add('TouchableOpacity');
  c.rnImports.add('Text');

  const title = node.title || '';
  const children = node.body.map(ch => genUINode(ch, c)).join('\n          ');

  const visibleVar = `show${capitalize(node.name || 'Modal')}`;
  const setter = `set${capitalize(visibleVar)}`;

  return `<Modal visible={${visibleVar}} animationType="slide" transparent>\n        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>\n          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%' }}>\n            ${title ? `<Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>${title}</Text>` : ''}\n            ${children}\n            <TouchableOpacity onPress={() => ${setter}(false)}>\n              <Text style={{ textAlign: 'center', marginTop: 12, color: '#007AFF' }}>Close</Text>\n            </TouchableOpacity>\n          </View>\n        </View>\n      </Modal>`;
}

function genComponentCall(node: ComponentCall, c: RNContext): string {
  const propsStr = Object.entries(node.args)
    .map(([k, v]) => {
      const val = genExpr(v, c);
      return `${k}={${val}}`;
    })
    .join(' ');

  return propsStr ? `<${node.name} ${propsStr} />` : `<${node.name} />`;
}

function genForm(node: FormDecl, c: RNContext): string {
  c.rnImports.add('View');
  c.rnImports.add('TextInput');
  c.rnImports.add('TouchableOpacity');
  c.rnImports.add('Text');

  const fields = node.fields.map(f => {
    const label = f.label || capitalize(f.name);
    return `        <Text style={{ marginBottom: 4 }}>${label}</Text>\n        <TextInput style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 }} placeholder="${label}" />`;
  }).join('\n');

  return `<View style={{ padding: 16 }}>\n${fields}\n        <TouchableOpacity style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' }}>\n          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit</Text>\n        </TouchableOpacity>\n      </View>`;
}

// ── Hook/Logic Generators ───────────────────────────

function genState(node: StateDecl, c: RNContext): string {
  c.imports.add('useState');
  const init = genExpr(node.initial, c);
  const setter = 'set' + capitalize(node.name);
  return `const [${node.name}, ${setter}] = useState(${init});`;
}

function genDerived(node: DerivedDecl, c: RNContext): string {
  c.imports.add('useMemo');
  const expr = genExpr(node.expression, c);
  const deps = extractSimpleDeps(node.expression, c);
  return `const ${node.name} = useMemo(() => ${expr}, [${deps.join(', ')}]);`;
}

function genFunction(node: FnDecl, c: RNContext): string {
  const isAsync = node.isAsync || bodyContainsAwait(node.body);
  const params = node.params.map((p: Param) => p.defaultValue ? `${p.name} = ${genExpr(p.defaultValue, c)}` : p.name).join(', ');
  const body = node.body.map(s => genStatement(s, c)).join('\n    ');
  return `${isAsync ? 'async ' : ''}function ${node.name}(${params}) {\n    ${body}\n  }`;
}

function genOnMount(node: OnMount, c: RNContext): string {
  c.imports.add('useEffect');
  const isAsync = bodyContainsAwait(node.body);
  const body = node.body.map(s => genStatement(s, c)).join('\n      ');
  if (isAsync) {
    return `useEffect(() => {\n    const init = async () => {\n      ${body}\n    };\n    init();\n  }, []);`;
  }
  return `useEffect(() => {\n    ${body}\n  }, []);`;
}

function genOnDestroy(node: OnDestroy, c: RNContext): string {
  c.imports.add('useEffect');
  const body = node.body.map(s => genStatement(s, c)).join('\n      ');
  return `useEffect(() => {\n    return () => {\n      ${body}\n    };\n  }, []);`;
}

function genWatch(node: WatchBlock, c: RNContext): string {
  c.imports.add('useEffect');
  const vars = node.variables && node.variables.length > 0 ? node.variables : [node.variable];
  const body = node.body.map(s => genStatement(s, c)).join('\n    ');
  return `useEffect(() => {\n    ${body}\n  }, [${vars.join(', ')}]);`;
}

function genCheck(node: CheckDecl, c: RNContext): string {
  const cond = genExpr(node.condition, c);
  const msg = typeof node.message === 'string' ? `'${node.message}'` : genExpr(node.message, c);
  return `if (!(${cond})) console.warn(${msg});`;
}

function genApi(node: ApiDecl, c: RNContext): string {
  const method = node.method.toLowerCase();
  return `const ${node.name} = (data) => fetch('${node.url}', { method: '${node.method}', headers: { 'Content-Type': 'application/json' }, body: ${method !== 'get' ? 'JSON.stringify(data)' : 'undefined'} }).then(r => r.json());`;
}

function genStore(node: StoreDecl, c: RNContext): string {
  const init = genExpr(node.initial, c);
  return `const ${node.name} = ${init};`;
}

function genDataDecl(node: DataDecl, c: RNContext): string {
  c.imports.add('useState');
  c.imports.add('useEffect');
  const source = genExpr(node.query, c);
  return `const [${node.name}, set${capitalize(node.name)}] = useState([]);\n  useEffect(() => {\n    fetch(${source}).then(r => r.json()).then(set${capitalize(node.name)});\n  }, []);`;
}

// ── Helpers ─────────────────────────────────────────

function genRNTextContent(expr: Expression, c: RNContext): string {
  if (expr.kind === 'string') return expr.value;
  if (expr.kind === 'template') {
    return expr.parts.map(p => {
      if (typeof p === 'string') return p;
      return `{${genExpr(p, c)}}`;
    }).join('');
  }
  return `{${genExpr(expr, c)}}`;
}

function genRNAction(expr: Expression | Statement[], c: RNContext): string {
  if (Array.isArray(expr)) {
    const stmts = (expr as Statement[]).map(s => genStatement(s, c)).join('; ');
    return `() => { ${stmts} }`;
  }
  if (expr.kind === 'assignment') {
    return `() => { ${genExpr(expr, c)} }`;
  }
  if (expr.kind === 'call') {
    return `() => ${genExpr(expr, c)}`;
  }
  return `() => { ${genExpr(expr, c)} }`;
}

function extractSimpleDeps(expr: Expression, c: RNContext): string[] {
  const deps = new Set<string>();
  walkExprSimple(expr, e => {
    if (e.kind === 'identifier') {
      if (c.states.has(e.name) || c.derivedNames.has(e.name) || c.propNames.has(e.name)) {
        deps.add(e.name);
      }
    }
  });
  return Array.from(deps);
}

function walkExprSimple(expr: Expression, fn: (e: Expression) => void): void {
  fn(expr);
  switch (expr.kind) {
    case 'binary': walkExprSimple(expr.left, fn); walkExprSimple(expr.right, fn); break;
    case 'unary': walkExprSimple(expr.operand, fn); break;
    case 'call': walkExprSimple(expr.callee, fn); expr.args.forEach(a => walkExprSimple(a, fn)); break;
    case 'member': walkExprSimple(expr.object, fn); break;
    case 'index': walkExprSimple(expr.object, fn); walkExprSimple(expr.index, fn); break;
    case 'ternary': walkExprSimple(expr.condition, fn); walkExprSimple(expr.consequent, fn); walkExprSimple(expr.alternate, fn); break;
    case 'array': expr.elements.forEach(e => walkExprSimple(e, fn)); break;
    case 'object_expr': expr.properties.forEach(p => walkExprSimple(p.value, fn)); break;
    case 'template': expr.parts.forEach(p => { if (typeof p !== 'string') walkExprSimple(p, fn); }); break;
    case 'assignment': walkExprSimple(expr.target, fn); walkExprSimple(expr.value, fn); break;
    case 'await': walkExprSimple(expr.expression, fn); break;
  }
}

function genStyleSheet(c: RNContext): string {
  const entries: string[] = [];
  entries.push(`  container: {\n    flex: 1,\n    padding: 16,\n  }`);

  for (const [name, style] of c.styleEntries) {
    const props = Object.entries(style)
      .map(([k, v]) => `    ${k}: ${v}`)
      .join(',\n');
    entries.push(`  ${name}: {\n${props},\n  }`);
  }

  return `const styles = StyleSheet.create({\n${entries.join(',\n')},\n});`;
}

function isUINode(node: ASTNode): boolean {
  const uiTypes = new Set([
    'Layout', 'Text', 'Button', 'Input', 'Image', 'Link',
    'Toggle', 'Select', 'IfBlock', 'ForBlock', 'ShowBlock', 'HideBlock',
    'Modal', 'ComponentCall', 'FormDecl', 'Table',
  ]);
  return uiTypes.has(node.type);
}
