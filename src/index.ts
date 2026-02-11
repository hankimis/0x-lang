// 0x — AI-First Programming Language Compiler

export { tokenize } from './tokenizer.js';
export type { Token, TokenType } from './tokenizer.js';

export { parse } from './parser.js';
export { ParseError } from './parser.js';

export { compile } from './compiler.js';
export type { CompileOptions, CompileTarget } from './compiler.js';

export { validate } from './validator.js';

export { generateReact } from './generators/react.js';
export { generateVue } from './generators/vue.js';
export { generateSvelte } from './generators/svelte.js';
export { generateBackend } from './generators/backend.js';
export { generateReactNative } from './generators/react-native.js';
export { generateTerraform } from './generators/terraform.js';

export { getLanguageSpec, generatePrompt, compileFromDescription } from './generators/ai-bridge.js';

export type { ASTNode, GeneratedCode, CodeGenerator } from './ast.js';
