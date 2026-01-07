/**
 * Folding Module - Advanced folding system for folded
 * Allows arbitrary fold points with smart detection
 */

class FoldManager {
    constructor() {
        this.folds = new Map(); // foldId -> fold object
        this.lineToFolds = new Map(); // lineNumber -> Set of foldIds
        this.nextFoldId = 1;
        this.changeCallbacks = [];
    }

    /**
     * Create a new fold
     * @param {number} startLine - Start line (inclusive, 0-indexed)
     * @param {number} endLine - End line (inclusive, 0-indexed)
     * @param {string} label - Optional label for the fold
     * @returns {string} Fold ID
     */
    createFold(startLine, endLine, label = null) {
        // Validate input
        if (startLine < 0 || endLine < startLine) {
            console.error('Invalid fold range:', startLine, endLine);
            return null;
        }

        // Check for overlapping folds
        const overlaps = this.getOverlappingFolds(startLine, endLine);
        if (overlaps.length > 0) {
            console.warn('Overlapping folds detected - merging or preventing');
            // For now, prevent overlapping folds
            // Can be enhanced to support nested folds later
            return null;
        }

        const foldId = `fold-${this.nextFoldId++}`;
        const fold = {
            id: foldId,
            startLine,
            endLine,
            collapsed: true, // Folds are collapsed by default
            label: label || this.generateLabel(startLine, endLine)
        };

        this.folds.set(foldId, fold);
        this.indexFold(fold);

        this.notifyChange();
        console.log('Created fold:', fold);
        return foldId;
    }

    /**
     * Remove a fold
     * @param {string} foldId - Fold ID to remove
     * @returns {boolean} Success status
     */
    removeFold(foldId) {
        const fold = this.folds.get(foldId);
        if (!fold) {
            return false;
        }

        this.unindexFold(fold);
        this.folds.delete(foldId);

        this.notifyChange();
        console.log('Removed fold:', foldId);
        return true;
    }

    /**
     * Toggle fold collapsed state
     * @param {string} foldId - Fold ID to toggle
     * @returns {boolean} New collapsed state
     */
    toggleFold(foldId) {
        const fold = this.folds.get(foldId);
        if (!fold) {
            console.error('Fold not found:', foldId);
            return null;
        }

        fold.collapsed = !fold.collapsed;
        this.notifyChange();
        console.log('Toggled fold:', foldId, 'collapsed:', fold.collapsed);
        return fold.collapsed;
    }

    /**
     * Collapse a fold
     * @param {string} foldId - Fold ID
     * @returns {boolean} Success status
     */
    collapseFold(foldId) {
        const fold = this.folds.get(foldId);
        if (!fold) return false;

        fold.collapsed = true;
        this.notifyChange();
        return true;
    }

    /**
     * Expand a fold
     * @param {string} foldId - Fold ID
     * @returns {boolean} Success status
     */
    expandFold(foldId) {
        const fold = this.folds.get(foldId);
        if (!fold) return false;

        fold.collapsed = false;
        this.notifyChange();
        return true;
    }

    /**
     * Get all folds
     * @returns {array} Array of fold objects
     */
    getAllFolds() {
        return Array.from(this.folds.values());
    }

    /**
     * Get folds that overlap with a range
     * @param {number} startLine - Start line
     * @param {number} endLine - End line
     * @returns {array} Array of overlapping folds
     */
    getOverlappingFolds(startLine, endLine) {
        const overlapping = [];

        for (const fold of this.folds.values()) {
            // Check if ranges overlap
            if (!(endLine < fold.startLine || startLine > fold.endLine)) {
                overlapping.push(fold);
            }
        }

        return overlapping;
    }

    /**
     * Get fold at a specific line
     * @param {number} lineNumber - Line number
     * @returns {object|null} Fold object or null
     */
    getFoldAtLine(lineNumber) {
        const foldIds = this.lineToFolds.get(lineNumber);
        if (!foldIds || foldIds.size === 0) {
            return null;
        }

        // Return the first fold (for now, assuming no nested folds)
        const foldId = Array.from(foldIds)[0];
        return this.folds.get(foldId);
    }

