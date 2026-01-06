# FoldingText Web - Claude Code Development Guide

This guide provides detailed prompting instructions for building FoldingText Web using Claude Code with parallel development instances.

## Quick Reference

| Phase | Instances | Duration | Strategy |
|-------|-----------|----------|----------|
| 1 | 1 (Serial) | 1-2 weeks | Core foundation |
| 2 | 6 (Parallel) | 2-4 weeks | Feature modules |
| 3 | 4 (Parallel) | 2-3 weeks | Advanced features |
| 4 | 2 (Parallel) | 1-2 weeks | Polish & testing |

---

## Phase 1: Serial Foundation (Single Instance)

### Context Setup

**Before starting, provide to Claude:**
```
I'm building FoldingText Web, a browser-based markdown editor with advanced folding capabilities.
Please read PLAN.md to understand the full feature set and architecture.

We're starting with Phase 1: Core Foundation. This phase builds the essential infrastructure
that all other features will depend on. Work on this sequentially, not in parallel.

Focus on: Basic editor, storage, parsing, and rendering infrastructure.
Files to create: index.html, js/main.js, js/modules/storage.js, js/modules/editor.js,
js/modules/parser.js, js/modules/renderer.js
```

### Week 1: Basic Architecture

**Initial Prompt:**
```
Phase 1, Week 1: Basic Architecture

Create the project foundation:

1. Set up project structure:
   - index.html with editor container
   - js/main.js for initialization
   - js/modules/ directory for all modules
   - css/ directory for styles
   - tests/ directory for unit tests

2. Implement IndexedDB storage wrapper (js/modules/storage.js):
   - Database initialization
   - Document CRUD operations
   - Settings storage
   - Transaction handling
   - Error recovery

3. Implement basic editor (js/modules/editor.js):
   - Textarea-based implementation
   - Line get/set/insert/delete methods
   - Cursor position tracking
   - Selection change events
   - Auto-save every 2 seconds

4. Implement document model (js/modules/document.js):
   - Document data structure
   - Create/load/save/delete operations
   - Document switching
   - Auto-save integration

Follow the specifications in PLAN.md sections 2-4.
Test each component as you build it.
```

**Success Criteria:**
- Can create and save documents to IndexedDB
- Textarea editor responds to input
- Auto-save triggers every 2 seconds
- No console errors

### Week 2: Parsing & Rendering

**Prompt:**
```
Phase 1, Week 2: Parsing & Rendering

Build the markdown parsing and rendering system:

1. Implement markdown parser (js/modules/parser.js):
   - Line-based tokenization
   - Detect headers (# through ######)
   - Detect lists (ordered, unordered, checkboxes)
   - Detect code blocks (``` fenced)
   - Detect blockquotes
   - Incremental parsing (re-parse only changed lines)
   - Build document structure tree

2. Implement renderer (js/modules/renderer.js):
   - Syntax highlighting overlay (div positioned over textarea)
   - Virtual scrolling for large documents
   - Line rendering with correct syntax classes
   - Scroll synchronization between textarea and overlay
   - Efficient re-rendering on edits

3. Integration:
   - Connect all modules: storage ← document ← editor → parser → renderer
   - Test end-to-end: type text → parse → highlight → save
   - Create module interface documentation
   - Fix any integration bugs

Reference PLAN.md sections 2.2 (Parsing), 3 (Folding structure), and 5.4 (Syntax highlighting).
```

**Success Criteria:**
- Markdown syntax is highlighted in real-time
- Can scroll smoothly through 10,000+ line document
- Parser correctly identifies all markdown elements
- Changes are saved and restored correctly

---

## Phase 2: Parallel Feature Tracks (6 Instances)

**Prerequisites:** Phase 1 must be complete and stable.

**General Setup for All Instances:**
```
We're now in Phase 2: Parallel Feature Development. The core foundation is complete.
You're working on Instance X: [FEATURE NAME].

IMPORTANT:
- Work ONLY on the files assigned to this instance
- Do NOT modify core files (editor.js, parser.js, renderer.js, storage.js, document.js)
- Use the documented interfaces from Phase 1
- Create your feature branch: git checkout -b feature/[feature-name]
- Write unit tests for your module
- Document any new interfaces you create

