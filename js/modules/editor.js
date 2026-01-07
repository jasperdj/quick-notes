/**
 * Editor Module - Line-based text editor for folded
 * Provides line operations and cursor management
 */

class Editor {
    constructor() {
        this.textarea = null;
        this.container = null;
        this.changeCallbacks = [];
        this.selectionCallbacks = [];
        this.debounceTimer = null;
        this.debounceDelay = 300; // milliseconds
    }

    /**
     * Initialize the editor with a container element
     * @param {HTMLElement} container - Container element for the editor
     */
    initialize(container) {
        this.container = container;
        this.textarea = container.querySelector('#editor') || container.querySelector('textarea');

        if (!this.textarea) {
            console.error('Textarea element not found in container');
            return false;
        }

        this.setupEventListeners();
        console.log('Editor initialized');
        return true;
    }

    /**
     * Set up event listeners for the textarea
     */
    setupEventListeners() {
        // Input events
        this.textarea.addEventListener('input', () => {
            this.triggerInputCallback();
        });

        // Selection change events
        this.textarea.addEventListener('click', () => {
            this.triggerSelectionCallback();
        });

        this.textarea.addEventListener('keyup', () => {
            this.triggerSelectionCallback();
        });

        // Scroll synchronization
        this.textarea.addEventListener('scroll', () => {
            this.syncScroll();
        });
    }

    /**
     * Trigger input callbacks with debouncing
     */
    triggerInputCallback() {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Immediate callback for real-time updates
        this.changeCallbacks.forEach(callback => callback());

        // Debounced callback for expensive operations (like saving)
        this.debounceTimer = setTimeout(() => {
            this.changeCallbacks.forEach(callback => {
                if (callback.debounced) {
                    callback();
                }
            });
        }, this.debounceDelay);
    }

    /**
     * Trigger selection change callbacks
     */
    triggerSelectionCallback() {
        this.selectionCallbacks.forEach(callback => callback());
    }

    /**
     * Sync scroll with overlay (for syntax highlighting)
     */
    syncScroll() {
        const overlay = this.container.querySelector('#overlay');
        if (overlay) {
            overlay.scrollTop = this.textarea.scrollTop;
            overlay.scrollLeft = this.textarea.scrollLeft;
        }
    }

    /**
     * Get content of a specific line
     * @param {number} lineNumber - Line number (0-indexed)
     * @returns {string|null} Line content or null if out of bounds
     */
    getLine(lineNumber) {
        const lines = this.getLines();
        return lineNumber >= 0 && lineNumber < lines.length ? lines[lineNumber] : null;
    }

    /**
     * Set content of a specific line
     * @param {number} lineNumber - Line number (0-indexed)
     * @param {string} content - New line content
     * @returns {boolean} Success status
     */
    setLine(lineNumber, content) {
        const lines = this.getLines();
        if (lineNumber >= 0 && lineNumber < lines.length) {
            lines[lineNumber] = content;
            this.setLines(lines);
            return true;
        }
        return false;
    }

    /**
     * Insert a new line at the specified position
     * @param {number} lineNumber - Position to insert (0-indexed)
     * @param {string} content - Line content
     * @returns {boolean} Success status
     */
    insertLine(lineNumber, content) {
        const lines = this.getLines();
        if (lineNumber >= 0 && lineNumber <= lines.length) {
            lines.splice(lineNumber, 0, content);
            this.setLines(lines);
            return true;
        }
        return false;
    }

    /**
     * Delete a line at the specified position
     * @param {number} lineNumber - Line to delete (0-indexed)
     * @returns {boolean} Success status
     */
    deleteLine(lineNumber) {
        const lines = this.getLines();
        if (lineNumber >= 0 && lineNumber < lines.length) {
            lines.splice(lineNumber, 1);
            this.setLines(lines);
            return true;
        }
        return false;
    }

