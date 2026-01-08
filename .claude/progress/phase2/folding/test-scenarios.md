# Test Scenarios - Folding Feature

## Overview

The folding system allows users to collapse and expand sections of markdown documents.

**NEW ARCHITECTURE (2026-01-07):** Folds now modify the actual document content by inserting fold markers (`<!--FOLD:id:label:count-->`). This ensures textarea and overlay are always in sync.

## Test Environment

- **Browser**: Chrome (latest)
- **URL**: Local file or deployed GitHub Pages

---

## Test Scenarios

### Scenario 1: Header Folding via Keyboard

**Steps:**
1. Create a document with this content:
```markdown
# Header One

Content under header one.
More content here.

## Subheader

Nested content.

# Header Two

Content under header two.
```

2. Place cursor on line 1 (`# Header One`)
3. Press `Ctrl+.` (Windows/Linux) or `Cmd+.` (Mac)

**Expected Result:**
- `# Header One` stays visible
- A fold indicator appears: `▶ Header One [8 lines]`
- `# Header Two` and its content remain visible
- Line count decreases (from 12 to ~5)

**Success Criteria:**
- [x] Fold indicator appears with correct line count
- [x] Header Two is NOT included in the fold
- [x] No vertical space where hidden content was

---

### Scenario 2: Expand Fold via Click

**Prerequisites:** Complete Scenario 1

**Steps:**
1. Click on the fold indicator (`▶ Header One [8 lines]`)

**Expected Result:**
- Fold expands, all content becomes visible
- Fold indicator disappears
- Original content appears in place
- Line count returns to original

**Success Criteria:**
- [x] All folded content reappears
- [x] No duplicate content
- [x] Fold indicator removed

---

### Scenario 3: Fold All (Keyboard Shortcut)

**Steps:**
1. Create a document with multiple foldable sections (headers, code blocks, lists)
2. Press `Ctrl+Alt+.` (Windows/Linux) or `Cmd+Alt+.` (Mac)

**Expected Result:**
- All foldable regions collapse
- Multiple fold indicators appear
- Document becomes very compact
- Console shows: "Folded X regions"

**Success Criteria:**
- [x] All headers fold
- [x] Console message appears

---

### Scenario 4: Unfold All (Keyboard Shortcut)

**Prerequisites:** Complete Scenario 3

**Steps:**
1. With multiple folds active, press `Ctrl+Shift+.` (Windows/Linux) or `Cmd+Shift+.` (Mac)

**Expected Result:**
- All folds expand
- All content visible
- No fold indicators remain
- Console shows: "Unfolded X regions"

**Success Criteria:**
- [x] All content expanded
- [x] No fold indicators
- [x] Console message appears

---

### Scenario 5: Fold at Cursor Toggle

**Steps:**
1. Place cursor on a header line and press `Ctrl+.` to fold
2. With cursor on the fold marker line, press `Ctrl+.` again

**Expected Result:**
- First press: Creates fold
- Second press: Expands fold (toggle behavior)

**Success Criteria:**
- [x] Fold created at cursor position
- [x] Pressing again on marker expands fold

---

### Scenario 6: Fold Persistence

**Steps:**
1. Create a fold (Ctrl+. on header)
2. Wait 2+ seconds for auto-save
3. Refresh the page (F5 or Ctrl+R)

**Expected Result:**
- Document loads with same content
- Fold marker is preserved in document
- Fold indicator renders correctly

**Success Criteria:**
- [x] Folds survive page refresh
- [x] Same sections folded
- [x] No data loss

---

### Scenario 7: Multiple Independent Folds

**Steps:**
1. Create a document with multiple H1 headers
2. Fold first header
3. Fold third header
4. Leave second header expanded

**Expected Result:**
- First and Third headers show fold indicators
- Second header content fully visible
- Each fold independent

**Success Criteria:**
- [x] Multiple folds can exist simultaneously
- [x] Folds don't interfere with each other
- [x] Expanded sections remain expanded

---

### Scenario 8: Grammar - Singular vs Plural

**Steps:**
1. Create a header with exactly 2 lines of content (1 line will be hidden)
2. Fold the header

**Expected Result:**
- Shows `[1 line]` (singular) not `[1 lines]`

**Success Criteria:**
- [x] Singular "line" for count of 1
- [x] Plural "lines" for count > 1

---

### Scenario 9: Visual Feedback on Hover

**Steps:**
1. Create a fold
2. Hover mouse over the fold indicator

**Expected Result:**
- Background color changes
- Text color changes to accent (blue)
- Cursor shows pointer

**Success Criteria:**
- [x] Visual indication of clickability
- [x] Cursor changes to pointer

---

## Architecture Notes

### Old Architecture (deprecated)
- Folds tracked line numbers
- Overlay visually hid lines with CSS
- Gutter icons for fold controls
- Caused cursor misalignment issues

### New Architecture (current)
- Folds modify actual document content
- Fold markers: `<!--FOLD:foldId:label:lineCount-->`
- Parser detects markers as `fold-marker` line type
- Renderer displays as clickable indicator
- Single source of truth - no sync issues

---

## Debugging Tips

1. **Open DevTools Console**: Check for fold-related log messages
2. **Inspect Document**: The fold marker is visible in textarea (select all, copy)
3. **Clear All Folds**: Use Ctrl+Shift+. to unfold everything

---

## Last Updated

2026-01-07 - Updated for fold markers architecture
