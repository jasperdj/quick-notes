# Architecture - folded

## Overview

folded is a client-side markdown editor with advanced folding capabilities. Built with TypeScript, CodeMirror 6, and Vite. All data is stored locally in IndexedDB.

## Core Principles

- **Serverless**: Everything runs in the browser
- **Privacy-first**: No data leaves the client
- **Performance**: CM6's efficient virtual DOM and incremental parsing
- **Modern Stack**: TypeScript, ES modules, Vite build
- **Modularity**: Clean separation of concerns

## Technology Stack

- **Editor**: CodeMirror 6
- **Language**: TypeScript
- **Build**: Vite
- **Storage**: IndexedDB
- **Deployment**: GitHub Pages via GitHub Actions

## Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      main.ts                            │
│              (Application Coordinator)                  │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐
│   document.ts   │ │  editor.ts  │ │   folding.ts     │
│  (Coordinator)  │ │ (CM6 Wrap)  │ │  (Fold State)    │
└─────────────────┘ └─────────────┘ └──────────────────┘
         │                 │                 │
         ▼                 │                 │
┌─────────────────┐        │                 │
│   storage.ts    │        │                 │
│  (IndexedDB)    │        │                 │
└─────────────────┘        │                 │
                           ▼                 │
              ┌────────────────────────┐     │
              │     CodeMirror 6       │     │
              │  ┌──────────────────┐  │     │
              │  │   extensions.ts  │  │◄────┘
              │  │  (CM6 Config)    │  │
              │  └──────────────────┘  │
              │  ┌──────────────────┐  │
              │  │invisible-chars.ts│  │
              │  │ (Fold Widgets)   │  │
              │  └──────────────────┘  │
              │  ┌──────────────────┐  │
              │  │  clipboard.ts    │  │
              │  │ (Copy/Paste)     │  │
              │  └──────────────────┘  │
              └────────────────────────┘
```

## Directory Structure

```
src/
├── main.ts                 # Application entry point
├── index.html              # HTML shell
├── css/
│   └── main.css            # Styles
├── modules/
│   ├── editor.ts           # CM6 wrapper with line-based API
│   ├── storage.ts          # IndexedDB operations
│   ├── document.ts         # Document lifecycle management
│   └── folding.ts          # Fold state & invisible char encoding
└── cm6/
    ├── extensions.ts       # CM6 plugins & configuration
    ├── invisible-chars.ts  # ViewPlugin for fold indicators
    └── clipboard.ts        # Copy/paste handling for folds
```

## Module Responsibilities

### main.ts - Application Entry Point

**Role**: Orchestrates all modules and handles application lifecycle

**Responsibilities**:
- Initialize all modules in correct order
- Set up global keyboard shortcuts
- Connect fold manager to CM6 plugins
- Handle errors and user feedback

**Key Functions**:
- `initializeApp()` - Bootstrap the application
- `setupKeyboardShortcuts()` - Global hotkeys
- `foldAtCursor()` - Smart folding at cursor position

### editor.ts - CodeMirror 6 Wrapper

**Role**: Provides a stable API over CodeMirror 6

**Responsibilities**:
- Initialize CM6 with extensions
- Expose line-based operations (compatible with old API)
- Handle cursor and selection
- Dispatch document changes

**API**:
```typescript
editor.initialize(container: HTMLElement): boolean
editor.getLine(n: number): string | null        // 0-indexed
editor.setLine(n: number, content: string): boolean
editor.getLines(): string[]
editor.setLines(lines: string[]): void
editor.getContent(): string
editor.setContent(content: string): void
editor.getCursor(): { line: number; col: number }
editor.setCursor(line: number, col: number): boolean
editor.getSelection(): string
editor.onChange(callback: () => void): void
editor.focus(): void
editor.getLineCount(): number
```

### folding.ts - Fold State Manager

**Role**: Manage document folding using invisible Unicode markers

**Key Concept**: Folds are encoded as invisible Unicode suffixes on lines:
- `U+200B` (ZWS) - Start marker
- `U+200C` (ZWNJ) - Binary 0
- `U+200D` (ZWJ) - Binary 1
- `U+FEFF` (BOM) - End marker

**Why invisible characters?**
- Folds persist in the document itself
- Copy/paste preserves fold structure
- No separate state to sync
- Works with any text operation

**Data Structures**:
```typescript
// In-memory storage for folded content
foldedContent: Map<number, {
  lines: string[];      // The hidden lines
  lineCount: number;    // For display
  label: string;        // First line preview
}>