    /**
     * Get all lines as an array
     * @returns {string[]} Array of lines
     */
    getLines() {
        const content = this.textarea.value;
        return content ? content.split('\n') : [''];
    }

    /**
     * Set all lines from an array
     * @param {string[]} lines - Array of lines
     */
    setLines(lines) {
        this.textarea.value = lines.join('\n');
        this.triggerInputCallback();
    }

    /**
     * Get the entire content as a string
     * @returns {string} All content
     */
    getContent() {
        return this.textarea.value;
    }

    /**
     * Set the entire content
     * @param {string} content - New content
     */
    setContent(content) {
        this.textarea.value = content;
        this.triggerInputCallback();
    }

    /**
     * Get cursor position
     * @returns {object} {line, col} - 0-indexed position
     */
    getCursor() {
        const pos = this.textarea.selectionStart;
        const content = this.textarea.value.substring(0, pos);
        const lines = content.split('\n');
        const line = lines.length - 1;
        const col = lines[lines.length - 1].length;
        return { line, col };
    }

    /**
     * Set cursor position
     * @param {number} line - Line number (0-indexed)
     * @param {number} col - Column number (0-indexed)
     */
    setCursor(line, col) {
        const lines = this.getLines();
        if (line < 0 || line >= lines.length) {
            return false;
        }

        let pos = 0;
        for (let i = 0; i < line; i++) {
            pos += lines[i].length + 1; // +1 for newline
        }
        pos += Math.min(col, lines[line].length);

        this.textarea.selectionStart = pos;
        this.textarea.selectionEnd = pos;
        this.textarea.focus();
        return true;
    }

    /**
     * Get selected text
     * @returns {string} Selected text
     */
    getSelection() {
        return this.textarea.value.substring(
            this.textarea.selectionStart,
            this.textarea.selectionEnd
        );
    }

    /**
     * Get selection range
     * @returns {object} {start: {line, col}, end: {line, col}}
     */
    getSelectionRange() {
        const content = this.textarea.value;
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;

        const getPosition = (pos) => {
            const substr = content.substring(0, pos);
            const lines = substr.split('\n');
            return {
                line: lines.length - 1,
                col: lines[lines.length - 1].length
            };
        };

        return {
            start: getPosition(start),
            end: getPosition(end)
        };
    }

    /**
     * Register a change callback
     * @param {function} callback - Function to call on content change
     * @param {boolean} debounced - Whether to debounce this callback
     */
    onChange(callback, debounced = false) {
        callback.debounced = debounced;
        this.changeCallbacks.push(callback);
    }

    /**
     * Register a selection change callback
     * @param {function} callback - Function to call on selection change
     */
    onSelectionChange(callback) {
        this.selectionCallbacks.push(callback);
    }

    /**
     * Get line count
     * @returns {number} Total number of lines
     */
    getLineCount() {
        return this.getLines().length;
    }

    /**
     * Focus the editor
     */
    focus() {
        this.textarea.focus();
    }

    /**
     * Scroll to a specific line
     * @param {number} lineNumber - Line to scroll to (0-indexed)
     */
    scrollToLine(lineNumber) {
        const lines = this.getLines();
        if (lineNumber < 0 || lineNumber >= lines.length) {
            return false;
        }

        // Calculate approximate scroll position
        const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight);
        const scrollTop = lineNumber * lineHeight;

        this.textarea.scrollTop = scrollTop;
        this.syncScroll();
        return true;
    }

    /**
     * Insert text at cursor position
     * @param {string} text - Text to insert
     */
    insertAtCursor(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const content = this.textarea.value;

        const newContent = content.substring(0, start) + text + content.substring(end);
        this.textarea.value = newContent;

        // Move cursor to end of inserted text
        const newPos = start + text.length;
        this.textarea.selectionStart = newPos;
        this.textarea.selectionEnd = newPos;

        this.triggerInputCallback();
    }
}

// Export singleton instance
const editor = new Editor();
export default editor;
