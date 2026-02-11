// 0x Language Server — Main entry point

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- need node-specific createConnection for stdio transport
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import {
  TextDocuments,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  TextDocumentPositionParams,
  CompletionItem,
  Hover,
  Location,
  DocumentSymbolParams,
  DocumentSymbol,
} from 'vscode-languageserver';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDiagnostics } from './diagnostics.js';
import { getCompletions } from './completion.js';
import { getHoverInfo } from './hover.js';
import { getDefinition } from './definition.js';
import { getDocumentSymbols } from './symbols.js';

// Create connection and document manager
const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

// Initialize
connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [' ', ':'],
      },
      hoverProvider: true,
      definitionProvider: true,
      documentSymbolProvider: true,
    },
  };
});

// Diagnostics — run on every content change
documents.onDidChangeContent((change) => {
  const source = change.document.getText();
  const diagnostics = getDiagnostics(source);
  connection.sendDiagnostics({
    uri: change.document.uri,
    diagnostics,
  });
});

// Completions
connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];
  return getCompletions(doc.getText(), params.position);
});

// Hover
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;
  return getHoverInfo(doc.getText(), params.position);
});

// Go to Definition
connection.onDefinition((params: TextDocumentPositionParams): Location | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;
  return getDefinition(doc.getText(), params.position, params.textDocument.uri);
});

// Document Symbols
connection.onDocumentSymbol((params: DocumentSymbolParams): DocumentSymbol[] => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];
  return getDocumentSymbols(doc.getText());
});

// Start listening
documents.listen(connection);
connection.listen();
