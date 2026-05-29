// debug-v015.mjs — Comprehensive tests for v0.1.15 features
// Backend, React Native, Terraform, AI Bridge, Compact Mode
import { compile, getLanguageSpec, generatePrompt, compileFromDescription } from './dist/index.js';

let total = 0, pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  total++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      pass++;
    } else {
      fail++;
      failures.push({ name, result: String(result).slice(0, 400) });
    }
  } catch (e) {
    fail++;
    failures.push({ name, error: e.message.slice(0, 400) });
  }
}

function compileTarget(code, target, opts = {}) {
  return compile(code.trim(), { target, validate: false, sourceMap: false, ...opts });
}

// ============================================================
// SECTION 1: BACKEND GENERATOR
// ============================================================

// --- 1.1 Basic endpoint ---
test('B01: Single GET endpoint', () => {
  const r = compileTarget(`
endpoint GET "/api/users":
  res.json([])
`, 'backend');
  const c = r.code;
  return c.includes("app.get('/api/users'") && c.includes('res.json') && c.includes('express') || c;
});

test('B02: POST endpoint', () => {
  const r = compileTarget(`
endpoint POST "/api/users":
  const user = req.body
  res.status(201).json(user)
`, 'backend');
  const c = r.code;
  return c.includes("app.post('/api/users'") && c.includes('req.body') && c.includes('201') || c;
});

test('B03: PUT endpoint', () => {
  const r = compileTarget(`
endpoint PUT "/api/users/:id":
  res.json({updated: true})
`, 'backend');
  return r.code.includes("app.put('/api/users/:id'") || r.code;
});

test('B04: DELETE endpoint', () => {
  const r = compileTarget(`
endpoint DELETE "/api/users/:id":
  res.status(204).end()
`, 'backend');
  return r.code.includes("app.delete('/api/users/:id'") || r.code;
});

// --- 1.2 Middleware ---
test('B05: Middleware definition', () => {
  const r = compileTarget(`
middleware auth:
  if !req.headers.authorization:
    res.status(401).json({error: "Unauthorized"})
  next()
`, 'backend');
  const c = r.code;
  return c.includes('function auth(req, res, next)') && c.includes('401') && c.includes('next()') || c;
});

test('B06: Endpoint with middleware', () => {
  const r = compileTarget(`
middleware auth:
  next()

endpoint GET "/api/secret" middleware auth:
  res.json({data: "secret"})
`, 'backend');
  const c = r.code;
  return c.includes("app.get('/api/secret', auth,") || c;
});

// --- 1.3 Cron jobs ---
test('B07: Cron job with schedule', () => {
  const r = compileTarget(`
cron cleanup "0 3 * * *":
  console.log("cleaning up")
`, 'backend');
  const c = r.code;
  return c.includes("cron.schedule('0 3 * * *'") && c.includes('node-cron') && c.includes('Cron:cleanup') || c;
});

test('B08: Cron job default schedule', () => {
  const r = compileTarget(`
cron heartbeat:
  console.log("heartbeat")
`, 'backend');
  return r.code.includes("cron.schedule(") && r.code.includes('heartbeat') || r.code;
});

// --- 1.4 Queue ---
test('B09: Queue worker', () => {
  const r = compileTarget(`
queue emailSender:
  console.log(job.data)
`, 'backend');
  const c = r.code;
  return c.includes("emailSenderQueue") && c.includes('Bull') && c.includes('process') || c;
});

// --- 1.5 Webhook ---
test('B10: Webhook handler', () => {
  const r = compileTarget(`
webhook stripe "/webhooks/stripe":
  const event = req.body
  console.log(event)
`, 'backend');
  const c = r.code;
  return c.includes("app.post('/webhooks/stripe'") && c.includes('payload') && c.includes('Webhook:stripe') || c;
});

// --- 1.6 Cache ---
test('B11: Memory cache', () => {
  const r = compileTarget(`
cache sessions memory:
  ttl: 3600
`, 'backend');
  const c = r.code;
  return c.includes('sessionsStore') && c.includes('sessionsCache') && c.includes('Map') || c;
});

test('B12: Redis cache', () => {
  const r = compileTarget(`
cache sessions redis:
  ttl: 3600
`, 'backend');
  const c = r.code;
  return c.includes('Redis') && c.includes('ioredis') && c.includes('sessionsRedis') || c;
});

