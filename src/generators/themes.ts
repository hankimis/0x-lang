// Theme system for 0x language
// Supports: shadcn/ui, MUI, Ant Design, Chakra UI
// Each theme maps 0x UI elements to the library's components

import type {
  ButtonNode, InputNode, ToggleNode, SelectNode, ModalNode, DrawerNode,
  TableNode, ToastNode, ConfirmNode, NavNode, ProgressNode, BreadcrumbNode,
  FaqNode, CommandNode, StatNode, UploadNode, SearchNode,
  Expression, Statement, UINode,
} from '../ast.js';
import { capitalize, unquote } from './shared.js';

export type ThemeName = 'shadcn' | 'mui' | 'antd' | 'chakra';

// Helpers interface — generator passes its own functions
export interface ThemeHelpers {
  genExpr: (expr: Expression, c: any) => string;
  genTextContent: (expr: Expression, c: any) => string;
  genActionExpr: (action: Expression | Statement[], c: any) => string;
  genUINode: (node: UINode, c: any) => string;
  srcComment: (node: any) => string;
}

export interface ThemedResult {
  jsx: string;
  imports: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REACT THEMES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── shadcn/ui ─────────────────────────────────────────

function shadcnButton(node: ButtonNode, c: any, h: ThemeHelpers): ThemedResult {
  const label = h.genTextContent(node.label, c);
  const action = h.genActionExpr(node.action, c);
  const props: string[] = [`onClick={() => ${action}}`];
  const imports = [`import { Button } from "@/components/ui/button";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'style': {
        const sv = unquote(v);
        const map: Record<string, string> = { primary: 'default', danger: 'destructive', secondary: 'secondary', outline: 'outline', ghost: 'ghost', link: 'link' };
        if (map[sv]) props.push(`variant="${map[sv]}"`);
        break;
      }
      case 'disabled': props.push(`disabled={${v}}`); break;
      case 'size': props.push(`size="${unquote(v)}"`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Button ${props.join(' ')}>${label}</Button>`, imports };
}

function shadcnInput(node: InputNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const props: string[] = [
    `value={${node.binding}}`,
    `onChange={e => ${setter}(e.target.value)}`,
  ];
  const imports = [`import { Input } from "@/components/ui/input";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'placeholder': props.push(`placeholder=${v.startsWith('"') || v.startsWith("'") ? v : `{${v}}`}`); break;
      case 'type': props.push(`type=${v.startsWith('"') || v.startsWith("'") ? v : `{${v}}`}`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Input ${props.join(' ')} />`, imports };
}

function shadcnToggle(node: ToggleNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const imports = [`import { Switch } from "@/components/ui/switch";`];
  const props: string[] = [
    `checked={${node.binding}}`,
    `onCheckedChange={${setter}}`,
  ];
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'class') props.push(`className="${unquote(h.genExpr(val, c))}"`);
  }
  return { jsx: `${h.srcComment(node)}<Switch ${props.join(' ')} />`, imports };
}

function shadcnSelect(node: SelectNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const opts = h.genExpr(node.options, c);
  const imports = [`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`];

  const jsx = `${h.srcComment(node)}<Select value={${node.binding}} onValueChange={${setter}}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    {${opts}.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
  </SelectContent>
</Select>`;

  return { jsx, imports };
}

function shadcnModal(node: ModalNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";`];
  if (node.trigger) {
    imports.push(`import { Button } from "@/components/ui/button";`);
  }

  const lines: string[] = [];
  lines.push(`${h.srcComment(node)}<Dialog>`);
  if (node.trigger) {
    lines.push(`  <DialogTrigger asChild>`);
    lines.push(`    <Button variant="outline">${node.trigger}</Button>`);
    lines.push(`  </DialogTrigger>`);
  }
  lines.push(`  <DialogContent>`);
  lines.push(`    <DialogHeader>`);
  lines.push(`      <DialogTitle>${capitalize(node.title)}</DialogTitle>`);
  lines.push(`    </DialogHeader>`);
  lines.push(`    ${bodyJsx}`);
  lines.push(`  </DialogContent>`);
  lines.push(`</Dialog>`);

  return { jsx: lines.join('\n'), imports };
}

function shadcnDrawer(node: DrawerNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";`];

  const lines: string[] = [];
  lines.push(`${h.srcComment(node)}<Sheet>`);
  lines.push(`  <SheetTrigger asChild>`);
  lines.push(`    <button>Open ${node.name}</button>`);
  lines.push(`  </SheetTrigger>`);
  lines.push(`  <SheetContent>`);
  lines.push(`    <SheetHeader>`);
  lines.push(`      <SheetTitle>${capitalize(node.name)}</SheetTitle>`);
  lines.push(`    </SheetHeader>`);
  lines.push(`    ${bodyJsx}`);
  lines.push(`  </SheetContent>`);
  lines.push(`</Sheet>`);

  return { jsx: lines.join('\n'), imports };
}

