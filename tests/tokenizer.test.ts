import { describe, test, expect } from 'vitest';
import { tokenize, Token, TokenType } from '../src/tokenizer.js';

function getTokenTypes(source: string): TokenType[] {
  return tokenize(source).filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.type);
}

function getTokenValues(source: string): string[] {
  return tokenize(source).filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
}

describe('Tokenizer', () => {
  describe('기본 토큰', () => {
    test('키워드 인식', () => {
      const tokens = tokenize('page state derived prop');
      const keywords = tokens.filter(t => t.type === 'KEYWORD');
      expect(keywords.map(t => t.value)).toEqual(['page', 'state', 'derived', 'prop']);
    });

    test('모든 키워드', () => {
      const allKeywords = [
        'app', 'page', 'component', 'state', 'derived', 'prop', 'type',
        'fn', 'async', 'layout', 'text', 'button', 'input', 'image',
        'link', 'toggle', 'select', 'if', 'elif', 'else', 'for', 'in',
        'show', 'hide', 'on', 'watch', 'check', 'requires', 'ensures',
        'api', 'store', 'use', 'js', 'style', 'import', 'from', 'return',
        'mount', 'destroy', 'await', 'true', 'false', 'null',
      ];
      for (const kw of allKeywords) {
        const tokens = tokenize(kw);
        expect(tokens[0].type).toBe('KEYWORD');
        expect(tokens[0].value).toBe(kw);
      }
    });

    test('식별자 인식', () => {
      const tokens = tokenize('myVar _private camelCase item2');
      const identifiers = tokens.filter(t => t.type === 'IDENTIFIER');
      expect(identifiers.map(t => t.value)).toEqual(['myVar', '_private', 'camelCase', 'item2']);
    });

    test('정수 리터럴', () => {
      const tokens = tokenize('0 42 100');
      const numbers = tokens.filter(t => t.type === 'NUMBER');
      expect(numbers.map(t => t.value)).toEqual(['0', '42', '100']);
    });

    test('실수 리터럴', () => {
      const tokens = tokenize('3.14 0.5 100.0');
      const numbers = tokens.filter(t => t.type === 'NUMBER');
      expect(numbers.map(t => t.value)).toEqual(['3.14', '0.5', '100.0']);
    });

    test('문자열 리터럴 (쌍따옴표)', () => {
      const tokens = tokenize('"hello world"');
      expect(tokens[0].type).toBe('STRING');
      expect(tokens[0].value).toBe('hello world');
    });

    test('문자열 리터럴 (홑따옴표)', () => {
      const tokens = tokenize("'hello world'");
      expect(tokens[0].type).toBe('STRING');
      expect(tokens[0].value).toBe('hello world');
    });

    test('이스케이프 문자열', () => {
      const tokens = tokenize('"He said \\"hello\\""');
      expect(tokens[0].type).toBe('STRING');
      expect(tokens[0].value).toBe('He said "hello"');
    });

    test('한글 문자열', () => {
      const tokens = tokenize('"할 일을 입력하세요"');
      expect(tokens[0].type).toBe('STRING');
      expect(tokens[0].value).toBe('할 일을 입력하세요');
    });

    test('이모지 포함 문자열', () => {
      const tokens = tokenize('"emoji: 🎉🔥"');
      expect(tokens[0].type).toBe('STRING');
      expect(tokens[0].value).toBe('emoji: 🎉🔥');
    });

    test('템플릿 문자열 (변수 보간)', () => {
      const tokens = tokenize('"{count}개 남음"');
      expect(tokens[0].type).toBe('STRING');
      expect(tokens[0].value).toBe('{count}개 남음');
    });
  });

  describe('연산자', () => {
    test('단일 문자 연산자', () => {
      const tokens = tokenize('+ - * / % = > < !');
      const ops = tokens.filter(t => t.type === 'OPERATOR');
      expect(ops.map(t => t.value)).toEqual(['+', '-', '*', '/', '%', '=', '>', '<', '!']);
    });

    test('복합 연산자', () => {
      const tokens = tokenize('+= -= -> == != >= <= && ||');
      const ops = tokens.filter(t => t.type === 'OPERATOR');
      expect(ops.map(t => t.value)).toEqual(['+=', '-=', '->', '==', '!=', '>=', '<=', '&&', '||']);
    });

    test('화살표 연산자', () => {
      const tokens = tokenize('button "클릭" -> count += 1');
      const arrow = tokens.find(t => t.value === '->');
      expect(arrow).toBeDefined();
      expect(arrow!.type).toBe('OPERATOR');
    });

    test('=> 연산자 (화살표 함수)', () => {
      const tokens = tokenize('items.filter(i => !i.done)');
      const arrow = tokens.find(t => t.value === '=>');
      expect(arrow).toBeDefined();
      expect(arrow!.type).toBe('OPERATOR');
    });
  });

  describe('구두점', () => {
    test('기본 구두점', () => {
      const tokens = tokenize(': , . ( ) [ ] { }');
      const puncts = tokens.filter(t => t.type === 'PUNCTUATION');
      expect(puncts.map(t => t.value)).toEqual([':', ',', '.', '(', ')', '[', ']', '{', '}']);
    });

    test('? 구두점 (nullable)', () => {
      const tokens = tokenize('str?');
      expect(tokens[1].type).toBe('PUNCTUATION');
      expect(tokens[1].value).toBe('?');
    });
  });

  describe('색상 리터럴', () => {
    test('hex 색상', () => {
      const tokens = tokenize('color=#333');
      const color = tokens.find(t => t.type === 'COLOR');
      expect(color).toBeDefined();
      expect(color!.value).toBe('#333');
    });

    test('6자리 hex 색상', () => {
      const tokens = tokenize('bg=#f0f0f0');
      const color = tokens.find(t => t.type === 'COLOR');
      expect(color).toBeDefined();
      expect(color!.value).toBe('#f0f0f0');
    });
  });

  describe('들여쓰기 (INDENT/DEDENT)', () => {
    test('기본 들여쓰기', () => {
      const source = `page Todo:\n  state count: int = 0`;
      const tokens = tokenize(source);
      const types = tokens.map(t => t.type);
      expect(types).toContain('INDENT');
    });

    test('들여쓰기 해제', () => {
      const source = `page Todo:\n  state count: int = 0\npage Other:`;
      const tokens = tokenize(source);
      const types = tokens.map(t => t.type);
      expect(types).toContain('INDENT');
      expect(types).toContain('DEDENT');
    });

    test('중첩 들여쓰기', () => {
      const source = `page Todo:\n  layout col:\n    text "hello"\n  text "world"`;
      const tokens = tokenize(source);
      const indents = tokens.filter(t => t.type === 'INDENT').length;
      const dedents = tokens.filter(t => t.type === 'DEDENT').length;
      expect(indents).toBe(2); // level 0→1, 1→2
      expect(dedents).toBeGreaterThanOrEqual(1); // at least back from 2→1
    });

    test('EOF에서 남은 DEDENT 생성', () => {
      const source = `page Todo:\n  layout col:\n    text "hello"`;
      const tokens = tokenize(source);
      const lastNonEOF = tokens.filter(t => t.type !== 'EOF');
      // Should have DEDENT tokens to close indentation before EOF
      const dedents = lastNonEOF.filter(t => t.type === 'DEDENT').length;
      expect(dedents).toBeGreaterThanOrEqual(2);
    });
  });

  describe('주석', () => {
    test('한 줄 주석', () => {
      const tokens = tokenize('// 이것은 주석입니다\nstate count: int = 0');
      const comment = tokens.find(t => t.type === 'COMMENT');
      expect(comment).toBeDefined();
      expect(comment!.value).toBe('이것은 주석입니다');
    });

    test('줄 끝 주석', () => {
      const tokens = tokenize('state count: int = 0 // 카운터');
      const comment = tokens.find(t => t.type === 'COMMENT');
      expect(comment).toBeDefined();
      expect(comment!.value).toBe('카운터');
    });
  });

  describe('@키워드', () => {
    test('@mobile, @tablet 인식', () => {
      const tokens = tokenize('@mobile: padding: 8');
      expect(tokens[0].type).toBe('AT_KEYWORD');
      expect(tokens[0].value).toBe('mobile');
    });

    test('@keypress 이벤트', () => {
      const tokens = tokenize('@keypress=onKeyPress');
      expect(tokens[0].type).toBe('AT_KEYWORD');
      expect(tokens[0].value).toBe('keypress');
    });
  });

  describe('위치 정보', () => {
    test('줄 번호와 컬럼 포함', () => {
      const tokens = tokenize('page Todo:\n  state count: int = 0');
      expect(tokens[0].line).toBe(1);
      expect(tokens[0].column).toBe(1);
      // state is on line 2
      const stateToken = tokens.find(t => t.value === 'state');
      expect(stateToken).toBeDefined();
      expect(stateToken!.line).toBe(2);
    });
  });

  describe('복합 토큰화', () => {
    test('state 선언', () => {
      const tokens = tokenize('state count: int = 0');
      const values = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
      expect(values).toEqual(['state', 'count', ':', 'int', '=', '0']);
    });

    test('derived 선언', () => {
      const tokens = tokenize('derived total = a + b');
      const values = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
      expect(values).toEqual(['derived', 'total', '=', 'a', '+', 'b']);
    });

    test('함수 정의', () => {
      const source = 'fn add(a: int, b: int):';
      const tokens = tokenize(source);
      const values = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
      expect(values).toEqual(['fn', 'add', '(', 'a', ':', 'int', ',', 'b', ':', 'int', ')', ':']);
    });

    test('list 타입', () => {
      const tokens = tokenize('state items: list[str] = []');
      const values = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
      expect(values).toEqual(['state', 'items', ':', 'list', '[', 'str', ']', '=', '[', ']']);
    });

    test('button with action', () => {
      const tokens = tokenize('button "추가" style=primary -> add()');
      const values = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
      expect(values).toEqual(['button', '추가', 'style', '=', 'primary', '->', 'add', '(', ')']);
    });

    test('layout with class', () => {
      const tokens = tokenize('layout col gap=8 .card:');
      const values = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').map(t => t.value);
      expect(values).toContain('.card');
    });

    test('HTTP 메서드', () => {
      const tokens = tokenize('api products = GET "/api/products"');
      const get = tokens.find(t => t.value === 'GET');
      expect(get).toBeDefined();
      expect(get!.type).toBe('HTTP_METHOD');
    });

    test('빈 소스', () => {
      const tokens = tokenize('');
      const meaningful = tokens.filter(t => t.type !== 'NEWLINE');
      expect(meaningful.length).toBe(1); // just EOF
      expect(meaningful[0].type).toBe('EOF');
    });

    test('공백만 있는 소스', () => {
      const tokens = tokenize('   \n\n   ');
      const nonNewlineNonEOF = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF');
      expect(nonNewlineNonEOF.length).toBe(0);
    });
  });

  describe('에러 처리', () => {
    test('닫히지 않은 문자열', () => {
      expect(() => tokenize('"hello')).toThrow();
    });

    test('에러 메시지에 줄 번호 포함', () => {
      try {
        tokenize('\n\n"unclosed');
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toMatch(/[Ll]ine 3/);
      }
    });
  });
});