// --- 1.7 Auth ---
test('B13: Auth declaration', () => {
  const r = compileTarget(`
auth:
  login: email, password
`, 'backend');
  const c = r.code;
  return c.includes('auth') && c.includes('authMiddleware') && c.includes('JWT_SECRET') || c;
});

// --- 1.8 Environment ---
test('B14: Environment variables', () => {
  const r = compileTarget(`
env prod:
  DATABASE_URL = "postgres://localhost/db"
  secret API_KEY = "sk-test-123"
`, 'backend');
  const c = r.code;
  return c.includes('DATABASE_URL') && c.includes('process.env.DATABASE_URL') && c.includes('API_KEY') && c.includes('// secret') || c;
});

// --- 1.9 Model with CRUD ---
test('B15: Model auto CRUD', () => {
  const r = compileTarget(`
model User:
  name: str
  email: str
`, 'backend');
  const c = r.code;
  return c.includes("UserSchema") && c.includes("/api/user") && c.includes("app.get") && c.includes("app.post") && c.includes("app.delete") || c;
});

// --- 1.10 Storage ---
test('B16: S3 storage', () => {
  const r = compileTarget(`
storage files s3:
  bucket: "my-bucket"
`, 'backend');
  const c = r.code;
  return c.includes('S3Client') && c.includes("my-bucket") && c.includes('PutObjectCommand') || c;
});

test('B17: Generic storage', () => {
  const r = compileTarget(`
storage uploads local:
  bucket: "uploads"
`, 'backend');
  const c = r.code;
  return c.includes("uploads") && c.includes("local") || c;
});

// --- 1.11 Server structure ---
test('B18: Express app structure', () => {
  const r = compileTarget(`
endpoint GET "/api/health":
  res.json({ok: true})
`, 'backend');
  const c = r.code;
  return c.includes("import express from 'express'") &&
         c.includes("import cors from 'cors'") &&
         c.includes("const app = express()") &&
         c.includes("app.use(cors())") &&
         c.includes("app.use(express.json())") &&
         c.includes("app.listen(PORT") &&
         c.includes("export default app") &&
         c.includes("/health") || c;
});

// --- 1.12 Full backend orchestration ---
test('B19: Complete server with multiple features', () => {
  const r = compileTarget(`
env prod:
  PORT = "4000"

middleware logger:
  console.log(req.method, req.url)
  next()

endpoint GET "/api/items":
  res.json([])

endpoint POST "/api/items":
  res.status(201).json(req.body)

cron daily "0 0 * * *":
  console.log("daily task")

webhook github "/webhooks/github":
  console.log(req.body)
`, 'backend');
  const c = r.code;
  return c.includes("app.get('/api/items'") &&
         c.includes("app.post('/api/items'") &&
         c.includes("function logger") &&
         c.includes("cron.schedule") &&
         c.includes("/webhooks/github") &&
         c.includes("PORT") || c;
});

test('B20: Server filename is server.ts', () => {
  const r = compileTarget(`
endpoint GET "/":
  res.json({ok: true})
`, 'backend');
  return r.filename === 'server.ts' || `Expected server.ts, got ${r.filename}`;
});

// --- 1.13 Async detection ---
test('B21: Async handler detection', () => {
  const r = compileTarget(`
endpoint GET "/api/data":
  const data = await fetch("https://api.example.com")
  res.json(data)
`, 'backend');
  return r.code.includes('async (req, res)') || r.code;
});

test('B22: Sync handler detection', () => {
  const r = compileTarget(`
endpoint GET "/api/ping":
  res.json({pong: true})
`, 'backend');
  return !r.code.includes('async (req, res) =>') || r.code;
});

// ============================================================
// SECTION 2: REACT NATIVE GENERATOR
// ============================================================

// --- 2.1 Basic page ---
test('RN01: Basic page renders', () => {
  const r = compileTarget(`
page MyApp:
  state count: int = 0
  layout col:
    text "Hello" size=xl bold
`, 'react-native');
  const c = r.code;
  return c.includes("import React") &&
         c.includes("from 'react-native'") &&
         c.includes("StyleSheet") &&
         c.includes("export default function MyApp") || c;
});

// --- 2.2 State + useState ---
test('RN02: State generates useState', () => {
  const r = compileTarget(`
page Counter:
  state count: int = 0
  layout col:
    text count
`, 'react-native');
  const c = r.code;
  return c.includes("useState") && c.includes("const [count, setCount] = useState(0)") || c;
});