function shadcnTable(node: TableNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";`];

  const headerCells = node.columns
    .filter(col => col.kind !== 'actions')
    .map(col => `<TableHead>${col.label || capitalize(col.field || '')}</TableHead>`);
  if (node.columns.some(c => c.kind === 'actions')) {
    headerCells.push(`<TableHead>Actions</TableHead>`);
  }

  const dataCells = node.columns.map(col => {
    if (col.kind === 'actions') {
      const btns = (col.actions || []).map(a =>
        `<button onClick={() => ${a}(item)} style={{ marginRight: '4px' }}>${capitalize(a)}</button>`
      ).join(' ');
      return `<TableCell>${btns}</TableCell>`;
    }
    return `<TableCell>{item.${col.field}}</TableCell>`;
  });

  const lines: string[] = [];
  lines.push(`<Table>`);
  lines.push(`  <TableHeader>`);
  lines.push(`    <TableRow>`);
  lines.push(`      ${headerCells.join('\n      ')}`);
  lines.push(`    </TableRow>`);
  lines.push(`  </TableHeader>`);
  lines.push(`  <TableBody>`);
  lines.push(`    {${node.dataSource}.map((item, i) => (`);
  lines.push(`      <TableRow key={i}>`);
  lines.push(`        ${dataCells.join('\n        ')}`);
  lines.push(`      </TableRow>`);
  lines.push(`    ))}`);
  lines.push(`  </TableBody>`);
  lines.push(`</Table>`);

  return { jsx: lines.join('\n'), imports };
}

function shadcnToast(node: ToastNode, c: any, h: ThemeHelpers): ThemedResult {
  const message = h.genExpr(node.message, c);
  const typeMap: Record<string, string> = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
  const fn = typeMap[node.toastType] || 'info';
  const imports = [`import { toast } from "sonner";`];
  return { jsx: `{toast.${fn}(${message})}`, imports };
}

function shadcnConfirm(node: ConfirmNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";`];

  const lines: string[] = [];
  lines.push(`<AlertDialog>`);
  lines.push(`  <AlertDialogTrigger asChild>`);
  lines.push(`    <button>${node.confirmLabel || 'Confirm'}</button>`);
  lines.push(`  </AlertDialogTrigger>`);
  lines.push(`  <AlertDialogContent>`);
  lines.push(`    <AlertDialogHeader>`);
  lines.push(`      <AlertDialogTitle>${node.message}</AlertDialogTitle>`);
  if (node.description) {
    lines.push(`      <AlertDialogDescription>${node.description}</AlertDialogDescription>`);
  }
  lines.push(`    </AlertDialogHeader>`);
  lines.push(`    <AlertDialogFooter>`);
  lines.push(`      <AlertDialogCancel>${node.cancelLabel || 'Cancel'}</AlertDialogCancel>`);
  lines.push(`      <AlertDialogAction${node.danger ? ' className="bg-destructive text-destructive-foreground"' : ''}>${node.confirmLabel || 'Confirm'}</AlertDialogAction>`);
  lines.push(`    </AlertDialogFooter>`);
  lines.push(`  </AlertDialogContent>`);
  lines.push(`</AlertDialog>`);

  return { jsx: lines.join('\n'), imports };
}

function shadcnNav(node: NavNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";`];

  const items = node.items.map(item =>
    `<NavigationMenuItem><NavigationMenuLink href="${item.href}">${item.label}</NavigationMenuLink></NavigationMenuItem>`
  );

  const jsx = `${h.srcComment(node)}<NavigationMenu>
  <NavigationMenuList>
    ${items.join('\n    ')}
  </NavigationMenuList>
</NavigationMenu>`;

  return { jsx, imports };
}

function shadcnProgress(node: ProgressNode, c: any, h: ThemeHelpers): ThemedResult {
  const val = h.genExpr(node.value, c);
  const imports = [`import { Progress } from "@/components/ui/progress";`];
  return { jsx: `<Progress value={${val}} />`, imports };
}

function shadcnBreadcrumb(node: BreadcrumbNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";`];

  const itemsExpr = node.props['items'] ? h.genExpr(node.props['items'], c) : '[]';
  const jsx = `<Breadcrumb>
  <BreadcrumbList>
    {${itemsExpr}.map((item, i) => (
      <BreadcrumbItem key={i}>
        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
        {i < ${itemsExpr}.length - 1 && <BreadcrumbSeparator />}
      </BreadcrumbItem>
    ))}
  </BreadcrumbList>
</Breadcrumb>`;

  return { jsx, imports };
}

function shadcnFaq(node: FaqNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";`];

  const items = node.items.map((item, i) =>
    `<AccordionItem value="item-${i}">
      <AccordionTrigger>${item.question}</AccordionTrigger>
      <AccordionContent>${item.answer}</AccordionContent>
    </AccordionItem>`
  );

  const jsx = `${h.srcComment(node)}<Accordion type="single" collapsible>
  ${items.join('\n  ')}
</Accordion>`;

  return { jsx, imports };
}

function shadcnCommand(node: CommandNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";`];

  const groups = node.sections.map(section => {
    const items = section.items.map(item =>
      `<CommandItem onSelect={() => ${h.genExpr(item.action, null)}}>${item.label}</CommandItem>`
    );
    return `<CommandGroup heading="${section.label}">\n      ${items.join('\n      ')}\n    </CommandGroup>`;
  });

  const jsx = `<CommandDialog>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    ${groups.join('\n    ')}
  </CommandList>
</CommandDialog>`;

  return { jsx, imports };
}

function shadcnStat(node: StatNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";`];
  const val = h.genExpr(node.value, c);
  const change = node.change ? h.genExpr(node.change, c) : null;

  const jsx = `${h.srcComment(node)}<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">${node.label}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{${val}}</div>${change ? `\n    <p className="text-xs text-muted-foreground">{${change}}</p>` : ''}
  </CardContent>
</Card>`;

  return { jsx, imports };
}

