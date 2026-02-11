// 0x Validator — Static analysis before code generation

import type {
  ASTNode, PageNode, ComponentNode, AppNode,
  DerivedDecl, StateDecl, PropDecl, FnDecl, Expression, UINode, Statement,
} from './ast.js';

export interface ValidationError {
  message: string;
  line: number;
  column: number;
}

export interface ValidationWarning {
  message: string;
  line: number;
  column: number;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export function validate(ast: ASTNode[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const node of ast) {
    if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
      validateTopLevel(node, errors, warnings);
    }
  }

  return { errors, warnings };
}

function validateTopLevel(
  node: PageNode | ComponentNode | AppNode,
  errors: ValidationError[],
  warnings: ValidationWarning[],
): void {
  const stateDecls = node.body.filter(n => n.type === 'StateDecl') as StateDecl[];
  const derivedDecls = node.body.filter(n => n.type === 'DerivedDecl') as DerivedDecl[];
  const propDecls = node.body.filter(n => n.type === 'PropDecl') as PropDecl[];
  const fnDecls = node.body.filter(n => n.type === 'FnDecl') as FnDecl[];

  // 1. Check for duplicate declarations
  checkDuplicateNames(stateDecls, derivedDecls, propDecls, fnDecls, errors);

  // 2. Check for circular derived dependencies
  checkCircularDerived(derivedDecls, errors);

  // 3. Check for unused states
  checkUnusedStates(stateDecls, node.body, warnings);
}

// ── Duplicate Name Detection ─────────────────────────

function checkDuplicateNames(
  states: StateDecl[],
  deriveds: DerivedDecl[],
  props: PropDecl[],
  fns: FnDecl[],
  errors: ValidationError[],
): void {
  const seen = new Map<string, { type: string; line: number; column: number }>();

  const allDecls: { name: string; kind: string; loc: { line: number; column: number } }[] = [
    ...states.map(s => ({ name: s.name, kind: 'state', loc: s.loc })),
    ...deriveds.map(d => ({ name: d.name, kind: 'derived', loc: d.loc })),
    ...props.map(p => ({ name: p.name, kind: 'prop', loc: p.loc })),
    ...fns.map(f => ({ name: f.name, kind: 'fn', loc: f.loc })),
  ];

  for (const decl of allDecls) {
    const existing = seen.get(decl.name);
    if (existing) {
      errors.push({
        message: `Duplicate declaration '${decl.name}' (${decl.kind}), previously declared as ${existing.type} at line ${existing.line}`,
        line: decl.loc.line,
        column: decl.loc.column,
      });
    } else {
      seen.set(decl.name, { type: decl.kind, line: decl.loc.line, column: decl.loc.column });
    }
  }
}

// ── Circular Derived Detection ──────────────────────

function checkCircularDerived(deriveds: DerivedDecl[], errors: ValidationError[]): void {
  // Build dependency graph: derived name → set of derived names it depends on
  const derivedNames = new Set(deriveds.map(d => d.name));
  const graph = new Map<string, Set<string>>();

  for (const d of deriveds) {
    const deps = new Set<string>();
    collectDerivedDeps(d.expression, derivedNames, deps);
    graph.set(d.name, deps);
  }

  // Detect cycles using DFS
  const visited = new Set<string>();
  const inStack = new Set<string>();

  for (const name of derivedNames) {
    if (!visited.has(name)) {
      if (hasCycle(name, graph, visited, inStack)) {
        const decl = deriveds.find(d => d.name === name)!;
        errors.push({
          message: `Circular dependency detected in derived '${name}'`,
          line: decl.loc.line,
          column: decl.loc.column,
        });
      }
    }
  }
}

function hasCycle(
  node: string,
  graph: Map<string, Set<string>>,
  visited: Set<string>,
  inStack: Set<string>,
): boolean {
  visited.add(node);
  inStack.add(node);

  const deps = graph.get(node) || new Set();
  for (const dep of deps) {
    if (!visited.has(dep)) {
      if (hasCycle(dep, graph, visited, inStack)) return true;
    } else if (inStack.has(dep)) {
      return true;
    }
  }

  inStack.delete(node);
  return false;
}

