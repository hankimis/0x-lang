// 0x LSP — Diagnostics (tokenize → parse → validate pipeline)

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { tokenize } from '../tokenizer.js';
import { parse, ParseError } from '../parser.js';
import { validate } from '../validator.js';

function makeRange(line: number, column: number): Range {
  // Parser line/column are 1-based; LSP is 0-based
  const l = Math.max(0, line - 1);
  const c = Math.max(0, column - 1);
  return { start: { line: l, character: c }, end: { line: l, character: c + 1 } };
}

export function getDiagnostics(source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  try {
    const tokens = tokenize(source);
    let ast;
    try {
      ast = parse(source);
    } catch (err) {
      if (err instanceof ParseError) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: makeRange(err.line, err.column),
          message: err.message,
          source: '0x',
        });
      } else if (err instanceof Error) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: makeRange(1, 1),
          message: err.message,
          source: '0x',
        });
      }
      return diagnostics;
    }

    const result = validate(ast);

    for (const error of result.errors) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: makeRange(error.line, error.column),
        message: error.message,
        source: '0x',
      });
    }

    for (const warning of result.warnings) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: makeRange(warning.line, warning.column),
        message: warning.message,
        source: '0x',
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: makeRange(1, 1),
      message,
      source: '0x',
    });
  }

  return diagnostics;
}