function shadcnSearch(node: SearchNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Input } from "@/components/ui/input";`];
  const target = node.target;
  const jsx = `${h.srcComment(node)}<div className="relative">
  <Input type="search" placeholder="Search ${target}..." className="pl-8" />
</div>`;
  return { jsx, imports };
}

function shadcnUpload(node: UploadNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Input } from "@/components/ui/input";`, `import { Button } from "@/components/ui/button";`];
  const accept = node.accept ? ` accept="${node.accept}"` : '';
  const jsx = `${h.srcComment(node)}<div className="grid w-full max-w-sm items-center gap-1.5">
  <Input type="file"${accept} />
</div>`;
  return { jsx, imports };
}

// ── MUI (Material UI) ────────────────────────────────

function muiButton(node: ButtonNode, c: any, h: ThemeHelpers): ThemedResult {
  const label = h.genTextContent(node.label, c);
  const action = h.genActionExpr(node.action, c);
  const props: string[] = [`onClick={() => ${action}}`];
  const imports = [`import Button from "@mui/material/Button";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'style': {
        const sv = unquote(v);
        const map: Record<string, string> = { primary: 'contained', danger: 'contained', secondary: 'outlined', outline: 'outlined', ghost: 'text' };
        if (map[sv]) props.push(`variant="${map[sv]}"`);
        if (sv === 'danger') props.push('color="error"');
        else if (sv === 'primary') props.push('color="primary"');
        break;
      }
      case 'disabled': props.push(`disabled={${v}}`); break;
      case 'size': props.push(`size="${unquote(v)}"`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Button ${props.join(' ')}>${label}</Button>`, imports };
}

function muiInput(node: InputNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const props: string[] = [
    `value={${node.binding}}`,
    `onChange={e => ${setter}(e.target.value)}`,
    'variant="outlined"',
    'size="small"',
  ];
  const imports = [`import TextField from "@mui/material/TextField";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'placeholder': props.push(`label=${v.startsWith('"') ? v : `{${v}}`}`); break;
      case 'type': props.push(`type=${v.startsWith('"') ? v : `{${v}}`}`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<TextField ${props.join(' ')} />`, imports };
}

function muiToggle(node: ToggleNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const imports = [`import Switch from "@mui/material/Switch";`];
  return { jsx: `${h.srcComment(node)}<Switch checked={${node.binding}} onChange={(e) => ${setter}(e.target.checked)} />`, imports };
}

function muiSelect(node: SelectNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const opts = h.genExpr(node.options, c);
  const imports = [
    `import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";`,
  ];

  const jsx = `${h.srcComment(node)}<FormControl size="small">
  <InputLabel>Select</InputLabel>
  <Select value={${node.binding}} onChange={e => ${setter}(e.target.value)} label="Select">
    {${opts}.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
  </Select>
</FormControl>`;

  return { jsx, imports };
}

function muiModal(node: ModalNode, c: any, h: ThemeHelpers): ThemedResult {
  const showVar = `show${capitalize(node.name)}`;
  const setShow = `set${capitalize(showVar)}`;
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";`];
  if (node.trigger) imports.push(`import Button from "@mui/material/Button";`);

  const lines: string[] = [];
  lines.push(`{(() => {`);
  lines.push(`  const [${showVar}, ${setShow}] = useState(false);`);
  lines.push(`  return (<>`);
  if (node.trigger) {
    lines.push(`    <Button variant="outlined" onClick={() => ${setShow}(true)}>${node.trigger}</Button>`);
  }
  lines.push(`    <Dialog open={${showVar}} onClose={() => ${setShow}(false)}>`);
  lines.push(`      <DialogTitle>${capitalize(node.title)}</DialogTitle>`);
  lines.push(`      <DialogContent>`);
  lines.push(`        ${bodyJsx}`);
  lines.push(`      </DialogContent>`);
  lines.push(`    </Dialog>`);
  lines.push(`  </>);`);
  lines.push(`})()}`);

  return { jsx: lines.join('\n'), imports };
}

function muiTable(node: TableNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";`];

  const headerCells = node.columns
    .filter(col => col.kind !== 'actions')
    .map(col => `<TableCell><strong>${col.label || capitalize(col.field || '')}</strong></TableCell>`);
  if (node.columns.some(c => c.kind === 'actions')) {
    headerCells.push(`<TableCell><strong>Actions</strong></TableCell>`);
  }

  const dataCells = node.columns.map(col => {
    if (col.kind === 'actions') {
      const btns = (col.actions || []).map(a =>
        `<button onClick={() => ${a}(item)}>${capitalize(a)}</button>`
      ).join(' ');
      return `<TableCell>${btns}</TableCell>`;
    }
    return `<TableCell>{item.${col.field}}</TableCell>`;
  });

  const jsx = `<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        ${headerCells.join('\n        ')}
      </TableRow>
    </TableHead>
    <TableBody>
      {${node.dataSource}.map((item, i) => (
        <TableRow key={i}>
          ${dataCells.join('\n          ')}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>`;

  return { jsx, imports };
}

function muiToast(node: ToastNode, c: any, h: ThemeHelpers): ThemedResult {
  const message = h.genExpr(node.message, c);
  const imports = [`import { Snackbar, Alert } from "@mui/material";`];
  return { jsx: `{/* MUI Toast: <Snackbar><Alert severity="${node.toastType}">{${message}}</Alert></Snackbar> */}`, imports };
}