function collectDerivedDeps(expr: Expression, derivedNames: Set<string>, deps: Set<string>): void {
  switch (expr.kind) {
    case 'identifier':
      if (derivedNames.has(expr.name)) deps.add(expr.name);
      break;
    case 'binary':
      collectDerivedDeps(expr.left, derivedNames, deps);
      collectDerivedDeps(expr.right, derivedNames, deps);
      break;
    case 'unary':
      collectDerivedDeps(expr.operand, derivedNames, deps);
      break;
    case 'call':
      collectDerivedDeps(expr.callee, derivedNames, deps);
      expr.args.forEach(a => collectDerivedDeps(a, derivedNames, deps));
      break;
    case 'member':
      collectDerivedDeps(expr.object, derivedNames, deps);
      break;
    case 'index':
      collectDerivedDeps(expr.object, derivedNames, deps);
      collectDerivedDeps(expr.index, derivedNames, deps);
      break;
    case 'ternary':
      collectDerivedDeps(expr.condition, derivedNames, deps);
      collectDerivedDeps(expr.consequent, derivedNames, deps);
      collectDerivedDeps(expr.alternate, derivedNames, deps);
      break;
    case 'array':
      expr.elements.forEach(e => collectDerivedDeps(e, derivedNames, deps));
      break;
    case 'object_expr':
      expr.properties.forEach(p => collectDerivedDeps(p.value, derivedNames, deps));
      break;
    case 'arrow':
      if (!Array.isArray(expr.body)) {
        collectDerivedDeps(expr.body as Expression, derivedNames, deps);
      }
      break;
    case 'template':
      expr.parts.forEach(p => {
        if (typeof p !== 'string') collectDerivedDeps(p, derivedNames, deps);
      });
      break;
    case 'assignment':
      collectDerivedDeps(expr.target, derivedNames, deps);
      collectDerivedDeps(expr.value, derivedNames, deps);
      break;
    case 'await':
      collectDerivedDeps(expr.expression, derivedNames, deps);
      break;
  }
}

// ── Unused State Detection ──────────────────────────

function checkUnusedStates(
  states: StateDecl[],
  body: ASTNode[],
  warnings: ValidationWarning[],
): void {
  const usedNames = new Set<string>();

  // Collect all identifiers used in the body (excluding the state declarations themselves)
  for (const node of body) {
    if (node.type === 'StateDecl') continue;
    collectUsedNames(node, usedNames);
  }

  for (const state of states) {
    if (!usedNames.has(state.name)) {
      warnings.push({
        message: `State '${state.name}' is declared but never used (unused)`,
        line: state.loc.line,
        column: state.loc.column,
      });
    }
  }
}

