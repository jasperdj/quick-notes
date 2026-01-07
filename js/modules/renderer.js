/**
 * Renderer Module - Syntax highlighting renderer for folded
 * Renders parsed markdown with syntax highlighting and fold support
 */

import parser from './parser.js';
import editor from './editor.js';
import foldManager from './folding.js';

class Renderer {
    constructor() {
        this.overlay = null;
        this.foldGutter = null;
        this.editor = null;
        this.parser = null;
        this.renderScheduled = false;
    }

    /**
     * Initialize the renderer
     * @param {object} editorInstance - Editor instance
     * @param {object} parserInstance - Parser instance
     */
    initialize(editorInstance, parserInstance) {
        this.editor = editorInstance;
        this.parser = parserInstance;
        this.overlay = document.getElementById('overlay');
        this.foldGutter = document.getElementById('fold-gutter');

        if (!this.overlay) {
            console.error('Overlay element not found');
            return false;
        }

        if (!this.foldGutter) {
            console.error('Fold gutter element not found');
            return false;
        }

        // Set up render on content change
        this.editor.onChange(() => {
            this.scheduleRender();
        });

        // Set up render on fold changes
        foldManager.onChange(() => {
            this.scheduleRender();
        });

        // Set up click handlers for fold indicators in overlay
        this.setupFoldClickHandlers();

        // Sync fold gutter scroll with editor
        this.editor.textarea.addEventListener('scroll', () => {
            this.syncGutterScroll();
        });

        console.log('Renderer initialized');
        return true;
    }

    /**
     * Schedule a render using requestAnimationFrame
     * This syncs with browser paint cycles for smooth rendering
     */
    scheduleRender() {
        if (this.renderScheduled) {
            return; // Already scheduled for next frame
        }

        this.renderScheduled = true;
        requestAnimationFrame(() => {
            this.render();
            this.renderScheduled = false;
        });
    }

    /**
     * Render the entire document
     */
    render() {
        if (!this.overlay) return;

        const content = this.editor.getContent();
        const parsed = this.parser.parse(content);

        const html = this.renderLines(parsed);
        this.overlay.innerHTML = html;

        // Render fold gutter separately
        this.renderFoldGutter(parsed);

        // Re-attach fold click handlers after render
        this.attachFoldElementHandlers();

        // Sync scroll positions
        this.syncScroll();
        this.syncGutterScroll();
    }

    /**
     * Sync fold gutter scroll with editor
     */
    syncGutterScroll() {
        if (this.foldGutter && this.editor.textarea) {
            this.foldGutter.scrollTop = this.editor.textarea.scrollTop;
        }
    }

    /**
     * Render the fold gutter with clickable icons
     * @param {array} parsedLines - Parsed line objects
     */
    renderFoldGutter(parsedLines) {
        if (!this.foldGutter) return;

        const icons = [];

        for (let i = 0; i < parsedLines.length; i++) {
            // Check if this line starts a fold (collapsed OR expanded)
            const fold = this.getFoldStartingAtLine(i);

            if (fold && fold.collapsed) {
                // Show collapsed fold icon with fold-id for toggling
                icons.push(`<div class="fold-gutter-icon collapsed" data-fold-id="${fold.id}" data-line="${i}">▶</div>`);
                // Add empty placeholders for hidden lines
                for (let j = i + 1; j <= fold.endLine; j++) {
                    icons.push(`<div class="fold-gutter-icon" style="visibility:hidden;">·</div>`);
                }
                i = fold.endLine;
            } else if (fold && !fold.collapsed) {
                // Expanded fold - show ▼ with fold-id so clicking toggles it
                icons.push(`<div class="fold-gutter-icon" data-fold-id="${fold.id}" data-line="${i}">▼</div>`);
            } else {
                // Check if line is foldable (no existing fold)
                const canFold = this.canFoldAtLine(i, parsedLines);
                if (canFold) {
                    icons.push(`<div class="fold-gutter-icon" data-line="${i}">▼</div>`);
                } else {
                    icons.push(`<div class="fold-gutter-icon" style="visibility:hidden;">·</div>`);
                }
            }
        }

        this.foldGutter.innerHTML = icons.join('');
    }

    /**
     * Render parsed lines to HTML
     * Fold icons are now rendered separately in the gutter
     * @param {array} parsedLines - Array of parsed line objects
     * @returns {string} HTML string
     */
    renderLines(parsedLines) {
        const lines = [];

        for (let i = 0; i < parsedLines.length; i++) {
            const line = parsedLines[i];

            // Check if this line starts a fold
            const fold = this.getFoldStartingAtLine(i);

            if (fold && fold.collapsed) {
                // Render fold indicator for collapsed fold (replaces the line)
                const indicator = this.renderFoldIndicator(fold);
                lines.push(indicator);

                // Add empty lines for hidden content to maintain line alignment
                for (let j = i + 1; j <= fold.endLine; j++) {
                    lines.push(''); // Empty line to keep textarea and overlay in sync
                }

                // Skip to the line after the fold
                i = fold.endLine;
            } else {
                // Render normal line (fold icons are in gutter now)
                lines.push(this.renderLine(line));
            }
        }

        return lines.join('\n');
    }