function muiProgress(node: ProgressNode, c: any, h: ThemeHelpers): ThemedResult {
  const val = h.genExpr(node.value, c);
  const imports = [`import LinearProgress from "@mui/material/LinearProgress";`];
  return { jsx: `<LinearProgress variant="determinate" value={${val}} />`, imports };
}

function muiNav(node: NavNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { AppBar, Toolbar, Button } from "@mui/material";`];
  const items = node.items.map(item => `<Button color="inherit" href="${item.href}">${item.label}</Button>`);
  const jsx = `${h.srcComment(node)}<AppBar position="static">
  <Toolbar>
    ${items.join('\n    ')}
  </Toolbar>
</AppBar>`;
  return { jsx, imports };
}

function muiConfirm(node: ConfirmNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";`];
  const jsx = `{/* MUI Confirm Dialog */}
<Dialog open={true}>
  <DialogTitle>${node.message}</DialogTitle>${node.description ? `\n  <DialogContent><DialogContentText>${node.description}</DialogContentText></DialogContent>` : ''}
  <DialogActions>
    <Button>${node.cancelLabel || 'Cancel'}</Button>
    <Button${node.danger ? ' color="error"' : ''} variant="contained">${node.confirmLabel || 'Confirm'}</Button>
  </DialogActions>
</Dialog>`;
  return { jsx, imports };
}

function muiDrawer(node: DrawerNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Drawer, Box, Typography } from "@mui/material";`];
  const jsx = `${h.srcComment(node)}<Drawer anchor="right" open={true}>
  <Box sx={{ width: 350, p: 3 }}>
    <Typography variant="h6">${capitalize(node.name)}</Typography>
    ${bodyJsx}
  </Box>
</Drawer>`;
  return { jsx, imports };
}

// ── Ant Design ────────────────────────────────────────

function antdButton(node: ButtonNode, c: any, h: ThemeHelpers): ThemedResult {
  const label = h.genTextContent(node.label, c);
  const action = h.genActionExpr(node.action, c);
  const props: string[] = [`onClick={() => ${action}}`];
  const imports = [`import { Button } from "antd";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'style': {
        const sv = unquote(v);
        const map: Record<string, string> = { primary: 'primary', danger: 'primary', secondary: 'default', outline: 'default', ghost: 'text', link: 'link' };
        if (map[sv]) props.push(`type="${map[sv]}"`);
        if (sv === 'danger') props.push('danger');
        break;
      }
      case 'disabled': props.push(`disabled={${v}}`); break;
      case 'size': props.push(`size="${unquote(v)}"`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Button ${props.join(' ')}>${label}</Button>`, imports };
}

function antdInput(node: InputNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const props: string[] = [
    `value={${node.binding}}`,
    `onChange={e => ${setter}(e.target.value)}`,
  ];
  const imports = [`import { Input } from "antd";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'placeholder': props.push(`placeholder=${v.startsWith('"') ? v : `{${v}}`}`); break;
      case 'type': {
        const tv = unquote(v);
        if (tv === 'password') {
          imports[0] = `import { Input } from "antd";`;
          // Use Input.Password for password type
        }
        break;
      }
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Input ${props.join(' ')} />`, imports };
}

function antdToggle(node: ToggleNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const imports = [`import { Switch } from "antd";`];
  return { jsx: `${h.srcComment(node)}<Switch checked={${node.binding}} onChange={${setter}} />`, imports };
}

function antdSelect(node: SelectNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const opts = h.genExpr(node.options, c);
  const imports = [`import { Select } from "antd";`];

  const jsx = `${h.srcComment(node)}<Select value={${node.binding}} onChange={${setter}} style={{ width: '100%' }}
  options={${opts}.map(opt => ({ label: opt, value: opt }))}
/>`;

  return { jsx, imports };
}

function antdModal(node: ModalNode, c: any, h: ThemeHelpers): ThemedResult {
  const showVar = `show${capitalize(node.name)}`;
  const setShow = `set${capitalize(showVar)}`;
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Modal } from "antd";`];
  if (node.trigger) imports.push(`import { Button } from "antd";`);

  const lines: string[] = [];
  lines.push(`{(() => {`);
  lines.push(`  const [${showVar}, ${setShow}] = useState(false);`);
  lines.push(`  return (<>`);
  if (node.trigger) {
    lines.push(`    <Button onClick={() => ${setShow}(true)}>${node.trigger}</Button>`);
  }
  lines.push(`    <Modal title="${capitalize(node.title)}" open={${showVar}} onCancel={() => ${setShow}(false)} footer={null}>`);
  lines.push(`      ${bodyJsx}`);
  lines.push(`    </Modal>`);
  lines.push(`  </>);`);
  lines.push(`})()}`);

  return { jsx: lines.join('\n'), imports };
}

