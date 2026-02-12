// 0x Compiler Pipeline

import { tokenize, type Token } from './tokenizer.js';
import { parse } from './parser.js';
import { generateReact } from './generators/react.js';
import { generateVue } from './generators/vue.js';
import { generateSvelte } from './generators/svelte.js';
import { generateBackend } from './generators/backend.js';
import { generateReactNative } from './generators/react-native.js';
import { generateTerraform } from './generators/terraform.js';
import { validate, type ValidationError } from './validator.js';
import type { ASTNode, GeneratedCode } from './ast.js';

export type CompileTarget = 'react' | 'vue' | 'svelte' | 'backend' | 'react-native' | 'terraform';

export interface CompileOptions {
  target: CompileTarget;
  validate?: boolean;
  // Add source line mapping comments (0x:L5) for debugging (default: true)
  sourceMap?: boolean;
  // Add 'use client' directive for Next.js SSR (React only, default: auto)
  useClient?: boolean;
  // AI-optimized compact output — strips comments, minimizes whitespace
  compact?: boolean;
  // Add runtime debug logging (console.log) to generated code
  debug?: boolean;
}

export interface DebugInfo {
  source: string;
  tokens: Token[];
  ast: ASTNode[];
  validation: { errors: ValidationError[] };
  generated: Record<string, GeneratedCode>;
  timing: { tokenize: number; parse: number; validate: number; generate: Record<string, number> };
  stats: { sourceLines: number; tokenCount: number; nodeCount: number };
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

  const debug = options.debug ?? false;

  let result: GeneratedCode;
  switch (options.target) {
    case 'react':
      result = generateReact(ast, debug);
      break;
    case 'vue':
      result = generateVue(ast, debug);
      break;
    case 'svelte':
      result = generateSvelte(ast, debug);
      break;
    case 'backend':
      result = generateBackend(ast);
      break;
    case 'react-native':
      result = generateReactNative(ast);
      break;
    case 'terraform':
      result = generateTerraform(ast);
      break;
    default:
      throw new Error(`Unknown target: ${options.target}`);
  }

  // Post-process: strip source map comments and V3 source map if disabled
  if (options.sourceMap === false) {
    result = { ...result, code: result.code.replace(/\{\/\* 0x:L\d+ \*\/\}/g, '').replace(/<!-- 0x:L\d+ -->/g, '').replace(/\/\/ 0x:L\d+\n\s*/g, ''), sourceMap: undefined };
  } else if (result.sourceMap) {
    // Append inline sourceMappingURL as base64 data URL
    const b64 = Buffer.from(result.sourceMap).toString('base64');
    result = { ...result, code: result.code + `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${b64}\n` };
  }

  // Post-process: strip 'use client' if explicitly disabled
  if (options.useClient === false && options.target === 'react') {
    result = { ...result, code: result.code.replace(/^'use client';\n\n/gm, '') };
  }

  // Post-process: compact mode for AI-optimized output
  if (options.compact) {
    result = compactify(result);
  }

  return result;
}

function countASTNodes(nodes: ASTNode[]): number {
  let count = 0;
  function walk(node: any) {
    if (!node || typeof node !== 'object') return;
    if (node.type) count++;
    if (Array.isArray(node.body)) node.body.forEach(walk);
    if (Array.isArray(node.children)) node.children.forEach(walk);
    if (node.elseBody) walk(node.elseBody);
    if (node.consequent) walk(node.consequent);
    if (node.alternate) walk(node.alternate);
  }
  nodes.forEach(walk);
  return count;
}

export function compileDebug(source: string): DebugInfo {
  const t0 = performance.now();
  const tokens = tokenize(source);
  const t1 = performance.now();

  const ast = parse(source);
  const t2 = performance.now();

  const validationResult = validate(ast);
  const t3 = performance.now();

  const targets: CompileTarget[] = ['react', 'vue', 'svelte'];
  const generated: Record<string, GeneratedCode> = {};
  const genTiming: Record<string, number> = {};

  for (const target of targets) {
    const g0 = performance.now();
    try {
      generated[target] = compile(source, { target, validate: false, sourceMap: false });
    } catch (err) {
      generated[target] = { code: `// Error: ${(err as Error).message}`, filename: '', imports: [], lineCount: 0, tokenCount: 0 };
    }
    genTiming[target] = performance.now() - g0;
  }

  return {
    source,
    tokens,
    ast,
    validation: { errors: validationResult.errors },
    generated,
    timing: {
      tokenize: t1 - t0,
      parse: t2 - t1,
      validate: t3 - t2,
      generate: genTiming,
    },
    stats: {
      sourceLines: source.split('\n').filter(l => l.trim().length > 0).length,
      tokenCount: tokens.length,
      nodeCount: countASTNodes(ast),
    },
  };
}

function compactify(result: GeneratedCode): GeneratedCode {
  let code = result.code;
  // Strip source map comments
  code = code.replace(/\{\/\* 0x:L\d+ \*\/\}/g, '');
  code = code.replace(/<!-- 0x:L\d+ -->/g, '');
  // Strip block comments
  code = code.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip single-line comments (but not URLs or sourceMappingURL)
  code = code.replace(/^(\s*)\/\/(?!#).*$/gm, '');
  // Strip hash comments (Terraform-style)
  code = code.replace(/^#\s+Generated by 0x.*$/gm, '');
  // Strip "Generated by 0x" header comments
  code = code.replace(/^\/\/ Generated by 0x.*$/gm, '');
  // Collapse multiple empty lines to single empty line
  code = code.replace(/\n{3,}/g, '\n\n');
  // Remove trailing whitespace on each line
  code = code.replace(/[ \t]+$/gm, '');
  // Trim
  code = code.trim();

  return {
    ...result,
    code,
    lineCount: code.split('\n').length,
    tokenCount: code.split(/\s+/).filter(t => t.length > 0).length,
    sourceMap: undefined,
  };
}