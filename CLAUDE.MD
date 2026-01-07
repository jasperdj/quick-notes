# folded - Development Guide for Claude Code

> **Project**: folded - A browser-based markdown editor with advanced folding capabilities
> **Architecture**: Vanilla JavaScript, serverless, client-side only
> **Development Approach**: Incremental, parallel where possible, with continuous validation

---

## 🎯 Project Context

**What is folded?**
A powerful, minimalist markdown editor that runs entirely in your browser. Think of it as a combination of:
- Obsidian's flexibility
- FoldingText's folding power
- Notion's rich content support
- VSCode's performance with large files

**Core Philosophy:**
1. **Simplicity first** - Clean, distraction-free interface
2. **Performance matters** - Handle 100K+ lines smoothly
3. **Privacy by default** - All data stays client-side (optional GitHub sync)
4. **Power when needed** - Advanced features don't get in the way

**Key Differentiator:** Fold content at ANY point, not just headers. This makes it perfect for managing large documents, CSV dumps, and complex nested structures.

---

## 🚦 How to Use This Guide

### Universal Prompt

For **ALL** development work on folded, use this simple prompt:

```
Work on folded.
```

That's it! Claude will automatically:
1. Read this guide (CLAUDE.MD)
2. Check `.claude/progress/active-instances.md` to see what's available
3. Choose an appropriate phase/feature to work on
4. Register itself as the active instance
5. Continue development from where we left off

### On Every Startup: Instance Coordination

**CRITICAL: Before starting any work, follow this sequence:**

```markdown
[ ] 1. Read `.claude/progress/active-instances.md`
       - Check which features are currently active (Last Update < 60 min)
       - Identify stale instances (Last Update > 60 min ago) - these can be taken over
       - Identify available features (not currently being worked on)

[ ] 2. Choose what to work on based on priority:
       - If Phase 1 is incomplete → Work on Phase 1 (single-instance, no conflicts)
       - If Phase 1 is complete → Choose from available Phase 2 features
       - If Phase 2 is complete → Choose from available Phase 3 features
       - If all phases complete → Report status and ask user for direction

[ ] 3. Register yourself in `active-instances.md`:
       - Add entry with your instance/session ID
       - Include start timestamp and "Last Update" timestamp
       - Mark status as "Active"

[ ] 4. During work: Update "Last Update" timestamp every 15-30 minutes
       - This tells other instances you're still working
       - Prevents conflicts with parallel instances

[ ] 5. When pausing or completing: Update your entry
       - If pausing: Change status to "Paused" and update timestamp
       - If completing: Remove your entry entirely OR mark as "Complete"
```

### Multi-Instance Coordination Rules

**Why this matters:**
- Phase 2 has **6 parallel features** (folding, search, richcontent, export, themes, codepreview)
- Phase 3 has **4 parallel features** (computation, restructure, kanban, github-sync)
- Multiple Claude instances can work simultaneously on **different** features
- The `active-instances.md` file prevents two instances from working on the **same** feature

**Key Rules:**
1. **One instance per feature** - Never work on a feature that's already "Active"
2. **Check timestamps** - Instances with Last Update > 60 min are considered stale/crashed
3. **Stale instances can be taken over** - If you find a stale instance, you can take it over
4. **Update regularly** - Keep your "Last Update" timestamp current (every 15-30 min)
5. **Clean up when done** - Remove your entry when pausing or completing work

### Example Instance Registration

When you start working on the "folding" feature in Phase 2, add this to `active-instances.md`:

```markdown
### Folding - Phase 2
- Instance ID: claude-session-abc123
- Started: 2026-01-06 10:30 AM
- Last Update: 2026-01-06 11:45 AM
- Status: Active
```

Update the "Last Update" field every 15-30 minutes while working. When done, remove this entry.

---

## 📋 Claude's Role & Development Principles

### Your Role

You are the **Implementation Engineer** for folded. Your responsibilities:

1. **Build incrementally** - Small, validated steps compound into robust features
2. **Document decisions** - Record why you chose specific approaches
3. **Track progress** - Keep detailed logs of what works and what doesn't
4. **Test continuously** - Validate after each significant change
5. **Preserve context** - Maintain state across sessions
6. **Communicate clearly** - Update progress files regularly

### Development Principles (Compounding Engineering)

**🔨 Build Small, Ship Often**
- Break every feature into the smallest testable unit
- Validate each piece before moving to the next
- Each completed piece compounds into the next

**📝 Document Everything**
- Every decision has a reason - write it down
- Every bug has a lesson - record it
- Every pattern has a purpose - explain it

**🔄 Iterate and Learn**
- First attempt won't be perfect - that's expected
- Learn from each iteration
- Apply learnings to next feature

**🎯 Validate Early, Validate Often**
- Test each function as you write it
- Run end-to-end tests after integration
- Performance test with realistic data

**🧭 Maintain Context**
- Sessions end, but progress persists
- Document where you are and where you're going
- Make it easy to resume

---

## 📊 Progress Tracking System

### Required Progress Files

You MUST maintain these files in `.claude/progress/`:

#### 1. `current-state.md` - Where you are right now

```markdown
# Current State - [Date]

## Active Phase
Phase X: [Name]

## Active Instance
Instance Y: [Feature Name]

## Current Task
[Specific task being worked on]

## Last Completed
- [x] Task 1
- [x] Task 2
- [x] Task 3

## Next Up
- [ ] Task 4
- [ ] Task 5

## Blockers
[Any issues preventing progress]

## Notes
[Relevant context for next session]
```

**Update this file:**
- At the start of each session (read it first!)
- After completing each significant task
- Before ending each session
- When encountering blockers

#### 2. `decisions.md` - Why you made specific choices

```markdown
# Decision Log

## [Date] - Decision: [Brief title]

**Context:** What problem were we solving?

**Options Considered:**
1. Option A - Pros/Cons
2. Option B - Pros/Cons
3. Option C - Pros/Cons

**Decision:** We chose [Option X]

**Reasoning:** Why we chose this approach

**Trade-offs:** What we're giving up

**Validation:** How we'll know if this was the right choice

---
```

**Add entries:**
- When choosing between architectural approaches
- When solving a non-trivial problem
- When making trade-offs (performance vs simplicity, etc.)
- When deviating from the plan

#### 3. `learnings.md` - What you discovered

```markdown
# Learnings & Insights

## [Date] - [Topic]

**What I Learned:**
[The insight or discovery]

**Context:**
[Where/how this came up]

**Applied To:**
[Where this knowledge was used]

**Future Application:**
[Where else this could be useful]

---
```

**Add entries:**
- When you discover a better pattern
- When you solve a tricky bug
- When you optimize something successfully
- When you find limitations of an approach

#### 4. `session-log.md` - Daily work summary

