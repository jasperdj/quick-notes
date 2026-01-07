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
       - Identify stale instances (Last Update > 12 hour ago) - these can be taken over
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
