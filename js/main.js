/**
 * Main Application - folded
 * Entry point that coordinates all modules
 */

import storage from './modules/storage.js';
import editor from './modules/editor.js';
import doc from './modules/document.js';
import parser from './modules/parser.js';
import renderer from './modules/renderer.js';
import foldManager from './modules/folding.js';

class FoldedApp {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing folded...');

        try {
            // Initialize storage
            await storage.initDB();
            console.log('✓ Storage initialized');

            // Initialize editor
            const container = document.querySelector('.editor-container');
            editor.initialize(container);
            console.log('✓ Editor initialized');

            // Initialize renderer
            renderer.initialize(editor, parser);
            console.log('✓ Renderer initialized');

            // Initialize fold manager with editor reference
            foldManager.setEditor(editor);
            console.log('✓ Fold manager initialized');

            // Initialize document manager
            await doc.initialize();
            console.log('✓ Document manager initialized');

            // Set up UI event handlers
            this.setupUIHandlers();
            console.log('✓ UI handlers set up');

            // Load or create default document
            await doc.getOrCreateDefault();
            console.log('✓ Document loaded');

            // Initial render
            renderer.render();
            console.log('✓ Initial render complete');

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
    setupUIHandlers() {
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
                const parsed = parser.getParsedLines();
                foldManager.foldAll(parsed);
            }
        });
    }

    /**
     * Set up cursor position tracking
     */
    setupCursorTracking() {
        const updateCursorPos = () => {
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
    updateLineCount() {
        const lineCount = editor.getLineCount();
        const lineCountElement = document.getElementById('line-count');
        if (lineCountElement) {
            lineCountElement.textContent = `${lineCount} line${lineCount !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Set up before unload handler to save document
     */
    setupBeforeUnload() {
        window.addEventListener('beforeunload', async (e) => {
            if (doc.dirty) {
                // Save the document
                await doc.save();
            }

            // Save as last opened
            await doc.saveAsLastOpened();
        });
    }

    /**
     * Create a new document
     */
    async createNewDocument() {
        const name = prompt('Document name:', 'Untitled');
        if (name !== null) {
            await doc.create(name);
            renderer.render();
            editor.focus();
        }
    }

    /**
     * Smart fold at cursor position (toggle behavior)
     * - If on a folded header/fence, expand it
     * - Otherwise, find containing header and fold it
     * - Works from anywhere within a header section
     */
    foldAtCursor() {
        const cursor = editor.getCursor();
        const parsed = parser.getParsedLines();

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
    showError(message) {
        // For now, just use alert
        // Can be replaced with a nicer modal later
        alert(message);
    }
}

// Create and initialize app
const app = new FoldedApp();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for debugging
window.folded = {
    app,
    storage,
    editor,
    doc,
    parser,
    renderer,
    foldManager
};

export default app;