```markdown
# Session Log

## [Date] - Session [N]

**Duration:** [Start time] - [End time]

**Objectives:**
- [ ] Objective 1
- [ ] Objective 2

**Completed:**
- [x] Task 1 - [Brief description]
- [x] Task 2 - [Brief description]

**In Progress:**
- [ ] Task 3 - 60% complete

**Challenges:**
- Challenge 1 and how it was resolved
- Challenge 2 and current status

**Code Changes:**
- `file1.js` - Added feature X
- `file2.css` - Styled component Y

**Tests:**
- ✅ Unit tests: X passing
- ✅ Integration tests: Y passing
- ⚠️ Performance: Needs optimization (noted in backlog)

**Next Session:**
Continue with [specific task]

---
```

**Update:**
- At start of session (read previous entry!)
- At end of session (summary of work)

#### 5. `tests-results.md` - Validation tracking

```markdown
# Test Results

## [Date] - [Feature/Module]

### Unit Tests
- ✅ storage.js - All 12 tests passing
- ✅ editor.js - 8/8 tests passing
- ⚠️ parser.js - 7/8 tests passing (1 edge case failing)

### Integration Tests
- ✅ Create → Edit → Save flow
- ✅ Fold/unfold with large document
- ❌ Search in folded sections (bug found, logged)

### Performance Benchmarks
- ✅ 100K lines: Scroll at 58fps (target: 55fps)
- ✅ Load time: 380ms (target: 500ms)
- ⚠️ Parse time: 45ms (target: 30ms, needs optimization)

### Manual Testing
- ✅ Tested in Chrome 120
- ✅ Tested in Firefox 121
- [ ] Safari testing pending

### Bugs Found
1. Bug: Search doesn't work in folded sections
   - Severity: Medium
   - Logged in: issues.md
   - Status: Investigating

---
```

**Update:**
- After running tests
- After fixing bugs
- After performance optimizations

---

## 🚀 How to Start Each Session

### Session Startup Checklist

Every time you start working on folded, follow this sequence:

```markdown
[ ] 0. **FIRST: Check instance coordination** (see "How to Use This Guide" above)
       - Read `.claude/progress/active-instances.md`
       - Choose an available feature to work on
       - Register yourself in active-instances.md
       - This prevents conflicts with parallel instances!

[ ] 1. Read appropriate `current-state.md` for your feature
       - Phase 1: `.claude/progress/phase1/current-state.md`
       - Phase 2+: `.claude/progress/phase{N}/{feature}/current-state.md`
       - Understand where we left off
       - Check for blockers

[ ] 2. Read `session-log.md` for your feature (last 2-3 entries)
       - Understand recent work
       - See what patterns emerged

[ ] 3. Read `PLAN.md` section for current phase/feature
       - Refresh on the feature specs
       - Review success criteria

[ ] 4. Check `decisions.md` for your feature (recent entries)
       - Understand key architectural choices
       - Avoid revisiting settled decisions

[ ] 5. Update `current-state.md` with session objectives
       - What you plan to accomplish
       - Estimated completion

[ ] 6. Begin work
       - Start with smallest testable unit
       - Test as you go
       - Update progress files regularly
       - Update active-instances.md timestamp every 15-30 min
```

### Session Ending Checklist

```markdown
[ ] 1. Run all tests
       - Unit tests for modules you touched
       - Integration tests if you changed interfaces
       - Update tests-results.md

[ ] 2. Update `current-state.md` for your feature
       - Mark completed tasks
       - Note next steps
       - Document any blockers

[ ] 3. Update `session-log.md` for your feature
       - Summarize what was accomplished
       - Note challenges and solutions
       - Set objectives for next session

[ ] 4. Document decisions (if any)
       - Add to decisions.md for your feature
       - Include reasoning

[ ] 5. Update `.claude/progress/active-instances.md`
       - If pausing: Change status to "Paused" and update timestamp
       - If complete: Remove your entry OR mark as "Complete"
       - This frees up the feature for other instances!

[ ] 6. Update ARCHITECTURE.md (if architecture changed)
       - Update module responsibilities
       - Update data flow diagrams
       - Document new integrations
       - Reflect any architectural decisions

[ ] 7. Create TESTING.md or update it with:
       - Clear testing instructions for the feature you worked on
       - Expected behaviors and outcomes
       - Sample test data/scenarios
       - What success looks like
       - Known limitations or edge cases

[ ] 8. Commit your work
       - Clear, descriptive commit message
       - Reference progress files in commit body

[ ] 9. Push to branch
       - Ensure work is backed up
```

---

## 📖 Development Phases Overview

| Phase | Features | Duration | Strategy | Progress Folder |
|-------|----------|----------|----------|-----------------|
| 1 | 1 (Serial) | 1-2 weeks | Core foundation | `.claude/progress/phase1/` |
| 2 | 6 (Parallel) | 2-4 weeks | Feature modules | `.claude/progress/phase2/{feature}/` |
| 3 | 4 (Parallel) | 2-3 weeks | Advanced features | `.claude/progress/phase3/{feature}/` |
| 4 | 2 (Parallel) | 1-2 weeks | Polish & testing | `.claude/progress/phase4/` |

---

## Phase 1: Serial Foundation (Single Instance)

**Goal:** Build the core infrastructure that all features depend on.

**Progress File:** `.claude/progress/phase1.md`

### Before You Start

**Read these documents in order:**
1. `PLAN.md` - Sections 1-4 (Architecture, UI/UX, Folding, Search)
2. This guide - Understand the development principles
3. `.claude/progress/current-state.md` - See where we are

**Create initial progress file:**

```bash
mkdir -p .claude/progress
cat > .claude/progress/current-state.md << 'EOF'
# Current State

## Active Phase
Phase 1: Core Foundation

## Active Instance
Instance 1: Foundation (single instance)

## Current Task
Setting up project structure

## Last Completed
None (starting fresh)

## Next Up
- [ ] Create project structure
- [ ] Implement IndexedDB wrapper
- [ ] Build basic editor
- [ ] Create document model
- [ ] Implement parser
- [ ] Build renderer

## Blockers
None

## Notes
Starting Phase 1. Focus on getting basic editing + persistence working before adding features.
EOF
```

### Context Setup

**Provide this prompt to Claude:**

```
I'm building folded, a browser-based markdown editor with advanced folding capabilities.

PROJECT CONTEXT:
- Read PLAN.md for full feature specifications
- Read CLAUDE.MD for development guidelines and progress tracking requirements
- Read .claude/progress/current-state.md to see where we are

DEVELOPMENT PRINCIPLES:
1. Build incrementally - Test each piece before moving forward
2. Document decisions in .claude/progress/decisions.md
3. Update .claude/progress/current-state.md as you work
4. Track learnings in .claude/progress/learnings.md
5. Maintain session-log.md for continuity

CURRENT TASK:
Phase 1: Core Foundation

This phase builds the essential infrastructure:
- Basic editor (textarea-based)
- IndexedDB storage
- Document model
- Markdown parser
- Renderer with syntax highlighting

Work sequentially. Test each component thoroughly before integrating.

START BY:
1. Reading current-state.md
2. Creating project structure
3. Implementing storage layer first (tests before integration)

FILES TO CREATE:
- index.html
- js/main.js
- js/modules/storage.js
- js/modules/editor.js
- js/modules/parser.js
- js/modules/renderer.js
- js/modules/document.js

REMEMBER:
- Update progress files as you work
- Document architectural decisions
- Test continuously
- Keep it simple - no premature optimization
```

