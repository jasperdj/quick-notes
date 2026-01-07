/**
 * Folding Module - Content-based folding system for folded
 *
 * NEW ARCHITECTURE: Folds actually modify the document content
 * - When collapsing: removes lines from document, stores them, inserts marker
 * - When expanding: removes marker, restores original lines
 * - This keeps textarea and overlay always in sync (single source of truth)
 */

import editor from './editor.js';

// Fold marker format: «F:id:label:n» (short to fit behind visual indicator)
const FOLD_MARKER_REGEX = /^«F:(\d+):([^:]*):(\d+)»$/;

class FoldManager {
    constructor() {
        // Stores the actual content that was folded
        // foldId -> { lines: string[], label: string, lineCount: number }
        this.foldedContent = new Map();

        this.nextFoldId = 1;
        this.changeCallbacks = [];
    }

    /**
     * Set the editor reference (called during initialization)
     * @param {object} editorInstance - The editor module instance
     */
    setEditor(editorInstance) {
        this.editor = editorInstance;
    }

    /**
     * Create a fold marker string
     * @param {number} foldId - Fold ID (number only)
     * @param {string} label - Display label
     * @param {number} lineCount - Number of hidden lines
     * @returns {string} Fold marker string
     */
    createMarker(foldId, label, lineCount) {
        // Escape colons in label, truncate to keep marker short
        const safeLabel = label.replace(/:/g, '∶').substring(0, 20);
        return `«F:${foldId}:${safeLabel}:${lineCount}»`;
    }

    /**
     * Parse a fold marker string
     * @param {string} line - Line to parse
     * @returns {object|null} { foldId, label, lineCount } or null
     */
    parseMarker(line) {
        const match = line.match(FOLD_MARKER_REGEX);
        if (!match) return null;

        return {
            foldId: parseInt(match[1], 10),
            label: match[2].replace(/∶/g, ':'), // Restore colons
            lineCount: parseInt(match[3], 10)
        };
    }

    /**
     * Check if a line is a fold marker
     * @param {string} line - Line to check
     * @returns {boolean}
     */
    isMarker(line) {
        return FOLD_MARKER_REGEX.test(line);
    }

    /**
     * Create a new fold - ACTUALLY MODIFIES THE DOCUMENT
     * @param {number} startLine - Start line (the header/trigger line, kept visible)
     * @param {number} endLine - End line (inclusive, will be hidden)
     * @param {string} label - Label for the fold indicator
     * @returns {string|null} Fold ID or null if failed
     */
    createFold(startLine, endLine, label = 'Folded') {
        const editorRef = this.editor || editor;

        // Validate
        if (startLine < 0 || endLine <= startLine) {
            console.error('Invalid fold range:', startLine, endLine);
            return null;
        }

        const lines = editorRef.getLines();
        if (endLine >= lines.length) {
            endLine = lines.length - 1;
        }

        // Check if trying to fold a fold marker
        if (this.isMarker(lines[startLine])) {
            console.warn('Cannot fold a fold marker');
            return null;
        }

        // Calculate what to fold
        // Keep startLine visible, fold startLine+1 through endLine
        const foldStartIndex = startLine + 1;
        const linesToFold = lines.slice(foldStartIndex, endLine + 1);
        const lineCount = linesToFold.length;

        if (lineCount === 0) {
            console.warn('No lines to fold');
            return null;
        }

        // Generate fold ID (just a number now)
        const foldId = this.nextFoldId++;

        // Store the folded content
        this.foldedContent.set(foldId, {
            lines: linesToFold,
            label: label,
            lineCount: lineCount
        });

        // Create the marker
        const marker = this.createMarker(foldId, label, lineCount);

        // Modify the document: remove folded lines, insert marker
        // The marker goes right after startLine (replacing the folded content)
        const newLines = [
            ...lines.slice(0, foldStartIndex),
            marker,
            ...lines.slice(endLine + 1)
        ];

        // Ensure there's always at least one line after the fold marker
        // so cursor has somewhere to go
        if (newLines[newLines.length - 1].match(/^«F:\d+:[^:]*:\d+»$/)) {
            newLines.push('');
        }

        editorRef.setLines(newLines);

        this.notifyChange();
        console.log(`Created fold ${foldId}: "${label}" (${lineCount} lines)`);
        return foldId;
    }