function antdTable(node: TableNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Table } from "antd";`];

  const columns = node.columns.map(col => {
    if (col.kind === 'actions') {
      return `{ title: 'Actions', key: 'actions', render: (_, record) => (${(col.actions || []).map(a => `<a onClick={() => ${a}(record)}>${capitalize(a)}</a>`).join(' ')}) }`;
    }
    return `{ title: '${col.label || capitalize(col.field || '')}', dataIndex: '${col.field}', key: '${col.field}'${col.sortable ? ', sorter: true' : ''} }`;
  });

  const jsx = `<Table dataSource={${node.dataSource}} columns={[${columns.join(', ')}]} rowKey={(r, i) => i} />`;
  return { jsx, imports };
}

function antdToast(node: ToastNode, c: any, h: ThemeHelpers): ThemedResult {
  const message = h.genExpr(node.message, c);
  const imports = [`import { message } from "antd";`];
  const typeMap: Record<string, string> = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
  const fn = typeMap[node.toastType] || 'info';
  return { jsx: `{message.${fn}(${message})}`, imports };
}

function antdProgress(node: ProgressNode, c: any, h: ThemeHelpers): ThemedResult {
  const val = h.genExpr(node.value, c);
  const imports = [`import { Progress } from "antd";`];
  return { jsx: `<Progress percent={${val}} />`, imports };
}

function antdNav(node: NavNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Menu } from "antd";`];
  const items = node.items.map((item, i) =>
    `{ key: '${i}', label: <a href="${item.href}">${item.label}</a> }`
  );
  const jsx = `${h.srcComment(node)}<Menu mode="horizontal" items={[${items.join(', ')}]} />`;
  return { jsx, imports };
}

function antdConfirm(node: ConfirmNode, _c: any, _h: ThemeHelpers): ThemedResult {
  const imports = [`import { Modal } from "antd";`];
  const jsx = `{Modal.confirm({
  title: "${node.message}",${node.description ? `\n  content: "${node.description}",` : ''}
  okText: "${node.confirmLabel || 'Confirm'}",
  cancelText: "${node.cancelLabel || 'Cancel'}",${node.danger ? '\n  okButtonProps: { danger: true },' : ''}
})}`;
  return { jsx, imports };
}

function antdDrawer(node: DrawerNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Drawer } from "antd";`];
  const jsx = `${h.srcComment(node)}<Drawer title="${capitalize(node.name)}" open={true}>
  ${bodyJsx}
</Drawer>`;
  return { jsx, imports };
}

function antdFaq(node: FaqNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Collapse } from "antd";`];
  const items = node.items.map((item, i) =>
    `{ key: '${i}', label: "${item.question}", children: <p>${item.answer}</p> }`
  );
  const jsx = `${h.srcComment(node)}<Collapse items={[${items.join(', ')}]} />`;
  return { jsx, imports };
}

// ── Chakra UI ─────────────────────────────────────────

function chakraButton(node: ButtonNode, c: any, h: ThemeHelpers): ThemedResult {
  const label = h.genTextContent(node.label, c);
  const action = h.genActionExpr(node.action, c);
  const props: string[] = [`onClick={() => ${action}}`];
  const imports = [`import { Button } from "@chakra-ui/react";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'style': {
        const sv = unquote(v);
        const map: Record<string, string> = { primary: 'solid', danger: 'solid', secondary: 'outline', outline: 'outline', ghost: 'ghost', link: 'link' };
        if (map[sv]) props.push(`variant="${map[sv]}"`);
        if (sv === 'primary') props.push('colorScheme="blue"');
        else if (sv === 'danger') props.push('colorScheme="red"');
        break;
      }
      case 'disabled': props.push(`isDisabled={${v}}`); break;
      case 'size': props.push(`size="${unquote(v)}"`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Button ${props.join(' ')}>${label}</Button>`, imports };
}

function chakraInput(node: InputNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const props: string[] = [
    `value={${node.binding}}`,
    `onChange={e => ${setter}(e.target.value)}`,
  ];
  const imports = [`import { Input } from "@chakra-ui/react";`];

  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, c);
    switch (key) {
      case 'placeholder': props.push(`placeholder=${v.startsWith('"') ? v : `{${v}}`}`); break;
      case 'type': props.push(`type=${v.startsWith('"') ? v : `{${v}}`}`); break;
      case 'class': props.push(`className="${unquote(v)}"`); break;
    }
  }

  return { jsx: `${h.srcComment(node)}<Input ${props.join(' ')} />`, imports };
}

function chakraToggle(node: ToggleNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const imports = [`import { Switch } from "@chakra-ui/react";`];
  return { jsx: `${h.srcComment(node)}<Switch isChecked={${node.binding}} onChange={e => ${setter}(e.target.checked)} />`, imports };
}

function chakraSelect(node: SelectNode, c: any, h: ThemeHelpers): ThemedResult {
  const setter = 'set' + capitalize(node.binding);
  const opts = h.genExpr(node.options, c);
  const imports = [`import { Select } from "@chakra-ui/react";`];

  const jsx = `${h.srcComment(node)}<Select value={${node.binding}} onChange={e => ${setter}(e.target.value)}>
  {${opts}.map(opt => <option key={opt} value={opt}>{opt}</option>)}
</Select>`;

  return { jsx, imports };
}