### Week 1: Basic Architecture

**Objective:** Get data persisting and basic editing working.

#### Day 1-2: Project Structure & Storage

**Task:** Set up the foundation

**Prompt:**
```
Phase 1, Week 1, Days 1-2: Project Setup & Storage Layer

OBJECTIVE: Create project structure and implement reliable data persistence.

TASKS:

1. Project Structure:
   - Create index.html with minimal editor UI
   - Set up js/modules/ directory
   - Create css/ directory with main.css
   - Set up tests/ directory
   - Initialize git (if not already done)

2. IndexedDB Storage (js/modules/storage.js):

   Implement class with methods:
   - initDB() - Create 'folded' database with 'documents' and 'settings' stores
   - saveDocument(id, content, metadata) - Store document
   - loadDocument(id) - Retrieve document
   - deleteDocument(id) - Remove document
   - listDocuments() - Get all document IDs
   - saveSetting(key, value) - Store setting
   - loadSetting(key) - Retrieve setting

   Requirements:
   - Use async/await throughout
   - Handle errors gracefully (log and return defaults)
   - Support transactions
   - Add migration support for future schema changes

3. Testing:
   - Write unit tests for each storage method
   - Test error conditions (database locked, storage full)
   - Test with large documents (100KB+)

4. Progress Tracking:
   - Update current-state.md after each major task
   - Document decision: Why IndexedDB over localStorage?
   - Log any challenges in session-log.md

VALIDATION:
- [ ] Can store and retrieve document
- [ ] Handles errors without crashing
- [ ] Tests pass (at least 10 tests)
- [ ] No console errors

REFERENCE: PLAN.md section 1.2 (File Structure), 1.3 (Data Model)

After completing, update current-state.md and commit with message:
"feat(storage): implement IndexedDB wrapper with CRUD operations"
```

**Expected Decision Log Entry:**

```markdown
## [Date] - Decision: IndexedDB vs localStorage

**Context:** Need to choose persistent storage mechanism for documents.

**Options Considered:**
1. localStorage - Simple API, 5-10MB limit, synchronous
2. IndexedDB - Complex API, hundreds of MB, asynchronous
3. File System Access API - Best performance, limited browser support

**Decision:** IndexedDB

**Reasoning:**
- Need to support large documents (CSV dumps, etc.)
- localStorage 5MB limit too restrictive
- Async API won't block UI during saves
- Wide browser support
- Supports transactions and migrations

**Trade-offs:**
- More complex API than localStorage
- Requires async/await throughout
- Need to handle database versioning

**Validation:**
- Successfully store/retrieve 100KB document
- No UI blocking during save
- Tests pass for error conditions
```

#### Day 3-4: Basic Editor

**Task:** Create the editor component

**Prompt:**
```
Phase 1, Week 1, Days 3-4: Basic Editor

OBJECTIVE: Build a functional text editor with line-based operations.

TASKS:

1. Editor Module (js/modules/editor.js):

   Implement class with methods:
   - initialize(container) - Set up textarea and event listeners
   - getLine(lineNumber) - Get specific line content
   - setLine(lineNumber, content) - Update line
   - insertLine(lineNumber, content) - Insert new line
   - deleteLine(lineNumber) - Remove line
   - getLines() - Get all lines as array
   - setLines(lines) - Replace all content
   - getCursor() - Get cursor position {line, col}
   - setCursor(line, col) - Set cursor position
   - getSelection() - Get selected text

   Event handling:
   - onInput() - Trigger on text change
   - onSelectionChange() - Trigger on cursor movement
   - onChange(callback) - Register change listener

2. Auto-save Integration:
   - Debounce saves (2 seconds after last edit)
   - Show save indicator (saving... → saved ✓)
   - Handle save failures gracefully

3. Testing:
   - Test all line operations
   - Test cursor positioning
   - Test selection handling
   - Test auto-save debouncing

4. Progress Tracking:
   - Update current-state.md
   - Document decisions about line-based API
   - Log performance observations

VALIDATION:
- [ ] Can type and see text appear
- [ ] Line operations work correctly
- [ ] Auto-save triggers after 2 seconds
- [ ] Cursor positioning accurate
- [ ] Tests pass (at least 15 tests)

REFERENCE: PLAN.md section 2.1 (Editor Component)

Remember: Keep it simple. No fancy features yet. Just reliable line-based editing.
```

**Expected Learning Entry:**

```markdown
## [Date] - Line-based API Design

**What I Learned:**
Using a line-based API (getLine, setLine) makes it much easier to integrate with the parser and folding system later. While character-based APIs are more flexible, line-based operations align with markdown structure.

**Context:**
While implementing the editor, I chose to expose line-based operations rather than character-based ones. This was validated when integrating with the parser (which operates on lines).

**Applied To:**
- Editor.js line operations
- Parser.js incremental parsing
- Renderer.js line-by-line highlighting

**Future Application:**
Folding will benefit from this - we can fold by line ranges. Variable computation can track which lines have variables. Search can operate line-by-line for better performance.
```

#### Day 5-7: Document Model & Integration

**Task:** Connect editor to storage with document abstraction

**Prompt:**
```
Phase 1, Week 1, Days 5-7: Document Model

OBJECTIVE: Create document abstraction and connect all pieces.

TASKS:

1. Document Module (js/modules/document.js):

   Implement class with methods:
   - create(name) - Create new document
   - load(id) - Load existing document
   - save() - Save current document
   - delete(id) - Delete document
   - getMetadata() - Get doc info (created, modified, etc.)
   - setContent(text) - Update content
   - getContent() - Get all text

   Auto-save integration:
   - Listen to editor changes
   - Debounce saves
   - Track dirty state
   - Handle conflicts

2. Main App (js/main.js):
   - Initialize storage
   - Create editor instance
   - Load last opened document OR create new
   - Set up auto-save
   - Handle page unload (save before exit)

3. Integration Testing:
   - Create → Edit → Save → Load cycle
   - Test with large document
   - Test rapid edits (debounce working?)
   - Test page refresh (data persists?)

4. Progress Tracking:
   - Update current-state.md (mark Week 1 complete!)
   - Document integration challenges
   - Update session-log.md with weekly summary

VALIDATION:
- [ ] Can create new document
- [ ] Can edit and see auto-save work
- [ ] Can refresh page and see document persist
- [ ] Can create multiple documents
- [ ] No data loss under any condition
- [ ] Tests pass (at least 20 total now)

REFERENCE: PLAN.md section 1.3 (Data Model)

After completing, you should be able to:
- Open the app
- Type some text
- See "Saving..." indicator
- Refresh the page
- See your text still there

This is your MVP foundation! Document it in session-log.md.
```

### Week 2: Parsing & Rendering

**Objective:** Add markdown parsing and syntax highlighting

#### Day 8-10: Markdown Parser

