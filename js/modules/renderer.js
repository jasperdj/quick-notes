/**
 * Renderer Module - Syntax highlighting renderer for folded
 * Renders parsed markdown with syntax highlighting
 */

import parser from './parser.js';
import editor from './editor.js';

class Renderer {
    constructor() {
        this.overlay = null;
        this.editor = null;
        this.parser = null;
        this.renderTimer = null;
        this.renderDelay = 100; // milliseconds
        this.immediateRenderScheduled = false;
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

        console.log('Renderer initialized');
        return true;
    }

    /**
     * Schedule a render with debouncing
     */
    scheduleRender() {
        // Immediate plain text update for instant feedback
        if (!this.immediateRenderScheduled) {
            this.immediateRenderScheduled = true;
            requestAnimationFrame(() => {
                this.renderPlainText();
                this.immediateRenderScheduled = false;
            });
        }

        // Debounced syntax highlighting
        if (this.renderTimer) {
            clearTimeout(this.renderTimer);
        }

        this.renderTimer = setTimeout(() => {
            this.render();
        }, this.renderDelay);
    }

    /**
     * Immediate plain text render (for instant visual feedback)
     */
    renderPlainText() {
        if (!this.overlay) return;

        const content = this.editor.getContent();
        this.overlay.textContent = content; // textContent is faster than innerHTML
        this.syncScroll();
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

        // Sync scroll positions
        this.syncScroll();
    }

    /**
     * Render parsed lines to HTML
     * @param {array} parsedLines - Array of parsed line objects
     * @returns {string} HTML string
     */
    renderLines(parsedLines) {
        return parsedLines.map(line => this.renderLine(line)).join('\n');
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
}

// Export singleton instance
const renderer = new Renderer();
export default renderer;
