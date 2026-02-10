// 0x Project Scaffolding

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const COUNTER_EXAMPLE = `page Counter:
  state count: int = 0
  derived doubled = count * 2

  fn increment():
    count += 1

  fn decrement():
    count -= 1

  layout col gap=16 padding=24 center:
    text "Counter" size=2xl bold
    text "{count}" size=3xl bold color=#333
    text "Doubled: {doubled}" size=lg color=#666

    layout row gap=8:
      button "-1" style=danger -> decrement()
      button "Reset" -> count = 0
      button "+1" style=primary -> increment()
`;

const TODO_EXAMPLE = `page Todo:
  type Item = {id: int, text: str, done: bool}

  state items: list[Item] = []
  state input: str = ""
  derived remaining = items.filter(i => !i.done).length

  fn add():
    if input.trim() != "":
      items.push({id: Date.now(), text: input, done: false})
      input = ""

  fn remove(id: int):
    items = items.filter(i => i.id != id)

  layout col gap=16 padding=24 maxWidth=600 margin=auto:
    text "Todo ({remaining} remaining)" size=2xl bold

    layout row gap=8:
      input input placeholder="What needs to be done?"
      button "Add" style=primary -> add()

    for item in items:
      layout row gap=8 center:
        toggle item.done
        text item.text strike={item.done}
        button "Delete" style=danger size=sm -> remove(item.id)

    if items.length == 0:
      text "Nothing to do" color=#999 center
`;

const PACKAGE_JSON_TEMPLATE = (name: string) => JSON.stringify({
  name,
  version: "0.1.0",
  private: true,
  scripts: {
    "build": "0x build src/app.ai --target react",
    "build:all": "0x build src/app.ai --target react,vue,svelte",
    "dev": "0x dev src/app.ai --target react",
    "bench": "0x bench src/app.ai"
  },
  devDependencies: {
    "0x-lang": "^1.0.0"
  }
}, null, 2);

const GITIGNORE = `node_modules/
dist/
*.js
!vite.config.js
`;

export function initProject(projectName: string): void {
  const projectDir = join(process.cwd(), projectName);

  if (existsSync(projectDir)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log(`\n  Creating 0x project: ${projectName}\n`);

  // Create directories
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });

  // Write files
  writeFileSync(join(projectDir, 'package.json'), PACKAGE_JSON_TEMPLATE(projectName));
  writeFileSync(join(projectDir, 'src', 'counter.ai'), COUNTER_EXAMPLE);
  writeFileSync(join(projectDir, 'src', 'todo.ai'), TODO_EXAMPLE);
  writeFileSync(join(projectDir, '.gitignore'), GITIGNORE);

  console.log('  Files created:');
  console.log('    package.json');
  console.log('    src/counter.ai');
  console.log('    src/todo.ai');
  console.log('    .gitignore');
  console.log();
  console.log('  Get started:');
  console.log(`    cd ${projectName}`);
  console.log('    npm install');
  console.log('    npx 0x build src/counter.ai --target react');
  console.log();
}