**Prompt:**
```
Phase 1, Week 2, Days 8-10: Markdown Parser

OBJECTIVE: Build incremental markdown parser for syntax highlighting and structure.

TASKS:

1. Parser Module (js/modules/parser.js):

   Implement class with methods:
   - parse(document) - Parse entire document
   - parseLine(line, lineNumber) - Parse single line
   - getHeaderTree() - Get hierarchical header structure
   - getHeaderPath(lineNumber) - Get path to header (e.g., "/Budget/Q1")
   - invalidateRange(start, end) - Mark lines for re-parse

   Detect:
   - Headers: # through ######
   - Lists: -, *, 1., a.
   - Checkboxes: - [ ] and - [x]
   - Code blocks: ``` fenced
   - Blockquotes: >
   - Bold: **text**
   - Italic: *text*
   - Code: `code`
   - Links: [text](url)

2. Incremental Parsing:
   - Only re-parse changed lines
   - Update header tree incrementally
   - Track dependencies (e.g., code block start affects later lines)

3. Performance:
   - Parse 10,000 lines in <50ms
   - Use caching where possible
   - Profile and optimize

4. Testing:
   - Test each markdown element type
   - Test header hierarchy building
   - Test incremental updates
   - Test edge cases (unclosed code blocks, etc.)

5. Progress Tracking:
   - Update current-state.md
   - Document parsing approach
   - Log performance metrics

VALIDATION:
- [ ] Correctly identifies all markdown elements
- [ ] Builds accurate header tree
- [ ] Incremental parsing works
- [ ] Performance target met (10K lines < 50ms)
- [ ] Tests pass (at least 30 tests now)

REFERENCE: PLAN.md section 2.2 (Markdown Parsing)

Key insight: Line-based parsing is fast. Don't try to be too clever.
Simple regex patterns are fine for markdown detection.
```

**Expected Performance Learning:**

```markdown
## [Date] - Parser Performance Optimization

**What I Learned:**
Simple regex patterns on individual lines is ~10x faster than trying to parse the entire document as one string. For 10,000 lines:
- String-based parsing: 450ms
- Line-based parsing: 42ms

**Context:**
Initially tried to parse document as single string. Performance was poor. Switched to line-by-line with incremental updates. Massive improvement.

**Applied To:**
- Parser.js uses line-based approach
- Only re-parses changed lines
- Caches results per line

**Future Application:**
Renderer should also work line-by-line. Virtual scrolling will benefit from this architecture.
```

#### Day 11-14: Renderer & Syntax Highlighting

**Prompt:**
```
Phase 1, Week 2, Days 11-14: Renderer & Syntax Highlighting

OBJECTIVE: Create renderer that highlights syntax without blocking the editor.

TASKS:

1. Renderer Module (js/modules/renderer.js):

   Implement class with methods:
   - initialize(editor, parser) - Set up overlay div
   - render() - Render all visible lines
   - updateLine(lineNumber) - Re-render single line
   - updateRange(start, end) - Re-render range
   - scrollToLine(lineNumber) - Scroll to specific line

   Virtual Scrolling:
   - Only render visible lines + buffer
   - Reuse DOM elements
   - Update on scroll
   - Sync with textarea scroll position

2. Syntax Highlighting:
   - Apply CSS classes based on parser tokens
   - Style headers, lists, code, bold, italic, etc.
   - Keep it subtle - not distracting

3. Overlay Synchronization:
   - Position overlay div exactly over textarea
   - Match font, line-height, padding
   - Keep scroll in sync
   - Handle window resize

4. Performance:
   - Maintain 60fps scrolling
   - Debounce expensive operations
   - Profile and optimize

5. Testing:
   - Test virtual scrolling with 100K lines
   - Test scroll synchronization
   - Test syntax highlighting accuracy
   - Measure FPS during scroll

6. Progress Tracking:
   - Update current-state.md (Phase 1 complete!)
   - Document rendering architecture
   - Log performance metrics in tests-results.md

VALIDATION:
- [ ] Syntax highlighting appears in real-time
- [ ] Can scroll smoothly through 100K lines
- [ ] FPS > 55 during scroll
- [ ] Overlay stays in sync with textarea
- [ ] Tests pass (at least 40 tests total)

REFERENCE: PLAN.md section 5.4 (Syntax Highlighting), 12.1 (Virtual Scrolling)

After this, you'll have a working markdown editor with:
- Persistence ✓
- Syntax highlighting ✓
- Performance ✓

Document this milestone in session-log.md!
```

### Phase 1 Completion Checklist

Before moving to Phase 2, verify:

```markdown
## Phase 1 Completion Checklist

### Functionality
- [ ] Can create new documents
- [ ] Can edit text smoothly
- [ ] Auto-save works (2 second debounce)
- [ ] Syntax highlighting appears in real-time
- [ ] Can handle 100K+ line documents
- [ ] Data persists across page refreshes

### Code Quality
- [ ] All modules tested (40+ tests passing)
- [ ] No console errors
- [ ] Code is clean and commented
- [ ] Interfaces documented

### Performance
- [ ] Scroll at 55+ fps with 100K lines
- [ ] Parse 10K lines in < 50ms
- [ ] Load time < 500ms
- [ ] No memory leaks

### Documentation
- [ ] current-state.md updated
- [ ] session-log.md has all sessions
- [ ] decisions.md has key choices
- [ ] learnings.md has insights
- [ ] tests-results.md has metrics

### Ready for Phase 2?
If all above are checked, create Phase 2 planning document:

`.claude/progress/phase2-planning.md` with:
- Which 6 instances to run in parallel
- Dependencies between instances
- Integration strategy
- Timeline estimate

Then update current-state.md:
```
## Active Phase
Phase 2: Parallel Feature Development

## Active Instance
Planning for 6 parallel instances

## Current Task
Creating phase2-instanceN.md files for coordination
```
```

---

## Phase 2: Parallel Feature Tracks (6 Instances)

**Goal:** Build independent feature modules on top of stable foundation.

**Prerequisites:** Phase 1 MUST be complete and stable.

### Multi-Instance Coordination

When running multiple Claude instances in parallel, coordination is critical.

#### Setup: Create Feature Folders

Before starting parallel work, create isolated progress folders for each feature:

```bash
# Create feature-specific progress folders
mkdir -p .claude/progress/phase2/{folding,search,richcontent,export,themes,codepreview}

# Create progress files for each feature
for feature in folding search richcontent export themes codepreview; do
  mkdir -p .claude/progress/phase2/$feature

  # current-state.md
  cat > .claude/progress/phase2/$feature/current-state.md << EOF
# Current State - $feature

## Status
Not Started

## Current Task
None

## Last Completed
[]

## Next Up
[]

## Blockers
[]

## Notes
[]
EOF

  # decisions.md
  cat > .claude/progress/phase2/$feature/decisions.md << EOF
# Decision Log - $feature

[Decisions specific to $feature feature will be recorded here]
EOF

  # learnings.md
  cat > .claude/progress/phase2/$feature/learnings.md << EOF
# Learnings & Insights - $feature

[Insights from building $feature will be captured here]
EOF

  # session-log.md
  cat > .claude/progress/phase2/$feature/session-log.md << EOF
# Session Log - $feature