function collectUsedNames(node: ASTNode | UINode, names: Set<string>): void {
  switch (node.type) {
    case 'DerivedDecl':
      collectExprNames(node.expression, names);
      break;
    case 'FnDecl':
      node.body.forEach(s => collectStmtNames(s, names));
      node.requires.forEach(e => collectExprNames(e, names));
      node.ensures.forEach(e => collectExprNames(e, names));
      break;
    case 'CheckDecl':
      collectExprNames(node.condition, names);
      break;
    case 'OnMount':
    case 'OnDestroy':
      node.body.forEach(s => collectStmtNames(s, names));
      break;
    case 'WatchBlock':
      names.add(node.variable);
      node.body.forEach(s => collectStmtNames(s, names));
      break;
    case 'Layout':
      Object.values(node.props).forEach(e => collectExprNames(e, names));
      node.children.forEach(ch => collectUsedNames(ch as ASTNode, names));
      break;
    case 'Text':
      collectExprNames(node.content, names);
      Object.values(node.props).forEach(e => collectExprNames(e, names));
      break;
    case 'Button':
      collectExprNames(node.label, names);
      if (!Array.isArray(node.action)) {
        collectExprNames(node.action as Expression, names);
      }
      Object.values(node.props).forEach(e => collectExprNames(e, names));
      break;
    case 'Input':
      names.add(node.binding);
      Object.values(node.props).forEach(e => collectExprNames(e, names));
      break;
    case 'Toggle':
      names.add(node.binding.split('.')[0]);
      break;
    case 'Select':
      names.add(node.binding);
      collectExprNames(node.options, names);
      break;
    case 'IfBlock':
      collectExprNames(node.condition, names);
      node.body.forEach(ch => collectUsedNames(ch as ASTNode, names));
      node.elifs.forEach(e => {
        collectExprNames(e.condition, names);
        e.body.forEach(ch => collectUsedNames(ch as ASTNode, names));
      });
      node.elseBody?.forEach(ch => collectUsedNames(ch as ASTNode, names));
      break;
    case 'ForBlock':
      collectExprNames(node.iterable, names);
      node.body.forEach(ch => collectUsedNames(ch as ASTNode, names));
      break;
    case 'ShowBlock':
    case 'HideBlock':
      collectExprNames(node.condition, names);
      node.body.forEach(ch => collectUsedNames(ch as ASTNode, names));
      break;
    case 'ComponentCall':
      Object.values(node.args).forEach(e => collectExprNames(e, names));
      if (node.children) node.children.forEach(ch => collectUsedNames(ch as ASTNode, names));
      break;
    case 'RawBlock':
      break;
  }
}

function collectExprNames(expr: Expression, names: Set<string>): void {
  switch (expr.kind) {
    case 'identifier': names.add(expr.name); break;
    case 'member': collectExprNames(expr.object, names); break;
    case 'index':
      collectExprNames(expr.object, names);
      collectExprNames(expr.index, names);
      break;
    case 'call':
      collectExprNames(expr.callee, names);
      expr.args.forEach(a => collectExprNames(a, names));
      break;
    case 'binary':
      collectExprNames(expr.left, names);
      collectExprNames(expr.right, names);
      break;
    case 'unary': collectExprNames(expr.operand, names); break;
    case 'ternary':
      collectExprNames(expr.condition, names);
      collectExprNames(expr.consequent, names);
      collectExprNames(expr.alternate, names);
      break;
    case 'array': expr.elements.forEach(e => collectExprNames(e, names)); break;
    case 'object_expr': expr.properties.forEach(p => collectExprNames(p.value, names)); break;
    case 'arrow':
      if (!Array.isArray(expr.body)) collectExprNames(expr.body as Expression, names);
      break;
    case 'template':
      expr.parts.forEach(p => { if (typeof p !== 'string') collectExprNames(p, names); });
      break;
    case 'assignment':
      collectExprNames(expr.target, names);
      collectExprNames(expr.value, names);
      break;
    case 'await': collectExprNames(expr.expression, names); break;
  }
}

function collectStmtNames(stmt: Statement, names: Set<string>): void {
  switch (stmt.kind) {
    case 'expr_stmt': collectExprNames(stmt.expression, names); break;
    case 'return': if (stmt.value) collectExprNames(stmt.value, names); break;
    case 'assignment_stmt':
      collectExprNames(stmt.target, names);
      collectExprNames(stmt.value, names);
      break;
    case 'var_decl': collectExprNames(stmt.value, names); break;
    case 'if_stmt':
      collectExprNames(stmt.condition, names);
      stmt.body.forEach(s => collectStmtNames(s, names));
      stmt.elifs.forEach(e => {
        collectExprNames(e.condition, names);
        e.body.forEach(s => collectStmtNames(s, names));
      });
      stmt.elseBody?.forEach(s => collectStmtNames(s, names));
      break;
    case 'for_stmt':
      collectExprNames(stmt.iterable, names);
      stmt.body.forEach(s => collectStmtNames(s, names));
      break;
  }
}
