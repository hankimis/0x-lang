import { describe, test, expect } from 'vitest';
import { validate, ValidationError, ValidationWarning } from '../src/validator.js';
import { parse } from '../src/parser.js';

function getErrors(source: string): ValidationError[] {
  const ast = parse(source);
  const result = validate(ast);
  return result.errors;
}

function getWarnings(source: string): ValidationWarning[] {
  const ast = parse(source);
  const result = validate(ast);
  return result.warnings;
}

describe('Validator', () => {
  describe('Duplicate declaration detection', () => {
    test('duplicate state names produce error', () => {
      const errors = getErrors(`page Bad:
  state count: int = 0
  state count: int = 1`);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toMatch(/duplicate/i);
    });

    test('state and derived with same name produce error', () => {
      const errors = getErrors(`page Bad:
  state x: int = 0
  derived x = 1 + 2`);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toMatch(/duplicate/i);
    });

    test('unique names pass', () => {
      const errors = getErrors(`page Good:
  state a: int = 0
  state b: int = 1
  derived c = a + b`);
      expect(errors.length).toBe(0);
    });
  });

  describe('Circular derived detection', () => {
    test('direct circular reference', () => {
      const errors = getErrors(`page Bad:
  derived a = b + 1
  derived b = a + 1`);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toMatch(/circular/i);
    });

    test('indirect circular reference', () => {
      const errors = getErrors(`page Bad:
  derived a = b + 1
  derived b = c + 1
  derived c = a + 1`);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toMatch(/circular/i);
    });

    test('non-circular derived passes', () => {
      const errors = getErrors(`page Good:
  state count: int = 0
  derived doubled = count * 2
  derived quadrupled = doubled * 2`);
      expect(errors.length).toBe(0);
    });
  });

  describe('Unused state warnings', () => {
    test('warns on unused state', () => {
      const warnings = getWarnings(`page T:
  state unused: int = 0
  state used: int = 0
  text "{used}"`);
      const unusedWarnings = warnings.filter(w => w.message.includes('unused'));
      expect(unusedWarnings.length).toBeGreaterThan(0);
    });

    test('no warning for used state', () => {
      const warnings = getWarnings(`page T:
  state count: int = 0
  text "{count}"`);
      const unusedWarnings = warnings.filter(w => w.message.includes('count'));
      expect(unusedWarnings.length).toBe(0);
    });
  });

  describe('Check validation', () => {
    test('valid check condition passes', () => {
      const errors = getErrors(`page T:
  state items: list[str] = []
  check items.length <= 100 "100개 초과 불가"`);
      expect(errors.length).toBe(0); // Valid check — no errors
    });
  });

  describe('Valid programs', () => {
    test('counter app — no errors', () => {
      const errors = getErrors(`page Counter:
  state count: int = 0
  derived doubled = count * 2

  fn increment():
    count += 1

  layout col:
    text "{count}" size=xl
    button "+1" -> increment()`);
      expect(errors.length).toBe(0);
    });
  });

  describe('Type compatibility', () => {
    test('valid prop types pass', () => {
      const errors = getErrors(`component Card:
  prop title: str
  prop count: int
  text "{title}"`);
      expect(errors.length).toBe(0);
    });
  });
});