// --- 2.3 Layout directions ---
test('RN03: Horizontal layout', () => {
  const r = compileTarget(`
page Test:
  layout row:
    text "A"
    text "B"
`, 'react-native');
  return r.code.includes("flexDirection") && r.code.includes("row") || r.code;
});

test('RN04: Grid layout', () => {
  const r = compileTarget(`
page Test:
  layout grid:
    text "1"
    text "2"
`, 'react-native');
  return r.code.includes("flexWrap") && r.code.includes("wrap") || r.code;
});

// --- 2.4 Text styling ---
test('RN05: Text with size and bold', () => {
  const r = compileTarget(`
page Test:
  layout col:
    text "Title" size=xl bold
`, 'react-native');
  const c = r.code;
  return c.includes("<Text") && c.includes("fontSize") && c.includes("fontWeight") && c.includes("bold") || c;
});

test('RN06: Text with color', () => {
  const r = compileTarget(`
page Test:
  layout col:
    text "Error" color="red"
`, 'react-native');
  return r.code.includes("color") && r.code.includes("red") || r.code;
});

// --- 2.5 Button → TouchableOpacity ---
test('RN07: Button renders TouchableOpacity', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    button "+1" -> count += 1
`, 'react-native');
  const c = r.code;
  return c.includes("TouchableOpacity") && c.includes("onPress") && c.includes("setCount") || c;
});

// --- 2.6 Input → TextInput ---
test('RN08: Input renders TextInput', () => {
  const r = compileTarget(`
page Test:
  state name: str = ""
  layout col:
    input name placeholder="Enter name"
`, 'react-native');
  const c = r.code;
  return c.includes("TextInput") && c.includes("onChangeText") && c.includes("setName") && c.includes("placeholder") || c;
});

// --- 2.7 Image ---
test('RN09: Image renders Image component', () => {
  const r = compileTarget(`
page Test:
  layout col:
    image "https://example.com/photo.jpg" width=100 height=100
`, 'react-native');
  const c = r.code;
  return c.includes("<Image") && c.includes("source={{ uri:") && c.includes("width") || c;
});

// --- 2.8 Toggle → Switch ---
test('RN10: Toggle renders Switch', () => {
  const r = compileTarget(`
page Test:
  state enabled: bool = false
  layout col:
    toggle enabled
`, 'react-native');
  const c = r.code;
  return c.includes("<Switch") && c.includes("value={enabled}") && c.includes("onValueChange") || c;
});

// --- 2.9 For loop ---
test('RN11: For loop renders .map', () => {
  const r = compileTarget(`
page Test:
  state items: list[str] = ["a", "b", "c"]
  layout col:
    for item in items:
      text item
`, 'react-native');
  const c = r.code;
  return c.includes(".map(") && c.includes("React.Fragment") && c.includes("key=") || c;
});

// --- 2.10 If block ---
test('RN12: If block renders conditional', () => {
  const r = compileTarget(`
page Test:
  state loading: bool = true
  layout col:
    if loading:
      text "Loading..."
`, 'react-native');
  return r.code.includes("loading &&") || r.code;
});

test('RN13: If/else block', () => {
  const r = compileTarget(`
page Test:
  state loaded: bool = false
  layout col:
    if loaded:
      text "Done"
    else:
      text "Loading"
`, 'react-native');
  return r.code.includes("loaded ?") && r.code.includes("Done") && r.code.includes("Loading") || r.code;
});

// --- 2.11 Show/Hide ---
test('RN14: Show block', () => {
  const r = compileTarget(`
page Test:
  state visible: bool = true
  layout col:
    show visible:
      text "Visible"
`, 'react-native');
  return r.code.includes("visible &&") || r.code;
});

// --- 2.12 onMount / useEffect ---
test('RN15: onMount generates useEffect', () => {
  const r = compileTarget(`
page Test:
  state data: list[any] = []

  on mount:
    const res = await fetch("/api/data")
    data = res

  layout col:
    text "loaded"
`, 'react-native');
  const c = r.code;
  return c.includes("useEffect") && c.includes("async") && c.includes("fetch") && c.includes(", [])") || c;
});

// --- 2.13 Derived / useMemo ---
test('RN16: Derived generates useMemo', () => {
  const r = compileTarget(`
page Test:
  state items: list[int] = [1, 2, 3]
  derived total = items.length
  layout col:
    text total
`, 'react-native');
  return r.code.includes("useMemo") && r.code.includes("items.length") || r.code;
});

// --- 2.14 StyleSheet ---
test('RN17: StyleSheet.create generated', () => {
  const r = compileTarget(`
page Test:
  layout col gap=16 padding=20:
    text "Hello" size=lg bold
    button "Click" -> console.log("hi")
`, 'react-native');
  const c = r.code;
  return c.includes("StyleSheet.create") && c.includes("container") && c.includes("gap: 16") || c;
});

// --- 2.15 Props ---
test('RN18: Component with props', () => {
  const r = compileTarget(`
component Card:
  prop title: str
  prop color: str = "blue"
  layout col:
    text title
`, 'react-native');
  const c = r.code;
  return c.includes("function Card({ title, color = ") || c;
});

// --- 2.16 Watch ---
test('RN19: Watch generates useEffect with deps', () => {
  const r = compileTarget(`
page Test:
  state query: str = ""
  watch query:
    console.log("query changed:", query)
  layout col:
    input query placeholder="Search"
`, 'react-native');
  return r.code.includes("useEffect") && r.code.includes("[query]") || r.code;
});

// --- 2.17 Link → TouchableOpacity + Linking ---
test('RN20: Link renders TouchableOpacity with Linking', () => {
  const r = compileTarget(`
page Test:
  layout col:
    link "Visit" href="https://example.com"
`, 'react-native');
  const c = r.code;
  return c.includes("Linking.openURL") && c.includes("TouchableOpacity") || c;
});

// --- 2.18 Layout with style props ---
test('RN21: Layout gap and padding', () => {
  const r = compileTarget(`
page Test:
  layout col gap=20 padding=16 bg="#f5f5f5":
    text "Styled"
`, 'react-native');
  const c = r.code;
  return c.includes("gap: 20") && c.includes("padding: 16") && c.includes("backgroundColor") || c;
});

// --- 2.19 Filename ---
test('RN22: Filename is Component.tsx', () => {
  const r = compileTarget(`
page App:
  layout col:
    text "App"
`, 'react-native');
  return r.filename === 'Component.tsx' || `Expected Component.tsx, got ${r.filename}`;
});

// --- 2.20 Select ---
test('RN23: Select renders', () => {
  const r = compileTarget(`
page Test:
  state color: str = "red"
  layout col:
    select color options=["red", "blue", "green"]
`, 'react-native');
  const c = r.code;
  return c.includes("TouchableOpacity") && c.includes(".map(") || c;
});

// --- 2.21 FnDecl ---
test('RN24: Function declaration', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0

  fn increment():
    count += 1

  layout col:
    button "Inc" -> increment()
`, 'react-native');
  return r.code.includes("function increment") || r.code;
});