Core interfaces available to you:
- Editor: getLine(), setLine(), insertLine(), deleteLine(), getCursor(), setCursor()
- Parser: parse(document), getHeaderTree(), getHeaderPath()
- Storage: save(), load(), getSetting(), setSetting()
- Renderer: updateLine(), updateRange(), scrollToLine()
```

### Instance 1: Folding System

**Branch:** `feature/folding`
**Files:** `js/modules/folding.js`, `css/folding.css`, `tests/folding.test.js`

**Prompt:**
```
Instance 1: Folding System

Implement the core folding feature:

1. Fold Data Structure (js/modules/folding.js):
   class FoldManager {
     folds: Array<{startLine, endLine, collapsed, type}>
     createFold(startLine, endLine)
     toggleFold(lineNumber)
     getFoldsInRange(start, end)
     persistFolds()
     loadFolds()
   }

2. Fold UI Features:
   - Visual fold indicators (▼ expanded, ▶ collapsed)
   - Click to toggle fold
   - Selection-based folding (Cmd+.)
   - Smart fold detection (auto-detect foldable regions)
   - Navigate between folds (Alt+Up/Down)

3. Header Copy/Paste:
   - Cmd+Shift+C: Copy entire header with content
   - Cmd+Shift+X: Cut entire header
   - Cmd+Shift+V: Paste header structure
   - Smart boundary detection

4. Integration:
   - Listen to parser.getHeaderTree() for fold points
   - Update renderer to hide folded lines
   - Persist fold state to storage

Reference PLAN.md section 3 (Folding System).
Write comprehensive tests for fold creation, toggle, and persistence.
```

**Success Criteria:**
- Can fold/unfold any section
- Fold state persists across sessions
- Header copy/paste works correctly
- No conflicts with editor scrolling

### Instance 2: Search & Navigation

**Branch:** `feature/search`
**Files:** `js/modules/search.js`, `js/modules/navigation.js`, `css/search.css`, `tests/search.test.js`

**Prompt:**
```
Instance 2: Search & Navigation

Implement search and URL-based navigation:

1. Search Engine (js/modules/search.js):
   class SearchEngine {
     search(query, options)
     replace(query, replacement, scope)
     getScopeLines(scope)  // 'document', 'header', 'nested'
     highlightResults()
   }

2. Search UI:
   - Modal search dialog (Cmd+F)
   - Regex support with validation
   - Scope selector: Document / Current Header / Nested Headers
   - Replace mode (Cmd+H)
   - Result navigation (Enter/Shift+Enter)

3. URL Navigation (js/modules/navigation.js):
   - Directory-style header paths: #/budget/q1/expenses
   - Focus on header when URL hash changes
   - Update URL when user clicks header
   - Browser back/forward integration
   - Scroll to focused header

4. Integration:
   - Use parser.getHeaderPath() for navigation
   - Highlight search results in renderer
   - Update fold state when navigating to collapsed header

Reference PLAN.md section 4 (Search & Navigation).
```

**Success Criteria:**
- Regex search works across scopes
- URL navigation focuses correct header
- Browser back/forward works
- Search highlights visible in editor

### Instance 3: Rich Content

**Branch:** `feature/richcontent`
**Files:** `js/modules/richcontent.js`, `css/richcontent.css`, `tests/richcontent.test.js`

**Prompt:**
```
Instance 3: Rich Content

Implement image handling and rich content features:

1. Image Support (js/modules/richcontent.js):
   class RichContentManager {
     handleImageUpload(file)
     handleImagePaste(clipboardData)
     storeImage(imageData)  // Store in IndexedDB
     renderImage(lineNumber, imageUrl)
     attachResizeHandles(imageElement)
   }

2. Features:
   - Drag & drop images into editor
   - Paste images from clipboard
   - Resize images with corner handles
   - Store images as base64 in IndexedDB
   - Render images inline at correct line
   - Delete images when line is deleted

3. File Attachments:
   - Attach any file type
   - Store in IndexedDB (up to 100MB)
   - Download button for attachments
   - File type icons

