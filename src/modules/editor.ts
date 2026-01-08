/**
 * Editor Module - CodeMirror 6 wrapper
 * Provides the same API as the original textarea-based editor
 * for backward compatibility with other modules
 */

import { EditorState, EditorView, setupExtensions } from '../cm6/extensions';

interface Position {
  line: number;
  col: number;
}

interface SelectionRange {
  start: Position;
  end: Position;
}

interface ChangeCallback {
  fn: () => void;
  debounced: boolean;
}

class Editor {
  private view: EditorView | null = null;
  private changeCallbacks: ChangeCallback[] = [];
  private selectionCallbacks: Array<() => void> = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceDelay = 300;

  /**
   * Initialize the editor
   * @param container - DOM element to mount the editor in
   */
  initialize(container: HTMLElement): boolean {
    try {
      const extensions = setupExtensions({
        onUpdate: (update) => {
          if (update.docChanged) {
            this.triggerChangeCallbacks();
          }
          if (update.selectionSet) {
            this.triggerSelectionCallbacks();
          }
        }
      });

      this.view = new EditorView({
        state: EditorState.create({
          doc: '',
          extensions
        }),
        parent: container
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      return false;
    }
  }

  /**
   * Get a specific line by number (0-based)
   */
  getLine(lineNumber: number): string | null {
    if (!this.view) return null;
    const doc = this.view.state.doc;
    if (lineNumber < 0 || lineNumber >= doc.lines) return null;

    // CM6 uses 1-based line numbers
    const line = doc.line(lineNumber + 1);
    return line.text;
  }

  /**
   * Set a specific line's content (0-based)
   */
  setLine(lineNumber: number, content: string): boolean {
    if (!this.view) return false;
    const doc = this.view.state.doc;
    if (lineNumber < 0 || lineNumber >= doc.lines) return false;

    const line = doc.line(lineNumber + 1);
    this.view.dispatch({
      changes: { from: line.from, to: line.to, insert: content }
    });
    return true;
  }

  /**
   * Insert a new line at the specified position (0-based)
   */
  insertLine(lineNumber: number, content: string): boolean {
    if (!this.view) return false;
    const doc = this.view.state.doc;

    let insertPos: number;
    let insertText: string;

    if (lineNumber <= 0) {
      // Insert at beginning
      insertPos = 0;
      insertText = content + '\n';
    } else if (lineNumber >= doc.lines) {
      // Insert at end
      insertPos = doc.length;
      insertText = '\n' + content;
    } else {
      // Insert before the specified line
      const line = doc.line(lineNumber + 1);
      insertPos = line.from;
      insertText = content + '\n';
    }

    this.view.dispatch({
      changes: { from: insertPos, to: insertPos, insert: insertText }
    });
    return true;
  }

  /**
   * Delete a line at the specified position (0-based)
   */
  deleteLine(lineNumber: number): boolean {
    if (!this.view) return false;
    const doc = this.view.state.doc;
    if (lineNumber < 0 || lineNumber >= doc.lines) return false;

    const line = doc.line(lineNumber + 1);
    let from = line.from;
    let to = line.to;

    // Include the newline character
    if (to < doc.length) {
      to += 1; // Include trailing newline
    } else if (from > 0) {
      from -= 1; // Include leading newline for last line
    }

    this.view.dispatch({
      changes: { from, to, insert: '' }
    });
    return true;
  }

  /**
   * Get all lines as an array
   */
  getLines(): string[] {
    if (!this.view) return [''];
    const doc = this.view.state.doc;
    const lines: string[] = [];
    for (let i = 1; i <= doc.lines; i++) {
      lines.push(doc.line(i).text);
    }
    return lines;
  }

  /**
   * Set all lines from an array
   */
  setLines(lines: string[]): void {
    if (!this.view) return;
    const content = lines.join('\n');
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content }
    });
  }

  /**
   * Get the total line count
   */
  getLineCount(): number {
    if (!this.view) return 1;
    return this.view.state.doc.lines;
  }

  /**
   * Get the entire content as a string
   */
  getContent(): string {
    return this.view?.state.doc.toString() ?? '';
  }

  /**
   * Set the entire content
   */
  setContent(content: string): void {
    if (!this.view) return;
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content }
    });
  }

  /**
   * Get cursor position (0-based line and col)
   */
  getCursor(): Position {
    if (!this.view) return { line: 0, col: 0 };
    const pos = this.view.state.selection.main.head;
    const line = this.view.state.doc.lineAt(pos);
    return {
      line: line.number - 1, // Convert to 0-based
      col: pos - line.from
    };
  }

  /**
   * Set cursor position (0-based line and col)
   */
  setCursor(line: number, col: number): boolean {
    if (!this.view) return false;
    const doc = this.view.state.doc;
    if (line < 0 || line >= doc.lines) return false;

    const lineObj = doc.line(line + 1);
    const pos = lineObj.from + Math.min(col, lineObj.length);

    this.view.dispatch({
      selection: { anchor: pos }
    });
    return true;
  }

  /**
   * Get the selected text
   */
  getSelection(): string {
    if (!this.view) return '';
    const { from, to } = this.view.state.selection.main;
    return this.view.state.sliceDoc(from, to);
  }

  /**
   * Get the selection range (0-based)
   */
  getSelectionRange(): SelectionRange {
    if (!this.view) {
      return {
        start: { line: 0, col: 0 },
        end: { line: 0, col: 0 }
      };
    }

    const { from, to } = this.view.state.selection.main;
    const startLine = this.view.state.doc.lineAt(from);
    const endLine = this.view.state.doc.lineAt(to);

    return {
      start: {
        line: startLine.number - 1,
        col: from - startLine.from
      },
      end: {
        line: endLine.number - 1,
        col: to - endLine.from
      }
    };
  }

  /**
   * Insert text at the current cursor position
   */
  insertAtCursor(text: string): void {
    if (!this.view) return;
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length }
    });
  }

  /**
   * Register a callback for content changes
   */
  onChange(callback: () => void, debounced = true): void {
    this.changeCallbacks.push({ fn: callback, debounced });
  }

  /**
   * Register a callback for selection/cursor changes
   */
  onSelectionChange(callback: () => void): void {
    this.selectionCallbacks.push(callback);
  }

  /**
   * Trigger registered change callbacks
   */
  private triggerChangeCallbacks(): void {
    // Immediate callbacks
    for (const cb of this.changeCallbacks) {
      if (!cb.debounced) {
        cb.fn();
      }
    }

    // Debounced callbacks
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      for (const cb of this.changeCallbacks) {
        if (cb.debounced) {
          cb.fn();
        }
      }
    }, this.debounceDelay);
  }

  /**
   * Trigger registered selection callbacks
   */
  private triggerSelectionCallbacks(): void {
    for (const callback of this.selectionCallbacks) {
      callback();
    }
  }

  /**
   * Focus the editor
   */
  focus(): void {
    this.view?.focus();
  }

  /**
   * Scroll to a specific line (0-based)
   */
  scrollToLine(lineNumber: number): boolean {
    if (!this.view) return false;
    const doc = this.view.state.doc;
    if (lineNumber < 0 || lineNumber >= doc.lines) return false;

    const line = doc.line(lineNumber + 1);
    this.view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: 'center' })
    });
    return true;
  }

  /**
   * Get the underlying CodeMirror EditorView
   * For advanced operations that need direct access
   */
  getView(): EditorView | null {
    return this.view;
  }

  /**
   * Destroy the editor
   */
  destroy(): void {
    this.view?.destroy();
    this.view = null;
    this.changeCallbacks = [];
    this.selectionCallbacks = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

// Export singleton instance
const editor = new Editor();
export default editor;