// Encoding: foldId → binary → invisible chars
encodeFoldId(id: number): string   // "​‌‍‍..."
decodeFoldId(suffix: string): number
```

**API**:
```typescript
foldManager.createFold(startLine: number, endLine: number): number
foldManager.expandFold(foldId: number): boolean
foldManager.foldAll(): void
foldManager.unfoldAll(): void
foldManager.getState(): unknown        // For persistence
foldManager.setState(state: unknown): void
foldManager.clear(): void
```

### storage.ts - IndexedDB Wrapper

**Role**: Persist documents and settings

**Database Schema**:
```typescript
// Database: 'folded-db', version 1
// Object stores:

documents: {
  keyPath: 'id',
  indexes: ['modified'],
  structure: {
    id: string,
    content: string,      // Includes invisible fold markers
    name: string,
    created: number,
    modified: number,
    foldState: unknown    // Serialized fold manager state
  }
}

settings: {
  keyPath: 'key',
  structure: { key: string, value: unknown }
}
```

**API**:
```typescript
storage.initDB(): Promise<void>
storage.saveDocument(id, content, metadata): Promise<DocumentData>
storage.loadDocument(id): Promise<DocumentData | null>
storage.deleteDocument(id): Promise<boolean>
storage.listDocuments(): Promise<DocumentData[]>
storage.saveSetting(key, value): Promise<void>
storage.loadSetting<T>(key, defaultValue): Promise<T>
```

### document.ts - Document Manager

**Role**: Coordinate between editor, storage, and fold manager

**Responsibilities**:
- Auto-save with 2-second debounce
- Track dirty state
- Manage document lifecycle (create, load, save, delete)
- Coordinate fold state persistence
- Update UI indicators

**API**:
```typescript
doc.initialize(): Promise<void>
doc.create(name?: string): Promise<DocumentData>
doc.load(id: string): Promise<DocumentData | null>
doc.save(): Promise<DocumentData | null>
doc.delete(id?: string): Promise<boolean>
doc.getOrCreateDefault(): Promise<DocumentData>
doc.markDirty(): void
```

## CodeMirror 6 Plugins

### extensions.ts - CM6 Configuration

**Included Extensions**:
- Line numbers, active line highlighting
- History (undo/redo)
- Markdown language support with code block highlighting
- One Dark theme
- Fold gutter (for native CM6 folding of headers/code blocks)
- Bracket matching
- Rectangular selection

**Custom Extensions**:
- `invisibleCharsExtension` - Fold indicator widgets
- `clipboardExtension` - Smart copy/paste
- `markdownFoldService` - Custom fold detection

### invisible-chars.ts - Fold Indicator Plugin

**Role**: Replace invisible fold markers with visual widgets

**How it works**:
1. `ViewPlugin` scans visible range for fold marker pattern
2. Regex matches: `ZWS + [ZWNJ|ZWJ]+ + BOM`
3. Creates `Decoration.replace()` with `FoldIndicatorWidget`
4. Widget shows "▼ N lines" badge, clickable to expand

**Widget**:
```typescript
class FoldIndicatorWidget extends WidgetType {
  toDOM(): HTMLElement {
    // Returns clickable badge: "▼ 5 lines"
    // Click handler calls foldManager.expandFold(id)
  }
}
```

### clipboard.ts - Copy/Paste Handler

**Role**: Handle copy/paste of folded content

**Challenges**:
- Browsers restrict custom clipboard MIME types
- Need to expand folds for external paste
- Need to preserve folds for internal paste

**Solution**:
1. On copy/cut: Store fold data in memory (`pendingPaste`)
2. Write plain text (with folds expanded) to clipboard
3. On paste: Check if we have pending data for this text
4. If yes: Restore folds with new IDs
5. If no: Paste as plain text

## Data Flow

### Startup Flow
```
main.ts: initializeApp()
    │
    ├─→ storage.initDB()
    │
    ├─→ editor.initialize(container)
    │       └─→ Creates CM6 EditorView with extensions
    │
    ├─→ Create FoldManager(editor)
    │
    ├─→ Connect fold manager to plugins:
    │       setFoldManager(foldManager)      → document.ts
    │       setFoldManagerRef(foldManager)   → invisible-chars.ts
    │       setClipboardFoldManager(foldManager) → clipboard.ts
    │
    ├─→ doc.initialize()
    │
    └─→ doc.getOrCreateDefault()
            └─→ Loads document + restores fold state