function chakraModal(node: ModalNode, c: any, h: ThemeHelpers): ThemedResult {
  const showVar = `show${capitalize(node.name)}`;
  const setShow = `set${capitalize(showVar)}`;
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from "@chakra-ui/react";`];
  if (node.trigger) imports.push(`import { Button } from "@chakra-ui/react";`);

  const lines: string[] = [];
  lines.push(`{(() => {`);
  lines.push(`  const [${showVar}, ${setShow}] = useState(false);`);
  lines.push(`  return (<>`);
  if (node.trigger) {
    lines.push(`    <Button onClick={() => ${setShow}(true)}>${node.trigger}</Button>`);
  }
  lines.push(`    <Modal isOpen={${showVar}} onClose={() => ${setShow}(false)}>`);
  lines.push(`      <ModalOverlay />`);
  lines.push(`      <ModalContent>`);
  lines.push(`        <ModalHeader>${capitalize(node.title)}</ModalHeader>`);
  lines.push(`        <ModalCloseButton />`);
  lines.push(`        <ModalBody>`);
  lines.push(`          ${bodyJsx}`);
  lines.push(`        </ModalBody>`);
  lines.push(`      </ModalContent>`);
  lines.push(`    </Modal>`);
  lines.push(`  </>);`);
  lines.push(`})()}`);

  return { jsx: lines.join('\n'), imports };
}

function chakraTable(node: TableNode, c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Table, Thead, Tbody, Tr, Th, Td, TableContainer } from "@chakra-ui/react";`];

  const headerCells = node.columns
    .filter(col => col.kind !== 'actions')
    .map(col => `<Th>${col.label || capitalize(col.field || '')}</Th>`);
  if (node.columns.some(c => c.kind === 'actions')) {
    headerCells.push(`<Th>Actions</Th>`);
  }

  const dataCells = node.columns.map(col => {
    if (col.kind === 'actions') {
      const btns = (col.actions || []).map(a =>
        `<button onClick={() => ${a}(item)}>${capitalize(a)}</button>`
      ).join(' ');
      return `<Td>${btns}</Td>`;
    }
    return `<Td>{item.${col.field}}</Td>`;
  });

  const jsx = `<TableContainer>
  <Table variant="simple">
    <Thead>
      <Tr>
        ${headerCells.join('\n        ')}
      </Tr>
    </Thead>
    <Tbody>
      {${node.dataSource}.map((item, i) => (
        <Tr key={i}>
          ${dataCells.join('\n          ')}
        </Tr>
      ))}
    </Tbody>
  </Table>
</TableContainer>`;

  return { jsx, imports };
}

function chakraToast(node: ToastNode, c: any, h: ThemeHelpers): ThemedResult {
  const message = h.genExpr(node.message, c);
  const imports = [`import { useToast } from "@chakra-ui/react";`];
  const statusMap: Record<string, string> = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
  return { jsx: `{toast({ description: ${message}, status: "${statusMap[node.toastType] || 'info'}" })}`, imports };
}

function chakraProgress(node: ProgressNode, c: any, h: ThemeHelpers): ThemedResult {
  const val = h.genExpr(node.value, c);
  const imports = [`import { Progress } from "@chakra-ui/react";`];
  return { jsx: `<Progress value={${val}} />`, imports };
}

function chakraNav(node: NavNode, _c: any, h: ThemeHelpers): ThemedResult {
  const imports = [`import { Flex, Link } from "@chakra-ui/react";`];
  const items = node.items.map(item => `<Link href="${item.href}" px={2}>${item.label}</Link>`);
  const jsx = `${h.srcComment(node)}<Flex as="nav" gap={4} align="center">
  ${items.join('\n  ')}
</Flex>`;
  return { jsx, imports };
}

function chakraConfirm(node: ConfirmNode, _c: any, _h: ThemeHelpers): ThemedResult {
  const imports = [`import { AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button } from "@chakra-ui/react";`];
  const jsx = `<AlertDialog isOpen={true} leastDestructiveRef={cancelRef}>
  <AlertDialogOverlay>
    <AlertDialogContent>
      <AlertDialogHeader>${node.message}</AlertDialogHeader>${node.description ? `\n      <AlertDialogBody>${node.description}</AlertDialogBody>` : ''}
      <AlertDialogFooter>
        <Button ref={cancelRef}>${node.cancelLabel || 'Cancel'}</Button>
        <Button${node.danger ? ' colorScheme="red"' : ''} ml={3}>${node.confirmLabel || 'Confirm'}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialogOverlay>
</AlertDialog>`;
  return { jsx, imports };
}

function chakraDrawer(node: DrawerNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyJsx = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton } from "@chakra-ui/react";`];
  const jsx = `${h.srcComment(node)}<Drawer isOpen={true} placement="right">
  <DrawerOverlay />
  <DrawerContent>
    <DrawerCloseButton />
    <DrawerHeader>${capitalize(node.name)}</DrawerHeader>
    <DrawerBody>
      ${bodyJsx}
    </DrawerBody>
  </DrawerContent>
</Drawer>`;
  return { jsx, imports };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VUE THEMES (shadcn-vue)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function shadcnVueButton(node: ButtonNode, c: any, h: ThemeHelpers): ThemedResult {
  const label = h.genTextContent(node.label, c);
  const action = h.genActionExpr(node.action, c);
  let variant = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'style') {
      const sv = unquote(h.genExpr(val, c));
      const map: Record<string, string> = { primary: 'default', danger: 'destructive', secondary: 'secondary', outline: 'outline', ghost: 'ghost' };
      if (map[sv]) variant = ` variant="${map[sv]}"`;
    }
  }
  return { jsx: `<Button${variant} @click="${action}">${label}</Button>`, imports: [`import { Button } from '@/components/ui/button';`] };
}

function shadcnVueInput(node: InputNode, _c: any, h: ThemeHelpers): ThemedResult {
  const props: string[] = [`v-model="${node.binding}"`];
  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, _c);
    if (key === 'placeholder') props.push(`placeholder=${v}`);
    else if (key === 'type') props.push(`type=${v}`);
  }
  return { jsx: `<Input ${props.join(' ')} />`, imports: [`import { Input } from '@/components/ui/input';`] };
}

function shadcnVueToggle(node: ToggleNode, _c: any, _h: ThemeHelpers): ThemedResult {
  return { jsx: `<Switch v-model:checked="${node.binding}" />`, imports: [`import { Switch } from '@/components/ui/switch';`] };
}

function shadcnVueSelect(node: SelectNode, c: any, h: ThemeHelpers): ThemedResult {
  const opts = h.genExpr(node.options, c);
  return {
    jsx: `<Select v-model="${node.binding}">
  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
  <SelectContent>
    <SelectItem v-for="opt in ${opts}" :key="opt" :value="opt">{{ opt }}</SelectItem>
  </SelectContent>
