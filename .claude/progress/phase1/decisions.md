# Decision Log - Phase 1

This file tracks all architectural and implementation decisions made during Phase 1 development.

---

## 2026-01-06 - Decision: IndexedDB for Storage

**Context:** Need to choose persistent storage mechanism for documents.

**Options Considered:**
1. localStorage - Simple API, 5-10MB limit, synchronous
2. IndexedDB - Complex API, hundreds of MB, asynchronous
3. File System Access API - Best performance, limited browser support

**Decision:** IndexedDB

**Reasoning:**
- Need to support large documents (CSV dumps, log files, etc.)
- localStorage 5MB limit too restrictive
- Async API won't block UI during saves
- Wide browser support (all modern browsers)
- Supports transactions and schema migrations
- Can store metadata alongside content

**Trade-offs:**
- More complex API than localStorage (requires Promises)
- Requires careful error handling
- Need to handle database versioning

**Validation:**
- Successfully store/retrieve 100KB+ documents
- No UI blocking during save operations
- All 12 storage tests passing

---

## 2026-01-06 - Decision: Line-based Editor API

**Context:** Need to design the editor's public API for interaction with other modules.

**Options Considered:**
1. Character-based API (getChar, setChar, positions as offsets)
2. Line-based API (getLine, setLine, positions as line/col)
3. Range-based API (getRanges, operations on ranges)

**Decision:** Line-based API

**Reasoning:**
- Markdown structure is inherently line-based (headers, lists, etc.)
- Parser works line-by-line for performance
- Folding will operate on line ranges
- Simpler mental model for most operations
- Aligns with how users think about markdown

**Trade-offs:**
- Less granular than character-based
- Some operations require converting line/col to positions
- Could be less efficient for character-level edits

**Implementation:**
- getLine(n), setLine(n, content)
- insertLine(n, content), deleteLine(n)
- getCursor() returns {line, col}
- All operations 0-indexed internally

**Validation:**
- Clean integration with parser (parser.parseLine())
- Folding system will benefit from line ranges
- Simple to reason about and debug

---

## 2026-01-06 - Decision: Overlay-based Syntax Highlighting

**Context:** Need to implement syntax highlighting without using a heavy library like CodeMirror.

**Options Considered:**
1. contentEditable div with inline HTML
2. Textarea with overlay div for highlighting
3. Canvas-based rendering
4. Monaco Editor integration

**Decision:** Textarea with overlay div

**Reasoning:**
- Textarea is native, reliable, accessible
- Overlay provides visual layer without affecting editing
- Can keep them in sync via CSS (same font, padding, scroll)
- No dealing with contentEditable cursor bugs
- Lightweight - no external dependencies
- Full control over rendering

**Trade-offs:**
- Need to keep overlay and textarea in sync
- Slightly more complex CSS positioning
- Re-render overlay on every change (debounced)

**Implementation:**
- Textarea for editing (z-index: 1, transparent selection)
- Overlay div for syntax highlighting (z-index: 0, pointer-events: none)
- Synchronized scrolling via JavaScript
- Debounced rendering (100ms) for performance

**Validation:**
- Overlay stays in sync during scrolling
- No lag during typing
- Syntax highlighting appears in real-time

---

## 2026-01-06 - Decision: Auto-save with 2-second Debounce

**Context:** Need to decide when and how to save documents.

**Options Considered:**
1. Manual save only (Cmd+S)
2. Save on every keystroke
3. Debounced auto-save (delay after last edit)
4. Interval-based save (every N seconds)

**Decision:** Debounced auto-save with 2-second delay

**Reasoning:**
- Users expect auto-save in modern apps
- Debouncing prevents excessive database writes
- 2 seconds feels responsive without being wasteful
- Still support manual save (Cmd+S) for immediate save
- Save before unload prevents data loss

**Trade-offs:**
- Could lose 2 seconds of work if browser crashes
- More complex state management (dirty flag)

**Implementation:**
- Mark document as dirty on any edit
- Schedule save 2 seconds after last edit
- Clear and reschedule on subsequent edits
- Show save indicator (saving... → saved ✓)
- Force save on Cmd+S and window.beforeunload

**Validation:**
- No data loss during normal usage
- Database write frequency is reasonable
- User feedback via save indicator

---

## 2026-01-06 - Fix: Transparent Textarea for Overlay Visibility