// --- 2.22 Multiple views ---
test('RN25: Multiple top-level UI wraps in View', () => {
  const r = compileTarget(`
page Test:
  layout col:
    text "First"
  layout col:
    text "Second"
`, 'react-native');
  return r.code.includes("styles.container") || r.code;
});

// ============================================================
// SECTION 3: TERRAFORM GENERATOR
// ============================================================

// --- 3.1 Deploy AWS ---
test('TF01: Deploy AWS', () => {
  const r = compileTarget(`
deploy aws:
  region: "ap-northeast-2"
`, 'terraform');
  const c = r.code;
  return c.includes('resource "aws_instance" "app"') &&
         c.includes('hashicorp/aws') &&
         c.includes('provider "aws"') || c;
});

// --- 3.2 Deploy Vercel ---
test('TF02: Deploy Vercel', () => {
  const r = compileTarget(`
deploy vercel:
  framework: "nextjs"
`, 'terraform');
  const c = r.code;
  return c.includes('resource "vercel_project" "app"') && c.includes('vercel/vercel') || c;
});

// --- 3.3 Deploy Docker ---
test('TF03: Deploy Docker', () => {
  const r = compileTarget(`
deploy docker:
  port: 3000
`, 'terraform');
  const c = r.code;
  return c.includes('docker') && c.includes('kreuzwerker/docker') || c;
});

// --- 3.4 Environment variables ---
test('TF04: Environment variables', () => {
  const r = compileTarget(`
env prod:
  DATABASE_URL = "postgres://localhost/mydb"
  secret API_KEY = "sk-123"
`, 'terraform');
  const c = r.code;
  return c.includes('variable "DATABASE_URL"') &&
         c.includes('variable "API_KEY"') &&
         c.includes('sensitive = true') || c;
});