4. Interactive Checkboxes:
   - Render - [ ] as clickable checkbox
   - Render - [x] as checked checkbox
   - Update markdown on click
   - Progress bars for parent tasks with subtasks

5. Mermaid Diagrams:
   - Detect ```mermaid code blocks
   - Load mermaid.js dynamically
   - Render diagram below code block
   - Toggle between source/rendered view

Reference PLAN.md section 6 (Rich Content).
```

**Success Criteria:**
- Can upload and resize images
- Images persist across sessions
- Checkboxes are clickable and update document
- Mermaid diagrams render correctly

### Instance 4: Export/Import

**Branch:** `feature/export`
**Files:** `js/modules/export.js`, `js/modules/import.js`, `js/workers/crypto.worker.js`, `tests/export.test.js`

**Prompt:**
```
Instance 4: Export/Import

Implement document export/import with encryption:

1. Export Manager (js/modules/export.js):
   class ExportManager {
     exportDocument(scope, options)
     generateFileName(headerPath)
     compressData(data)
     encryptData(data, password)
     includeAttachments(attachments)
     downloadFile(blob, filename)
   }

2. Export Features:
   - Scope options: Full document / Current header / Custom selection
   - Compression with gzip
   - Optional encryption (per-header or full document)
   - Include images/attachments
   - Generate .txt filename (discrete encryption)

3. Import Manager (js/modules/import.js):
   class ImportManager {
     detectImportMode(fileData)
     importBackup()       // Create new document
     importSync()         // Merge with existing via environment ID
     importInject()       // Insert at cursor/header
     validateEnvironmentId()
     decryptData(data, password)
   }

4. Import Modes:
   - Backup & Recover: Create new document
   - Sync: Detect previous import via environment ID, merge changes
   - Inject: Insert content at specified header location

5. Encryption:
   - Use Web Crypto API (crypto.worker.js for performance)
   - AES-256-GCM encryption
   - PBKDF2 key derivation
   - Silent failure on wrong password (security)

Reference PLAN.md sections 7.4-7.9 (Export/Import).
```

**Success Criteria:**
- Can export full document or header sections
- Encryption/decryption works correctly
- Import detects correct mode
- Attachments included in export
- Wrong password fails silently

### Instance 5: Themes & UI Polish

**Branch:** `feature/themes`
**Files:** `js/modules/themes.js`, `js/modules/keyboard.js`, `css/themes.css`, `tests/themes.test.js`

**Prompt:**
```
Instance 5: Themes & UI Polish

Implement theming system and polish UI:

1. Theme System (js/modules/themes.js):
   class ThemeManager {
     themes: Array<Theme>
     applyTheme(themeId)
     createCustomTheme()
     editTheme(themeId, properties)
     exportTheme()
     importTheme(themeData)
   }

2. Built-in Themes (6+ themes):
   - Dracula Dark
   - Solarized Dark
   - Solarized Light
   - One Dark
   - GitHub Light
   - Tokyo Night

3. Theme Editor UI:
   - Color picker for all theme variables
   - Live preview
   - Save custom themes
   - Export/import themes as JSON

4. Keyboard Shortcuts (js/modules/keyboard.js):
   - Centralized keyboard shortcut manager
   - Customizable shortcuts
   - Shortcut hint overlay (Cmd+?)
   - Conflict detection

5. Command Palette:
   - Fuzzy search for all commands
   - Recent commands
   - Keyboard shortcut hints

6. Settings Panel:
   - Theme selector
   - Font size/family
   - Line height
   - Auto-save interval
   - All feature toggles

Reference PLAN.md sections 5 (UI/UX), 6 (Keyboard Shortcuts), 8 (Themes).
```

**Success Criteria:**
- All built-in themes work correctly
- Can create and save custom theme
- Command palette finds all commands
- Settings persist across sessions

### Instance 6: Code Previews

**Branch:** `feature/codepreview`
**Files:** `js/modules/codepreview.js`, `css/codepreview.css`, `tests/codepreview.test.js`

