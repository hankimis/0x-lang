#!/usr/bin/env node

// 0x CLI

import { readFileSync, writeFileSync, mkdirSync, existsSync, watchFile } from 'fs';
import { resolve, basename, join } from 'path';
import { compile, compileDebug } from './compiler.js';
import type { CompileTarget } from './compiler.js';
import { initProject } from './init.js';
import { getLanguageSpec } from './generators/ai-bridge.js';

const VALID_TARGETS = ['react', 'vue', 'svelte', 'backend', 'react-native', 'terraform'];

const HELP = `
0x Compiler CLI

Usage:
  0x build <file.ai> --target <target> [--output <dir>] [--compact] [--debug]
  0x dev <file.ai> --target <target>
  0x debug <file.ai>
  0x inspect <file.ai>
  0x bench <file.ai>
  0x spec
  0x init [project-name]

Commands:
  build    Compile .ai file to target framework code
  dev      Watch mode — recompile on file changes
  debug    Show full compilation pipeline (tokens, AST, validation, timing)
  inspect  Show generated code for all 3 targets (react, vue, svelte)
  bench    Show token efficiency benchmark
  spec     Print the 0x language specification (for AI/LLM agents)
  init     Create a new 0x project

Targets:
  react          React JSX + hooks (web frontend)
  vue            Vue 3 SFC (web frontend)
  svelte         Svelte component (web frontend)
  backend        Express.js server (API server)
  react-native   React Native (mobile)
  terraform      Terraform HCL (infrastructure)

Options:
  --target <target>    Target framework (comma-separated for multiple)
  --output <dir>       Output directory (default: ./dist/)
  --compact            AI-optimized compact output (strips comments, minimizes whitespace)
  --debug              Add runtime debug logging ([0x] console.log) to generated code
  --no-sourcemap       Disable source maps
  --help               Show this help message

Examples:
  0x build todo.ai --target react
  0x build todo.ai --target react --debug
  0x build api.ai --target backend
  0x build infra.ai --target terraform
  0x build todo.ai --target react,vue,svelte --output ./dist/
  0x build todo.ai --target react --compact
  0x debug todo.ai
  0x inspect todo.ai
  0x dev todo.ai --target react
  0x bench todo.ai
  0x spec
  0x init my-app
`;

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'build':
      buildCommand(args.slice(1));
      break;
    case 'dev':
      devCommand(args.slice(1));
      break;
    case 'debug':
      debugCommand(args.slice(1));
      break;
    case 'inspect':
      inspectCommand(args.slice(1));
      break;
    case 'bench':
      benchCommand(args.slice(1));
      break;
    case 'spec':
      console.log(getLanguageSpec());
      break;
    case 'init':
      initProject(args[1] || 'my-0x-app');
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

function parseArgs(args: string[]): { file: string; targets: string[]; output: string } {
  let file = '';
  let targets: string[] = ['react'];
  let output = './dist/';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' || args[i] === '-t') {
      i++;
      targets = args[i].split(',').map(t => t.trim());
    } else if (args[i] === '--output' || args[i] === '-o') {
      i++;
      output = args[i];
    } else if (!args[i].startsWith('-')) {
      file = args[i];
    }
  }

  if (!file) {
    console.error('Error: No input file specified');
    process.exit(1);
  }

  return { file, targets, output };
}

function buildCommand(args: string[]): void {
  const { file, targets, output } = parseArgs(args);
  const filePath = resolve(file);

  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');
  const name = basename(file, '.ai');

  console.log(`\n0x Compiler v0.1.5`);
  console.log(`Compiling: ${file}\n`);

  for (const target of targets) {
    if (!VALID_TARGETS.includes(target)) {
      console.error(`Error: Unknown target '${target}'. Use: ${VALID_TARGETS.join(', ')}`);
      process.exit(1);
    }

    try {
      const compact = process.argv.includes('--compact');
      const noSourceMap = process.argv.includes('--no-sourcemap');
      const debug = process.argv.includes('--debug');
      const result = compile(source, { target: target as CompileTarget, compact, sourceMap: noSourceMap ? false : undefined, debug });
      const extMap: Record<string, string> = { react: 'jsx', vue: 'vue', svelte: 'svelte', backend: 'ts', 'react-native': 'tsx', terraform: 'tf' };
      const ext = extMap[target] || 'js';
      const outDir = resolve(output, target);
      const outFile = join(outDir, `${name}.${ext}`);

      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      writeFileSync(outFile, result.code, 'utf-8');

      console.log(`  ✓ ${target}: ${outFile}`);
      console.log(`    ${result.lineCount} lines / ${result.tokenCount} tokens`);
    } catch (err) {
      console.error(`  ✗ ${target}: ${(err as Error).message}`);
    }
  }

  console.log('\nDone!');
}