    /**
     * Check if a line is visible (not hidden by a fold)
     * @param {number} lineNumber - Line number to check
     * @returns {boolean} True if visible
     */
    isLineVisible(lineNumber) {
        for (const fold of this.folds.values()) {
            if (fold.collapsed &&
                lineNumber > fold.startLine &&
                lineNumber <= fold.endLine) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get array of visible line numbers
     * @param {number} totalLines - Total number of lines in document
     * @returns {array} Array of visible line numbers
     */
    getVisibleLines(totalLines) {
        const visible = [];
        for (let i = 0; i < totalLines; i++) {
            if (this.isLineVisible(i)) {
                visible.push(i);
            }
        }
        return visible;
    }

    /**
     * Detect foldable region at cursor
     * @param {number} lineNumber - Current line number
     * @param {object} parsedLines - Array of parsed lines from parser
     * @returns {object|null} {startLine, endLine, type} or null
     */
    detectFoldableRegion(lineNumber, parsedLines) {
        if (!parsedLines || lineNumber >= parsedLines.length) {
            return null;
        }

        const currentLine = parsedLines[lineNumber];

        // Header folding: fold from header to next header of same/higher level
        if (currentLine.type === 'header') {
            const endLine = this.findHeaderEnd(lineNumber, currentLine.level, parsedLines);
            if (endLine > lineNumber) {
                return {
                    startLine: lineNumber,
                    endLine,
                    type: 'header',
                    label: currentLine.text
                };
            }
        }

        // Code block folding
        if (currentLine.type === 'code-fence') {
            const endLine = this.findCodeBlockEnd(lineNumber, parsedLines);
            if (endLine > lineNumber) {
                return {
                    startLine: lineNumber,
                    endLine,
                    type: 'code-block',
                    label: `Code block (${currentLine.lang || 'plain'})`
                };
            }
        }

        // List folding
        if (currentLine.type === 'list-ordered' ||
            currentLine.type === 'list-unordered' ||
            currentLine.type === 'checkbox') {
            const endLine = this.findListEnd(lineNumber, parsedLines);
            if (endLine > lineNumber) {
                return {
                    startLine: lineNumber,
                    endLine,
                    type: 'list',
                    label: 'List'
                };
            }
        }

        // Blockquote folding
        if (currentLine.type === 'blockquote') {
            const endLine = this.findBlockquoteEnd(lineNumber, parsedLines);
            if (endLine > lineNumber) {
                return {
                    startLine: lineNumber,
                    endLine,
                    type: 'blockquote',
                    label: 'Blockquote'
                };
            }
        }

        // Paragraph folding (group of consecutive text lines)
        if (currentLine.type === 'text' && currentLine.raw.trim() !== '') {
            const endLine = this.findParagraphEnd(lineNumber, parsedLines);
            if (endLine > lineNumber) {
                return {
                    startLine: lineNumber,
                    endLine,
                    type: 'paragraph',
                    label: 'Paragraph'
                };
            }
        }

        return null;
    }

    /**
     * Find end of header section
     * @param {number} startLine - Header line number
     * @param {number} level - Header level
     * @param {array} parsedLines - Parsed lines
     * @returns {number} End line number
     */
    findHeaderEnd(startLine, level, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            const line = parsedLines[i];
            // Stop at header of same or higher level (lower number)
            if (line.type === 'header' && line.level <= level) {
                return i - 1;
            }
        }
        // Fold to end of document
        return parsedLines.length - 1;
    }

    /**
     * Find end of code block
     * @param {number} startLine - Code fence line number
     * @param {array} parsedLines - Parsed lines
     * @returns {number} End line number
     */
    findCodeBlockEnd(startLine, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            if (parsedLines[i].type === 'code-fence') {
                return i;
            }
        }
        // If no closing fence, fold to end
        return parsedLines.length - 1;
    }

    /**
     * Find end of list
     * @param {number} startLine - List line number
     * @param {array} parsedLines - Parsed lines
     * @returns {number} End line number
     */
    findListEnd(startLine, parsedLines) {
        const startIndent = parsedLines[startLine].indent || 0;

        for (let i = startLine + 1; i < parsedLines.length; i++) {
            const line = parsedLines[i];
            const isListItem = line.type === 'list-ordered' ||
                             line.type === 'list-unordered' ||
                             line.type === 'checkbox';

            // Continue if it's a list item at same or deeper indent
            if (isListItem && (line.indent || 0) >= startIndent) {
                continue;
            }

            // Stop if it's not a list item or shallower indent
            if (!isListItem || (line.indent || 0) < startIndent) {
                return i - 1;
            }
        }

        return parsedLines.length - 1;
    }

