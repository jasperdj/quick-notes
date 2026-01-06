# FoldingText Web - Implementation Plan

## Executive Summary

Building a web-based version of FoldingText with these key requirements:
- **Serverless**: Runs entirely client-side
- **Storage**: IndexedDB for persistence
- **Format**: Plain text markdown (no WYSIWYG)
- **Performance**: Handle large content (CSV dumps, etc.) without slowdown
- **Core Feature**: Collapse content at ANY point (not just at headers)
- **UI**: Simplistic yet elegant

---

## 1. Application Architecture

### 1.1 Technology Stack
```
Frontend:
├── Vanilla JavaScript (ES6+ modules) - No framework overhead for performance
├── HTML5 - Semantic structure
└── CSS3 - Modern styling with CSS variables for theming

Storage:
└── IndexedDB - Asynchronous, handles large data efficiently

Optional:
├── Web Workers - For heavy parsing/processing
└── Service Worker - For offline capability (future enhancement)
```

### 1.2 File Structure
```
quick-notes/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest (optional)
├── css/
│   ├── main.css           # Core styles
│   ├── editor.css         # Editor-specific styles
│   └── themes.css         # Color themes
├── js/
│   ├── main.js            # Application entry point
│   ├── modules/
│   │   ├── editor.js      # Editor controller
│   │   ├── storage.js     # IndexedDB wrapper
│   │   ├── folding.js     # Folding/collapse logic
│   │   ├── parser.js      # Markdown parsing
│   │   ├── renderer.js    # Virtual rendering engine
│   │   ├── keyboard.js    # Keyboard shortcuts
│   │   └── utils.js       # Utility functions
│   └── workers/
│       └── parser.worker.js # Background parsing
└── README.md
```

### 1.3 Core Modules

**Editor Module** (`editor.js`)
- Manages the main editing surface
- Handles text input and cursor management
- Coordinates between other modules
- Implements undo/redo

**Storage Module** (`storage.js`)
- IndexedDB wrapper for document persistence
- Auto-save functionality
- Document versioning (optional)
- Import/export capabilities

**Folding Module** (`folding.js`)
- **Critical Innovation**: Arbitrary fold points
- Fold state management
- Visual indicators for folds
- Keyboard navigation through folds

**Parser Module** (`parser.js`)
- Lightweight markdown tokenization
- Line-based parsing for performance
- Incremental parsing (only re-parse changed regions)
- Structure detection (headers, lists, code blocks)

**Renderer Module** (`renderer.js`)
- Virtual scrolling for large documents
- Efficient DOM updates (only visible lines)
- Syntax highlighting for markdown
- Fold visual representation

---

## 2. Data Model

### 2.1 Document Structure
```javascript
{
  id: "unique-doc-id",
  title: "Document Title",
  content: "raw markdown text",  // Plain text, newline-separated
  created: timestamp,
  modified: timestamp,
  metadata: {
    lineCount: number,
    charCount: number,
    foldCount: number
  },
  folds: [
    {
      id: "fold-uuid",
      startLine: number,        // 0-indexed line number
      endLine: number,          // 0-indexed line number
      collapsed: boolean,
      label: "optional label"   // Preview text when collapsed
    }
  ],
  cursor: {
    line: number,
    column: number
  },
  scroll: {
    top: number
  }
}
```

### 2.2 IndexedDB Schema
```javascript
Database: "FoldingTextDB"
Version: 1

Object Stores:
├── documents
│   ├── keyPath: "id"
│   └── indexes: ["modified", "title"]
│
├── settings
│   └── keyPath: "key"
│
└── autosave
    ├── keyPath: "id"
    └── Temporary storage for recovery
```

### 2.3 In-Memory Representation
For performance, maintain in-memory structures:
```javascript
{
  lines: [                    // Array of line objects
    {
      text: "line content",
      lineNumber: number,
      tokens: [],             // Parsed markdown tokens
      isFoldStart: boolean,
      isFoldEnd: boolean,
      isHidden: boolean,      // Hidden by parent fold
      foldId: "fold-uuid"     // If part of a fold
    }
  ],
  visibleLines: [],           // Indexes of visible lines
  foldMap: Map(),            // foldId -> fold object
  lineToFoldMap: Map()       // lineNumber -> foldId[]
}
```