[Daily work summaries for $feature]
EOF

  # tests-results.md
  cat > .claude/progress/phase2/$feature/tests-results.md << EOF
# Test Results - $feature

[Test results and validation tracking for $feature]
EOF
done

# Create shared coordination file
cat > .claude/progress/phase2/coordination.md << 'EOF'
# Phase 2 Coordination

## Daily Standup - [Date]

### Folding
- Status: [Not Started / In Progress / Blocked / Complete]
- Progress: [X%]
- Blockers: [None / List]
- Notes: []

### Search
- Status: [Not Started / In Progress / Blocked / Complete]
- Progress: [X%]
- Blockers: [None / List]
- Notes: []

### Rich Content
- Status: [Not Started / In Progress / Blocked / Complete]
- Progress: [X%]
- Blockers: [None / List]
- Notes: []

### Export/Import
- Status: [Not Started / In Progress / Blocked / Complete]
- Progress: [X%]
- Blockers: [None / List]
- Notes: []

### Themes
- Status: [Not Started / In Progress / Blocked / Complete]
- Progress: [X%]
- Blockers: [None / List]
- Notes: []

### Code Previews
- Status: [Not Started / In Progress / Blocked / Complete]
- Progress: [X%]
- Blockers: [None / List]
- Notes: []

## Integration Issues
[Any conflicts or coordination needed between features]

## Shared Interface Changes
[Any changes to core modules that affect multiple features]

## Next Steps
[What needs to happen to keep moving forward]
EOF
```

### General Setup for All Parallel Features

**Before ANY feature development starts:**

```
IMPORTANT: You are working on the [FEATURE] feature in a parallel development environment.

RULES:
1. Read .claude/progress/phase2/[feature]/current-state.md FIRST
2. Read .claude/progress/phase2/coordination.md for context
3. Work ONLY on files assigned to this feature
4. Do NOT modify core files (editor.js, parser.js, renderer.js, storage.js)
5. Update your feature's progress files after each significant task
6. Update coordination.md daily
7. Document any interface changes that affect other features

CORE INTERFACES (read-only for you):
- Editor: getLine(), setLine(), getCursor(), onChange()
- Parser: parse(), getHeaderTree(), getHeaderPath()
- Storage: saveDocument(), loadDocument(), saveSetting(), loadSetting()
- Renderer: updateLine(), scrollToLine()

YOUR FEATURE:
Feature: [feature-name]
Branch: feature/[feature-name]
Files: [List of files you own]
Progress Folder: .claude/progress/phase2/[feature-name]/

PROGRESS TRACKING:
- Update .claude/progress/phase2/[feature]/current-state.md continuously
- Document decisions in .claude/progress/phase2/[feature]/decisions.md
- Log learnings in .claude/progress/phase2/[feature]/learnings.md
- Keep session log in .claude/progress/phase2/[feature]/session-log.md
- Track tests in .claude/progress/phase2/[feature]/tests-results.md
- Update coordination.md daily with status

START BY:
1. Reading your feature's current-state.md
2. Reading coordination.md
3. Creating your feature branch
4. Setting up tests
5. Building smallest testable unit first
```

### Feature: Folding System

**Branch:** `feature/folding`
**Progress Folder:** `.claude/progress/phase2/folding/`
**Files:** `js/modules/folding.js`, `css/folding.css`, `tests/folding.test.js`

**Prompt:**
```
Feature: Folding System

CONTEXT:
You are building the CORE feature of folded - the ability to fold content at ANY point.
This is what differentiates us from other editors.

Read:
- PLAN.md section 3 (Folding System)
- .claude/progress/phase2/folding/current-state.md
- .claude/progress/phase2/coordination.md

YOUR RESPONSIBILITIES:

1. Fold Data Structure:
   - Track fold regions (startLine, endLine, collapsed state)
   - Persist fold state to IndexedDB
   - Load fold state on document load

2. Fold UI:
   - Visual indicators (▼ expanded, ▶ collapsed)
   - Click handlers to toggle
   - Keyboard shortcuts (Cmd+. to fold, Cmd+, to unfold)

3. Smart Folding:
   - Auto-detect foldable regions (headers, code blocks, lists)
   - Selection-based folding (fold whatever is selected)

4. Header Copy/Paste:
   - Cmd+Shift+C: Copy entire header with content
   - Cmd+Shift+X: Cut entire header
   - Cmd+Shift+V: Paste header structure
   - Smart boundary detection using parser

5. Integration:
   - Hook into renderer to hide folded lines
   - Update on document changes
   - Preserve folds during edits

DEVELOPMENT APPROACH:
Day 1: Data structure + persistence (test thoroughly)
Day 2: Basic fold/unfold (test with simple cases)
Day 3: UI indicators + click handling
Day 4: Smart fold detection
Day 5: Header copy/paste
Day 6-7: Integration + edge cases

VALIDATION:
- [ ] Can fold any selection
- [ ] Can fold headers automatically
- [ ] Folds persist across sessions
- [ ] Folded content is truly hidden
- [ ] Header copy/paste works
- [ ] No bugs with nested folds
- [ ] 20+ tests passing

UPDATE PROGRESS:
- Update .claude/progress/phase2/folding/current-state.md after each day
- Document fold persistence approach in .claude/progress/phase2/folding/decisions.md
- Log any clever patterns in .claude/progress/phase2/folding/learnings.md
- Update coordination.md daily

START: Create basic fold data structure and write tests for it.
```

### Feature: Search & Navigation

**Branch:** `feature/search`
**Progress Folder:** `.claude/progress/phase2/search/`
**Files:** `js/modules/search.js`, `js/modules/navigation.js`, `css/search.css`, `tests/search.test.js`

**Prompt:**
```
Feature: Search & Navigation

CONTEXT:
Build powerful search with regex support and URL-based navigation.

Read:
- PLAN.md section 4 (Search & Navigation)
- .claude/progress/phase2/search/current-state.md
- .claude/progress/phase2/coordination.md

YOUR RESPONSIBILITIES:

1. Search Engine:
   - Regex search across document
   - Scope control (entire doc / current header / nested)
   - Find and replace
   - Case sensitive/insensitive
   - Whole word matching

2. Search UI:
   - Modal search dialog (Cmd+F)
   - Replace mode (Cmd+H)
   - Result navigation (Enter/Shift+Enter)
   - Result count
   - Highlight all matches