**Prompt:**
```
Instance 6: Code Previews

Implement HTML code block previews:

1. Preview Manager (js/modules/codepreview.js):
   class CodePreviewManager {
     detectHtmlBlocks()
     createSandboxedIframe(htmlContent)
     renderPreview(lineNumber, htmlContent)
     attachResizeHandles(previewElement)
     captureConsoleLogs()
   }

2. Features:
   - Detect ```html code blocks
   - Render in sandboxed iframe
   - Resize preview window
   - Toggle between source/preview
   - Console output capture
   - Error display

3. Security:
   - Sandboxed iframe (sandbox="allow-scripts")
   - CSP headers
   - No access to parent page

4. Preview Window Management:
   - Multiple previews in same document
   - Minimize/maximize previews
   - Side-by-side preview mode
   - Auto-refresh on code changes

Reference PLAN.md section 6.6 (Code Previews).
```

**Success Criteria:**
- HTML previews render correctly
- Previews are sandboxed and secure
- Can resize preview windows
- Console logs visible in preview

---

## Phase 3: Advanced Features (4 Instances)

**Prerequisites:** Phase 2 complete, all features integrated and tested.

### Instance 7: Inline Computation

**Branch:** `feature/compute`
**Files:** `js/modules/compute.js`, `tests/compute.test.js`

**Prompt:**
```
Instance 7: Inline Computation

Implement variable computation system:

1. Computation Engine (js/modules/compute.js):
   class ComputationEngine {
     parseDocument()
     extractVariables(scope)
     resolveVariable(scope, varName)
     evaluateExpression(expr, scope)
     evaluateInline(expr, scope)
     updateDisplay(lineNumber, result)
     trackDependencies()
     triggerReactiveUpdates()
   }

2. Variable Syntax:
   - $variable = expression  → result
   - ${ expression }  → result (inline, no variable name)
   - Header-scoped variables (inherit from parent headers)

3. Features:
   - Safe expression evaluation (sandboxed)
   - Dependency tracking (topological sort)
   - Reactive updates (changing $x updates all dependent variables)
   - Support for: math, dates, strings, arrays
   - Display results with → symbol

4. Scope Resolution:
   - Variables defined in parent headers are accessible
   - Child variables override parent variables
   - /path/to/header/var for explicit scope reference

Reference PLAN.md section 9 (Inline Variable Computation).
```

**Success Criteria:**
- Variables compute correctly
- Scoped variables inherit from parents
- Changes trigger reactive updates
- ${} inline expressions work

### Instance 8: Document Restructuring

**Branch:** `feature/restructure`
**Files:** `js/modules/restructure.js`, `css/restructure.css`, `tests/restructure.test.js`

**Prompt:**
```
Instance 8: Document Restructuring

Implement visual restructuring mode:

1. Restructure Manager (js/modules/restructure.js):
   class RestructureManager {
     enterRestructureMode()
     buildTreeView()
     enableDragDrop()
     moveHeader(fromPath, toPath)
     applyChanges()
     exitRestructureMode()
   }

2. Tree View:
   - Hierarchical display of all headers
   - Expandable/collapsible sections
   - Indent levels match header levels
   - Visual drag handles

3. Drag & Drop:
   - Drag headers to reorder
   - Drag to change hierarchy (indent/outdent)
   - Visual drop zones
   - Preview of new structure

4. Keyboard Shortcuts:
   - Alt+Up/Down: Move header up/down
   - Alt+Left/Right: Change indent level
   - Enter: Edit header text inline
   - Esc: Cancel and exit

5. Auto-Organize:
   - Sort alphabetically
   - Sort by date (if headers contain dates)
   - Group by tag
   - Sort by length

Reference PLAN.md section 10 (Document Restructuring).
```

**Success Criteria:**
- Tree view shows correct hierarchy
- Drag & drop updates document correctly
- Keyboard shortcuts work
- Changes apply correctly to markdown

### Instance 9: Kanban View

**Branch:** `feature/kanban`
**Files:** `js/modules/kanban.js`, `css/kanban.css`, `tests/kanban.test.js`

**Prompt:**
```
Instance 9: Kanban View

Implement Kanban board visualization:

1. Kanban Manager (js/modules/kanban.js):
   class KanbanView {
     parseTasksFromDocument()
     buildKanbanBoard()
     organizeColumns()
     renderBoard()
     enableDragDrop()
     syncChangesToMarkdown()
     configureColumns()
   }

