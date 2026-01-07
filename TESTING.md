# Testing Instructions - Folding System (Phase 2)

## What Was Implemented

The advanced folding system allows you to collapse and expand sections of your markdown document. This is the core feature that gives "folded" its name!

## How to Test

### 1. Initial Setup

1. Open the application in your browser (or deploy to GitHub Pages)
2. You should see the markdown editor load with a default document
3. Type some test content (see sample below)

**Sample Test Document:**
```markdown
# Main Header

This is some introductory text under the main header.

## Subsection 1

Here's content in subsection 1.
More content here.

### Deep Section

Nested content.

## Subsection 2

Different section.

```javascript
function example() {
    console.log("This is a code block");
    return true;
}
```

End of code block.

- First list item
- Second list item
- Third list item

> This is a blockquote.
> It spans multiple lines.

Just a paragraph.
With multiple lines.
All part of the same paragraph.
```

### 2. Test Smart Folding at Cursor

**Test: Fold a Header Section**

1. **Action**: Place your cursor on the `# Main Header` line
2. **Action**: Press `Cmd+.` (or `Ctrl+.` on Windows/Linux)
3. **Expected**:
   - The entire section under "Main Header" collapses
   - You see: `▶ Main Header [X lines]` where X is the number of hidden lines
   - All content from "Main Header" to the end of document is hidden
   - The fold indicator is clickable

**Test: Fold a Subsection**

1. **Action**: Place cursor on `## Subsection 1`
2. **Action**: Press `Cmd+.`
3. **Expected**:
   - Only "Subsection 1" and its content collapses
   - Stops before "## Subsection 2"
   - Shows `▶ Subsection 1 [X lines]`

**Test: Fold a Code Block**