```

### Folding Flow
```
User presses Cmd+.
    │
    ├─→ foldAtCursor()
    │
    ├─→ Get cursor line from editor
    │
    ├─→ foldManager.createFold(startLine, endLine)
    │       │
    │       ├─→ Extract lines to fold
    │       ├─→ Store in foldedContent Map
    │       ├─→ Generate fold ID
    │       ├─→ Encode ID as invisible suffix
    │       └─→ Replace lines with single line + suffix
    │
    └─→ CM6 updates → invisible-chars plugin detects marker
            └─→ Renders fold indicator widget
```

### Expand Flow
```
User clicks fold indicator
    │
    ├─→ FoldIndicatorWidget click handler
    │
    ├─→ foldManager.expandFold(foldId)
    │       │
    │       ├─→ Get stored lines from foldedContent
    │       ├─→ Find line with this fold's marker
    │       ├─→ Remove invisible suffix
    │       ├─→ Insert stored lines back
    │       └─→ Delete from foldedContent
    │
    └─→ CM6 updates → widget disappears, content restored
```

### Save Flow
```
User types
    │
    ├─→ editor.onChange() fires
    │
    ├─→ doc.markDirty()
    │       └─→ Schedules auto-save (2s debounce)
    │
    └─→ Timer fires → doc.save()
            │
            ├─→ editor.getContent()  // Includes invisible markers
            ├─→ foldManager.getState()
            │
            └─→ storage.saveDocument(id, content, { foldState, ... })
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save immediately |
| `Cmd/Ctrl + N` | New document |
| `Cmd/Ctrl + .` | Smart fold at cursor |
| `Cmd/Ctrl + ,` | Unfold at cursor |
| `Cmd/Ctrl + Shift + .` | Fold all |
| `Cmd/Ctrl + Shift + ,` | Unfold all |

## Styling

### CSS Variables (Theming Ready)
```css
--bg-color: #1e1e1e;
--text-color: #d4d4d4;
--border-color: #3e3e42;
--accent-color: #007acc;
```

### Fold Indicator Styling
```css
.cm-fold-indicator {
  background: #3e3e42;
  color: #858585;
  padding: 0 6px;
  border-radius: 3px;
  cursor: pointer;
}
.cm-fold-indicator:hover {
  background: #4e4e52;
  color: #d4d4d4;
}
```

## Deployment

### GitHub Actions Workflows

**deploy.yml** (Production):
- Triggers on push to `main`
- Builds with Vite
- Deploys to gh-pages branch
- Triggers GitHub Pages build via API

**preview.yml** (PR Previews):
- Triggers on PR open/sync
- Builds with PR-specific base path
- Deploys to `gh-pages/pr/{number}/`
- Comments preview URL on PR
- Cleans up on PR close

### URLs
- **Production**: https://jasperdj.github.io/folded/
- **PR Preview**: https://jasperdj.github.io/folded/pr/{number}/

## Future Enhancements (Phase 2+)

### Planned Features
- **Search & Navigation**: Regex search, URL-based header navigation
- **Rich Content**: Images, Mermaid diagrams, interactive checkboxes
- **Export/Import**: Encrypted, compressed data portability
- **Themes**: Custom theme editor
- **Code Previews**: Sandboxed HTML preview

### Performance Optimizations
- Virtual scrolling for 100K+ line documents
- Web Workers for heavy operations
- Incremental fold state updates

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support

**Requirements**:
- ES2020+ support
- IndexedDB support
- CSS variables support
