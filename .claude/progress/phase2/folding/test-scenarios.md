# Test Scenarios - Folding Feature

## Overview

The folding system allows users to collapse and expand sections of markdown documents. This document outlines manual test scenarios to validate the feature works correctly.

## Test Environment

- **Browser**: Chrome (latest)
- **URL**: Local file or deployed GitHub Pages
- **Prerequisites**: Clear IndexedDB before testing if stale folds exist

---

## Test Scenarios

### Scenario 1: Header Folding via Gutter Click

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

2. Look at the fold gutter (left side) - you should see `▼` icons next to headers
3. Click the `▼` icon next to `# Header One`

**Expected Result:**
- `# Header One` collapses showing: `Header One [X lines]` where X is the count of hidden lines
- The gutter icon changes from `▼` to `▶`
- `# Header Two` remains visible (header folding stops at same-level headers)
- Hidden lines should NOT take up space

**Success Criteria:**
- [ ] Fold indicator appears with correct line count
- [ ] Header Two is NOT included in the fold
- [ ] No vertical space where hidden content was

---

### Scenario 2: Expand Fold via Gutter Click

**Prerequisites:** Complete Scenario 1

**Steps:**
1. With `# Header One` folded, click the `▶` icon in the gutter

**Expected Result:**
- Fold expands, all content becomes visible
- Gutter icon changes back to `▼`
- Original content appears in place

**Success Criteria:**
- [ ] All folded content reappears
- [ ] No duplicate content
- [ ] Gutter icon shows `▼`

---

### Scenario 3: Expand Fold via Indicator Click

**Steps:**
1. Fold a header section (click gutter icon)
2. Click directly on the fold indicator text (e.g., `Header One [9 lines]`)

**Expected Result:**
- Fold toggles (expands)
- Same behavior as clicking gutter icon

**Success Criteria:**
- [ ] Click on indicator text toggles fold
- [ ] Cursor shows pointer on hover
- [ ] Visual feedback on hover (color change)

---

### Scenario 4: Code Block Folding

**Steps:**
1. Create a document with:
```markdown
# Test

Some text.

```javascript
function example() {
    console.log("Hello");
    return true;
}
```

More text after.
```

2. Click the `▼` icon next to the opening code fence

**Expected Result:**
- Code block collapses
- Shows: `Code block (javascript) [X lines]`
- Text after code block remains visible

**Success Criteria:**
- [ ] Code block folds correctly
- [ ] Language shown in label
- [ ] Content after block visible

---

### Scenario 5: List Folding

**Steps:**
1. Create a document with:
```markdown
# Shopping List

- Apples
- Bananas
- Oranges
- Grapes

Other content.
```

2. Click the `▼` icon next to the first list item

**Expected Result:**
- Entire list collapses
- Shows: `List [X lines]`
- "Other content" remains visible

**Success Criteria:**
- [ ] All list items collapse together
- [ ] Label shows "List"
- [ ] Non-list content remains visible

---

### Scenario 6: Blockquote Folding

**Steps:**
1. Create a document with:
```markdown
# Quote

> This is a quote.
> It spans multiple lines.
> Three lines total.

After the quote.
```

2. Click the `▼` icon next to the first blockquote line

**Expected Result:**
- All blockquote lines collapse
- Shows: `Blockquote [X lines]`

**Success Criteria:**
- [ ] Multi-line blockquote folds as one unit
- [ ] Label shows "Blockquote"

---

### Scenario 7: Fold All (Keyboard Shortcut)

**Steps:**
1. Create a document with multiple foldable sections (headers, code blocks, lists)
2. Press `Ctrl+Alt+.` (Windows/Linux) or `Cmd+Alt+.` (Mac)

**Expected Result:**
- All foldable regions collapse
- Multiple fold indicators appear
- Document becomes very compact
- Console shows: "Folded X regions"

**Success Criteria:**
- [ ] All headers fold
- [ ] All code blocks fold
- [ ] All lists fold
- [ ] Console message appears

---

### Scenario 8: Unfold All (Keyboard Shortcut)

**Prerequisites:** Complete Scenario 7