---

## 3. Folding/Collapsing Mechanism

### 3.1 The Innovation: Arbitrary Folding
Unlike traditional outliners that only fold at headers, this implementation allows:
- **Selection-based folding**: Select any range and fold it
- **Smart folding**: Auto-detect foldable regions (headers, lists, code blocks)
- **Inline folding**: Collapse in the middle of content without scrolling

### 3.2 Folding Behavior
```
User Actions:
1. Manual Selection Fold
   - Select text (multiple lines)
   - Press fold shortcut (Cmd/Ctrl + .)
   - Creates fold from selection start to end

2. Smart Fold
   - Cursor on header line → fold entire section
   - Cursor in list → fold list items
   - Cursor in code block → fold block
   - Cursor anywhere → fold paragraph

3. Fold All/Unfold All
   - Collapse all headers
   - Collapse all code blocks
   - Expand everything

Visual Representation:
┌─────────────────────────────────┐
│ # Header 1                      │
│ Some content...                 │
│ ▶ [Lines 3-15 collapsed] ...    │ ← Fold indicator
│ More content after fold         │
│ ## Header 2                     │
└─────────────────────────────────┘
```

### 3.3 Fold Management
```javascript
class FoldManager {
  createFold(startLine, endLine, label?)
  removeFold(foldId)
  toggleFold(foldId)
  getFoldsInRange(startLine, endLine)
  getVisibleLines()
  navigateToNextFold()
  navigateToPreviousFold()
}
```

### 3.4 Edge Cases
- Nested folds: Allow folds within folds
- Overlapping folds: Prevent or merge
- Editing folded content: Auto-expand or edit in-place
- Moving/deleting folded regions: Update fold boundaries

---

## 4. Performance Optimizations

### 4.1 Virtual Scrolling
**Problem**: Rendering 100,000 lines in DOM = browser freeze
**Solution**: Only render visible lines + buffer

```javascript
class VirtualScroller {
  constructor(container, totalLines, lineHeight) {
    this.viewportHeight = container.clientHeight
    this.bufferSize = 20  // Lines above/below viewport
    this.lineHeight = lineHeight
  }

  getVisibleRange(scrollTop) {
    const start = Math.floor(scrollTop / this.lineHeight) - this.bufferSize
    const end = start + Math.ceil(this.viewportHeight / this.lineHeight) + (2 * this.bufferSize)
    return { start: Math.max(0, start), end }
  }

  render(scrollTop) {
    const { start, end } = this.getVisibleRange(scrollTop)
    // Only render lines[start:end]
    // Use transform: translateY() for positioning
  }
}
```

### 4.2 Incremental Parsing
Don't re-parse entire document on each change:
```javascript
class IncrementalParser {
  parseChange(changeStart, changeEnd, newText) {
    // 1. Find affected line range
    const startLine = this.getLineNumber(changeStart)
    const endLine = this.getLineNumber(changeEnd)

    // 2. Invalidate tokens for affected lines
    this.invalidateLines(startLine, endLine)

    // 3. Re-parse only affected region
    this.parseLines(startLine, endLine)

    // 4. Update line numbers for following lines if needed
    this.updateLineNumbers(endLine + 1)
  }
}
```

### 4.3 Efficient DOM Updates
Use DocumentFragment and minimize reflows:
```javascript
function updateVisibleLines(linesToRender) {
  const fragment = document.createDocumentFragment()
  const existingLines = new Map()

  // Reuse existing DOM elements where possible
  for (const line of linesToRender) {
    const el = existingLines.get(line.number) || createLineElement(line)
    fragment.appendChild(el)
  }

  requestAnimationFrame(() => {
    container.innerHTML = ''  // Or better: differential update
    container.appendChild(fragment)
  })
}
```