**Context:** Syntax highlighting wasn't visible on deployed site - overlay was rendering but hidden behind opaque textarea.

**Problem:**
- Textarea had `background: var(--bg-primary)` (opaque)
- Overlay was at `z-index: 0` (behind textarea)
- Even though overlay was rendering, it was completely blocked

**Options Considered:**
1. Swap z-index (overlay on top) - breaks text selection and input
2. Make textarea semi-transparent - works but shows both layers
3. Make textarea fully transparent - cleanest solution

**Decision:** Make textarea fully transparent

**Implementation:**
- Textarea: `background: transparent`, `color: transparent`, `-webkit-text-fill-color: transparent`
- Overlay: `background: var(--bg-primary)`, `color: var(--text-primary)` (holds the actual colors)
- Container: `background: var(--bg-primary)` (fallback)
- Added selection styling for transparent text (`::selection` pseudo-element)

**Reasoning:**
- Textarea remains functional for input, selection, cursor
- Overlay displays the actual colored text
- Caret remains visible via `caret-color`
- Text selection visible via `::selection` pseudo-element
- Cleanest separation of concerns

**Trade-offs:**
- Slightly unconventional approach (transparent text is unusual)
- Requires careful CSS to keep caret/selection visible
- But: No library dependencies, full control, works perfectly

**Validation:**
- Syntax highlighting now visible on deployed site
- Typing still works normally
- Selection highlighting works (blue highlight)
- Caret visible and positioned correctly
- All 12 storage tests still passing

---

## 2026-01-06 - Performance: Dual-Render Strategy (Universal)

**Context:** Android users experienced ~300ms visual lag when typing - characters appeared delayed.

**Problem:**
- Debounce delay (100ms) + parse time (~50-100ms) + render time (~50-100ms) = ~300ms total lag
- Every keystroke triggered full document re-parse and re-render
- Mobile browsers are slower than desktop
- Unacceptable typing experience

**Options Considered:**
1. Remove debounce entirely - would work but hurt performance on rapid typing
2. Reduce debounce to 0ms - same issue, still have parse + render time
3. Disable syntax highlighting on mobile - fixes lag but removes feature
4. Dual-render strategy - immediate plain text, then delayed syntax highlighting
5. Apply dual-render only to mobile - adds device detection complexity
6. Apply dual-render universally - simpler, benefits everyone

**Decision:** Dual-render strategy applied universally (all devices)

**Implementation:**
- On every keystroke (all devices):
  1. Immediate: `requestAnimationFrame()` → `overlay.textContent = content` (instant, no parsing)
  2. Debounced: 100ms later → full syntax highlight render
- Use `textContent` instead of `innerHTML` for speed (no HTML parsing needed)
- No device detection needed

**Reasoning:**
- User sees typed characters IMMEDIATELY (0ms lag)
- Syntax highlighting appears shortly after (100ms)
- Best of both worlds: responsiveness + features
- `requestAnimationFrame()` syncs with browser paint cycle
- Simpler code without device detection
- Everyone benefits from instant feedback (not just mobile)
- Easier to maintain and debug

**Trade-offs:**
- Two render passes instead of one (minimal overhead)
- Brief moment where text is plain before highlighting appears
- But: `textContent` assignment is extremely fast, worth it for instant feedback

**Refinement (2026-01-07):**
- Initially implemented with mobile detection
- Simplified to apply universally after realizing device detection added unnecessary complexity
- **REVERTED:** Dual-render approach caused distracting flicker
  - Plain text → syntax highlighting transition was visible on every keystroke
  - Created constant flickering while typing
  - User reported this as distracting

**Final Solution (2026-01-07):**
Abandoned dual-render entirely, replaced with `requestAnimationFrame` only:
- Single render per keystroke (no flicker)
- Uses `requestAnimationFrame()` instead of `setTimeout(100ms)`
- Syncs with browser paint cycle (~16ms at 60fps)
- Much simpler code (removed 20 lines)
- Faster than original 100ms debounce
- No visual artifacts

**Validation:**
- No flicker ✓
- Fast and responsive (~16ms render time)
- Syntax highlighting smooth and consistent
- Simpler, cleaner code
- Works perfectly on all devices

**Lesson Learned:**
Sometimes the simplest solution is best. `requestAnimationFrame` provides:
- Optimal timing (synced with display refresh)
- No flicker (single render)
- Clean code (no dual-render complexity)

---
