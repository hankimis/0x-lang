// 0x LSP — Document Symbols

import { DocumentSymbol, SymbolKind, Range } from 'vscode-languageserver';
import { parse } from '../parser.js';
import type { ASTNode, SourceLocation } from '../ast.js';

function locToRange(loc: SourceLocation): Range {
  const line = Math.max(0, loc.line - 1);
  const char = Math.max(0, loc.column - 1);
  return {
    start: { line, character: char },
    end: { line, character: char + 1 },
  };
}

function makeSymbol(
  name: string,
  kind: SymbolKind,
  loc: SourceLocation,
  detail?: string,
  children?: DocumentSymbol[],
): DocumentSymbol {
  const range = locToRange(loc);
  return {
    name,
    kind,
    range,
    selectionRange: range,
    detail,
    children,
  };
}

export function getDocumentSymbols(source: string): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];

  try {
    const ast = parse(source);

    for (const node of ast) {
      if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
        const children: DocumentSymbol[] = [];

        for (const child of node.body) {
          switch (child.type) {
            case 'StateDecl':
              children.push(makeSymbol(child.name, SymbolKind.Variable, child.loc, 'state'));
              break;
            case 'DerivedDecl':
              children.push(makeSymbol(child.name, SymbolKind.Variable, child.loc, 'derived'));
              break;
            case 'PropDecl':
              children.push(makeSymbol(child.name, SymbolKind.Property, child.loc, 'prop'));
              break;
            case 'FnDecl':
              children.push(makeSymbol(child.name, SymbolKind.Function, child.loc, 'fn'));
              break;
            case 'OnMount':
              children.push(makeSymbol('on mount', SymbolKind.Event, child.loc));
              break;
            case 'OnDestroy':
              children.push(makeSymbol('on destroy', SymbolKind.Event, child.loc));
              break;
            case 'StyleDecl':
              children.push(makeSymbol('style', SymbolKind.Object, child.loc));
              break;
          }
        }

        symbols.push(makeSymbol(node.name, SymbolKind.Class, node.loc, node.type, children));
      } else if (node.type === 'Model') {
        symbols.push(makeSymbol(node.name, SymbolKind.Struct, node.loc, 'model'));
      } else if (node.type === 'RouteDecl') {
        symbols.push(makeSymbol(node.path, SymbolKind.Module, node.loc, 'route'));
      } else if (node.type === 'RoleDecl') {
        const roleName = node.roles.map(r => r.name).join(', ');
        symbols.push(makeSymbol(roleName, SymbolKind.Enum, node.loc, 'role'));
      }
    }
  } catch {
    // Parse failed — return empty symbols
  }

  return symbols;
}