2. Task Parser:
   - Extract all checkbox items (- [ ] / - [x])
   - Parse tags: #todo, #in-progress, #done
   - Parse assignees: @username
   - Parse due dates: 📅 2026-01-15
   - Track subtasks and calculate progress

3. Kanban Board:
   - Configurable columns (default: Todo / In Progress / Done)
   - Column configuration UI (add/edit/remove columns)
   - Tag-based column assignment
   - Checked/unchecked state matching
   - Drag tasks between columns
   - Task cards show: content, progress, assignees, due dates

4. Sync Behavior:
   - Moving task updates tag in markdown
   - Checking task moves to "Done" column
   - Changes in markdown reflect in Kanban view
   - Auto-save on every change

Reference PLAN.md section 11 (Kanban Board View) and 11.7 (Column Configuration).
```

**Success Criteria:**
- Kanban board shows all tasks correctly
- Drag & drop updates markdown
- Column configuration works
- Progress bars accurate for parent tasks

### Instance 10: GitHub Auto-Sync

**Branch:** `feature/github`
**Files:** `js/modules/github-sync.js`, `tests/github-sync.test.js`

**Prompt:**
```
Instance 10: GitHub Auto-Sync

Implement automatic GitHub synchronization:

1. GitHub Sync Manager (js/modules/github-sync.js):
   class GitHubSync {
     configure(token, repo, branch, interval)
     startAutoSync()
     stopAutoSync()
     syncNow()
     detectConflicts()
     resolveConflicts()
     updateStatusBar()
   }

2. Features:
   - Auto-export every N seconds (user configurable, default 60)
   - Push to GitHub repository via API
   - Detect remote changes and pull
   - Conflict resolution (last-write-wins or manual)
   - Status bar indicator (syncing, synced, error)

3. Configuration UI:
   - GitHub token input
   - Repository selector
   - Branch selector
   - Sync interval (free text input for seconds)
   - File path in repo

4. Sync Behavior:
   - Only sync when changes detected
   - Export as .txt file (discrete)
   - Commit with descriptive message
   - Pull before push
   - Handle rate limits

Reference PLAN.md section 11.4 (GitHub Auto-Sync).
```

**Success Criteria:**
- Syncs to GitHub automatically
- Interval is configurable
- Conflicts detected and resolved
- Status bar shows sync state

---

## Phase 4: Polish & Integration (2 Instances)

### Instance 11: Scrappy (Stale Header Detection)

**Branch:** `feature/scrappy`
**Files:** `js/modules/scrappy.js`, `css/scrappy.css`, `tests/scrappy.test.js`

**Prompt:**
```
Instance 11: Scrappy - Stale Header Detection

Implement AI-powered content cleanup assistant:

1. Scrappy Manager (js/modules/scrappy.js):
   class Scrappy {
     analyzeHeaders()
     calculateStaleness(header)
     generatePreview(header)
     suggestDeletion()
     archiveHeaders(headers)
     deleteHeaders(headers)
   }

2. Staleness Algorithm:
   - Track: last edited date, last viewed date, header age
   - Score based on: time since edit, time since view, content patterns
   - Detect abandoned TODOs
   - Identify completed project sections

3. Scrappy UI:
   - Modal showing stale headers
   - Preview: first 8 lines and last 8 lines
   - Bulk selection checkboxes
   - Archive vs Delete options
   - Configurable staleness threshold

4. Header Metadata:
   - Store in IndexedDB: created, lastEdited, lastViewed
   - Update on header view/edit
   - Manual "keep forever" override

Reference PLAN.md section 12 (Scrappy).
```

**Success Criteria:**
- Correctly identifies stale headers
- Preview shows relevant content
- Archive moves to #Archive header
- Manual overrides work

### Instance 12: Performance & Testing (Main Developer)

**Branch:** `main`
**Files:** All modules, `tests/e2e/`, performance profiling

**Prompt:**
```
Instance 12: Performance Optimization & Integration Testing

Final polish and performance optimization:

