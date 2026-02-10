// Phase 4 Feature Tests — Infrastructure, Backend, Testing, i18n
import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser.js';
import { compile } from '../src/compiler.js';
import { tokenize } from '../src/tokenizer.js';

describe('Phase 4: Infrastructure', () => {
  it('parses deploy declaration', () => {
    const ast = parse(`deploy vercel:\n  region: "us-east-1"\n  build: "npm run build"`);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('Deploy');
    const node = ast[0] as any;
    expect(node.provider).toBe('vercel');
  });

  it('parses env declaration with secret', () => {
    const ast = parse(`env production:\n  API_URL = "https://api.example.com"\n  secret DB_PASSWORD = "hunter2"`);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('Env');
    const node = ast[0] as any;
    expect(node.envType).toBe('production');
    expect(node.vars.length).toBe(2);
    expect(node.vars[0].secret).toBe(false);
    expect(node.vars[1].secret).toBe(true);
    expect(node.vars[1].name).toBe('DB_PASSWORD');
  });

  it('parses docker declaration', () => {
    const ast = parse(`docker "node:20-alpine":\n  port: 3000`);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('Docker');
    const node = ast[0] as any;
    expect(node.baseImage).toBe('node:20-alpine');
  });

  it('parses ci declaration', () => {
    const ast = parse(`ci github:\n  trigger push\n  install = "npm ci"\n  build = "npm run build"\n  test = "npm test"`);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('Ci');
    const node = ast[0] as any;
    expect(node.provider).toBe('github');
    expect(node.triggers).toContain('push');
    expect(node.steps.length).toBe(3);
  });

  it('compiles deploy to React', () => {
    const result = compile(`deploy vercel:\n  region: "us-east-1"`, { target: 'react' });
    expect(result.code).toContain('vercel');
  });
});

describe('Phase 4: Backend/API', () => {
  it('parses endpoint declaration', () => {
    const ast = parse(`endpoint GET "/api/users":\n  return users`);
    expect(ast.length).toBe(1);
    expect(ast[0].type).toBe('Endpoint');
    const node = ast[0] as any;
    expect(node.method).toBe('GET');
    expect(node.path).toBe('/api/users');
  });

  it('parses endpoint with middleware', () => {
    const ast = parse(`endpoint POST "/api/items" guard auth:\n  return items`);
    const node = ast[0] as any;
    expect(node.middleware).toContain('auth');
  });

  it('parses middleware declaration', () => {
    const ast = parse(`middleware rateLimit:\n  return next()`);
    expect(ast[0].type).toBe('Middleware');
    const node = ast[0] as any;
    expect(node.name).toBe('rateLimit');
  });

  it('parses queue declaration', () => {
    const ast = parse(`queue emailQueue:\n  sendEmail(job)`);
    expect(ast[0].type).toBe('Queue');
    const node = ast[0] as any;
    expect(node.name).toBe('emailQueue');
  });

  it('parses cron declaration', () => {
    const ast = parse(`cron cleanup "0 3 * * *":\n  deleteOldRecords()`);
    expect(ast[0].type).toBe('Cron');
    const node = ast[0] as any;
    expect(node.name).toBe('cleanup');
    expect(node.schedule).toBe('0 3 * * *');
  });

  it('parses cache declaration', () => {
    const ast = parse(`cache userCache redis:\n  ttl: 3600`);
    expect(ast[0].type).toBe('Cache');
    const node = ast[0] as any;
    expect(node.name).toBe('userCache');
    expect(node.strategy).toBe('redis');
  });

  it('compiles endpoint to React', () => {
    const result = compile(`endpoint GET "/api/users":\n  return users`, { target: 'react' });
    expect(result.code).toContain('/api/users');
  });
});

describe('Phase 4: Testing', () => {
  it('tokenizes test keywords', () => {
    for (const kw of ['test', 'e2e', 'fixture', 'mock']) {
      const tokens = tokenize(kw);
      expect(tokens[0].type).toBe('KEYWORD');
      expect(tokens[0].value).toBe(kw);
    }
  });

  it('parses test declaration', () => {
    const ast = parse(`test "adds items":\n  result = add(1, 2)\n  result == 3`);
    expect(ast[0].type).toBe('Test');
    const node = ast[0] as any;
    expect(node.name).toBe('adds items');
  });
});

describe('Phase 4: i18n', () => {
  it('tokenizes i18n keywords', () => {
    for (const kw of ['i18n', 'locale', 'rtl']) {
      const tokens = tokenize(kw);
      expect(tokens[0].type).toBe('KEYWORD');
      expect(tokens[0].value).toBe(kw);
    }
  });
});

describe('Phase 4: Error/State', () => {
  it('tokenizes error-handling keywords', () => {
    for (const kw of ['error', 'loading', 'offline', 'retry', 'log']) {
      const tokens = tokenize(kw);
      expect(tokens[0].type).toBe('KEYWORD');
      expect(tokens[0].value).toBe(kw);
    }
  });
});

describe('Phase 4: Automation (fixed parser)', () => {
  it('parses automation with trigger', () => {
    const ast = parse(`automation:\n  trigger "user_created"\n    sendWelcome(user)`);
    expect(ast[0].type).toBe('Automation');
    const node = ast[0] as any;
    expect(node.triggers.length).toBe(1);
    expect(node.triggers[0].event).toBe('user_created');
    expect(node.triggers[0].actions.length).toBe(1);
  });

  it('parses automation with schedule', () => {
    const ast = parse(`automation:\n  schedule "0 9 * * *"\n    sendReport()`);
    expect(ast[0].type).toBe('Automation');
    const node = ast[0] as any;
    expect(node.schedules.length).toBe(1);
    expect(node.schedules[0].cron).toBe('0 9 * * *');
    expect(node.schedules[0].actions.length).toBe(1);
  });
});
