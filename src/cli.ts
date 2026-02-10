#!/usr/bin/env node

// 0x CLI

import { readFileSync, writeFileSync, mkdirSync, existsSync, watchFile } from 'fs';
import { resolve, basename, dirname, join } from 'path';
import { compile } from './compiler.js';
import { initProject } from './init.js';

const HELP = `
0x Compiler CLI

Usage:
  0x build <file.ai> --target <target> [--output <dir>]
  0x dev <file.ai> --target <target>
  0x bench <file.ai>
  0x init [project-name]

Commands:
  build    Compile .ai file to target framework code
  dev      Watch mode — recompile on file changes
  bench    Show token efficiency benchmark
  init     Create a new 0x project

Options:
  --target <target>    Target framework: react, vue, svelte (comma-separated for multiple)
  --output <dir>       Output directory (default: ./dist/)
  --help               Show this help message

Examples:
  0x build todo.ai --target react
  0x build todo.ai --target react,vue,svelte --output ./dist/
  0x dev todo.ai --target react
  0x bench todo.ai
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

  console.log(`\n0x Compiler v0.1.3`);
  console.log(`Compiling: ${file}\n`);

  for (const target of targets) {
    if (!['react', 'vue', 'svelte'].includes(target)) {
      console.error(`Error: Unknown target '${target}'. Use react, vue, or svelte.`);
      process.exit(1);
    }

    try {
      const result = compile(source, { target: target as 'react' | 'vue' | 'svelte' });
      const ext = target === 'react' ? 'jsx' : target === 'vue' ? 'vue' : 'svelte';
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
      const result = compile(source, { target: target as 'react' | 'vue' | 'svelte' });
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

  const targets: Array<'react' | 'vue' | 'svelte'> = ['react', 'vue', 'svelte'];

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
