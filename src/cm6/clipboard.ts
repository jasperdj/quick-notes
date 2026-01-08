/**
 * Clipboard Module for CodeMirror 6
 *
 * Handles copy/cut/paste operations with fold-aware behavior:
 * - Copy: Expands folded content so external apps get full text
 * - Cut: Same as copy, but also removes the content
 * - Paste: Restores fold structure when pasting within the app
 *
 * Uses in-memory storage for fold data since browsers block
 * custom MIME types on paste operations.
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { FOLD_SUFFIX_REGEX } from '../modules/folding';

// Type for fold manager reference
interface FoldManagerLike {
  foldedContent: Map<number, { lines: string[]; label: string; lineCount: number }>;
  decodeFoldId(encoded: string): number;
  encodeFoldId(foldId: number): string;
  nextFoldId: number;
}

// Global reference to fold manager
let foldManagerRef: FoldManagerLike | null = null;

/**
 * Set the fold manager reference
 */
export function setClipboardFoldManager(fm: FoldManagerLike): void {
  foldManagerRef = fm;
}

/**
 * Pending paste data - stored in memory since browsers block custom MIME types
 */
interface PendingPaste {
  plainText: string;
  foldData: FoldData[];
  timestamp: number;
}

interface FoldData {
  lineIndex: number;  // Line index relative to copied text
  lines: string[];
  label: string;
  lineCount: number;
}

let pendingPaste: PendingPaste | null = null;
const PASTE_TIMEOUT = 30000; // 30 seconds

/**
 * Expand a line's fold content if it has a fold marker
 */
function expandLineForCopy(line: string): string[] {
  if (!foldManagerRef) return [line];

  const match = line.match(FOLD_SUFFIX_REGEX);
  if (!match) return [line];

  // Get the fold ID from the marker
  const encoded = match[0];
  const foldId = foldManagerRef.decodeFoldId(encoded);
  const foldData = foldManagerRef.foldedContent.get(foldId);

  if (!foldData) {
    // Fold data not found, just strip the marker
    return [line.replace(FOLD_SUFFIX_REGEX, '')];
  }

  // Return header line (without marker) + folded content
  const baseLine = line.replace(FOLD_SUFFIX_REGEX, '');
  return [baseLine, ...foldData.lines];
}

/**
 * Expand all folds in a text selection
 */
function expandTextForCopy(text: string): { plainText: string; foldData: FoldData[] } {
  const lines = text.split('\n');
  const expandedLines: string[] = [];
  const foldData: FoldData[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(FOLD_SUFFIX_REGEX);

    if (match && foldManagerRef) {
      const encoded = match[0];
      const foldId = foldManagerRef.decodeFoldId(encoded);
      const data = foldManagerRef.foldedContent.get(foldId);

      if (data) {
        // Store fold data for potential paste within app
        foldData.push({
          lineIndex: expandedLines.length,
          lines: data.lines,
          label: data.label,
          lineCount: data.lineCount
        });
      }

      // Add expanded content
      const expanded = expandLineForCopy(line);
      expandedLines.push(...expanded);
    } else {
      expandedLines.push(line);
    }
  }

  return {
    plainText: expandedLines.join('\n'),
    foldData
  };
}

/**
 * Handle copy event
 */
function handleCopy(view: EditorView, event: ClipboardEvent): boolean {
  const selection = view.state.selection.main;

  // Only handle if there's a selection
  if (selection.empty) return false;

  const selectedText = view.state.sliceDoc(selection.from, selection.to);

  // Check if selection contains fold markers
  if (!FOLD_SUFFIX_REGEX.test(selectedText)) {
    // No fold markers, let default behavior handle it
    return false;
  }

  // Expand folds for copy
  const { plainText, foldData } = expandTextForCopy(selectedText);

  // Store fold data in memory for potential paste within app
  if (foldData.length > 0) {
    pendingPaste = {
      plainText,
      foldData,
      timestamp: Date.now()
    };
  }

  // Write expanded text to clipboard
  if (event.clipboardData) {
    event.clipboardData.setData('text/plain', plainText);
    event.preventDefault();
    return true;
  }

  return false;
}

/**
 * Handle cut event
 */
function handleCut(view: EditorView, event: ClipboardEvent): boolean {
  // First handle like copy
  const handled = handleCopy(view, event);

  // If we handled it, the default cut won't happen, so we need to delete manually
  if (handled) {
    const selection = view.state.selection.main;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: '' }
    });
  }

  return handled;
}

/**
 * Restore folds in pasted text
 */
function restoreFoldsInPaste(text: string, foldData: FoldData[]): string {
  if (!foldManagerRef || foldData.length === 0) return text;

  const lines = text.split('\n');

  // Process folds in reverse order to maintain line indices
  for (let i = foldData.length - 1; i >= 0; i--) {
    const fold = foldData[i];

    if (fold.lineIndex >= lines.length) continue;

    // Generate new fold ID
    const newFoldId = foldManagerRef.nextFoldId++;

    // Store the fold data
    foldManagerRef.foldedContent.set(newFoldId, {
      lines: fold.lines,
      label: fold.label,
      lineCount: fold.lineCount
    });

    // Add fold marker to the line
    const headerLine = lines[fold.lineIndex];
    lines[fold.lineIndex] = headerLine + foldManagerRef.encodeFoldId(newFoldId);

    // Remove the expanded lines that are now folded
    lines.splice(fold.lineIndex + 1, fold.lineCount);
  }

  return lines.join('\n');
}

/**
 * Handle paste event
 */
function handlePaste(view: EditorView, event: ClipboardEvent): boolean {
  const clipboardText = event.clipboardData?.getData('text/plain');
  if (!clipboardText) return false;

  // Check if we have pending fold data that matches
  if (pendingPaste) {
    const isRecent = Date.now() - pendingPaste.timestamp < PASTE_TIMEOUT;
    const textMatches = clipboardText === pendingPaste.plainText;

    if (isRecent && textMatches && pendingPaste.foldData.length > 0) {
      // Restore folds in the pasted text
      const restoredText = restoreFoldsInPaste(clipboardText, pendingPaste.foldData);

      // Insert the restored text
      const selection = view.state.selection.main;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: restoredText },
        selection: { anchor: selection.from + restoredText.length }
      });

      event.preventDefault();

      // Clear pending paste after use
      pendingPaste = null;

      return true;
    }
  }

  // No fold restoration needed, let default paste handle it
  return false;
}

/**
 * Create clipboard event handlers as a CM6 extension
 */
export function clipboardExtension(): Extension {
  return EditorView.domEventHandlers({
    copy: (event, view) => {
      return handleCopy(view, event);
    },
    cut: (event, view) => {
      return handleCut(view, event);
    },
    paste: (event, view) => {
      return handlePaste(view, event);
    }
  });
}

/**
 * Clear pending paste data (called when switching documents)
 */
export function clearPendingPaste(): void {
  pendingPaste = null;
}

export default clipboardExtension;