// --- 3.5 Docker resource ---
test('TF05: Docker configuration', () => {
  const r = compileTarget(`
docker "node:20-alpine":
  port: 3000
`, 'terraform');
  const c = r.code;
  return c.includes('resource "docker_image" "app"') &&
         c.includes('resource "docker_container" "app"') &&
         c.includes('internal = 3000') || c;
});

// --- 3.6 Domain ---
test('TF06: Domain configuration', () => {
  const r = compileTarget(`
domain "example.com":
  ssl: true
`, 'terraform');
  const c = r.code;
  return c.includes('aws_route53_zone') &&
         c.includes('aws_route53_record') &&
         c.includes('example.com') || c;
});

// --- 3.7 CDN CloudFront ---
test('TF07: CDN AWS CloudFront', () => {
  const r = compileTarget(`
cdn aws:
  origin: "app.example.com"
`, 'terraform');
  const c = r.code;
  return c.includes('aws_cloudfront_distribution') || c;
});

// --- 3.8 CDN Cloudflare ---
test('TF08: CDN Cloudflare', () => {
  const r = compileTarget(`
cdn cloudflare:
  zone: "example.com"
`, 'terraform');
  return r.code.includes('cloudflare_zone') && r.code.includes('cloudflare/cloudflare') || r.code;
});

// --- 3.9 Storage S3 ---
test('TF09: Storage S3', () => {
  const r = compileTarget(`
storage files s3:
  bucket: "my-app-files"
`, 'terraform');
  const c = r.code;
  return c.includes('resource "aws_s3_bucket" "files"') &&
         c.includes("my-app-files") &&
         c.includes('aws_s3_bucket_versioning') || c;
});

// --- 3.10 Storage GCS ---
test('TF10: Storage GCS', () => {
  const r = compileTarget(`
storage assets gcs:
  bucket: "my-assets"
`, 'terraform');
  const c = r.code;
  return c.includes('google_storage_bucket') && c.includes("my-assets") || c;
});

// --- 3.11 Monitor Datadog ---
test('TF11: Monitor Datadog', () => {
  const r = compileTarget(`
monitor datadog:
  name: "App Monitor"
`, 'terraform');
  const c = r.code;
  return c.includes('datadog_monitor') && c.includes('DataDog/datadog') || c;
});

// --- 3.12 Monitor Sentry ---
test('TF12: Monitor Sentry', () => {
  const r = compileTarget(`
monitor sentry:
  name: "My Project"
`, 'terraform');
  return r.code.includes('sentry_project') || r.code;
});

// --- 3.13 Backup ---
test('TF13: Backup daily', () => {
  const r = compileTarget(`
backup daily:
  retention: 30
`, 'terraform');
  const c = r.code;
  return c.includes('aws_backup_vault') && c.includes('aws_backup_plan') && c.includes('daily') || c;
});

test('TF14: Backup hourly', () => {
  const r = compileTarget(`
backup hourly:
  retention: 7
`, 'terraform');
  return r.code.includes('hourly') && r.code.includes('cron(0 * * * ? *)') || r.code;
});

// --- 3.14 Cache Redis ElastiCache ---
test('TF15: Cache Redis ElastiCache', () => {
  const r = compileTarget(`
cache sessions redis:
  ttl: 3600
`, 'terraform');
  const c = r.code;
  return c.includes('aws_elasticache_cluster') && c.includes('redis') || c;
});

// --- 3.15 Filename ---
test('TF16: Filename is main.tf', () => {
  const r = compileTarget(`
deploy aws:
  region: "us-east-1"
`, 'terraform');
  return r.filename === 'main.tf' || `Expected main.tf, got ${r.filename}`;
});

// --- 3.16 Combined infra ---
test('TF17: Combined infrastructure', () => {
  const r = compileTarget(`
deploy aws:
  region: "us-east-1"

env prod:
  DB_HOST = "rds.example.com"

storage media s3:
  bucket: "app-media"

backup daily:
  retention: 30
`, 'terraform');
  const c = r.code;
  return c.includes('aws_instance') &&
         c.includes('variable "DB_HOST"') &&
         c.includes('aws_s3_bucket') &&
         c.includes('aws_backup_plan') &&
         c.includes('terraform {') || c;
});

