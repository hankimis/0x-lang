// Source Map Builder — generates V3 source maps for 0x compiled output
// Uses @jridgewell/gen-mapping for lightweight, standards-compliant source map generation

import { GenMapping, addMapping, toEncodedMap } from '@jridgewell/gen-mapping';

export class SourceMapBuilder {
  private map: GenMapping;
  private generatedLine = 1;
  private generatedColumn = 0;

  constructor(private sourceFile: string, generatedFile: string) {
    this.map = new GenMapping({ file: generatedFile });
  }

  /** Record a mapping from generated position to original source position */
  addMapping(sourceLine: number, sourceColumn: number): void {
    addMapping(this.map, {
      generated: { line: this.generatedLine, column: this.generatedColumn },
      source: this.sourceFile,
      original: { line: sourceLine, column: sourceColumn },
    });
  }

  /** Track generated output position as code is appended */
  advance(code: string): void {
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '\n') {
        this.generatedLine++;
        this.generatedColumn = 0;
      } else {
        this.generatedColumn++;
      }
    }
  }

  /** Emit a code segment, optionally recording a source mapping */
  emit(code: string, loc?: { line: number; column: number }): void {
    if (loc && loc.line > 0) {
      this.addMapping(loc.line, loc.column);
    }
    this.advance(code);
  }

  /** Get the V3 source map as a JSON string */
  toJSON(): string {
    return JSON.stringify(toEncodedMap(this.map));
  }
}
