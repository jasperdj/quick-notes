# folded - Development Guide

> **Project**: folded - Browser-based markdown editor with advanced folding
> **Architecture**: Vanilla JavaScript, serverless, client-side only

---

## Project Overview

A minimalist markdown editor that runs entirely in the browser. Key features:
- Fold content at ANY point (not just headers)
- Syntax highlighting
- IndexedDB persistence
- Performance with large documents (100K+ lines)

**Core Philosophy:**
1. Simplicity first - Clean, distraction-free interface
2. Performance matters - Handle large files smoothly
3. Privacy by default - All data stays client-side

---

## Architecture

### File Structure
```
folded/
├── index.html
├── css/main.css
├── js/
│   ├── main.js
│   └── modules/
│       ├── storage.js    # IndexedDB wrapper
│       ├── editor.js     # Textarea management
│       ├── document.js   # Document model
│       ├── parser.js     # Markdown parsing
│       ├── renderer.js   # Syntax highlighting overlay
│       └── folding.js    # Fold state management
└── .claude/progress/     # Development tracking
```

### Layered Rendering
- **Textarea** (z-index: 1) - User input, transparent text
- **Overlay** (z-index: 0) - Syntax highlighting, non-interactive
- **Fold Gutter** (z-index: 10) - Clickable fold icons on left side

### Key Module Interfaces

**Storage**: `initDB()`, `saveDocument()`, `loadDocument()`, `saveSetting()`, `loadSetting()`

**Editor**: `getLine(n)`, `setLine(n, content)`, `getCursor()`, `onChange(callback)`

**Parser**: `parse()`, `parseLine()`, `getHeaderTree()`, `getParsedLines()`

**Renderer**: `render()`, `scheduleRender()`, `renderFoldGutter()`

**Folding**: `createFold()`, `toggleFold()`, `getAllFolds()`, `detectFoldableRegion()`

---

## Development Phases

### Phase 1: Core Foundation (Complete)
- [x] IndexedDB storage
- [x] Basic editor with line operations
- [x] Markdown parser
- [x] Syntax highlighting renderer
- [x] Document model with auto-save

### Phase 2: Feature Modules (Current - Folding)
1. **Folding** - In progress: fold/unfold any content region
2. **Search** - Regex search with navigation
3. **Rich Content** - Images, checkboxes, Mermaid
4. **Export/Import** - With encryption
5. **Themes** - Custom color schemes
6. **Code Previews** - HTML sandbox

### Phase 3: Advanced Features (Future)
- Inline computation, Document restructuring, Kanban view, GitHub sync

---

## Progress Tracking

Maintain these files in `.claude/progress/phase2/folding/`:
- `current-state.md` - Current task and status
- `decisions.md` - Architectural choices
- `session-log.md` - Work summaries

### Session Workflow

**Starting:**
1. Read `current-state.md` for context
2. Continue from where you left off

**Ending:**
1. Update `current-state.md` with progress
2. Update TESTING.md if behavior changed
3. Commit with descriptive message

---

## Testing

See `TESTING.md` for detailed test scenarios.

### Performance Targets
- 60fps scrolling with 100K lines
- < 50ms parse time for 10K lines
- < 500ms initial load

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + S | Save |
| Cmd/Ctrl + N | New document |
| Cmd/Ctrl + . | Smart fold at cursor |
| Cmd/Ctrl + Shift + . | Unfold all |
| Cmd/Ctrl + Alt + . | Fold all |

---

## Development Principles

1. **Build Small** - Smallest testable unit first
2. **Test Continuously** - Validate each piece before moving on
3. **No Over-engineering** - Only build what's needed now
4. **Document Decisions** - Record why, not just what