### 4.4 Debouncing & Throttling
```javascript
// Auto-save: debounce (wait for typing to stop)
const debouncedSave = debounce(saveToIndexedDB, 1000)

// Scroll rendering: throttle (limit update frequency)
const throttledRender = throttle(renderVisibleLines, 16) // ~60fps
```

### 4.5 Web Worker for Heavy Processing
```javascript
// parser.worker.js
self.addEventListener('message', (e) => {
  const { content, action } = e.data

  if (action === 'parse') {
    const tokens = heavyParseOperation(content)
    self.postMessage({ tokens })
  }
})

// main.js
const parser = new Worker('js/workers/parser.worker.js')
parser.postMessage({ content, action: 'parse' })
parser.onmessage = (e) => updateTokens(e.data.tokens)
```

---

## 5. User Interface Design

### 5.1 Layout
```
┌─────────────────────────────────────────────────┐
│  FoldingText                          [☰ Menu]  │ ← Header (minimal)
├─────────────────────────────────────────────────┤
│  [←] Documents                                  │ ← Sidebar (collapsible)
│  ────────────────                               │
│  ☰ Quick Note                                   │
│  ☰ Meeting Notes                                │
│  ☰ Ideas                                        │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  # Document Title                               │
│                                                  │
│  Start typing...                                │
│                                           |      │ ← Editor (full focus)
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘
│  Line 42, Column 8  |  2,341 words  |  Auto-saved │ ← Status bar
└─────────────────────────────────────────────────┘
```

### 5.2 Visual Design Principles
- **Minimalism**: No visual clutter, focus on content
- **Typography**: Monospace font for editing, clean readable size
- **Spacing**: Generous line height for readability
- **Colors**: Muted palette, high contrast for text
- **Fold Indicators**: Subtle triangles (▶/▼) or custom icons

### 5.3 CSS Architecture
```css
/* CSS Variables for easy theming */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #0066cc;
  --border: #e0e0e0;

  --font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --line-height: 1.6;
  --editor-padding: 2rem;
  --fold-indent: 1.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #e0e0e0;
    --text-secondary: #999999;
    --accent: #4dabf7;
    --border: #404040;
  }
}
```

### 5.4 Markdown Syntax Highlighting
Subtle syntax highlighting without being distracting:
```css
.md-header {
  font-weight: bold;
  color: var(--accent);
}
.md-bold { font-weight: bold; }
.md-italic { font-style: italic; }
.md-code {
  background: var(--bg-secondary);
  font-family: var(--font-mono);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
.md-link {
  color: var(--accent);
  text-decoration: underline;
}
```

---

## 6. Keyboard Shortcuts

Essential for power users:

```
Document Management:
Cmd/Ctrl + N          New document
Cmd/Ctrl + O          Open document
Cmd/Ctrl + S          Save (manual trigger)
Cmd/Ctrl + W          Close document

Editing:
Cmd/Ctrl + Z          Undo
Cmd/Ctrl + Shift + Z  Redo
Cmd/Ctrl + F          Find
Cmd/Ctrl + H          Find and replace

Folding:
Cmd/Ctrl + .          Fold selection / smart fold at cursor
Cmd/Ctrl + ,          Unfold at cursor
Cmd/Ctrl + Shift + .  Fold all
Cmd/Ctrl + Shift + ,  Unfold all
Alt + Arrow Up        Jump to previous fold
Alt + Arrow Down      Jump to next fold

Navigation:
Cmd/Ctrl + G          Go to line
Cmd/Ctrl + Home       Go to document start
Cmd/Ctrl + End        Go to document end

View:
Cmd/Ctrl + B          Toggle sidebar
Cmd/Ctrl + \          Toggle focus mode
Cmd/Ctrl + +          Increase font size
Cmd/Ctrl + -          Decrease font size
Cmd/Ctrl + 0          Reset font size
```

---

## 7. Implementation Phases

### Phase 1: Core Foundation (MVP)
**Goal**: Basic editing and storage