1. **Action**: Place cursor on the opening ` ```javascript ` line
2. **Action**: Press `Cmd+.`
3. **Expected**:
   - Code block collapses
   - Shows `▶ Code block (javascript) [X lines]`
   - Click to expand shows full code

**Test: Fold a List**

1. **Action**: Place cursor on any list item (e.g., `- First list item`)
2. **Action**: Press `Cmd+.`
3. **Expected**:
   - Entire list collapses
   - Shows `▶ List [3 lines]`

**Test: Fold a Blockquote**

1. **Action**: Place cursor on `> This is a blockquote.`
2. **Action**: Press `Cmd+.`
3. **Expected**:
   - Both blockquote lines collapse
   - Shows `▶ Blockquote [2 lines]`

**Test: Fold a Paragraph**

1. **Action**: Place cursor on the "Just a paragraph" line
2. **Action**: Press `Cmd+.`
3. **Expected**:
   - All consecutive text lines collapse
   - Shows `▶ Paragraph [4 lines]`

### 3. Test Toggle Fold by Clicking

1. **Action**: Click on any fold indicator (e.g., `▶ Main Header [X lines]`)
2. **Expected**:
   - Fold expands
   - Icon changes from ▶ to ▼
   - All hidden content becomes visible
   - Label changes from "▶ Section [X lines]" to "▼ Section"

3. **Action**: Click the same indicator again
4. **Expected**:
   - Fold collapses again
   - Icon changes from ▼ to ▶
   - Content hides again

### 4. Test Fold All

1. **Setup**: Have a document with multiple foldable sections (headers, code blocks, lists)
2. **Action**: Press `Cmd+Alt+.` (or `Ctrl+Alt+.`)
3. **Expected**:
   - All foldable regions collapse automatically
   - You see multiple fold indicators
   - Document becomes very compact
   - Console shows: "Folded X regions"

### 5. Test Unfold All

1. **Setup**: Have multiple folds active (use Fold All from test #4)
2. **Action**: Press `Cmd+Shift+.` (or `Ctrl+Shift+.`)
3. **Expected**:
   - All folds expand
   - All content becomes visible
   - No fold indicators remain
   - Console shows: "Unfolded X regions"

### 6. Test Fold Persistence

**Test: Save and Reload**

1. **Action**: Create several folds in your document
2. **Action**: Wait 2 seconds for auto-save (or press `Cmd+S`)
3. **Expected**: See "Saved ✓" indicator
4. **Action**: Refresh the page (`Cmd+R` or `F5`)
5. **Expected**:
   - Document loads with same content
   - **All folds are restored exactly as before**
   - Fold indicators appear in same positions
   - Collapsed state preserved

**Test: New Document Clears Folds**

1. **Action**: Create folds in current document
2. **Action**: Press `Cmd+N` to create new document
3. **Action**: Enter a name (e.g., "Test Doc")
4. **Expected**:
   - New empty document loads
   - No folds present
   - Previous document's folds don't carry over

**Test: Switch Between Documents**

1. **Setup**: Create two documents with different folds
2. **Action**: Load first document (with folds)
3. **Action**: Note which sections are folded
4. **Action**: Load second document (with different folds)
5. **Expected**: Second document's folds appear correctly
6. **Action**: Load first document again
7. **Expected**: Original folds restored exactly

### 7. Test Edge Cases

**Test: Overlapping Folds Prevention**

1. **Action**: Fold a header section (lines 1-10)
2. **Action**: Try to fold a subsection within it (lines 3-7)
3. **Expected**:
   - Second fold is prevented
   - Console shows: "Overlapping folds detected"
   - Only first fold remains

**Test: Folding Empty Sections**

1. **Action**: Create a header with no content below it
2. **Action**: Try to fold it with `Cmd+.`
3. **Expected**:
   - Either no fold created (if no lines to fold)
   - Or fold created but shows [0 lines]

**Test: Typing in Folded Section**

1. **Action**: Fold a section
2. **Action**: Expand the fold (click it)
3. **Action**: Edit the content inside
4. **Expected**:
   - Can edit normally
   - Content saves correctly
   - Fold remains but in expanded state

### 8. Visual/UX Tests

**Test: Fold Indicator Hover**

1. **Action**: Hover mouse over a fold indicator
2. **Expected**:
   - Background color changes (lighter)
   - Text color changes to accent blue
   - Smooth transition (0.2s)
   - Cursor shows pointer (clickable)

**Test: Fold Indicator Active State**

1. **Action**: Click and hold on fold indicator
2. **Expected**:
   - Background becomes accent blue
   - Text becomes dark (high contrast)
   - Releases when mouse up
   - Toggle happens on mouse up

**Test: Scroll Synchronization**

1. **Setup**: Document with folds active
2. **Action**: Scroll up and down
3. **Expected**:
   - Fold indicators scroll with content
   - No visual glitches
   - Smooth scrolling

### 9. Performance Tests

**Test: Large Document**

1. **Setup**: Create a document with 100+ headers
2. **Action**: Press `Cmd+Alt+.` to fold all
3. **Expected**:
   - Folds create without lag
   - UI remains responsive
   - No noticeable delay
   - Console reports fold count

**Test: Rapid Toggle**

1. **Action**: Click a fold indicator rapidly (5+ times in 2 seconds)
2. **Expected**:
   - Toggles smoothly each time
   - No race conditions
   - No visual artifacts
   - Each click processed correctly

**Test: Typing Performance with Folds**

1. **Setup**: Create several folds in document
2. **Action**: Type rapidly in visible section
3. **Expected**:
   - No typing lag
   - Characters appear instantly
   - Syntax highlighting updates smoothly
   - Folds don't interfere with typing

## What to Look For

### ✅ Success Indicators

- **Instant feedback**: Fold indicators appear immediately when created
- **Smooth animations**: Hover/click transitions are smooth
- **Persistence works**: Folds survive page refresh
- **Smart detection**: Cursor position determines fold type
- **Clear labels**: Fold indicators show meaningful names
- **Clickable**: Fold indicators respond to clicks
- **No overlap**: Can't create overlapping folds
- **Auto-save**: Folds saved automatically after 2 seconds

### ❌ Bugs to Watch For

- **Fold indicators not appearing**: Check console for errors
- **Clicking doesn't toggle**: Check if `pointer-events: auto` is set
- **Folds not persisting**: Check IndexedDB in DevTools
- **Wrong lines hidden**: Check fold start/end line calculations
- **Overlapping folds created**: Check overlap prevention logic
- **Typing lag**: Check rendering performance
- **Visual artifacts**: Check scroll synchronization

## Browser Console Tips

Open browser DevTools (F12) and check Console tab for helpful messages:

```
Created fold: Main Header (lines 0-10)
Folded 5 regions
Unfolded 5 regions
Saved document: doc_xxx
Loaded document: doc_xxx
Restored 3 folds
```

## DevTools Inspection

### Check IndexedDB

1. Open DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "IndexedDB" → "foldedDB" → "documents"
4. Click on your document
5. Look for `folds` array in the data
6. Should see fold objects with `id`, `startLine`, `endLine`, `collapsed`, `label`

### Check DOM

1. Open DevTools Elements/Inspector
2. Find the `#overlay` element
3. Look for `<span class="fold-indicator">` elements
4. Should have:
   - `data-fold-id` attribute
   - Proper text (icon + label + line count)
   - CSS classes applied

## Known Limitations (Current Phase)

- **No nested folds**: Can't fold sections within already folded sections
- **No selection-based folds**: Can only fold smart-detected regions
- **Basic fold indicators**: No expand-in-place option yet
- **No fold navigation**: Can't jump between folds with keyboard

These are planned for future phases.

## Reporting Issues

If you find bugs, note:
1. What action you took
2. What you expected to happen
3. What actually happened
4. Browser console errors (if any)
5. Steps to reproduce

## Summary

The folding system should feel:
- **Fast**: No lag when creating/toggling folds
- **Smart**: Detects correct regions based on cursor
- **Persistent**: Folds survive page refresh
- **Intuitive**: Click to toggle, keyboard shortcuts work
- **Reliable**: No visual glitches or errors

Enjoy collapsing your markdown! 📁