</Select>`,
    imports: [`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';`]
  };
}

function shadcnVueModal(node: ModalNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyHtml = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';`];
  if (node.trigger) imports.push(`import { Button } from '@/components/ui/button';`);

  const lines: string[] = [];
  lines.push(`<Dialog>`);
  if (node.trigger) {
    lines.push(`  <DialogTrigger as-child>`);
    lines.push(`    <Button variant="outline">${node.trigger}</Button>`);
    lines.push(`  </DialogTrigger>`);
  }
  lines.push(`  <DialogContent>`);
  lines.push(`    <DialogHeader>`);
  lines.push(`      <DialogTitle>${capitalize(node.title)}</DialogTitle>`);
  lines.push(`    </DialogHeader>`);
  lines.push(`    ${bodyHtml}`);
  lines.push(`  </DialogContent>`);
  lines.push(`</Dialog>`);
  return { jsx: lines.join('\n'), imports };
}

function shadcnVueTable(node: TableNode, _c: any, _h: ThemeHelpers): ThemedResult {
  const imports = [`import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';`];
  const headerCells = node.columns.filter(c => c.kind !== 'actions').map(c => `<TableHead>${c.label || capitalize(c.field || '')}</TableHead>`);
  if (node.columns.some(c => c.kind === 'actions')) headerCells.push(`<TableHead>Actions</TableHead>`);
  const dataCells = node.columns.map(col => {
    if (col.kind === 'actions') return `<TableCell>${(col.actions || []).map(a => `<button @click="${a}(item)">${capitalize(a)}</button>`).join(' ')}</TableCell>`;
    return `<TableCell>{{ item.${col.field} }}</TableCell>`;
  });
  const jsx = `<Table>
  <TableHeader><TableRow>${headerCells.join('')}</TableRow></TableHeader>
  <TableBody>
    <TableRow v-for="(item, i) in ${node.dataSource}" :key="i">
      ${dataCells.join('\n      ')}
    </TableRow>
  </TableBody>
</Table>`;
  return { jsx, imports };
}

function shadcnVueProgress(node: ProgressNode, c: any, h: ThemeHelpers): ThemedResult {
  const val = h.genExpr(node.value, c);
  return { jsx: `<Progress :model-value="${val}" />`, imports: [`import { Progress } from '@/components/ui/progress';`] };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SVELTE THEMES (shadcn-svelte / bits-ui)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function shadcnSvelteButton(node: ButtonNode, c: any, h: ThemeHelpers): ThemedResult {
  const label = h.genTextContent(node.label, c);
  const action = h.genActionExpr(node.action, c);
  let variant = '';
  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'style') {
      const sv = unquote(h.genExpr(val, c));
      const map: Record<string, string> = { primary: 'default', danger: 'destructive', secondary: 'secondary', outline: 'outline', ghost: 'ghost' };
      if (map[sv]) variant = ` variant="${map[sv]}"`;
    }
  }
  return { jsx: `<Button${variant} on:click={() => ${action}}>${label}</Button>`, imports: [`import { Button } from '$lib/components/ui/button';`] };
}

function shadcnSvelteInput(node: InputNode, _c: any, h: ThemeHelpers): ThemedResult {
  const props: string[] = [`bind:value={${node.binding}}`];
  for (const [key, val] of Object.entries(node.props)) {
    const v = h.genExpr(val, _c);
    if (key === 'placeholder') props.push(`placeholder=${v}`);
    else if (key === 'type') props.push(`type=${v}`);
  }
  return { jsx: `<Input ${props.join(' ')} />`, imports: [`import { Input } from '$lib/components/ui/input';`] };
}

function shadcnSvelteToggle(node: ToggleNode, _c: any, _h: ThemeHelpers): ThemedResult {
  return { jsx: `<Switch bind:checked={${node.binding}} />`, imports: [`import { Switch } from '$lib/components/ui/switch';`] };
}

function shadcnSvelteSelect(node: SelectNode, c: any, h: ThemeHelpers): ThemedResult {
  const opts = h.genExpr(node.options, c);
  return {
    jsx: `<Select bind:value={${node.binding}}>
  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
  <SelectContent>
    {#each ${opts} as opt}
      <SelectItem value={opt}>{opt}</SelectItem>
    {/each}
  </SelectContent>
</Select>`,
    imports: [`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';`]
  };
}

function shadcnSvelteModal(node: ModalNode, c: any, h: ThemeHelpers): ThemedResult {
  const bodyHtml = node.body.map(ch => h.genUINode(ch, c)).join('\n    ');
  const imports = [`import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';`];
  if (node.trigger) imports.push(`import { Button } from '$lib/components/ui/button';`);

  const lines: string[] = [];
  lines.push(`<Dialog>`);
  if (node.trigger) {
    lines.push(`  <DialogTrigger>`);
    lines.push(`    <Button variant="outline">${node.trigger}</Button>`);
    lines.push(`  </DialogTrigger>`);
  }
  lines.push(`  <DialogContent>`);
  lines.push(`    <DialogHeader>`);
  lines.push(`      <DialogTitle>${capitalize(node.title)}</DialogTitle>`);
  lines.push(`    </DialogHeader>`);
  lines.push(`    ${bodyHtml}`);
  lines.push(`  </DialogContent>`);
  lines.push(`</Dialog>`);
  return { jsx: lines.join('\n'), imports };
}