    /**
     * Find end of blockquote
     * @param {number} startLine - Blockquote line number
     * @param {array} parsedLines - Parsed lines
     * @returns {number} End line number
     */
    findBlockquoteEnd(startLine, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            if (parsedLines[i].type !== 'blockquote') {
                return i - 1;
            }
        }
        return parsedLines.length - 1;
    }

    /**
     * Find end of paragraph
     * @param {number} startLine - Paragraph start line
     * @param {array} parsedLines - Parsed lines
     * @returns {number} End line number
     */
    findParagraphEnd(startLine, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            const line = parsedLines[i];
            // Stop at empty line or non-text line
            if (line.type !== 'text' || line.raw.trim() === '') {
                return i - 1;
            }
        }
        return parsedLines.length - 1;
    }

    /**
     * Fold all foldable regions
     * @param {array} parsedLines - Parsed lines from parser
     * @returns {number} Number of folds created
     */
    foldAll(parsedLines) {
        let count = 0;
        let i = 0;

        while (i < parsedLines.length) {
            const region = this.detectFoldableRegion(i, parsedLines);
            if (region && region.endLine > region.startLine) {
                const foldId = this.createFold(region.startLine, region.endLine, region.label);
                if (foldId) {
                    count++;
                    i = region.endLine + 1; // Skip past folded region
                    continue;
                }
            }
            i++;
        }

        console.log(`Folded ${count} regions`);
        return count;
    }

    /**
     * Unfold all folds
     * @returns {number} Number of folds removed
     */
    unfoldAll() {
        const count = this.folds.size;
        this.folds.clear();
        this.lineToFolds.clear();
        this.notifyChange();
        console.log(`Unfolded ${count} regions`);
        return count;
    }

    /**
     * Index a fold for quick lookup
     * @param {object} fold - Fold object
     */
    indexFold(fold) {
        for (let line = fold.startLine; line <= fold.endLine; line++) {
            if (!this.lineToFolds.has(line)) {
                this.lineToFolds.set(line, new Set());
            }
            this.lineToFolds.get(line).add(fold.id);
        }
    }

    /**
     * Remove fold from index
     * @param {object} fold - Fold object
     */
    unindexFold(fold) {
        for (let line = fold.startLine; line <= fold.endLine; line++) {
            const foldIds = this.lineToFolds.get(line);
            if (foldIds) {
                foldIds.delete(fold.id);
                if (foldIds.size === 0) {
                    this.lineToFolds.delete(line);
                }
            }
        }
    }

    /**
     * Generate a label for a fold
     * @param {number} startLine - Start line
     * @param {number} endLine - End line
     * @returns {string} Label
     */
    generateLabel(startLine, endLine) {
        const lineCount = endLine - startLine;
        return `${lineCount} line${lineCount !== 1 ? 's' : ''} folded`;
    }

    /**
     * Register a change callback
     * @param {function} callback - Function to call when folds change
     */
    onChange(callback) {
        this.changeCallbacks.push(callback);
    }

    /**
     * Notify all change callbacks
     */
    notifyChange() {
        this.changeCallbacks.forEach(callback => callback());
    }

    /**
     * Clear all folds
     */
    clear() {
        this.folds.clear();
        this.lineToFolds.clear();
        this.notifyChange();
    }

    /**
     * Get fold state for persistence
     * @returns {array} Array of fold objects (without methods)
     */
    getState() {
        return Array.from(this.folds.values()).map(fold => ({
            id: fold.id,
            startLine: fold.startLine,
            endLine: fold.endLine,
            collapsed: fold.collapsed,
            label: fold.label
        }));
    }

    /**
     * Restore fold state from persistence
     * @param {array} state - Array of fold objects
     */
    setState(state) {
        this.clear();

        if (!state || !Array.isArray(state)) {
            return;
        }

        for (const fold of state) {
            const foldId = fold.id || `fold-${this.nextFoldId++}`;
            const foldObj = {
                id: foldId,
                startLine: fold.startLine,
                endLine: fold.endLine,
                collapsed: fold.collapsed !== false, // Default to collapsed
                label: fold.label || this.generateLabel(fold.startLine, fold.endLine)
            };

            this.folds.set(foldId, foldObj);
            this.indexFold(foldObj);

            // Update nextFoldId to avoid collisions
            const idNum = parseInt(foldId.replace('fold-', ''));
            if (!isNaN(idNum) && idNum >= this.nextFoldId) {
                this.nextFoldId = idNum + 1;
            }
        }

        this.notifyChange();
        console.log(`Restored ${state.length} folds`);
    }
}

// Export singleton instance
const foldManager = new FoldManager();
export default foldManager;