3. URL Navigation:
   - Convert header paths to URLs (#/budget/q1)
   - Focus header when URL changes
   - Update URL when user clicks header
   - Browser back/forward support
   - Deep linking

4. Integration:
   - Use parser.getHeaderPath() for navigation
   - Coordinate with Instance 1 (skip folded content or not?)
   - Highlight matches in renderer

DEVELOPMENT APPROACH:
Day 1: Search engine (regex + scopes)
Day 2: Search UI modal
Day 3: Result highlighting + navigation
Day 4: Find & replace
Day 5: URL navigation system
Day 6-7: Integration + edge cases

VALIDATION:
- [ ] Regex search works
- [ ] Scope limiting works
- [ ] Find & replace works
- [ ] URL navigation works
- [ ] Browser back/forward works
- [ ] 20+ tests passing

COORDINATION:
With Folding feature: Decide whether search should:
- Skip folded content (my recommendation)
- OR search inside folds but keep them collapsed

Document this decision in coordination.md and your feature's decisions.md

UPDATE PROGRESS:
- Update .claude/progress/phase2/search/current-state.md daily
- Document search algorithm choices in .claude/progress/phase2/search/decisions.md
- Update coordination.md with dependencies

START: Build search engine with regex support and scope filtering.
```

### Feature: Rich Content

**Branch:** `feature/richcontent`
**Progress Folder:** `.claude/progress/phase2/richcontent/`
**Files:** `js/modules/richcontent.js`, `css/richcontent.css`, `tests/richcontent.test.js`

**Prompt:**
```
Feature: Rich Content

CONTEXT:
Add support for images, attachments, interactive checkboxes, and Mermaid diagrams.

Read:
- PLAN.md section 6 (Rich Content Support)
- .claude/progress/phase2/richcontent/current-state.md
- .claude/progress/phase2/coordination.md

YOUR RESPONSIBILITIES:

1. Image Handling:
   - Drag & drop images
   - Paste images from clipboard
   - Store as base64 in IndexedDB
   - Render inline at correct line
   - Resize handles (corner drag)
   - Delete when line deleted

2. File Attachments:
   - Attach any file type
   - Store in IndexedDB (up to 100MB)
   - Download button
   - File type icons

3. Interactive Checkboxes:
   - Render - [ ] as clickable checkbox
   - Click updates markdown
   - Progress bars for parent tasks
   - Auto-complete parent when all children done

4. Mermaid Diagrams:
   - Detect ```mermaid blocks
   - Load mermaid.js dynamically
   - Render diagram below code
   - Toggle source/rendered view
   - Export as SVG

5. Integration:
   - Hook into renderer for inline content
   - Use storage for images/attachments
   - Use parser to find code blocks

DEVELOPMENT APPROACH:
Day 1-2: Image upload + storage
Day 3: Image resize handles
Day 4: Interactive checkboxes
Day 5-6: Mermaid integration
Day 7: File attachments + testing

VALIDATION:
- [ ] Can upload and see images
- [ ] Images persist across sessions
- [ ] Resize handles work
- [ ] Checkboxes are clickable
- [ ] Mermaid diagrams render
- [ ] File attachments work
- [ ] 25+ tests passing

UPDATE PROGRESS:
- Update .claude/progress/phase2/richcontent/current-state.md after each feature
- Document image storage approach in .claude/progress/phase2/richcontent/decisions.md
- Log performance with large images in .claude/progress/phase2/richcontent/learnings.md

START: Image upload and storage first (it's the foundation for attachments).
```

### Feature: Export/Import

**Branch:** `feature/export`
**Progress Folder:** `.claude/progress/phase2/export/`
**Files:** `js/modules/export.js`, `js/modules/import.js`, `js/workers/crypto.worker.js`, `tests/export.test.js`

**Prompt:**
```
Feature: Export/Import & Encryption

CONTEXT:
Build robust export/import with encryption and three import modes.

Read:
- PLAN.md sections 7.4-7.9 (Export/Import)
- .claude/progress/phase2/export/current-state.md
- .claude/progress/phase2/coordination.md

YOUR RESPONSIBILITIES:

1. Export Manager:
   - Export full document or header scope
   - Compression (gzip)
   - Optional encryption (AES-256-GCM)
   - Include images/attachments
   - Generate .txt filename (discrete)

2. Import Manager:
   - Three modes:
     a) Backup & Recover (new document)
     b) Sync (merge via environment ID)
     c) Inject (insert at cursor/header)
   - Auto-detect mode
   - Handle encrypted imports
   - Validate data integrity

3. Encryption:
   - Web Crypto API
   - PBKDF2 key derivation
   - Per-header OR full document
   - Silent failure on wrong password (security)
   - Use Web Worker for performance

4. Environment ID:
   - Generate unique ID per environment
   - Use for sync detection
   - Prevent duplicate imports

DEVELOPMENT APPROACH:
Day 1-2: Export with compression
Day 3-4: Encryption (Web Crypto)
Day 5: Import modes
Day 6-7: Integration + security testing

VALIDATION:
- [ ] Export works (full doc + scoped)
- [ ] Compression reduces size
- [ ] Encryption works (can't read without password)
- [ ] Wrong password fails silently
- [ ] Import modes work correctly
- [ ] Images included in export
- [ ] 30+ tests passing

SECURITY NOTES:
- Never log passwords
- Never expose decrypted content on error
- Test with various password strengths
- Document security approach in decisions.md

UPDATE PROGRESS:
- Update .claude/progress/phase2/export/current-state.md after each security milestone
- Document encryption choices in .claude/progress/phase2/export/decisions.md
- Log security learnings in .claude/progress/phase2/export/learnings.md

START: Basic export (no encryption) with compression. Test thoroughly.
```

### Feature: Themes & UI Polish

**Branch:** `feature/themes`
**Progress Folder:** `.claude/progress/phase2/themes/`
**Files:** `js/modules/themes.js`, `js/modules/keyboard.js`, `css/themes.css`, `tests/themes.test.js`

**Prompt:**
```
Feature: Themes & UI Polish

CONTEXT:
Make folded beautiful with custom themes, keyboard shortcuts, and command palette.

Read:
- PLAN.md sections 5 (UI/UX), 6 (Keyboard), 8 (Themes)
- .claude/progress/phase2/themes/current-state.md
- .claude/progress/phase2/coordination.md

YOUR RESPONSIBILITIES:

1. Theme System:
   - 6+ built-in themes
   - Custom theme editor
   - Live preview
   - Export/import themes
   - CSS variable based

2. Built-in Themes:
   - Dracula Dark
   - Solarized Dark
   - Solarized Light
   - One Dark
   - GitHub Light
   - Tokyo Night

3. Theme Editor:
   - Color pickers for all variables
   - Font family/size controls
   - Line height adjustment
   - Save custom themes

4. Keyboard Shortcuts:
   - Centralized manager
   - Customizable shortcuts
   - Shortcut hint overlay (Cmd+?)
   - Conflict detection

5. Command Palette:
   - Fuzzy search all commands
   - Recent commands
   - Keyboard shortcut hints

6. Settings Panel:
   - Theme selector
   - Font settings
   - All feature toggles
   - Auto-save interval

DEVELOPMENT APPROACH:
Day 1-2: Theme system + built-ins
Day 3: Theme editor
Day 4: Keyboard manager
Day 5: Command palette
Day 6-7: Settings panel + polish

VALIDATION:
- [ ] All 6 themes work
- [ ] Can create custom theme
- [ ] Theme persists across sessions
- [ ] Command palette finds commands
- [ ] Keyboard shortcuts customizable
- [ ] Settings panel complete
- [ ] 20+ tests passing

UPDATE PROGRESS:
- Update .claude/progress/phase2/themes/current-state.md as you add themes
- Document theme architecture in .claude/progress/phase2/themes/decisions.md
- Log UX insights in .claude/progress/phase2/themes/learnings.md

START: Theme system with CSS variables and one working theme.
```

### Feature: Code Previews

**Branch:** `feature/codepreview`
**Progress Folder:** `.claude/progress/phase2/codepreview/`
**Files:** `js/modules/codepreview.js`, `css/codepreview.css`, `tests/codepreview.test.js`

**Prompt:**
```
Feature: Code Previews

CONTEXT:
Enable HTML code block previews with sandboxed iframes.

Read:
- PLAN.md section 6.6 (Code Previews)
- .claude/progress/phase2/codepreview/current-state.md
- .claude/progress/phase2/coordination.md

YOUR RESPONSIBILITIES:

1. Preview Manager:
   - Detect ```html blocks
   - Create sandboxed iframe
   - Render HTML safely
   - Capture console logs
   - Display errors

2. Security:
   - Sandboxed iframe (allow-scripts only)
   - CSP headers
   - No parent page access
   - XSS prevention

3. UI:
   - Resizable preview window
   - Toggle source/preview
   - Minimize/maximize
   - Console output display

4. Multi-Preview:
   - Multiple previews in document
   - Each independent
   - Auto-refresh on code change
   - Manage preview lifecycle

DEVELOPMENT APPROACH:
Day 1-2: Basic iframe preview
Day 3: Sandboxing + security
Day 4: Resize handles
Day 5: Console capture
Day 6-7: Multi-preview + polish

VALIDATION:
- [ ] HTML renders in preview
- [ ] Sandbox prevents parent access
- [ ] Can resize preview
- [ ] Console logs visible
- [ ] Multiple previews work
- [ ] No XSS vulnerabilities
- [ ] 15+ tests passing

SECURITY TESTING:
Test with malicious code:
- <script>alert(document.cookie)</script>
- <script>top.location = "evil.com"</script>
- <iframe src="evil.com"></iframe>

None should escape sandbox. Document in tests-results.md

UPDATE PROGRESS:
- Update .claude/progress/phase2/codepreview/current-state.md
- Document security approach in .claude/progress/phase2/codepreview/decisions.md
- Log security test results in .claude/progress/phase2/codepreview/tests-results.md

START: Basic preview with proper sandboxing. Security first!
```

### Phase 2 Daily Coordination

**Every day, each feature team should:**

1. **Morning:** Read `coordination.md`, update your section with today's plan
2. **During work:** Update your feature's progress files
3. **Evening:** Update `coordination.md` with progress, blockers, needs

**Example coordination.md entry:**

```markdown
## Daily Standup - 2026-01-07

### Folding
- Status: In Progress (Day 3)
- Progress: 60%
- Completed: Fold data structure, basic fold/unfold
- Today: Adding UI indicators and click handlers
- Blockers: None
- Notes: Fold state persisting to IndexedDB works great

### Search
- Status: In Progress (Day 2)
- Progress: 40%
- Completed: Search engine with regex
- Today: Building search UI modal
- Blockers: Waiting for decision on folded content handling
- Notes: Need to coordinate with Folding feature on search behavior

### Rich Content
- Status: In Progress (Day 1)
- Progress: 20%
- Completed: Image upload working
- Today: Implementing image storage
- Blockers: None
- Notes: Considering base64 vs blob URLs (will document decision)

### Export/Import
- Status: In Progress (Day 1)
- Progress: 15%
- Completed: Basic export structure
- Today: Adding compression
- Blockers: None
- Notes: Gzip compression working, ~70% size reduction

### Themes
- Status: In Progress (Day 2)
- Progress: 30%
- Completed: Theme system, 2 themes working
- Today: Adding remaining built-in themes
- Blockers: None
- Notes: CSS variables approach working well

### Code Previews
- Status: In Progress (Day 2)
- Progress: 25%
- Completed: Basic iframe preview
- Today: Implementing sandboxing
- Blockers: None
- Notes: Testing various CSP configurations

## Integration Issues
- **Search + Folding:** Need to decide if search should look inside folded content
  - Recommendation: Skip folded content (cleaner UX)
  - Decision needed by: Tomorrow
  - Owners: Folding & Search features

## Shared Interface Changes
None today

## Next Steps
- Resolve search + folding behavior
- All instances on track for Week 1 completion
```

---

## Phase 3: Advanced Features (4 Features)

**Prerequisites:** Phase 2 complete and integrated.

**Progress Folder:** `.claude/progress/phase3/`

Similar structure as Phase 2, with 4 parallel features:

### Feature: Inline Computation
**Branch:** `feature/computation`
**Progress Folder:** `.claude/progress/phase3/computation/`
**Files:** `js/modules/compute.js`, `tests/compute.test.js`

### Feature: Document Restructuring
**Branch:** `feature/restructure`
**Progress Folder:** `.claude/progress/phase3/restructure/`
**Files:** `js/modules/restructure.js`, `css/restructure.css`, `tests/restructure.test.js`

### Feature: Kanban View
**Branch:** `feature/kanban`
**Progress Folder:** `.claude/progress/phase3/kanban/`
**Files:** `js/modules/kanban.js`, `css/kanban.css`, `tests/kanban.test.js`

### Feature: GitHub Auto-Sync
**Branch:** `feature/github-sync`
**Progress Folder:** `.claude/progress/phase3/github-sync/`
**Files:** `js/modules/github-sync.js`, `tests/github-sync.test.js`

Each feature follows the same progress tracking structure as Phase 2:
- current-state.md
- decisions.md
- learnings.md
- session-log.md
- tests-results.md

---

## Phase 4: Polish & Integration (2 Instances)

**Prerequisites:** Phase 3 complete.

[Similar structure for final polish phase]

---

## Integration Workflow

### Weekly Integration Meetings

Every week, review:

```markdown
# Weekly Integration Review - Week [N]

## Completed This Week
- Folding: [Summary]
- Search: [Summary]
- Rich Content: [Summary]
- Export/Import: [Summary]
- Themes: [Summary]
- Code Previews: [Summary]

## Integration Challenges
[What problems emerged when combining work?]

## Solutions Implemented
[How we solved them]

## Carry Forward
[What needs more work next week]

## Performance Impact
[Did any features slow things down?]

## Test Results
[Overall test suite status]

## Next Week Plan
[What each instance will focus on]
```

### Merge Strategy

Merge in order of dependencies:

1. **Themes** (changes CSS, low risk)
2. **Folding** (changes renderer, medium risk)
3. **Search** (depends on folding, medium risk)
4. **Rich Content** (changes renderer, medium risk)
5. **Export/Import** (depends on storage, low risk)
6. **Code Previews** (independent, low risk)

**For each merge:**

```markdown
## Pre-Merge Checklist - [Feature Name]

- [ ] All tests pass on feature branch
- [ ] Rebased on latest main
- [ ] No merge conflicts
- [ ] Manually tested in isolation
- [ ] Manually tested with already-merged features
- [ ] Performance benchmarks run
- [ ] Documentation updated
- [ ] Progress files updated

## Merge Process

1. Create PR from feature branch
2. Review changes (use PR template)
3. Run full test suite
4. Merge to main
5. Tag release: v0.x-[feature-name]
6. Update coordination.md
7. Notify all instances of merge

## Post-Merge Validation

- [ ] All tests still pass
- [ ] No new console errors
- [ ] Performance unchanged
- [ ] Existing features still work
```

---

## Troubleshooting Guide

### Common Problems & Solutions

#### "I don't know where to start"

**Solution:**
1. Read `current-state.md` - it tells you exactly where you are
2. If it says "Not started" - start with the smallest piece (usually data structures)
3. If it says "In progress" - check "Current Task" and continue there
4. Write tests first - they clarify what you're building

#### "Tests are failing after integration"

**Solution:**
1. Isolate: Do tests pass for the individual module?
2. If yes → integration issue. Check interfaces.
3. If no → module issue. Fix the module first.
4. Use `git bisect` to find when it broke
5. Check `decisions.md` for architectural assumptions that changed

#### "Performance degraded"

**Solution:**
1. Profile with Chrome DevTools
2. Check `tests-results.md` for baseline metrics
3. Look for:
   - N^2 algorithms (common in search/fold)
   - Excessive re-renders
   - Memory leaks (detached DOM)
   - Synchronous IndexedDB (should be async)
4. Document findings in `learnings.md`

#### "I'm blocked by another instance"

**Solution:**
1. Document blocker in your instance progress file
2. Update `coordination.md` with blocker
3. Create mock/stub of the dependency
4. Continue with your work using the mock
5. Replace with real implementation when available

#### "Should I refactor this code?"

**Decision Tree:**
```
Is it working? → No → Fix it first
                ↓ Yes
Is it tested? → No → Write tests first
                ↓ Yes
Is it slow? → Yes → Profile, optimize, document
             ↓ No
Is it confusing? → Yes → Refactor, keep tests passing
                  ↓ No
Leave it alone! → Move to next task
```

#### "I made a wrong architectural decision"

**Solution:**
1. Document the problem in `decisions.md`
2. Explain what you learned
3. Propose alternative approach
4. Estimate cost to change
5. If cost is low → change it now
6. If cost is high → add to backlog, work around for now
7. Update `learnings.md` with the lesson

---

## Success Metrics

### Per-Phase Success Criteria

**Phase 1 Success:**
- [ ] All 40+ tests passing
- [ ] Can edit and persist documents
- [ ] Syntax highlighting works
- [ ] 60fps scrolling with 100K lines
- [ ] Load time < 500ms

**Phase 2 Success:**
- [ ] All 6 features work independently
- [ ] 100+ tests passing
- [ ] All features integrated
- [ ] No performance regression
- [ ] All progress files updated

**Phase 3 Success:**
- [ ] All 4 advanced features work
- [ ] 150+ tests passing
- [ ] Features compound nicely
- [ ] Performance still good

**Phase 4 Success:**
- [ ] Production ready
- [ ] All browsers supported
- [ ] 200+ tests passing
- [ ] Documentation complete
- [ ] User guide written

### Overall Project Success

```markdown
## folded is DONE when:

### Core Functionality
- [ ] Can create/edit/save documents
- [ ] Can fold anywhere
- [ ] Syntax highlighting
- [ ] Search with regex
- [ ] URL navigation
- [ ] Export with encryption
- [ ] Rich content (images, checkboxes)
- [ ] Custom themes

### Advanced Features
- [ ] Inline computation
- [ ] Document restructuring
- [ ] Kanban view
- [ ] GitHub sync
- [ ] Scrappy (stale detection)
- [ ] Code previews
- [ ] Split view

### Performance
- [ ] 100K+ lines smooth
- [ ] 60fps scrolling
- [ ] <16ms typing latency
- [ ] <500ms load

### Quality
- [ ] 200+ tests passing
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works in Chrome, Firefox, Safari, Edge

### Documentation
- [ ] README
- [ ] User guide
- [ ] Developer docs
- [ ] All progress files complete
- [ ] All decisions documented
- [ ] All learnings captured

### User Validation
- [ ] Can complete real-world tasks
- [ ] Feels fast and responsive
- [ ] UI is intuitive
- [ ] No data loss under any condition
```

---

## Final Notes: Making Progress Compound

**The Power of Incremental Progress:**

Every small piece you complete:
- Validates your approach
- Teaches you something
- Becomes foundation for next piece
- Reduces overall risk

**Document Everything:**

Six months from now, when you're adding a new feature, you'll read your decision logs and learnings and think "wow, I'm glad I wrote that down."

**Test Continuously:**

Tests aren't overhead - they're insurance. They let you refactor fearlessly.

**Keep Context:**

Progress files might feel like busywork now, but they're what lets you pick up after a break without losing momentum.

**Celebrate Milestones:**

When you finish Phase 1, document it! When tests go from 40 to 100, note it! Progress is motivating.

---

**Good luck building folded! Remember:**

1. **Read progress files first** - Always start by reading current-state.md
2. **Build small** - Smallest testable piece
3. **Test immediately** - Don't wait
4. **Document decisions** - Future you will thank you
5. **Update progress** - Keep files current
6. **Learn continuously** - Capture insights
7. **Compound knowledge** - Each piece builds on the last

**Start with Phase 1. Get it perfect. Then parallelize in Phase 2.**

---

## Appendix: File Reference

### Progress Files Structure

```
.claude/
└── progress/
    ├── phase1/
    │   ├── current-state.md      # Where you are NOW
    │   ├── decisions.md          # Why you made choices
    │   ├── learnings.md          # What you discovered
    │   ├── session-log.md        # Daily summaries
    │   └── tests-results.md      # Validation tracking
    ├── phase2/
    │   ├── coordination.md       # Cross-feature sync
    │   ├── folding/
    │   │   ├── current-state.md
    │   │   ├── decisions.md
    │   │   ├── learnings.md
    │   │   ├── session-log.md
    │   │   └── tests-results.md
    │   ├── search/
    │   │   └── [same 5 files]
    │   ├── richcontent/
    │   │   └── [same 5 files]
    │   ├── export/
    │   │   └── [same 5 files]
    │   ├── themes/
    │   │   └── [same 5 files]
    │   └── codepreview/
    │       └── [same 5 files]
    ├── phase3/
    │   ├── coordination.md
    │   ├── computation/
    │   │   └── [same 5 files]
    │   ├── restructure/
    │   │   └── [same 5 files]
    │   ├── kanban/
    │   │   └── [same 5 files]
    │   └── github-sync/
    │       └── [same 5 files]
    └── phase4/
        └── [similar structure]
```

### Quick Commands

```bash
# Read current state
cat .claude/progress/current-state.md

# Update current state
nano .claude/progress/current-state.md

# Log session work
echo "## $(date) - Session" >> .claude/progress/session-log.md

# Run tests and log results
npm test 2>&1 | tee -a .claude/progress/tests-results.md

# Check all progress files
find .claude/progress -name "*.md" -exec echo "\n=== {} ===" \; -exec cat {} \;
```

---

**End of Development Guide. Now go build something amazing! 🚀**