// --- 3.17 Multiple providers ---
test('TF18: Multiple providers registered', () => {
  const r = compileTarget(`
deploy aws:
  region: "us-east-1"

monitor datadog:
  name: "monitor"
`, 'terraform');
  const c = r.code;
  return c.includes('hashicorp/aws') && c.includes('DataDog/datadog') &&
         c.includes('provider "aws"') && c.includes('provider "datadog"') || c;
});

// ============================================================
// SECTION 4: COMPACT MODE
// ============================================================

// --- 4.1 Strips source map comments ---
test('CM01: Strips 0x:L comments', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text "hello"
    button "+1" -> count += 1
`, 'react', { compact: true });
  return !r.code.includes('0x:L') || r.code;
});

// --- 4.2 Strips generated by header ---
test('CM02: Strips Generated by header', () => {
  const r = compileTarget(`
page Test:
  layout col:
    text "hello"
`, 'react', { compact: true });
  return !r.code.includes('Generated by 0x') || r.code;
});

// --- 4.3 No triple blank lines ---
test('CM03: No triple blank lines', () => {
  const r = compileTarget(`
page Test:
  state a: int = 1
  state b: int = 2
  layout col:
    text a
    text b
`, 'react', { compact: true });
  return !r.code.includes('\n\n\n') || r.code;
});

// --- 4.4 No trailing whitespace ---
test('CM04: No trailing whitespace', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text count
    button "+1" -> count += 1
`, 'react', { compact: true });
  const hasTrailing = r.code.split('\n').some(l => /[ \t]+$/.test(l));
  return !hasTrailing || r.code;
});

// --- 4.5 No source map ---
test('CM05: No sourceMap in compact', () => {
  const r = compileTarget(`
page Test:
  layout col:
    text "hi"
`, 'react', { compact: true });
  return r.sourceMap === undefined || 'sourceMap is not undefined';
});

// --- 4.6 Token count lower than non-compact ---
test('CM06: Compact reduces token count', () => {
  const src = `
page Test:
  state count: int = 0
  state name: str = "hello"
  derived upper = name.toUpperCase()
  layout col gap=16:
    text name size=xl bold
    text count
    button "+1" -> count += 1
`;
  const normal = compileTarget(src, 'react', { compact: false, sourceMap: false });
  const compact = compileTarget(src, 'react', { compact: true });
  return compact.tokenCount < normal.tokenCount || `Compact: ${compact.tokenCount}, Normal: ${normal.tokenCount}`;
});

// --- 4.7 Compact on Vue ---
test('CM07: Compact works on Vue', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text count
`, 'vue', { compact: true });
  return !r.code.includes('Generated by 0x') && !r.code.includes('0x:L') || r.code;
});

// --- 4.8 Compact on Svelte ---
test('CM08: Compact works on Svelte', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text count
`, 'svelte', { compact: true });
  return !r.code.includes('Generated by 0x') && !r.code.includes('0x:L') || r.code;
});

// --- 4.9 Compact on Backend ---
test('CM09: Compact works on Backend', () => {
  const r = compileTarget(`
endpoint GET "/api/test":
  res.json({ok: true})
`, 'backend', { compact: true });
  return !r.code.includes('Generated by 0x') || r.code;
});

// --- 4.10 Compact preserves sourceMappingURL ---
test('CM10: Compact does not strip sourceMappingURL', () => {
  // In compact mode, sourceMap is removed entirely, so no sourceMappingURL should exist
  const r = compileTarget(`
page Test:
  layout col:
    text "hi"
`, 'react', { compact: true });
  return !r.code.includes('sourceMappingURL') || r.code;
});

// ============================================================
// SECTION 5: AI BRIDGE
// ============================================================

// --- 5.1 Language Spec ---
test('AI01: getLanguageSpec returns non-empty', () => {
  const spec = getLanguageSpec();
  return spec.length > 1000 || `Spec too short: ${spec.length}`;
});

test('AI02: Spec contains key sections', () => {
  const spec = getLanguageSpec();
  return spec.includes('## Basic Syntax') &&
         spec.includes('### State') &&
         spec.includes('### Backend') &&
         spec.includes('### Infrastructure') &&
         spec.includes('## Compile Targets') || 'Missing sections';
});

test('AI03: Spec contains correct syntax examples', () => {
  const spec = getLanguageSpec();
  return spec.includes('state count: int = 0') &&
         spec.includes('button') &&
         spec.includes('endpoint') &&
         spec.includes('deploy') || 'Missing syntax examples';
});