- [x] Set up project structure
- [ ] Create HTML/CSS shell
- [ ] Implement basic text editor (contenteditable or textarea)
- [ ] IndexedDB storage wrapper
- [ ] Document create/save/load
- [ ] Auto-save functionality

**Deliverable**: Can create and edit plain text documents with persistence

---

### Phase 2: Markdown Parsing
**Goal**: Understand document structure

- [ ] Line-based markdown tokenizer
- [ ] Detect headers, lists, code blocks, blockquotes
- [ ] Incremental parsing on edit
- [ ] Syntax highlighting overlay
- [ ] Structure tree representation

**Deliverable**: Markdown is parsed and highlighted in real-time

---

### Phase 3: Folding System
**Goal**: Core differentiator

- [ ] Fold data structure
- [ ] Manual selection-based folding
- [ ] Smart fold (auto-detect foldable regions)
- [ ] Fold/unfold toggle
- [ ] Visual fold indicators
- [ ] Navigate between folds
- [ ] Persist fold state

**Deliverable**: Can fold/unfold content at any point

---

### Phase 4: Performance Optimization
**Goal**: Handle large documents (100K+ lines)

- [ ] Virtual scrolling implementation
- [ ] Only render visible lines
- [ ] Efficient line recycling
- [ ] Debounce/throttle optimizations
- [ ] Web Worker for parsing (if needed)
- [ ] Memory profiling and optimization

**Deliverable**: Smooth scrolling and editing even with massive CSV dumps

---

### Phase 5: Polish & UX
**Goal**: Simplistic yet elegant

- [ ] Refined visual design
- [ ] Animations (subtle fold/unfold)
- [ ] Keyboard shortcuts
- [ ] Command palette
- [ ] Settings panel
- [ ] Dark mode
- [ ] Responsive design

**Deliverable**: Production-ready user interface

---

### Phase 6: Advanced Features (Post-MVP)
**Goal**: Power user features

- [ ] Multi-document management
- [ ] Document search
- [ ] Export (Markdown, HTML, PDF)
- [ ] Import (Markdown, TXT, CSV)
- [ ] Outline view sidebar
- [ ] Todo list syntax support
- [ ] Tags/metadata
- [ ] Full-text search across documents

---

## 8. Technical Challenges & Solutions

### Challenge 1: Contenteditable vs Textarea
**Problem**: Contenteditable is complex but allows rich display; textarea is simple but plain

**Solution**: Use `textarea` wrapped with syntax highlighting overlay
```html
<div class="editor-container">
  <div class="syntax-overlay" aria-hidden="true">
    <!-- Rendered syntax-highlighted version -->
  </div>
  <textarea class="editor-input"></textarea>
</div>
```
This approach gives us:
- Simple text editing (textarea)
- Visual syntax highlighting (overlay)
- No contenteditable complexity
- Better accessibility

### Challenge 2: Folding with Arbitrary Points
**Problem**: Traditional editors fold at structural boundaries; we need arbitrary folding

**Solution**: Line-range-based folding system
```javascript
// Any selection creates a fold:
const selection = getSelection()
const startLine = getLineNumber(selection.start)
const endLine = getLineNumber(selection.end)
createFold(startLine, endLine)

// Render: Skip hidden lines
function getVisibleLines(allLines, folds) {
  return allLines.filter(line => !isLineHidden(line, folds))
}
```

### Challenge 3: Large Content Performance
**Problem**: 100K lines of CSV data crashes browser

**Solution**: Virtual scrolling + lazy rendering
- Only render ~50 visible lines at a time
- Use `transform: translateY()` for positioning (no layout thrashing)
- Recycle DOM elements instead of creating new ones
- Use `requestAnimationFrame` for smooth updates

### Challenge 4: Maintaining Fold State During Edits
**Problem**: Adding/deleting lines invalidates fold line numbers

