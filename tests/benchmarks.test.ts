import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { compile } from '../src/compiler.js';

function readExample(name: string): string {
  return readFileSync(`examples/${name}.ai`, 'utf-8');
}

// Simple token counter (whitespace-separated)
function countTokens(code: string): number {
  return code.split(/\s+/).filter(t => t.length > 0).length;
}

function countLines(code: string): number {
  return code.split('\n').filter(l => l.trim().length > 0).length;
}

function countChars(code: string): number {
  return code.replace(/\s+/g, '').length;
}

// Production-grade React equivalents
// These represent what an AI would actually generate for the same UI
const REACT_COUNTER = `
import React, { useState, useMemo, useCallback } from 'react';

interface CounterProps {}

const Counter: React.FC<CounterProps> = () => {
  const [count, setCount] = useState<number>(0);
  const doubled = useMemo(() => count * 2, [count]);
  const isPositive = useMemo(() => count > 0, [count]);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '24px',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 'bold',
        margin: 0,
      }}>
        카운터
      </h1>

      <span style={{
        fontSize: '40px',
        fontWeight: 'bold',
        color: '#333',
      }}>
        {count}
      </span>

      <span style={{
        fontSize: '20px',
        color: '#666',
      }}>
        두 배: {doubled}
      </span>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
      }}>
        <button
          onClick={decrement}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          -1
        </button>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#e5e7eb',
            color: '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          리셋
        </button>
        <button
          onClick={increment}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          +1
        </button>
      </div>
    </div>
  );
};

export default Counter;
`;

const REACT_TODO = `
import React, { useState, useMemo, useCallback, ChangeEvent } from 'react';

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

const Todo: React.FC = () => {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [input, setInput] = useState<string>('');
  const remaining = useMemo(
    () => items.filter(item => !item.done).length,
    [items]
  );

  const add = useCallback(() => {
    if (input.trim() !== '') {
      setItems(prev => [
        ...prev,
        { id: Date.now(), text: input, done: false },
      ]);
      setInput('');
    }
  }, [input]);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const toggleDone = useCallback((id: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  if (items.length > 500) {
    console.warn('할일은 500개 이하');
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: 'bold',
      }}>
        할 일 ({remaining}개 남음)
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
      }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="할 일을 입력하세요"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={add}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          추가
        </button>
      </div>

      {items.map(item => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => toggleDone(item.id)}
          />
          <span style={{
            textDecoration: item.done ? 'line-through' : 'none',
            color: item.done ? '#999' : '#333',
            flex: 1,
          }}>
            {item.text}
          </span>
          <button
            onClick={() => remove(item.id)}
            style={{
              padding: '4px 10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            삭제
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <p style={{
          color: '#999',
          textAlign: 'center',
          padding: '20px 0',
        }}>
          할 일이 없습니다
        </p>
      )}
    </div>
  );
};

export default Todo;
`;

describe('Token Efficiency Benchmarks', () => {
  test('카운터 앱 — 0x vs Production React', () => {
    const srcSource = readExample('counter');
    const srcLines = countLines(srcSource);
    const srcChars = countChars(srcSource);

    const reactLines = countLines(REACT_COUNTER);
    const reactChars = countChars(REACT_COUNTER);

    const lineRatio = srcLines / reactLines;
    const charRatio = srcChars / reactChars;

    console.log(`\n=== Counter App Benchmark ===`);
    console.log(`0x:    ${srcLines} lines / ${srcChars} chars`);
    console.log(`React: ${reactLines} lines / ${reactChars} chars`);
    console.log(`Line savings: ${((1 - lineRatio) * 100).toFixed(1)}%`);
    console.log(`Char savings: ${((1 - charRatio) * 100).toFixed(1)}%`);

    // 0x should use at least 70% fewer lines than production React
    expect(lineRatio).toBeLessThan(0.30);
    expect(charRatio).toBeLessThan(0.40);
  });

  test('Todo 앱 — 0x vs Production React', () => {
    const srcSource = readExample('todo');
    const srcLines = countLines(srcSource);
    const srcChars = countChars(srcSource);

    const reactLines = countLines(REACT_TODO);
    const reactChars = countChars(REACT_TODO);

    const lineRatio = srcLines / reactLines;
    const charRatio = srcChars / reactChars;

    console.log(`\n=== Todo App Benchmark ===`);
    console.log(`0x:    ${srcLines} lines / ${srcChars} chars`);
    console.log(`React: ${reactLines} lines / ${reactChars} chars`);
    console.log(`Line savings: ${((1 - lineRatio) * 100).toFixed(1)}%`);
    console.log(`Char savings: ${((1 - charRatio) * 100).toFixed(1)}%`);

    expect(lineRatio).toBeLessThan(0.30);
    expect(charRatio).toBeLessThan(0.40);
  });

  test('모든 예제 파일 벤치마크 리포트', () => {
    const examples = ['counter', 'todo', 'dashboard', 'chat', 'ecommerce'];

    console.log('\n=== Full Benchmark Report ===');
    console.log('Example       | 0x Lines | React Lines | Line Savings | 0x Chars | React Chars | Char Savings');
    console.log('------------- | -------- | ----------- | ------------ | -------- | ----------- | ------------');

    for (const name of examples) {
      const srcSource = readExample(name);
      const srcLines = countLines(srcSource);
      const srcChars = countChars(srcSource);

      const reactResult = compile(srcSource, { target: 'react', validate: false });
      const reactLines = countLines(reactResult.code);
      const reactChars = countChars(reactResult.code);

      const lineSavings = ((1 - srcLines / reactLines) * 100).toFixed(1);
      const charSavings = ((1 - srcChars / reactChars) * 100).toFixed(1);

      console.log(
        `${name.padEnd(13)} | ${String(srcLines).padStart(8)} | ${String(reactLines).padStart(11)} | ${(lineSavings + '%').padStart(12)} | ${String(srcChars).padStart(8)} | ${String(reactChars).padStart(11)} | ${charSavings}%`
      );

      // 0x source should always be shorter than generated React
      expect(srcLines).toBeLessThan(reactLines);
      expect(srcChars).toBeLessThan(reactChars);
    }
  });
});
