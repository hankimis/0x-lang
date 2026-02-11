// 0x LSP — Go to Definition

import { Location, Position, Range } from 'vscode-languageserver';
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

function getWordAtPosition(source: string, position: Position): string {
  const lines = source.split('\n');
  const line = lines[position.line] || '';
  const before = line.substring(0, position.character);
  const after = line.substring(position.character);

  const wordBefore = before.match(/[\w]+$/) || [''];
  const wordAfter = after.match(/^[\w]+/) || [''];
  return wordBefore[0] + wordAfter[0];
}

export function getDefinition(source: string, position: Position, uri: string): Location | null {
  const word = getWordAtPosition(source, position);
  if (!word) return null;

  try {
    const ast = parse(source);

    for (const node of ast) {
      // Check top-level names (page/component/app)
      if (
        (node.type === 'Page' || node.type === 'Component' || node.type === 'App') &&
        node.name === word
      ) {
        return { uri, range: locToRange(node.loc) };
      }

      // Search inside top-level blocks for declarations
      if (node.type === 'Page' || node.type === 'Component' || node.type === 'App') {
        for (const child of node.body) {
          if (child.type === 'StateDecl' && child.name === word) {
            return { uri, range: locToRange(child.loc) };
          }
          if (child.type === 'DerivedDecl' && child.name === word) {
            return { uri, range: locToRange(child.loc) };
          }
          if (child.type === 'PropDecl' && child.name === word) {
            return { uri, range: locToRange(child.loc) };
          }
          if (child.type === 'FnDecl' && child.name === word) {
            return { uri, range: locToRange(child.loc) };
          }
          if (child.type === 'StoreDecl' && child.name === word) {
            return { uri, range: locToRange(child.loc) };
          }
          if (child.type === 'ApiDecl' && child.name === word) {
            return { uri, range: locToRange(child.loc) };
          }
        }
      }

      // Model nodes
      if (node.type === 'Model' && node.name === word) {
        return { uri, range: locToRange(node.loc) };
      }

      // Role nodes
      if (node.type === 'RoleDecl') {
        for (const role of node.roles) {
          if (role.name === word) {
            return { uri, range: locToRange(node.loc) };
          }
        }
      }
    }
  } catch {
    // Parse failed — no definition available
  }

  return null;
}