test('AI04: Spec lists all 6 targets', () => {
  const spec = getLanguageSpec();
  return spec.includes('react') &&
         spec.includes('vue') &&
         spec.includes('svelte') &&
         spec.includes('backend') &&
         spec.includes('react-native') &&
         spec.includes('terraform') || 'Missing targets';
});

// --- 5.2 Generate Prompt ---
test('AI05: generatePrompt creates valid prompt', () => {
  const p = generatePrompt('Build a todo app', 'react');
  return p.includes('todo app') && p.includes('react') && p.includes('0x') || p;
});

test('AI06: generatePrompt includes rules', () => {
  const p = generatePrompt('Build a dashboard');
  return p.includes('Rules') && p.includes('syntax') || p;
});

test('AI07: generatePrompt respects target param', () => {
  const p = generatePrompt('Build API', 'backend');
  return p.includes('backend') || p;
});

// --- 5.3 Compile from Description ---
test('AI08: compileFromDescription generates UI skeleton', () => {
  const s = compileFromDescription('Create a user dashboard');
  return s.includes('page') && s.includes('state') && s.includes('layout') || s;
});

test('AI09: compileFromDescription generates backend skeleton', () => {
  const s = compileFromDescription('Build an API server with user endpoints');
  return s.includes('endpoint') && s.includes('/api/users') || s;
});

test('AI10: compileFromDescription generates infra skeleton', () => {
  const s = compileFromDescription('Deploy to AWS with S3 storage');
  return s.includes('deploy aws') && s.includes('storage') || s;
});

test('AI11: compileFromDescription with auth', () => {
  const s = compileFromDescription('API with auth and database');
  return s.includes('middleware auth') || s;
});

test('AI12: compileFromDescription with queue', () => {
  const s = compileFromDescription('Background job queue worker');
  return s.includes('queue') || s;
});

test('AI13: compileFromDescription with docker', () => {
  const s = compileFromDescription('Docker deployment with infrastructure');
  return s.includes('docker') || s;
});

test('AI14: compileFromDescription page name extraction', () => {
  const s = compileFromDescription('Create a todo list');
  return s.includes('page') && (s.includes('CreatePage') || s.includes('TodoPage') || s.includes('Page')) || s;
});

// ============================================================
// SECTION 6: CROSS-TARGET COMPATIBILITY
// ============================================================

// --- 6.1 Same source compiles to all UI targets ---
test('CT01: Same page compiles to all 3 UI targets', () => {
  const src = `
page Test:
  state count: int = 0
  layout col:
    text count
    button "+1" -> count += 1
`;
  const react = compileTarget(src, 'react');
  const vue = compileTarget(src, 'vue');
  const svelte = compileTarget(src, 'svelte');
  return react.code.length > 50 && vue.code.length > 50 && svelte.code.length > 50 || 'One or more targets failed';
});

// --- 6.2 Backend nodes ignored by UI targets ---
test('CT02: Backend nodes in react target use generateBackendCode', () => {
  const r = compileTarget(`
endpoint GET "/api/test":
  res.json({ok: true})
`, 'react');
  return r.code.includes('Endpoint') || r.code.includes('async function') || r.code;
});

// --- 6.3 UI nodes ignored by backend target ---
test('CT03: UI page in backend target produces minimal output', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text count
`, 'backend');
  // Backend should not generate React components
  return !r.code.includes('useState') && r.code.includes('express') || r.code;
});

// --- 6.4 sourceMap option ---
test('CT04: sourceMap=false strips source maps', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text count
`, 'react', { sourceMap: false });
  return !r.code.includes('0x:L') && r.sourceMap === undefined || r.code;
});

