# folded - Development Guide

> **Project**: folded - Browser-based markdown editor with advanced folding
> **Architecture**: Vanilla JavaScript, serverless, client-side only

---

## Project Overview

A minimalist markdown editor that runs entirely in the browser. Key features:
- Fold content at ANY point (not just headers)
- Syntax highlighting with live preview
- IndexedDB persistence (offline-first)
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
├── index.html              # Main entry point
├── css/
│   └── main.css            # All styles including folding UI
├── js/
│   ├── main.js             # App initialization and keyboard shortcuts
│   └── modules/
│       ├── storage.js      # IndexedDB wrapper for persistence
│       ├── editor.js       # Textarea management, cursor, selection
│       ├── document.js     # Document model, auto-save, dirty tracking
│       ├── parser.js       # Markdown parsing, line-by-line
│       ├── renderer.js     # Syntax highlighting overlay + fold gutter
│       └── folding.js      # Fold state management, region detection
├── .claude/
│   └── progress/           # Development tracking files
├── CLAUDE.md               # This file - development guide
├── TESTING.md              # Manual testing instructions
└── ARCHITECTURE.md         # Detailed architecture docs
```

### Layered Rendering Architecture
The editor uses a three-layer architecture for rendering:

1. **Textarea** (z-index: 1)
   - Actual user input element
   - Transparent text (user doesn't see it directly)
   - Handles cursor, selection, keyboard input

2. **Overlay** (z-index: 0)
   - Positioned exactly over textarea
   - Shows syntax-highlighted content
   - Non-interactive (`pointer-events: none`)
   - Uses flexbox with `overlay-line` divs for proper folding

3. **Fold Gutter** (z-index: 10)
   - Left-side column with fold icons (▼/▶)
   - Clickable (`pointer-events: auto`)
   - Scrolls in sync with editor

### Key Module Interfaces

**Storage** (`storage.js`)
- `initDB()` - Initialize IndexedDB database
- `saveDocument(id, content, metadata)` - Persist document
- `loadDocument(id)` - Retrieve document
- `saveSetting(key, value)` / `loadSetting(key)` - App settings

**Editor** (`editor.js`)
- `initialize(container)` - Set up textarea and events
- `getLine(n)` / `setLine(n, content)` - Line operations
- `getCursor()` / `setCursor(line, col)` - Cursor control
- `getContent()` / `setContent(text)` - Full content
- `onChange(callback)` - Register change listener

**Parser** (`parser.js`)
- `parse(document)` - Parse entire document
- `parseLine(line, lineNumber)` - Parse single line
- `getHeaderTree()` - Get header hierarchy
- `getParsedLines()` - Get cached parsed results

**Renderer** (`renderer.js`)
- `initialize(editor, parser)` - Set up overlay and gutter
- `render()` - Full render of overlay and gutter
- `scheduleRender()` - Queue render for next animation frame
- `renderFoldGutter(parsedLines)` - Render fold icons
- `syncGutterScroll()` - Keep gutter aligned with editor

**Folding** (`folding.js`)
- `createFold(startLine, endLine, label)` - Create new fold
- `toggleFold(foldId)` - Toggle collapse state
- `removeFold(foldId)` - Delete a fold
- `getAllFolds()` - Get all fold objects
- `detectFoldableRegion(lineNumber, parsedLines)` - Smart region detection
- `getState()` / `setState(state)` - For persistence

---

## Development Workflow

### Starting a Session

1. **Read Context**
   - Check `TESTING.md` for current test status
   - Read any recent commits to understand recent changes

2. **Understand Current State**
   - Run the app locally: `npx serve` then open `http://localhost:3000`
   - Test basic functionality before making changes

3. **Make Changes Incrementally**
   - Small, testable changes
   - Test after each significant change
   - Use browser DevTools for debugging

### During Development

**Testing Changes:**
- Refresh browser (F5) after code changes
- Check console for errors
- Test the specific feature you changed
- Test related features for regressions

**Debugging Tips:**
- Use `console.log()` liberally
- Check IndexedDB in DevTools > Application > IndexedDB
- Inspect DOM elements in DevTools > Elements
- Use `window.folded` in console to access all modules