    /**
     * Render a single parsed line
     * @param {object} line - Parsed line object
     * @returns {string} HTML string for the line
     */
    renderLine(line) {
        switch (line.type) {
            case 'header':
                return `<span class="syntax-header">${this.escapeHtml(line.raw)}</span>`;

            case 'code-fence':
                return `<span class="syntax-code-block">${this.escapeHtml(line.raw)}</span>`;

            case 'code-block-line':
                return `<span class="syntax-code-block">${this.escapeHtml(line.raw)}</span>`;

            case 'checkbox':
                return `<span class="syntax-checkbox">${this.escapeHtml(line.raw)}</span>`;

            case 'list-unordered':
            case 'list-ordered':
                return `<span class="syntax-list">${this.escapeHtml(line.raw)}</span>`;

            case 'blockquote':
                return `<span class="syntax-blockquote">${this.escapeHtml(line.raw)}</span>`;

            case 'hr':
                return `<span class="syntax-hr">${this.escapeHtml(line.raw)}</span>`;

            case 'text':
                return this.renderInlineTokens(line.tokens);

            default:
                return this.escapeHtml(line.raw);
        }
    }

    /**
     * Render inline tokens (bold, italic, code, links)
     * @param {array} tokens - Array of inline tokens
     * @returns {string} HTML string
     */
    renderInlineTokens(tokens) {
        if (!tokens || tokens.length === 0) {
            return '';
        }

        return tokens.map(token => {
            switch (token.type) {
                case 'bold':
                    return `<span class="syntax-bold">**${this.escapeHtml(token.text)}**</span>`;

                case 'italic':
                    return `<span class="syntax-italic">*${this.escapeHtml(token.text)}*</span>`;

                case 'code':
                    return `<span class="syntax-code">\`${this.escapeHtml(token.text)}\`</span>`;

                case 'link':
                    return `<span class="syntax-link">[${this.escapeHtml(token.text)}](${this.escapeHtml(token.url)})</span>`;

                case 'text':
                default:
                    return this.escapeHtml(token.text);
            }
        }).join('');
    }

    /**
     * Update a single line (for incremental rendering)
     * @param {number} lineNumber - Line number to update
     */
    updateLine(lineNumber) {
        // For now, just re-render everything
        // Can be optimized later for true incremental updates
        this.render();
    }

    /**
     * Update a range of lines
     * @param {number} start - Start line
     * @param {number} end - End line
     */
    updateRange(start, end) {
        // For now, just re-render everything
        // Can be optimized later
        this.render();
    }

    /**
     * Scroll to a specific line
     * @param {number} lineNumber - Line to scroll to
     */
    scrollToLine(lineNumber) {
        return this.editor.scrollToLine(lineNumber);
    }

    /**
     * Sync overlay scroll with editor
     */
    syncScroll() {
        if (this.overlay && this.editor.textarea) {
            this.overlay.scrollTop = this.editor.textarea.scrollTop;
            this.overlay.scrollLeft = this.editor.textarea.scrollLeft;
        }
    }

    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear the overlay
     */
    clear() {
        if (this.overlay) {
            this.overlay.innerHTML = '';
        }
    }

    /**
     * Get fold that starts at a specific line
     * @param {number} lineNumber - Line number
     * @returns {object|null} Fold object or null
     */
    getFoldStartingAtLine(lineNumber) {
        const allFolds = foldManager.getAllFolds();
        return allFolds.find(fold => fold.startLine === lineNumber) || null;
    }

    /**
     * Render a fold indicator
     * @param {object} fold - Fold object
     * @returns {string} HTML string for fold indicator
     */
    renderFoldIndicator(fold) {
        // No icon here - the gutter already shows the triangle
        const lineCount = fold.endLine - fold.startLine;
        const label = fold.label || 'Folded region';

        return `<span class="fold-indicator" data-fold-id="${fold.id}">` +
               `${this.escapeHtml(label)} [${lineCount} lines]` +
               `</span>`;
    }

    /**
     * Set up click handlers for fold indicators
     * Note: This is called once during initialization but doesn't work
     * because overlay has pointer-events: none. We use attachFoldElementHandlers instead.
     */
    setupFoldClickHandlers() {
        // Event delegation doesn't work when overlay has pointer-events: none
        // Using attachFoldElementHandlers() after each render instead
    }

    /**
     * Attach click handlers directly to fold elements after render
     */
    attachFoldElementHandlers() {
        // Handle fold gutter icon clicks (both expand and collapse)
        const gutterIcons = this.foldGutter.querySelectorAll('.fold-gutter-icon');
        gutterIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();

                // Check if this is a collapsed fold (has fold-id)
                const foldId = icon.dataset.foldId;
                if (foldId) {
                    // Toggle existing fold
                    foldManager.toggleFold(foldId);
                    return;
                }

                // Otherwise, create new fold at this line
                const lineNumber = parseInt(icon.dataset.line);
                if (!isNaN(lineNumber)) {
                    const parsed = this.parser.getParsedLines();
                    const region = foldManager.detectFoldableRegion(lineNumber, parsed);
                    if (region) {
                        foldManager.createFold(region.startLine, region.endLine, region.label);
                    }
                }
            });
        });

        // Handle fold indicator clicks in overlay (for collapsed folds)
        const foldIndicators = this.overlay.querySelectorAll('.fold-indicator');
        foldIndicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                const foldId = indicator.dataset.foldId;
                if (foldId) {
                    foldManager.toggleFold(foldId);
                }
            });
        });
    }

    /**
     * Check if a line can be folded
     * @param {number} lineNumber - Line number
     * @param {array} parsedLines - Parsed lines
     * @returns {boolean} True if line is foldable
     */
    canFoldAtLine(lineNumber, parsedLines) {
        const region = foldManager.detectFoldableRegion(lineNumber, parsedLines);
        return region !== null && region.endLine > region.startLine;
    }
}

// Export singleton instance
const renderer = new Renderer();
export default renderer;