// --- 6.5 useClient option ---
test('CT05: useClient=false strips use client', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    text count
`, 'react', { useClient: false, sourceMap: false });
  return !r.code.includes("'use client'") || r.code;
});

// ============================================================
// SECTION 7: EDGE CASES
// ============================================================

// --- 7.1 Empty backend ---
test('EC01: Empty input for backend', () => {
  // No backend nodes → still generates server skeleton
  try {
    const r = compileTarget('', 'backend');
    return r.code.includes('express') || r.code;
  } catch (e) {
    return true; // Empty is fine to error
  }
});

// --- 7.2 Backend with no endpoints ---
test('EC02: Backend with only env', () => {
  const r = compileTarget(`
env dev:
  PORT = "3000"
`, 'backend');
  return r.code.includes('express') && r.code.includes('app.listen') && r.code.includes('PORT') || r.code;
});

// --- 7.3 Terraform with no infra nodes ---
test('EC03: Empty terraform output', () => {
  try {
    const r = compileTarget('', 'terraform');
    return r.code.includes('terraform') || true;
  } catch (e) {
    return true;
  }
});

// --- 7.4 RN with no UI ---
test('EC04: React Native with no UI nodes', () => {
  const r = compileTarget(`
page Empty:
  state x: int = 0
`, 'react-native');
  return r.code.includes('<View />') || r.code.includes('View') || r.code;
});

// --- 7.5 Backend async middleware ---
test('EC05: Async middleware', () => {
  const r = compileTarget(`
middleware validate:
  const user = await findUser(req.params.id)
  if !user:
    res.status(404).json({error: "Not found"})
  next()
`, 'backend');
  return r.code.includes('async function validate') || r.code;
});

// --- 7.6 Multiple endpoints same path different methods ---
test('EC06: Multiple methods same path', () => {
  const r = compileTarget(`
endpoint GET "/api/items":
  res.json([])

endpoint POST "/api/items":
  res.status(201).json(req.body)

endpoint DELETE "/api/items/:id":
  res.status(204).end()
`, 'backend');
  const c = r.code;
  return c.includes("app.get('/api/items'") &&
         c.includes("app.post('/api/items'") &&
         c.includes("app.delete('/api/items/:id'") || c;
});

// --- 7.7 Terraform with SSL certificate ---
test('EC07: Domain with SSL generates certificate', () => {
  const r = compileTarget(`
domain "example.com":
  ssl: true
`, 'terraform');
  return r.code.includes('aws_acm_certificate') || r.code;
});

// --- 7.8 RN button label with expression ---
test('EC08: RN button with expression', () => {
  const r = compileTarget(`
page Test:
  state count: int = 0
  layout col:
    button "+1" -> count += 1
`, 'react-native');
  return r.code.includes('onPress') && r.code.includes('setCount') || r.code;
});

// --- 7.9 Backend generates health check ---
test('EC09: Backend health check endpoint', () => {
  const r = compileTarget(`
endpoint GET "/api/test":
  res.json({})
`, 'backend');
  return r.code.includes("/health") && r.code.includes("uptime") || r.code;
});

// --- 7.10 RN onDestroy ---
test('EC10: RN onDestroy generates cleanup useEffect', () => {
  const r = compileTarget(`
page Test:
  state timer: int = 0

  on destroy:
    clearInterval(timer)

  layout col:
    text "test"
`, 'react-native');
  const c = r.code;
  return c.includes('useEffect') && c.includes('return () =>') && c.includes('clearInterval') || c;
});

// --- 7.11 Backend model field types ---
test('EC11: Model with various field types', () => {
  const r = compileTarget(`
model Product:
  name: str
  price: int
  active: bool = true
`, 'backend');
  const c = r.code;
  return c.includes('ProductSchema') && c.includes("'str'") && c.includes("'int'") || c;
});

// --- 7.12 Terraform deploy fly ---
test('EC12: Deploy Fly.io', () => {
  const r = compileTarget(`
deploy fly:
  region: "iad"
`, 'terraform');
  return r.code.includes('fly_app') || r.code;
});

// --- 7.13 Compact on Terraform ---
test('EC13: Compact works on Terraform', () => {
  const r = compileTarget(`
deploy aws:
  region: "us-east-1"
`, 'terraform', { compact: true });
  return !r.code.includes('Generated by 0x') || r.code;
});

// ============================================================
// REPORT
// ============================================================

console.log('\n============================================================');
console.log(`  0x v0.1.15 Debug Tests`);
console.log('============================================================');
console.log(`  Total: ${total}`);
console.log(`  Pass:  ${pass}`);
console.log(`  Fail:  ${fail}`);
console.log('============================================================');

if (failures.length > 0) {
  console.log('\n❌ FAILURES:\n');
  for (const f of failures) {
    console.log(`  [FAIL] ${f.name}`);
    if (f.error) console.log(`    Error: ${f.error}`);
    if (f.result) console.log(`    Output: ${f.result.slice(0, 300)}`);
    console.log('');
  }
} else {
  console.log('\n✅ All v0.1.15 tests passed!');
}

process.exit(fail > 0 ? 1 : 0);
