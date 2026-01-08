/**
 * Main Application - folded
 * Entry point that coordinates all modules
 *
 * CodeMirror 6 version - handles syntax highlighting internally
 */

import storage from './modules/storage';
import editor from './modules/editor';
import doc, { setFoldManager } from './modules/document';
import foldManager from './modules/folding';
import { setFoldManagerRef } from './cm6/invisible-chars';
import { setClipboardFoldManager } from './cm6/clipboard';

// Import CSS
import './css/main.css';

class FoldedApp {
  initialized = false;

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    console.log('Initializing folded...');

    try {
      // Initialize storage
      await storage.initDB();
      console.log('✓ Storage initialized');

      // Initialize editor (CodeMirror 6)
      const container = document.querySelector('.editor-container') as HTMLElement;
      if (!container) {
        throw new Error('Editor container not found');
      }
      editor.initialize(container);
      console.log('✓ Editor initialized');

      // Initialize fold manager with editor reference
      foldManager.setEditor(editor);
      console.log('✓ Fold manager initialized');

      // Set fold manager references for CM6 plugins
      setFoldManager(foldManager);
      setFoldManagerRef(foldManager);
      setClipboardFoldManager(foldManager);
      console.log('✓ CM6 plugins connected');

      // Initialize document manager
      await doc.initialize();
      console.log('✓ Document manager initialized');

      // Set up UI event handlers
      this.setupUIHandlers();
      console.log('✓ UI handlers set up');

      // Load or create default document
      await doc.getOrCreateDefault();
      console.log('✓ Document loaded');

      // Set up cursor position tracking
      this.setupCursorTracking();
      console.log('✓ Cursor tracking set up');

      // Set up before unload handler
      this.setupBeforeUnload();
      console.log('✓ Before unload handler set up');

      // Focus editor
      editor.focus();

      this.initialized = true;
      console.log('✓ folded initialized successfully!');

    } catch (error) {
      console.error('Failed to initialize folded:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Set up UI event handlers
   */
  setupUIHandlers(): void {
    // Update line count on content change
    editor.onChange(() => {
      this.updateLineCount();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        doc.save();
      }

      // Cmd/Ctrl + N: New document
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        this.createNewDocument();
      }

      // Cmd/Ctrl + .: Smart fold at cursor
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        this.foldAtCursor();
      }

      // Cmd/Ctrl + Shift + .: Unfold all
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
        e.preventDefault();
        foldManager.unfoldAll();
      }

      // Cmd/Ctrl + Alt + .: Fold all
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === '.') {
        e.preventDefault();
        // For fold all, we need to get parsed lines
        // Since we don't have a parser module, we'll create simple parsed lines
        const parsedLines = this.createParsedLines();
        foldManager.foldAll(parsedLines);
      }
    });
  }

  /**
   * Create simple parsed lines for fold detection
   */
  createParsedLines(): Array<{
    type: string;
    level?: number;
    text?: string;
    raw: string;
    lineNumber: number;
    isFolded?: boolean;
    foldId?: number;
    indent?: number;
    lang?: string;
  }> {
    const lines = editor.getLines();
    const parsed = [];
    let inCodeBlock = false;
    let codeFencePattern = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const result: {
        type: string;
        level?: number;
        text?: string;
        raw: string;
        lineNumber: number;
        isFolded?: boolean;
        foldId?: number;
        indent?: number;
        lang?: string;
      } = {
        type: 'text',
        raw: line,
        lineNumber: i
      };

      // Check for fold marker
      const foldMarker = foldManager.getMarkerAtLine(i);
      if (foldMarker) {
        result.isFolded = true;
        result.foldId = foldMarker.foldId;
      }

      // Check for code fence
      const fenceMatch = line.match(/^(`{3,})(\w*)/);
      if (fenceMatch) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeFencePattern = fenceMatch[1];
          result.type = 'code-fence';
          result.lang = fenceMatch[2] || '';
        } else if (line.match(new RegExp(`^${codeFencePattern}\\s*$`))) {
          inCodeBlock = false;
          result.type = 'code-fence';
        }
      } else if (inCodeBlock) {
        result.type = 'code-block-line';
      }

      // Check for header
      if (!inCodeBlock) {
        const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
          result.type = 'header';
          result.level = headerMatch[1].length;
          result.text = headerMatch[2];
        }

        // Check for list items
        const listMatch = line.match(/^(\s*)[-*]\s/);
        if (listMatch) {
          result.type = 'list-unordered';
          result.indent = listMatch[1].length;
        }

        const orderedListMatch = line.match(/^(\s*)\d+\.\s/);
        if (orderedListMatch) {
          result.type = 'list-ordered';
          result.indent = orderedListMatch[1].length;
        }

        // Check for checkbox
        const checkboxMatch = line.match(/^(\s*)[-*]\s\[[ x]\]/i);
        if (checkboxMatch) {
          result.type = 'checkbox';
          result.indent = checkboxMatch[1].length;
        }

        // Check for blockquote
        if (line.match(/^>\s/)) {
          result.type = 'blockquote';
        }
      }

      parsed.push(result);
    }

    return parsed;
  }

  /**
   * Set up cursor position tracking
   */
  setupCursorTracking(): void {
    const updateCursorPos = (): void => {
      const pos = editor.getCursor();
      const cursorElement = document.getElementById('cursor-pos');
      if (cursorElement) {
        cursorElement.textContent = `Ln ${pos.line + 1}, Col ${pos.col + 1}`;
      }
    };

    editor.onSelectionChange(updateCursorPos);

    // Initial update
    updateCursorPos();
  }

  /**
   * Update line count display
   */
  updateLineCount(): void {
    const lineCount = editor.getLineCount();
    const lineCountElement = document.getElementById('line-count');
    if (lineCountElement) {
      lineCountElement.textContent = `${lineCount} line${lineCount !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Set up before unload handler to save document
   */
  setupBeforeUnload(): void {
    window.addEventListener('beforeunload', async () => {
      if (doc.dirty) {
        await doc.save();
      }
      await doc.saveAsLastOpened();
    });
  }

  /**
   * Create a new document
   */
  async createNewDocument(): Promise<void> {
    const name = prompt('Document name:', 'Untitled');
    if (name !== null) {
      await doc.create(name);
      editor.focus();
    }
  }

  /**
   * Smart fold at cursor position (toggle behavior)
   * - If on a folded header/fence, expand it
   * - Otherwise, find containing header and fold it
   * - Works from anywhere within a header section
   */
  foldAtCursor(): void {
    const cursor = editor.getCursor();
    const parsed = this.createParsedLines();

    // Check if cursor is on a folded line - if so, expand it (toggle: unfold)
    const currentLine = parsed[cursor.line];
    if (currentLine && currentLine.isFolded && currentLine.foldId) {
      const expanded = foldManager.expandFold(currentLine.foldId);
      if (expanded) {
        console.log(`Expanded fold: ${currentLine.foldId}`);
      }
      return;
    }

    // Try to create a fold at cursor position
    // Pass findContaining=true to allow folding from anywhere within a header section
    const region = foldManager.detectFoldableRegion(cursor.line, parsed, true);
    if (region) {
      const foldId = foldManager.createFold(region.startLine, region.endLine, region.label);
      if (foldId) {
        console.log(`Created fold: ${region.label} (lines ${region.startLine}-${region.endLine})`);
      } else {
        console.log('Could not create fold');
      }
    } else {
      console.log('No foldable region detected at cursor');
    }
  }

  /**
   * Show error message to user
   */
  showError(message: string): void {
    alert(message);
  }
}

// Create app instance
const app = new FoldedApp();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging
declare global {
  interface Window {
    folded: {
      app: FoldedApp;
      storage: typeof storage;
      editor: typeof editor;
      doc: typeof doc;
      foldManager: typeof foldManager;
    };
  }
}

window.folded = {
  app,
  storage,
  editor,
  doc,
  foldManager
};

export default app;
