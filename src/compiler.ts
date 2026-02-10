// 0x Compiler Pipeline

import { parse } from './parser.js';
import { generateReact } from './generators/react.js';
import { generateVue } from './generators/vue.js';
import { generateSvelte } from './generators/svelte.js';
import { validate } from './validator.js';
import type { GeneratedCode } from './ast.js';

export interface CompileOptions {
  target: 'react' | 'vue' | 'svelte';
  validate?: boolean;
}

export function compile(source: string, options: CompileOptions): GeneratedCode {
  const ast = parse(source);

  // Run validation if requested
  if (options.validate !== false) {
    const result = validate(ast);
    if (result.errors.length > 0) {
      const errMsg = result.errors.map(e => `Line ${e.line}, Col ${e.column}: ${e.message}`).join('\n');
      throw new Error(`Validation errors:\n${errMsg}`);
    }
  }

  switch (options.target) {
    case 'react':
      return generateReact(ast);
    case 'vue':
      return generateVue(ast);
    case 'svelte':
      return generateSvelte(ast);
    default:
      throw new Error(`Unknown target: ${options.target}`);
  }
}
