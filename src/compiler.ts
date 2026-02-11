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
  // Add source line mapping comments (0x:L5) for debugging (default: true)
  sourceMap?: boolean;
  // Add 'use client' directive for Next.js SSR (React only, default: auto)
  useClient?: boolean;
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

  let result: GeneratedCode;
  switch (options.target) {
    case 'react':
      result = generateReact(ast);
      break;
    case 'vue':
      result = generateVue(ast);
      break;
    case 'svelte':
      result = generateSvelte(ast);
      break;
    default:
      throw new Error(`Unknown target: ${options.target}`);
  }

  // Post-process: strip source map comments if disabled
  if (options.sourceMap === false) {
    result = { ...result, code: result.code.replace(/\{\/\* 0x:L\d+ \*\/\}/g, '').replace(/<!-- 0x:L\d+ -->/g, '') };
  }

  // Post-process: strip 'use client' if explicitly disabled
  if (options.useClient === false && options.target === 'react') {
    result = { ...result, code: result.code.replace(/^'use client';\n\n/gm, '') };
  }

  return result;
}
