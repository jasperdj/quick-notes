# Architecture - folded

## Overview

folded is a client-side markdown editor with advanced folding capabilities. It's built entirely with vanilla JavaScript (ES6 modules) and requires no framework dependencies. All data is stored locally in IndexedDB.

## Core Principles

- **Serverless**: Everything runs in the browser
- **Privacy-first**: No data leaves the client
- **Performance**: 60fps rendering with requestAnimationFrame
- **Simplicity**: No build tools or frameworks required
- **Modularity**: Clean separation of concerns

## Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      main.js                            │
│              (Application Coordinator)                  │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
│   document.js   │ │  editor.js  │ │ renderer.js  │
│  (Coordinator)  │ │  (UI Core)  │ │  (Display)   │
└─────────────────┘ └─────────────┘ └──────────────┘
         │                 │                 │
         │                 └─────────────────┤
         ▼                                   │
┌─────────────────┐                         │
│   storage.js    │                         │
│  (IndexedDB)    │                         │
└─────────────────┘                         │
                                            │
         ┌──────────────────────────────────┤
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│   parser.js     │              │   folding.js     │
│  (Markdown)     │              │  (Fold State)    │
└─────────────────┘              └──────────────────┘
```

## Module Responsibilities

### main.js - Application Entry Point
**Role**: Orchestrates all modules and handles application lifecycle

**Responsibilities**:
- Initialize all modules in correct order
- Set up global keyboard shortcuts
- Coordinate between modules
- Handle errors and user feedback
- Manage application state

**Key Functions**:
- `init()` - Initialize the application
- `setupUIHandlers()` - Set up keyboard shortcuts
- `foldAtCursor()` - Smart folding at cursor position
- `createNewDocument()` - Create new document

### editor.js - Text Editor Core
**Role**: Line-based text editing with cursor management

**Responsibilities**:
- Manage textarea element
- Provide line-based API (getLine, setLine, etc.)
- Track cursor position and selection
- Handle input events
- Synchronize scroll with overlay

**Key Features**:
- 0-indexed line operations
- Debounced change callbacks
- Selection range tracking
- Scroll synchronization

**API**:
```javascript
editor.getLine(n)              // Get line content
editor.setLine(n, content)     // Set line content
editor.getCursor()             // Get {line, col}
editor.getSelection()          // Get selected text
editor.onChange(callback)      // Register change handler
```

### parser.js - Markdown Parser
**Role**: Parse markdown into structured tokens

**Responsibilities**:
- Line-by-line parsing for performance
- Detect markdown elements (headers, lists, code, etc.)
- Parse inline tokens (bold, italic, code, links)
- Build header tree structure
- Track parsing context (code blocks, etc.)

**Supported Elements**:
- Headers (# through ######)
- Code blocks (```)
- Lists (ordered, unordered, checkboxes)
- Blockquotes (>)
- Inline: bold, italic, code, links

**API**:
```javascript
parser.parse(content)          // Parse entire document
parser.parseLine(line, ctx)    // Parse single line
parser.getParsedLines()        // Get all parsed lines
parser.getHeaderTree()         // Get header structure
```

### renderer.js - Syntax Highlighting Renderer
**Role**: Render parsed markdown with syntax highlighting

**Responsibilities**:
- Render parsed lines to HTML
- Apply syntax highlighting styles
- Integrate with fold system
- Render fold indicators
- Sync scroll with editor
- Handle fold clicks

**Rendering Strategy**:
- Uses overlay div positioned over transparent textarea
- Scheduled with requestAnimationFrame for 60fps
- Only re-renders when content or folds change
- Skips hidden (folded) lines

**API**:
```javascript
renderer.render()              // Render entire document
renderer.scheduleRender()      // Schedule next frame render
renderer.renderFoldIndicator() // Render fold UI
```

### folding.js - Fold State Manager (NEW in Phase 2)
**Role**: Manage document folding state

**Responsibilities**:
- Track fold regions (start/end lines)
- Detect foldable regions (smart folding)
- Toggle fold collapse/expand state
- Maintain line visibility
- Prevent overlapping folds
- Persist fold state

**Smart Fold Detection**:
- **Headers**: Fold section until next same-level header
- **Code blocks**: Fold from opening ``` to closing ```
- **Lists**: Fold consecutive list items at same indent
- **Blockquotes**: Fold consecutive blockquote lines
- **Paragraphs**: Fold consecutive text lines

