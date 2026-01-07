/**
 * Renderer Module - Syntax highlighting renderer for folded
 *
 * NEW ARCHITECTURE: No hidden lines, no gutter icons
 * - Fold markers are actual document content (parsed by parser)
 * - Renderer just displays what's in the document
 * - Click handlers on fold indicators to expand folds
 */

import parser from './parser.js';
import editor from './editor.js';
import foldManager from './folding.js';

class Renderer {
    constructor() {
        this.overlay = null;
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

        if (!this.overlay) {
            console.error('Overlay element not found');
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

        // Attach click handlers to fold indicators
        this.attachFoldClickHandlers();

        // Sync scroll positions
        this.syncScroll();
    }

    /**
     * Render parsed lines to HTML
     * Fold state is now embedded in the line itself (isFolded property)
     * @param {array} parsedLines - Array of parsed line objects
     * @returns {string} HTML string
     */
    renderLines(parsedLines) {
        const lines = [];
        let inCodeBlock = false;

        for (let i = 0; i < parsedLines.length; i++) {
            const line = parsedLines[i];

            // Track code block state to know if fence is opening or closing
            let isOpeningFence = false;
            if (line.type === 'code-fence') {
                isOpeningFence = !inCodeBlock;
                inCodeBlock = !inCodeBlock;
            }

            lines.push(`<div class="overlay-line">${this.renderLine(line, isOpeningFence)}</div>`);
        }

        return lines.join('');
    }

    /**
     * Render a single parsed line
     * @param {object} line - Parsed line object (includes isFolded, foldId if folded)
     * @param {boolean} isOpeningFence - Whether this code-fence is opening (not closing)
     * @returns {string} HTML string for the line
     */
    renderLine(line, isOpeningFence = false) {
        switch (line.type) {
            case 'header':
                // For folded headers, show the text without the suffix
                // line.text is the header text, line.raw includes the suffix
                const headerDisplay = line.isFolded
                    ? `${'#'.repeat(line.level)} ${line.text}`
                    : line.raw;
                const headerClass = line.isFolded ? 'syntax-header folded' : 'syntax-header';
                const headerDataAttr = line.isFolded
                    ? `data-fold-id="${line.foldId}"`
                    : `data-line="${line.lineNumber}"`;
                return `<span class="fold-button ${line.isFolded ? 'folded' : ''}" ${headerDataAttr}>▼</span>` +
                       `<span class="${headerClass}">${this.escapeHtml(headerDisplay)}</span>`;

            case 'code-fence':
                // Only show fold button on opening fence, not closing fence
                if (isOpeningFence) {
                    // For folded code fences, show without the suffix
                    const fenceDisplay = line.isFolded
                        ? '```' + (line.lang || '')
                        : line.raw;
                    const codeClass = line.isFolded ? 'syntax-code-block folded' : 'syntax-code-block';
                    const codeDataAttr = line.isFolded
                        ? `data-fold-id="${line.foldId}"`
                        : `data-line="${line.lineNumber}"`;
                    return `<span class="fold-button ${line.isFolded ? 'folded' : ''}" ${codeDataAttr}>▼</span>` +
                           `<span class="${codeClass}">${this.escapeHtml(fenceDisplay)}</span>`;
                } else {
                    // Closing fence - no fold button
                    return `<span class="syntax-code-block">${this.escapeHtml(line.raw)}</span>`;
                }

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
     * Attach click handlers to fold buttons (handles both fold and expand)
     */
    attachFoldClickHandlers() {
        const foldButtons = this.overlay.querySelectorAll('.fold-button');
        foldButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();

                // Check if this is a folded button (has fold-id) or expanded button (has line)
                const foldId = parseInt(button.dataset.foldId, 10);
                const lineNumber = parseInt(button.dataset.line, 10);

                if (!isNaN(foldId)) {
                    // Expand the fold
                    foldManager.expandFold(foldId);
                } else if (!isNaN(lineNumber)) {
                    // Create a fold
                    const parsed = this.parser.getParsedLines();
                    const region = foldManager.detectFoldableRegion(lineNumber, parsed, false);
                    if (region) {
                        foldManager.createFold(region.startLine, region.endLine, region.label);
                    }
                }
            });
        });
    }

    /**
     * Update a single line (for incremental rendering)
     * @param {number} lineNumber - Line number to update
     */
    updateLine(lineNumber) {
        // For now, just re-render everything
        this.render();
    }

    /**
     * Update a range of lines
     * @param {number} start - Start line
     * @param {number} end - End line
     */
    updateRange(start, end) {
        // For now, just re-render everything
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
}

// Export singleton instance
const renderer = new Renderer();
export default renderer;
