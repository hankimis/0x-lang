#!/usr/bin/env node

// 0x CLI

import { readFileSync, writeFileSync, mkdirSync, existsSync, watchFile } from 'fs';
import { resolve, basename, join } from 'path';
import { compile } from './compiler.js';
import type { CompileTarget } from './compiler.js';
import { initProject } from './init.js';
import { getLanguageSpec } from './generators/ai-bridge.js';

const VALID_TARGETS = ['react', 'vue', 'svelte', 'backend', 'react-native', 'terraform'];

const HELP = `
0x Compiler CLI

Usage:
  0x build <file.ai> --target <target> [--output <dir>] [--compact]
  0x dev <file.ai> --target <target>
  0x bench <file.ai>
  0x spec
  0x init [project-name]

Commands:
  build    Compile .ai file to target framework code
  dev      Watch mode — recompile on file changes
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
  --no-sourcemap       Disable source maps
  --help               Show this help message

Examples:
  0x build todo.ai --target react
  0x build api.ai --target backend
  0x build infra.ai --target terraform
  0x build todo.ai --target react,vue,svelte --output ./dist/
  0x build todo.ai --target react --compact
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
      const result = compile(source, { target: target as CompileTarget, compact, sourceMap: noSourceMap ? false : undefined });
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

function countTokens(code: string): number {
  return code.split(/\s+/).filter(t => t.length > 0).length;
}

function countNonEmptyLines(code: string): number {
  return code.split('\n').filter(l => l.trim().length > 0).length;
}

main();