function shadcnSvelteTable(node: TableNode, _c: any, _h: ThemeHelpers): ThemedResult {
  const imports = [`import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';`];
  const headerCells = node.columns.filter(c => c.kind !== 'actions').map(c => `<TableHead>${c.label || capitalize(c.field || '')}</TableHead>`);
  if (node.columns.some(c => c.kind === 'actions')) headerCells.push(`<TableHead>Actions</TableHead>`);
  const dataCells = node.columns.map(col => {
    if (col.kind === 'actions') return `<TableCell>${(col.actions || []).map(a => `<button on:click={() => ${a}(item)}>${capitalize(a)}</button>`).join(' ')}</TableCell>`;
    return `<TableCell>{item.${col.field}}</TableCell>`;
  });
  const jsx = `<Table>
  <TableHeader><TableRow>${headerCells.join('')}</TableRow></TableHeader>
  <TableBody>
    {#each ${node.dataSource} as item, i}
      <TableRow>
        ${dataCells.join('\n        ')}
      </TableRow>
    {/each}
  </TableBody>
</Table>`;
  return { jsx, imports };
}

function shadcnSvelteProgress(node: ProgressNode, c: any, h: ThemeHelpers): ThemedResult {
  const val = h.genExpr(node.value, c);
  return { jsx: `<Progress value={${val}} />`, imports: [`import { Progress } from '$lib/components/ui/progress';`] };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THEME REGISTRY — Dispatchers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ElementType = string;
type ThemeRenderer = (node: any, c: any, h: ThemeHelpers) => ThemedResult;

const REACT_THEMES: Record<ThemeName, Record<ElementType, ThemeRenderer>> = {
  shadcn: {
    Button: shadcnButton,
    Input: shadcnInput,
    Toggle: shadcnToggle,
    Select: shadcnSelect,
    Modal: shadcnModal,
    Drawer: shadcnDrawer,
    Table: shadcnTable,
    Toast: shadcnToast,
    Confirm: shadcnConfirm,
    Nav: shadcnNav,
    Progress: shadcnProgress,
    Breadcrumb: shadcnBreadcrumb,
    Faq: shadcnFaq,
    Command: shadcnCommand,
    Stat: shadcnStat,
    Search: shadcnSearch,
    Upload: shadcnUpload,
  },
  mui: {
    Button: muiButton,
    Input: muiInput,
    Toggle: muiToggle,
    Select: muiSelect,
    Modal: muiModal,
    Drawer: muiDrawer,
    Table: muiTable,
    Toast: muiToast,
    Progress: muiProgress,
    Nav: muiNav,
    Confirm: muiConfirm,
  },
  antd: {
    Button: antdButton,
    Input: antdInput,
    Toggle: antdToggle,
    Select: antdSelect,
    Modal: antdModal,
    Drawer: antdDrawer,
    Table: antdTable,
    Toast: antdToast,
    Progress: antdProgress,
    Nav: antdNav,
    Confirm: antdConfirm,
    Faq: antdFaq,
  },
  chakra: {
    Button: chakraButton,
    Input: chakraInput,
    Toggle: chakraToggle,
    Select: chakraSelect,
    Modal: chakraModal,
    Drawer: chakraDrawer,
    Table: chakraTable,
    Toast: chakraToast,
    Progress: chakraProgress,
    Nav: chakraNav,
    Confirm: chakraConfirm,
  },
};

const VUE_THEMES: Record<string, Record<ElementType, ThemeRenderer>> = {
  shadcn: {
    Button: shadcnVueButton,
    Input: shadcnVueInput,
    Toggle: shadcnVueToggle,
    Select: shadcnVueSelect,
    Modal: shadcnVueModal,
    Table: shadcnVueTable,
    Progress: shadcnVueProgress,
  },
};

const SVELTE_THEMES: Record<string, Record<ElementType, ThemeRenderer>> = {
  shadcn: {
    Button: shadcnSvelteButton,
    Input: shadcnSvelteInput,
    Toggle: shadcnSvelteToggle,
    Select: shadcnSvelteSelect,
    Modal: shadcnSvelteModal,
    Table: shadcnSvelteTable,
    Progress: shadcnSvelteProgress,
  },
};

/**
 * Get a themed renderer for a React element.
 * Returns null if no theme override exists for this element type.
 */
export function getReactThemeRenderer(theme: ThemeName, elementType: string): ThemeRenderer | null {
  return REACT_THEMES[theme]?.[elementType] ?? null;
}

/**
 * Get a themed renderer for a Vue element.
 */
export function getVueThemeRenderer(theme: ThemeName, elementType: string): ThemeRenderer | null {
  return VUE_THEMES[theme]?.[elementType] ?? null;
}

/**
 * Get a themed renderer for a Svelte element.
 */
export function getSvelteThemeRenderer(theme: ThemeName, elementType: string): ThemeRenderer | null {
  return SVELTE_THEMES[theme]?.[elementType] ?? null;
}