function devCommand(args: string[]): void {
  const { file, targets } = parseArgs(args);
  const filePath = resolve(file);

  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n0x Dev Mode — watching ${file}`);
  console.log(`Targets: ${targets.join(', ')}`);
  console.log('Press Ctrl+C to stop\n');

  // Initial compile
  compileAndLog(filePath, targets);

  // Watch for changes
  watchFile(filePath, { interval: 500 }, () => {
    console.log(`\n--- File changed: ${file} ---`);
    compileAndLog(filePath, targets);
  });
}

function compileAndLog(filePath: string, targets: string[]): void {
  const source = readFileSync(filePath, 'utf-8');

  for (const target of targets) {
    try {
      const result = compile(source, { target: target as CompileTarget });
      console.log(`  ✓ ${target}: ${result.lineCount} lines / ${result.tokenCount} tokens`);
    } catch (err) {
      console.error(`  ✗ ${target}: ${(err as Error).message}`);
    }
  }
}

function benchCommand(args: string[]): void {
  let file = args[0];
  if (!file) {
    console.error('Error: No input file specified');
    process.exit(1);
  }

  const filePath = resolve(file);
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');
  const name = basename(file, '.ai');

  const srcTokens = countTokens(source);
  const srcLines = countNonEmptyLines(source);

  console.log(`\n=== 0x Benchmark: ${name} ===\n`);
  console.log(`Source: ${file}`);
  console.log(`0x: ${srcLines} lines / ${srcTokens} tokens\n`);

  const targets: CompileTarget[] = ['react', 'vue', 'svelte'];

  for (const target of targets) {
    try {
      const result = compile(source, { target, validate: false });
      const genTokens = countTokens(result.code);
      const genLines = countNonEmptyLines(result.code);
      const tokenSavings = ((1 - srcTokens / genTokens) * 100).toFixed(1);
      const lineSavings = ((1 - srcLines / genLines) * 100).toFixed(1);

      console.log(`${target}:`);
      console.log(`  Generated: ${genLines} lines / ${genTokens} tokens`);
      console.log(`  Savings:   ${tokenSavings}% tokens / ${lineSavings}% lines`);
      console.log(`  0x: ${srcLines} lines / ${srcTokens} tokens → ${target}: ${genLines} lines / ${genTokens} tokens (${tokenSavings}% token savings)\n`);
    } catch (err) {
      console.error(`  ${target}: Error — ${(err as Error).message}\n`);
    }
  }
}

function debugCommand(args: string[]): void {
  const file = args.find(a => !a.startsWith('-'));
  if (!file) {
    console.error('Error: No input file specified');
    process.exit(1);
  }
  const filePath = resolve(file);
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');

  console.log(`\n\x1b[36m━━━ 0x Debug: ${file} ━━━\x1b[0m\n`);

  const info = compileDebug(source);

  // 1. TOKENS (first 30)
  console.log(`\x1b[33m▸ TOKENS\x1b[0m (${info.tokens.length} total, showing first 30)\n`);
  const tokenSlice = info.tokens.slice(0, 30);
  console.log('  Line  Col  Type            Value');
  console.log('  ────  ───  ──────────────  ─────────────────────');
  for (const t of tokenSlice) {
    const val = t.value.replace(/\n/g, '\\n').slice(0, 24);
    console.log(`  ${String(t.line).padStart(4)}  ${String(t.column).padStart(3)}  ${t.type.padEnd(14)}  ${val}`);
  }
  if (info.tokens.length > 30) console.log(`  ... +${info.tokens.length - 30} more tokens`);

  // 2. AST (first 50 lines of JSON)
  console.log(`\n\x1b[33m▸ AST\x1b[0m (${info.stats.nodeCount} nodes)\n`);
  const astJson = JSON.stringify(info.ast, null, 2).split('\n');
  const astSlice = astJson.slice(0, 50);
  for (const line of astSlice) {
    console.log(`  ${line}`);
  }
  if (astJson.length > 50) console.log(`  ... +${astJson.length - 50} more lines`);

  // 3. VALIDATION
  console.log(`\n\x1b[33m▸ VALIDATION\x1b[0m`);
  if (info.validation.errors.length === 0) {
    console.log(`  \x1b[32m✓ Passed\x1b[0m (no errors)`);
  } else {
    console.log(`  \x1b[31m✗ ${info.validation.errors.length} errors:\x1b[0m`);
    for (const e of info.validation.errors) {
      console.log(`    Line ${e.line}, Col ${e.column}: ${e.message}`);
    }
  }

  // 4. GENERATED CODE
  console.log(`\n\x1b[33m▸ GENERATED CODE\x1b[0m\n`);
  for (const [target, gen] of Object.entries(info.generated)) {
    const badge = target === 'react' ? '\x1b[36m' : target === 'vue' ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${badge}${target}\x1b[0m: ${gen.lineCount} lines / ${gen.tokenCount} tokens`);
    const preview = gen.code.split('\n').slice(0, 20);
    for (const line of preview) {
      console.log(`    ${line}`);
    }
    if (gen.code.split('\n').length > 20) console.log(`    ...`);
    console.log('');
  }

  // 5. TIMING
  console.log(`\x1b[33m▸ TIMING\x1b[0m\n`);
  console.log(`  Tokenize:  ${info.timing.tokenize.toFixed(2)}ms`);
  console.log(`  Parse:     ${info.timing.parse.toFixed(2)}ms`);
  console.log(`  Validate:  ${info.timing.validate.toFixed(2)}ms`);
  for (const [target, ms] of Object.entries(info.timing.generate)) {
    console.log(`  Generate (${target}): ${ms.toFixed(2)}ms`);
  }
  const totalMs = info.timing.tokenize + info.timing.parse + info.timing.validate + Object.values(info.timing.generate).reduce((a, b) => a + b, 0);
  console.log(`  \x1b[1mTotal:     ${totalMs.toFixed(2)}ms\x1b[0m`);

  // 6. SUMMARY
  console.log(`\n\x1b[33m▸ SUMMARY\x1b[0m\n`);
  console.log(`  Source:  ${info.stats.sourceLines} lines / ${info.stats.tokenCount} tokens / ${info.stats.nodeCount} AST nodes`);
  for (const [target, gen] of Object.entries(info.generated)) {
    const ratio = (gen.lineCount / info.stats.sourceLines).toFixed(1);
    console.log(`  → ${target}: ${gen.lineCount} lines (${ratio}x expansion)`);
  }
  console.log('');
}

function inspectCommand(args: string[]): void {
  const file = args.find(a => !a.startsWith('-'));
  if (!file) {
    console.error('Error: No input file specified');
    process.exit(1);
  }
  const filePath = resolve(file);
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');
  const targets: CompileTarget[] = ['react', 'vue', 'svelte'];

  console.log(`\n\x1b[36m━━━ 0x Inspect: ${file} ━━━\x1b[0m\n`);

  for (const target of targets) {
    const badge = target === 'react' ? '\x1b[36m' : target === 'vue' ? '\x1b[32m' : '\x1b[31m';
    try {
      const result = compile(source, { target, validate: false, sourceMap: false });
      console.log(`${badge}── ${target.toUpperCase()} ──\x1b[0m (${result.lineCount} lines / ${result.tokenCount} tokens)\n`);
      console.log(result.code);
      console.log('');
    } catch (err) {
      console.error(`${badge}── ${target.toUpperCase()} ──\x1b[0m \x1b[31mError: ${(err as Error).message}\x1b[0m\n`);
    }
  }
}

function countTokens(code: string): number {
  return code.split(/\s+/).filter(t => t.length > 0).length;
}

function countNonEmptyLines(code: string): number {
  return code.split('\n').filter(l => l.trim().length > 0).length;
}

main();