    /**
     * Expand a fold - RESTORES THE ORIGINAL CONTENT
     * @param {string} foldId - Fold ID to expand
     * @returns {boolean} Success
     */
    expandFold(foldId) {
        const editorRef = this.editor || editor;

        // Get stored content
        const stored = this.foldedContent.get(foldId);
        if (!stored) {
            console.error('Fold content not found:', foldId);
            return false;
        }

        // Find the marker in the document
        const lines = editorRef.getLines();
        let markerIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const parsed = this.parseMarker(lines[i]);
            if (parsed && parsed.foldId === foldId) {
                markerIndex = i;
                break;
            }
        }

        if (markerIndex === -1) {
            console.error('Fold marker not found in document:', foldId);
            // Clean up orphaned content
            this.foldedContent.delete(foldId);
            return false;
        }

        // Replace marker with stored lines
        const newLines = [
            ...lines.slice(0, markerIndex),
            ...stored.lines,
            ...lines.slice(markerIndex + 1)
        ];

        editorRef.setLines(newLines);

        // Remove from storage
        this.foldedContent.delete(foldId);

        this.notifyChange();
        console.log(`Expanded fold ${foldId}: restored ${stored.lineCount} lines`);
        return true;
    }

    /**
     * Toggle a fold by ID
     * @param {string} foldId - Fold ID
     * @returns {boolean} True if now collapsed, false if now expanded, null if error
     */
    toggleFold(foldId) {
        // If we have stored content, the fold is collapsed - expand it
        if (this.foldedContent.has(foldId)) {
            this.expandFold(foldId);
            return false; // Now expanded
        }

        // Fold doesn't exist in our storage - can't toggle
        console.warn('Cannot toggle fold - not found:', foldId);
        return null;
    }

    /**
     * Get all active (collapsed) folds
     * @returns {array} Array of { foldId, label, lineCount }
     */
    getAllFolds() {
        return Array.from(this.foldedContent.entries()).map(([foldId, data]) => ({
            foldId,
            label: data.label,
            lineCount: data.lineCount
        }));
    }

    /**
     * Check if a fold is collapsed
     * @param {string} foldId - Fold ID
     * @returns {boolean}
     */
    isCollapsed(foldId) {
        return this.foldedContent.has(foldId);
    }

    /**
     * Find the containing header for any line position
     * Scans backward to find which header "owns" this line
     * @param {number} lineNumber - Current line number
     * @param {array} parsedLines - Array of parsed lines from parser
     * @returns {object|null} { headerLine, level, label } or null
     */
    findContainingHeader(lineNumber, parsedLines) {
        if (!parsedLines || lineNumber >= parsedLines.length) {
            return null;
        }

        // Scan backward to find the nearest header
        for (let i = lineNumber; i >= 0; i--) {
            const line = parsedLines[i];
            if (line.type === 'header') {
                return {
                    headerLine: i,
                    level: line.level,
                    label: line.text || line.raw.replace(/^#+\s*/, '')
                };
            }
            // Stop at fold markers - don't cross fold boundaries
            if (line.type === 'fold-marker') {
                return null;
            }
        }

        return null;
    }

    /**
     * Detect foldable region at cursor position
     * Now supports finding containing header when cursor is anywhere in section
     * @param {number} lineNumber - Current line number
     * @param {array} parsedLines - Array of parsed lines from parser
     * @param {boolean} findContaining - If true, find containing header even if not on header line
     * @returns {object|null} { startLine, endLine, type, label } or null
     */
    detectFoldableRegion(lineNumber, parsedLines, findContaining = false) {
        if (!parsedLines || lineNumber >= parsedLines.length) {
            return null;
        }

        const currentLine = parsedLines[lineNumber];

        // Don't detect on fold markers
        if (currentLine.type === 'fold-marker') {
            return null;
        }

        // Header folding - if on a header line directly
        if (currentLine.type === 'header') {
            const endLine = this.findHeaderEnd(lineNumber, currentLine.level, parsedLines);
            if (endLine > lineNumber) {
                return {
                    startLine: lineNumber,
                    endLine,
                    type: 'header',
                    label: currentLine.text || currentLine.raw.replace(/^#+\s*/, '')
                };
            }
        }

        // If not on a header but findContaining is true, look for containing header
        if (findContaining && currentLine.type !== 'header') {
            const containing = this.findContainingHeader(lineNumber, parsedLines);
            if (containing) {
                const endLine = this.findHeaderEnd(containing.headerLine, containing.level, parsedLines);
                if (endLine > containing.headerLine) {
                    return {
                        startLine: containing.headerLine,
                        endLine,
                        type: 'header',
                        label: containing.label
                    };
                }
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
                    label: `Code (${currentLine.lang || 'plain'})`
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

        return null;
    }

    /**
     * Find end of header section
     */
    findHeaderEnd(startLine, level, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            const line = parsedLines[i];
            // Stop at header of same or higher level
            if (line.type === 'header' && line.level <= level) {
                return i - 1;
            }
            // Stop at fold markers (don't fold across them)
            if (line.type === 'fold-marker') {
                return i - 1;
            }
        }
        return parsedLines.length - 1;
    }

    /**
     * Find end of code block
     */
    findCodeBlockEnd(startLine, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            if (parsedLines[i].type === 'code-fence') {
                return i;
            }
        }
        return parsedLines.length - 1;
    }

    /**
     * Find end of list
     */
    findListEnd(startLine, parsedLines) {
        const startIndent = parsedLines[startLine].indent || 0;

        for (let i = startLine + 1; i < parsedLines.length; i++) {
            const line = parsedLines[i];
            const isListItem = line.type === 'list-ordered' ||
                             line.type === 'list-unordered' ||
                             line.type === 'checkbox';

            if (!isListItem && line.raw.trim() !== '') {
                return i - 1;
            }

            if (isListItem && (line.indent || 0) < startIndent) {
                return i - 1;
            }
        }

        return parsedLines.length - 1;
    }

    /**
     * Find end of blockquote
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
     * Fold all foldable regions in the document
     * @param {array} parsedLines - Parsed lines from parser
     * @returns {number} Number of folds created
     */
    foldAll(parsedLines) {
        let count = 0;
        let i = 0;

        // Process from end to start to avoid line number shifting issues
        const regionsToFold = [];

        while (i < parsedLines.length) {
            const region = this.detectFoldableRegion(i, parsedLines);
            if (region && region.endLine > region.startLine) {
                regionsToFold.push(region);
                i = region.endLine + 1;
            } else {
                i++;
            }
        }

        // Fold in reverse order (from bottom to top)
        for (let j = regionsToFold.length - 1; j >= 0; j--) {
            const region = regionsToFold[j];
            const foldId = this.createFold(region.startLine, region.endLine, region.label);
            if (foldId) {
                count++;
            }
        }

        console.log(`Folded ${count} regions`);
        return count;
    }

    /**
     * Unfold all folds in the document
     * @returns {number} Number of folds expanded
     */
    unfoldAll() {
        const editorRef = this.editor || editor;
        const foldIds = Array.from(this.foldedContent.keys());
        let count = 0;

        // Expand in reverse order of creation to maintain line positions
        for (const foldId of foldIds.reverse()) {
            if (this.expandFold(foldId)) {
                count++;
            }
        }

        console.log(`Unfolded ${count} regions`);
        return count;
    }

    /**
     * Register a change callback
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
     * Clear all folds (without restoring content - use unfoldAll for that)
     */
    clear() {
        this.foldedContent.clear();
        this.notifyChange();
    }

    /**
     * Get fold state for persistence
     * @returns {object} State object with foldedContent
     */
    getState() {
        const state = {
            nextFoldId: this.nextFoldId,
            folds: []
        };

        for (const [foldId, data] of this.foldedContent.entries()) {
            state.folds.push({
                foldId,
                lines: data.lines,
                label: data.label,
                lineCount: data.lineCount
            });
        }

        return state;
    }

    /**
     * Restore fold state from persistence
     * Note: This assumes the document already has the fold markers in place
     * @param {object} state - State object from getState()
     */
    setState(state) {
        this.foldedContent.clear();

        if (!state || !state.folds) {
            return;
        }

        // Restore nextFoldId
        if (state.nextFoldId) {
            this.nextFoldId = state.nextFoldId;
        }

        // Restore folded content
        for (const fold of state.folds) {
            this.foldedContent.set(fold.foldId, {
                lines: fold.lines,
                label: fold.label,
                lineCount: fold.lineCount
            });

            // Update nextFoldId if needed (foldId is now a number)
            const idNum = typeof fold.foldId === 'number' ? fold.foldId : parseInt(fold.foldId);
            if (!isNaN(idNum) && idNum >= this.nextFoldId) {
                this.nextFoldId = idNum + 1;
            }
        }

        this.notifyChange();
        console.log(`Restored ${state.folds.length} folds`);
    }

    /**
     * Find fold marker at a specific line
     * @param {number} lineNumber - Line number to check
     * @returns {object|null} Parsed marker info or null
     */
    getMarkerAtLine(lineNumber) {
        const editorRef = this.editor || editor;
        const lines = editorRef.getLines();

        if (lineNumber < 0 || lineNumber >= lines.length) {
            return null;
        }

        return this.parseMarker(lines[lineNumber]);
    }
}

// Export singleton instance
const foldManager = new FoldManager();
export default foldManager;