1. Performance Optimizations:
   - Profile with Chrome DevTools
   - Optimize virtual scrolling for 100K+ lines
   - Selection-aware rendering (don't despawn selected lines)
   - Debounce expensive operations
   - Use Web Workers for heavy computation
   - Optimize IndexedDB queries

2. Cross-Browser Testing:
   - Test in Chrome, Firefox, Safari, Edge
   - Fix browser-specific issues
   - Test on mobile browsers

3. E2E Integration Tests:
   - Full document workflow (create → edit → save → load)
   - Test all features working together
   - Performance benchmarks
   - Memory leak detection

4. Mobile Responsiveness:
   - Touch-friendly UI
   - Mobile keyboard handling
   - Responsive layout for small screens

5. CI/CD Integration:
   - Set up browser automation tests with Claude Code Chrome plugin
   - Run tests on every PR
   - Performance regression detection

Reference PLAN.md sections 12 (Performance Optimizations) and 13 (Testing Strategy).
```

**Success Criteria:**
- 60fps scrolling with 100K lines
- All tests pass
- No memory leaks
- Works on mobile devices

---

## Integration Workflow

### Daily Coordination

**Shared Document (coordination.md):**
```markdown
# Daily Standup - [Date]

## Instance 1: Folding
- Completed: Fold creation and toggle
- In Progress: Header copy/paste
- Blocked: None
- Interface Changes: Added FoldManager.getFoldsInRange()

## Instance 2: Search
- Completed: Regex search engine
- In Progress: Search UI modal
- Blocked: Waiting for renderer highlight API
- Interface Changes: None

[... etc for all instances ...]

## Integration Issues
- Issue: Folding and search both modify line visibility
- Resolution: Folding takes precedence, search skips hidden lines

## Shared File Conflicts
- None this week
```

### Pull Request Process

**PR Template:**
```markdown
## Feature: [Feature Name]
Instance: #X
Branch: feature/[name]

### Summary
Brief description of what this PR implements.

### Files Changed
- js/modules/[name].js - Core implementation
- css/[name].css - Styles
- tests/[name].test.js - Unit tests

### Interface Changes
Document any new methods added to shared interfaces.

### Testing
- [ ] All unit tests pass
- [ ] Manual testing completed
- [ ] No conflicts with other features
- [ ] Performance impact measured

### Integration Notes
Any special considerations for integration.

### Screenshots/Demo
If applicable, show the feature in action.
```

### Merge Strategy

1. **Week 1-2**: Each instance develops independently on feature branch
2. **Week 3**: Integration week - merge one feature at a time
3. **Week 4**: Bug fixes and polish

**Merge Order (to minimize conflicts):**
1. Themes (changes CSS)
2. Folding (changes renderer)
3. Search (uses folding)
4. Rich Content (uses renderer)
5. Export/Import (uses storage)
6. Code Previews (independent)

---

## Common Patterns

### Module Template

```javascript
// js/modules/[feature].js

class FeatureManager {
  constructor(editor, parser, storage) {
    this.editor = editor
    this.parser = parser
    this.storage = storage

    this.initialize()
  }

  async initialize() {
    // Load settings, set up event listeners
    await this.loadSettings()
    this.setupEventListeners()
  }

  async loadSettings() {
    this.settings = await this.storage.getSetting('[feature]_settings') || this.getDefaultSettings()
  }

  getDefaultSettings() {
    return {
      // default configuration
    }
  }

  setupEventListeners() {
    // Register keyboard shortcuts, editor events, etc.
  }

  // Public API methods

  // Private helper methods
}

export default FeatureManager
```

### Test Template

```javascript
// tests/[feature].test.js

import FeatureManager from '../js/modules/[feature].js'

describe('FeatureManager', () => {
  let feature
  let mockEditor
  let mockParser
  let mockStorage

  beforeEach(() => {
    mockEditor = {
      getLine: jest.fn(),
      setLine: jest.fn()
    }
    mockParser = {
      parse: jest.fn()
    }
    mockStorage = {
      getSetting: jest.fn(),
      setSetting: jest.fn()
    }

    feature = new FeatureManager(mockEditor, mockParser, mockStorage)
  })

  test('should initialize with default settings', async () => {
    await feature.initialize()
    expect(feature.settings).toBeDefined()
  })

  test('should [specific functionality]', () => {
    // Test specific feature behavior
  })
})
```

---

## Troubleshooting

### Common Issues

**Issue: Module can't access core interfaces**
```
Solution: Ensure core modules (editor, parser, etc.) are passed to constructor.
Check that Phase 1 is complete and interfaces are documented.
```

**Issue: Features conflict (e.g., folding + search)**
```
Solution: Coordinate in daily standup. Define priority order.
Example: Folding hides lines, search should skip hidden lines.
```

**Issue: Performance degradation**
```
Solution: Profile with Chrome DevTools. Check for:
- N^2 algorithms
- Unnecessary re-renders
- Memory leaks (detached DOM nodes)
- Large IndexedDB transactions
```

**Issue: Tests failing after integration**
```
Solution:
1. Run tests in isolation first
2. Check for shared state between tests
3. Mock all external dependencies
4. Use beforeEach to reset state
```

---

## Success Metrics

### Phase 1 Complete When:
- [ ] Can type and see syntax highlighting
- [ ] Documents save and load from IndexedDB
- [ ] Virtual scrolling works with 10K+ lines
- [ ] No console errors
- [ ] All Phase 1 tests pass

### Phase 2 Complete When:
- [ ] All 6 features work independently
- [ ] All feature branches merged to main
- [ ] Integration tests pass
- [ ] No feature conflicts
- [ ] All Phase 2 tests pass

### Phase 3 Complete When:
- [ ] All 4 advanced features work
- [ ] Features integrate with existing codebase
- [ ] All Phase 3 tests pass
- [ ] Performance benchmarks met

### Phase 4 Complete When:
- [ ] Scrappy correctly identifies stale content
- [ ] Performance: 60fps scroll, <500ms load
- [ ] All browsers supported
- [ ] Mobile works well
- [ ] E2E tests pass
- [ ] Production ready

---

## Emergency Contacts

**If you get stuck:**
1. Check PLAN.md for detailed specifications
2. Review module interface documentation
3. Check coordination.md for known issues
4. Ask in daily standup

**Critical Issues:**
- Database corruption: Use backup/restore from export
- Performance crisis: Profile and optimize critical path
- Feature conflict: Coordinate priority in standup
- Merge conflict: Resolve manually, test thoroughly

---

## Final Checklist

Before considering FoldingText complete:

### Core Features
- [ ] Create/edit/save documents
- [ ] Fold/unfold any section
- [ ] Syntax highlighting works
- [ ] Search with regex and scopes
- [ ] URL-based navigation
- [ ] Export/import with encryption
- [ ] Rich content (images, attachments)
- [ ] Custom themes
- [ ] Command palette
- [ ] Keyboard shortcuts

### Advanced Features
- [ ] Inline computation with variables
- [ ] Document restructuring
- [ ] Kanban board view
- [ ] GitHub auto-sync
- [ ] Scrappy stale detection
- [ ] Code previews
- [ ] Split view (multi-pane)
- [ ] Mermaid diagrams

### Performance
- [ ] Handle 100K+ lines smoothly
- [ ] 60fps scrolling
- [ ] <16ms typing latency
- [ ] <500ms load time

### Quality
- [ ] All tests pass
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works in all browsers
- [ ] Mobile responsive
- [ ] Accessible (ARIA labels)

### Documentation
- [ ] README with features
- [ ] User guide
- [ ] Developer docs
- [ ] API documentation
- [ ] Keyboard shortcuts reference

---

## Appendix: Quick Command Reference

### Git Workflow
```bash
# Start new feature
git checkout -b feature/[name]

# Daily commits
git add .
git commit -m "feat([name]): description"

# Push to remote
git push -u origin feature/[name]

# Create PR
gh pr create --title "Feature: [Name]" --body "..."

# Update from main
git fetch origin main
git rebase origin/main
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/[feature].test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Development Server
```bash
# Local development
npx http-server . -p 8080

# Open browser
open http://localhost:8080
```

### Chrome DevTools Profiling
```
1. Open DevTools (F12)
2. Performance tab
3. Record while scrolling/typing
4. Analyze flame graph
5. Look for long tasks (>16ms)
```

---

**Good luck building FoldingText! Remember: Start with Phase 1, get it perfect, then parallelize in Phase 2.**