**Solution**: Offset adjustment system
```javascript
function onTextChange(change) {
  const { startLine, endLine, linesAdded, linesRemoved } = change
  const delta = linesAdded - linesRemoved

  if (delta !== 0) {
    // Adjust all folds after the change
    for (const fold of folds) {
      if (fold.startLine > endLine) {
        fold.startLine += delta
        fold.endLine += delta
      } else if (fold.endLine > endLine) {
        fold.endLine += delta
      }
    }
  }
}
```

### Challenge 5: IndexedDB Async Complexity
**Problem**: IndexedDB is callback-based and verbose

**Solution**: Promise wrapper
```javascript
class Storage {
  async save(document) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite')
      const store = transaction.objectStore('documents')
      const request = store.put(document)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async load(id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly')
      const store = transaction.objectStore('documents')
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}
```

---

## 9. Testing Strategy

### Unit Tests
- Storage module (CRUD operations)
- Parser (markdown tokenization)
- Fold manager (create, toggle, navigation)
- Virtual scroller (range calculation)

### Integration Tests
- Full document flow (create → edit → save → load)
- Folding while editing
- Large document performance

### Manual Testing Scenarios
1. **Large Content Test**: Paste 50,000 line CSV
   - Verify no lag
   - Verify folding works
   - Verify scrolling is smooth

2. **Fold Persistence**: Create folds, close app, reopen
   - Verify folds are restored

3. **Edit Folded Content**: Make changes while folds exist
   - Verify fold positions update correctly

4. **Edge Cases**:
   - Fold on line 1
   - Fold last line
   - Nested folds
   - Fold single line
   - Fold entire document

---

## 10. Success Metrics

The implementation will be considered successful when:

1. **Performance**: Can handle 100,000+ lines without lag
   - Scrolling at 60fps
   - Typing with <16ms latency
   - Loading in <500ms

2. **Functionality**: All core features work
   - Create/edit/save documents ✓
   - Fold/unfold at any point ✓
   - Markdown syntax highlighting ✓
   - Keyboard shortcuts ✓

3. **UX**: Feels elegant and simple
   - Clean, minimal interface
   - No visual clutter
   - Intuitive folding interactions
   - Fast and responsive

4. **Reliability**: Data safety
   - Auto-save works consistently
   - No data loss on browser crash
   - IndexedDB operations are atomic

---

## 11. Future Enhancements

Beyond the initial implementation:

- **Collaboration**: Real-time collaborative editing (WebRTC or WebSocket)
- **Sync**: Cross-device sync (via optional backend or P2P)
- **Plugins**: Extension system for custom functionality
- **Themes**: User-customizable color schemes
- **Vim/Emacs modes**: Modal editing for power users
- **Git integration**: Version control within the app
- **Mobile support**: Touch-optimized interface
- **Offline PWA**: Full offline capability with service worker

---

## 12. Open Questions

Before implementation, clarify:

1. **Editor Component**: Textarea + overlay, or custom contenteditable implementation?
   - Recommendation: Textarea + overlay for simplicity

2. **Fold Visualization**: How should folds appear?
   - Option A: Single line with "... X lines hidden"
   - Option B: Collapsed block with preview
   - Recommendation: Single line, cleaner

3. **Multi-document UI**: Tabs vs sidebar vs command palette?
   - Recommendation: Sidebar for browsing, command palette for quick switch

4. **Mobile Support**: Include in Phase 1 or later?
   - Recommendation: Later, focus on desktop experience first

5. **Export Format**: What formats to support?
   - Recommendation: Start with plain markdown, add HTML/PDF later

---

## Summary

This plan outlines a complete, performant, serverless markdown editor with the unique ability to fold content at arbitrary points. The phased approach ensures we build a solid foundation before adding complexity, with performance as a first-class concern throughout.

**Key Innovations**:
1. Arbitrary folding (not just headers)
2. Virtual scrolling for massive documents
3. Serverless architecture with IndexedDB
4. Textarea + overlay for simple yet powerful editing

**Next Steps**: Review this plan, clarify open questions, then proceed with Phase 1 implementation.