### Ending a Session

1. **Test Your Changes**
   - Run through TESTING.md scenarios
   - Verify no regressions

2. **Update Documentation**
   - Update TESTING.md if behavior changed
   - Update ARCHITECTURE.md if architecture changed

3. **Commit with Clear Message**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
   - Describe what changed and why

---

## Development Phases

### Phase 1: Core Foundation (Complete)
- [x] IndexedDB storage with async operations
- [x] Basic editor with line-based operations
- [x] Markdown parser (headers, lists, code blocks, etc.)
- [x] Syntax highlighting renderer with overlay
- [x] Document model with auto-save (2s debounce)

### Phase 2: Feature Modules (Current)

**Folding (In Progress)**
- [x] Fold data structure and state management
- [x] Fold gutter with clickable icons
- [x] Smart region detection (headers, code blocks, lists)
- [x] Collapsed content properly hides (zero-height)
- [x] Toggle works repeatedly
- [ ] Nested folds support
- [ ] Fold persistence across sessions

**Other Phase 2 Features (Planned)**
- Search - Regex search with result navigation
- Rich Content - Images, interactive checkboxes, Mermaid diagrams
- Export/Import - With optional encryption
- Themes - Custom color schemes
- Code Previews - Sandboxed HTML preview

### Phase 3: Advanced Features (Future)
- Inline computation (spreadsheet-like formulas)
- Document restructuring (drag-and-drop sections)
- Kanban view (task board from checkboxes)
- GitHub sync (optional cloud backup)

---

## Testing

See `TESTING.md` for detailed test scenarios and expected behaviors.

### Quick Test Checklist
- [ ] Can type and see syntax highlighting
- [ ] Auto-save works (2 second delay)
- [ ] Fold icons appear on headers only
- [ ] Clicking fold icon collapses content
- [ ] Collapsed content takes no space
- [ ] Click again to expand
- [ ] Multiple toggle cycles work
- [ ] Sub-headers can be folded independently

### Performance Targets
- 60fps scrolling with 100K lines
- < 50ms parse time for 10K lines
- < 500ms initial load time

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + S | Save document |
| Cmd/Ctrl + N | New document |
| Cmd/Ctrl + . | Smart fold at cursor |
| Cmd/Ctrl + Shift + . | Unfold all |
| Cmd/Ctrl + Alt + . | Fold all |

---

## Troubleshooting

### Common Issues

**Fold icons not appearing:**
- Check console for parser errors
- Verify `renderFoldGutter()` is being called
- Ensure CSS for `.fold-gutter-icon` is loaded

**Clicking fold icon doesn't work:**
- Check z-index: gutter must be z-index: 10
- Verify `pointer-events: auto` on gutter
- Check console for JavaScript errors
- Ensure `attachFoldElementHandlers()` runs after render

**Collapsed content still takes space:**
- Verify `.fold-hidden-line` CSS has `height: 0`
- Check overlay uses flexbox (`display: flex; flex-direction: column`)
- Ensure hidden lines use `<div class="overlay-line fold-hidden-line">`

**Sub-headers can't be folded:**
- Clear existing folds first (`foldManager.clear()`)
- Check for "Overlapping folds" in console
- Overlapping folds are prevented by design

### Debug Commands (Browser Console)

```javascript
// Access all modules
window.folded

// Clear all folds
window.folded.foldManager.clear()

// Force re-render
window.folded.renderer.render()

// Get all folds
window.folded.foldManager.getAllFolds()

// Get parsed lines
window.folded.parser.getParsedLines()
```

---

## Development Principles

1. **Build Small** - Smallest testable unit first
2. **Test Continuously** - Validate each change before moving on
3. **No Over-engineering** - Only build what's needed now
4. **Document Decisions** - Record architectural choices and why
5. **Keep It Simple** - Vanilla JS, no frameworks, minimal dependencies

---

## Git Workflow

- Branch naming: `feature/name`, `fix/name`, `claude/work-on-*`
- Commit messages: Use conventional commits
- Always test before committing
- Push regularly to avoid losing work