**Steps:**
1. With multiple folds active, press `Ctrl+Shift+.` (Windows/Linux) or `Cmd+Shift+.` (Mac)

**Expected Result:**
- All folds expand
- All content visible
- No fold indicators remain
- Console shows: "Unfolded X regions"

**Success Criteria:**
- [ ] All content expanded
- [ ] No fold indicators
- [ ] Console message appears

---

### Scenario 9: Fold at Cursor (Keyboard Shortcut)

**Steps:**
1. Place cursor on a header line (e.g., `# Header One`)
2. Press `Ctrl+.` (Windows/Linux) or `Cmd+.` (Mac)

**Expected Result:**
- Section under cursor folds
- Smart detection based on line type (header, code block, list, etc.)

**Success Criteria:**
- [ ] Fold created at cursor position
- [ ] Correct region detected

---

### Scenario 10: Fold Persistence

**Steps:**
1. Create several folds in your document
2. Wait 2+ seconds for auto-save
3. Refresh the page (F5 or Ctrl+R)

**Expected Result:**
- Document loads with same content
- All folds restored exactly as before
- Collapsed state preserved

**Success Criteria:**
- [ ] Folds survive page refresh
- [ ] Same sections folded
- [ ] No data loss

---

### Scenario 11: Multiple Independent Folds

**Steps:**
1. Create a document with multiple H1 headers:
```markdown
# First Header

Content 1

# Second Header

Content 2

# Third Header

Content 3
```

2. Fold "First Header"
3. Fold "Third Header"
4. Leave "Second Header" expanded

**Expected Result:**
- First and Third headers show fold indicators
- Second header content fully visible
- Each fold independent

**Success Criteria:**
- [ ] Multiple folds can exist simultaneously
- [ ] Folds don't interfere with each other
- [ ] Expanded sections remain expanded

---

### Scenario 12: Grammar - Singular vs Plural

**Steps:**
1. Create a header with exactly 2 lines of content (1 line will be hidden)
2. Fold the header

**Expected Result:**
- Shows `[1 line]` (singular) not `[1 lines]`

**Steps (continued):**
3. Create a header with 3+ lines of content
4. Fold the header

**Expected Result:**
- Shows `[2 lines]`, `[3 lines]`, etc. (plural)

**Success Criteria:**
- [ ] Singular "line" for count of 1
- [ ] Plural "lines" for count > 1

---

### Scenario 13: Visual Feedback on Hover

**Steps:**
1. Create a fold
2. Hover mouse over the fold indicator text

**Expected Result:**
- Background color lightens
- Text color changes to accent (blue)
- Border color changes
- Slight transform/movement
- Cursor shows pointer

**Success Criteria:**
- [ ] Smooth transition on hover
- [ ] Visual indication of clickability
- [ ] Cursor changes to pointer

---

### Scenario 14: Overlapping Folds Prevention

**Steps:**
1. Fold a header section (lines 1-10)
2. Expand it
3. Try to fold a subsection within it while the parent is also foldable

**Expected Result:**
- If parent header is already folded, can't fold child
- If parent is expanded, child can be folded
- Console may show: "Overlapping folds detected"

**Success Criteria:**
- [ ] No nested/overlapping folds created
- [ ] System prevents overlapping ranges

---

## Known Limitations

1. **No Nested Folds**: Cannot fold sections within already folded sections
2. **No Selection-Based Folds**: Can only fold smart-detected regions (headers, code blocks, lists, blockquotes)
3. **No Paragraph Folding**: Regular text paragraphs are not foldable (intentional design decision)
4. **Stale IndexedDB Data**: If document structure changes significantly, old fold data may have incorrect line ranges. Use "Unfold All" and re-fold to fix.

---

## Debugging Tips

1. **Open DevTools Console**: Check for errors and fold-related log messages
2. **Check IndexedDB**: Application > IndexedDB > foldedDB > documents > check `folds` array
3. **Clear Stale Data**: If folds behave incorrectly, use Ctrl+Shift+. to unfold all, then create fresh folds
4. **Verify Z-Index**: If clicks don't work, check that overlay has z-index: 2 and fold-indicator has z-index: 5

---

## Last Updated

2026-01-07 - Initial test scenarios created