**Data Structures**:
```javascript
// Fold object
{
  id: "fold-123",
  startLine: 10,
  endLine: 50,
  collapsed: true,
  label: "Section Header"
}

// Maps for fast lookup
folds: Map<id, fold>           // foldId -> fold object
lineToFolds: Map<line, Set>    // lineNumber -> Set<foldId>
```

**API**:
```javascript
foldManager.createFold(start, end, label)
foldManager.removeFold(id)
foldManager.toggleFold(id)
foldManager.isLineVisible(n)
foldManager.detectFoldableRegion(line, parsed)
foldManager.foldAll(parsedLines)
foldManager.unfoldAll()
foldManager.getState()         // For persistence
foldManager.setState(state)    // Restore from storage
```

### document.js - Document Manager
**Role**: Coordinate between editor and storage

**Responsibilities**:
- Manage current document state
- Auto-save with debouncing (2 seconds)
- Handle document CRUD operations
- Coordinate fold state persistence
- Show save indicators
- Track dirty state

**Auto-save Flow**:
1. User types → editor triggers onChange
2. Document marked as dirty
3. Timer scheduled (2s)
4. Timer fires → save() called
5. Content + folds saved to storage
6. Save indicator updated

**API**:
```javascript
doc.create(name)               // Create new document
doc.load(id)                   // Load document + folds
doc.save()                     // Save content + folds
doc.getOrCreateDefault()       // Get last opened or create
```

### storage.js - IndexedDB Wrapper
**Role**: Persist documents and settings

**Responsibilities**:
- Manage IndexedDB connection
- CRUD operations for documents
- Store document metadata (name, dates, folds)
- Store application settings
- Handle database versioning

**Database Schema**:
```javascript
// Object stores
documents: {
  keyPath: 'id',
  data: {
    id: string,
    content: string,
    name: string,
    created: timestamp,
    modified: timestamp,
    folds: array      // NEW: fold state
  }
}

settings: {
  keyPath: 'key',
  data: { key: string, value: any }
}
```

**API**:
```javascript
storage.initDB()
storage.saveDocument(id, content, metadata)
storage.loadDocument(id)
storage.deleteDocument(id)
storage.saveSetting(key, value)
storage.loadSetting(key)
```

## Data Flow

### Rendering Flow
```
User types
    ↓
editor.onChange() fired
    ↓
renderer.scheduleRender()
    ↓
requestAnimationFrame callback
    ↓
parser.parse(content)
    ↓
renderer.renderLines(parsed)
    ↓
  for each line:
    - Check if hidden by fold → skip
    - Check if fold starts here → render indicator
    - Otherwise → render line with syntax
    ↓
overlay.innerHTML = html
```

### Folding Flow
```
User presses Cmd+.
    ↓
foldAtCursor() called
    ↓
Get cursor position from editor
    ↓
parser.getParsedLines()
    ↓
foldManager.detectFoldableRegion(cursor.line, parsed)
    ↓
Detect type (header/code/list/etc.)
    ↓
Find end line based on type
    ↓
foldManager.createFold(start, end, label)
    ↓
Index fold in maps
    ↓
foldManager.onChange() fired
    ↓
renderer.scheduleRender()
    ↓
Fold indicator appears, content hidden
```

### Save Flow
```
User types
    ↓
document.markDirty()
    ↓
scheduleAutoSave() (2s debounce)
    ↓
Timer fires
    ↓
editor.getContent()
foldManager.getState()
    ↓
storage.saveDocument(id, content, { folds, ... })
    ↓
IndexedDB transaction
    ↓
Save indicator: "Saved ✓"
```

### Load Flow
```
App starts
    ↓
doc.getOrCreateDefault()
    ↓
storage.loadSetting('lastOpenedDocument')
    ↓
storage.loadDocument(id)
    ↓
editor.setContent(doc.content)
    ↓
foldManager.setState(doc.folds)
    ↓
renderer.render()
    ↓
UI shows document with folds restored
```

## Performance Considerations

### Rendering Performance
- **requestAnimationFrame**: Syncs with browser paint cycle (~16ms)
- **No debouncing**: Immediate visual feedback
- **Incremental parsing**: Only parse changed regions (future optimization)
- **Virtual scrolling**: Planned for very large documents

### Memory Efficiency
- **Line-based storage**: Strings in arrays, no heavy objects
- **Map-based indexes**: O(1) fold lookups
- **Minimal DOM**: Single overlay div, rewritten on change

### Storage Efficiency
- **IndexedDB**: Handles large documents efficiently
- **No duplicates**: Documents stored once, loaded on demand
- **Metadata separation**: Name, dates stored separately from content

## Event System

### Change Propagation
```
editor.onChange
    ↓
    ├─→ document.markDirty()
    │       ↓
    │   scheduleAutoSave()
    │
    └─→ renderer.scheduleRender()
            ↓
        parser.parse()
            ↓
        renderer.renderLines()

foldManager.onChange
    ↓
    └─→ renderer.scheduleRender()
```

## Keyboard Shortcuts

```
Cmd/Ctrl + S           → Save immediately
Cmd/Ctrl + N           → New document
Cmd/Ctrl + .           → Smart fold at cursor
Cmd/Ctrl + Shift + .   → Unfold all
Cmd/Ctrl + Alt + .     → Fold all
```

## CSS Architecture

### Layer System (z-index)
```
z-index: 0  → overlay (syntax highlighting, fold indicators)
z-index: 1  → textarea (transparent, receives input)
```

### Positioning Strategy
- Container: `position: relative`
- Both textarea and overlay: `position: absolute`
- Same padding, font, line-height for alignment
- Synchronized scrolling via JavaScript

### Syntax Highlighting Classes
```css
.syntax-header       → Headers
.syntax-code-block   → Code blocks
.syntax-list         → Lists
.syntax-checkbox     → Checkboxes
.syntax-blockquote   → Blockquotes
.syntax-bold         → Bold text
.syntax-italic       → Italic text
.syntax-code         → Inline code
.syntax-link         → Links
.fold-indicator      → Fold UI (clickable)
```

## Future Enhancements (Phase 3+)

### Planned Features
- **Search & Replace**: Regex search with scope control
- **Rich Content**: Images, Mermaid diagrams, table rendering
- **Export/Import**: Encrypted, compressed data portability
- **Themes**: Custom theme creation and management
- **Nested Folds**: Support folds within folds
- **Selection-based Folds**: Fold arbitrary selected text
- **Fold Persistence by Type**: Remember fold preferences per content type

### Performance Optimizations
- Incremental parsing (only re-parse changed lines)
- Virtual scrolling for 100K+ line documents
- Web Workers for heavy operations
- IndexedDB caching layer

## Testing Strategy

### Unit Tests
- `storage.test.html` - IndexedDB operations (12 tests)
- Parser tests - Markdown parsing accuracy
- Fold manager tests - Fold logic and state

### Manual Testing
- Typing performance (should feel instant)
- Auto-save (2s after typing stops)
- Fold operations (create, toggle, delete)
- State persistence (folds survive reload)
- Large documents (1000+ lines)

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Tested on Chrome Android

**Requirements**:
- ES6 modules support
- IndexedDB support
- requestAnimationFrame support
- CSS variables support

## Deployment

- **Platform**: GitHub Pages
- **Build**: None required (vanilla JS)
- **Deploy**: Push to main branch
- **URL**: https://jasperdj.github.io/quick-notes/

## File Structure

```
quick-notes/
├── index.html                 # Entry point
├── css/
│   └── main.css              # All styles
├── js/
│   ├── main.js               # App coordinator
│   └── modules/
│       ├── editor.js         # Text editor
│       ├── parser.js         # Markdown parser
│       ├── renderer.js       # Syntax renderer
│       ├── storage.js        # IndexedDB
│       ├── document.js       # Doc manager
│       └── folding.js        # Fold state (NEW)
├── tests/
│   └── storage.test.html     # Storage tests
├── README.md                 # User documentation
├── ARCHITECTURE.md           # This file
└── PLAN.md                   # Full roadmap
```

## Summary

folded is a well-architected, modular markdown editor that prioritizes:
- **Performance**: 60fps with requestAnimationFrame
- **Simplicity**: No frameworks, minimal dependencies
- **Privacy**: Everything client-side
- **UX**: Auto-save, smart folding, instant feedback

The addition of the folding system (Phase 2) maintains these principles while adding powerful document organization capabilities. All modules remain loosely coupled and communicate through clean interfaces.
