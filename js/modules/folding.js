/**
 * Folding Module - Content-based folding system for folded
 *
 * ARCHITECTURE: Folds modify the document content
 * - When collapsing: removes lines, appends invisible suffix to header/fence
 * - When expanding: removes suffix, restores original lines
 * - Single source of truth: fold state is in the document itself
 *
 * Invisible encoding uses zero-width Unicode characters:
 * - U+200B (Zero Width Space) - start marker
 * - U+200C (ZWNJ) - binary 0
 * - U+200D (ZWJ) - binary 1
 * - U+FEFF (BOM) - end marker
 */

import editor from './editor.js';

// Zero-width characters for invisible fold encoding
const ZWS = '\u200B';   // Start marker
const ZWNJ = '\u200C';  // Binary 0
const ZWJ = '\u200D';   // Binary 1
const BOM = '\uFEFF';   // End marker

// Regex to detect invisible fold suffix
const FOLD_SUFFIX_REGEX = new RegExp(`${ZWS}[${ZWNJ}${ZWJ}]+${BOM}$`);

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
     * Encode a fold ID as invisible zero-width characters
     * @param {number} foldId - Fold ID
     * @returns {string} Invisible string encoding the ID
     */
    encodeFoldId(foldId) {
        // Convert to binary and encode each bit
        const binary = foldId.toString(2);
        let encoded = ZWS; // Start marker
        for (const bit of binary) {
            encoded += bit === '1' ? ZWJ : ZWNJ;
        }
        encoded += BOM; // End marker
        return encoded;
    }

    /**
     * Decode a fold ID from invisible characters
     * @param {string} encoded - The invisible suffix
     * @returns {number} The fold ID
     */
    decodeFoldId(encoded) {
        // Strip start and end markers
        const bits = encoded.slice(1, -1);
        let binary = '';
        for (const char of bits) {
            binary += char === ZWJ ? '1' : '0';
        }
        return parseInt(binary, 2);
    }

    /**
     * Create a fold suffix string (invisible)
     * @param {number} foldId - Fold ID
     * @returns {string} Invisible fold suffix
     */
    createSuffix(foldId) {
        return this.encodeFoldId(foldId);
    }

    /**
     * Parse a fold suffix from a line
     * @param {string} line - Line to parse
     * @returns {object|null} { foldId, baseLine } or null
     */
    parseSuffix(line) {
        const match = line.match(FOLD_SUFFIX_REGEX);
        if (!match) return null;

        const encoded = match[0];
        const foldId = this.decodeFoldId(encoded);

        return {
            foldId,
            baseLine: line.replace(FOLD_SUFFIX_REGEX, '')
        };
    }

    /**
     * Check if a line has a fold suffix
     * @param {string} line - Line to check
     * @returns {boolean}
     */
    hasSuffix(line) {
        return FOLD_SUFFIX_REGEX.test(line);
    }

    /**
     * Create a new fold - MODIFIES THE DOCUMENT
     * Appends fold suffix to header/fence line and removes content below
     * @param {number} startLine - Start line (the header/fence line, gets suffix)
     * @param {number} endLine - End line (inclusive, will be hidden)
     * @param {string} label - Label for storage
     * @returns {number|null} Fold ID or null if failed
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

        // Check if already folded (has suffix)
        if (this.hasSuffix(lines[startLine])) {
            console.warn('Line already has fold suffix');
            return null;
        }

        // Calculate what to fold
        // Keep startLine visible (with suffix), fold startLine+1 through endLine
        const foldStartIndex = startLine + 1;
        const linesToFold = lines.slice(foldStartIndex, endLine + 1);
        const lineCount = linesToFold.length;

        if (lineCount === 0) {
            console.warn('No lines to fold');
            return null;
        }

        // Generate fold ID
        const foldId = this.nextFoldId++;

        // Store the folded content
        this.foldedContent.set(foldId, {
            lines: linesToFold,
            label: label,
            lineCount: lineCount
        });

        // Modify the document:
        // 1. Append suffix to the start line
        // 2. Remove the folded lines
        const newLines = [
            ...lines.slice(0, startLine),
            lines[startLine] + this.createSuffix(foldId),
            ...lines.slice(endLine + 1)
        ];

        editorRef.setLines(newLines);

        this.notifyChange();
        console.log(`Created fold ${foldId}: "${label}" (${lineCount} lines)`);
        return foldId;
    }

    /**
     * Expand a fold - RESTORES THE ORIGINAL CONTENT
     * Removes suffix from header/fence and inserts stored content
     * @param {number} foldId - Fold ID to expand
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

        // Find line with this fold suffix
        const lines = editorRef.getLines();
        let foldLineIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const parsed = this.parseSuffix(lines[i]);
            if (parsed && parsed.foldId === foldId) {
                foldLineIndex = i;
                break;
            }
        }

        if (foldLineIndex === -1) {
            console.error('Fold suffix not found in document:', foldId);
            // Clean up orphaned content
            this.foldedContent.delete(foldId);
            return false;
        }

        // Get the base line (without suffix)
        const parsed = this.parseSuffix(lines[foldLineIndex]);
        const baseLine = parsed.baseLine;

        // Build new document:
        // 1. Lines before the fold
        // 2. The header/fence line WITHOUT suffix
        // 3. The restored content
        // 4. Lines after the fold
        const newLines = [
            ...lines.slice(0, foldLineIndex),
            baseLine,
            ...stored.lines,
            ...lines.slice(foldLineIndex + 1)
        ];

        editorRef.setLines(newLines);

        // Remove stored content
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
            // Stop at folded headers - don't cross fold boundaries
            if (line.type === 'header' && line.isFolded) {
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

        // Don't detect on already-folded lines
        if (currentLine.isFolded) {
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

        // If inside a code block, fold the whole code block
        if (currentLine.type === 'code-block-line' ||
            (findContaining && this.isInsideCodeBlock(lineNumber, parsedLines))) {
            const codeBlock = this.findContainingCodeBlock(lineNumber, parsedLines);
            if (codeBlock) {
                return {
                    startLine: codeBlock.startLine,
                    endLine: codeBlock.endLine,
                    type: 'code-block',
                    label: `Code (${codeBlock.lang || 'plain'})`
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

        // Code block folding (when on the opening fence)
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
     * Includes folded subheaders within the section
     */
    findHeaderEnd(startLine, level, parsedLines) {
        for (let i = startLine + 1; i < parsedLines.length; i++) {
            const line = parsedLines[i];
            // Stop at header of same or higher level (folded or not)
            if (line.type === 'header' && line.level <= level) {
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
     * Check if a line is inside a code block
     */
    isInsideCodeBlock(lineNumber, parsedLines) {
        let inCodeBlock = false;
        for (let i = 0; i <= lineNumber && i < parsedLines.length; i++) {
            if (parsedLines[i].type === 'code-fence') {
                inCodeBlock = !inCodeBlock;
            }
        }
        return inCodeBlock;
    }

    /**
     * Find the containing code block for a line
     * @returns {object|null} { startLine, endLine, lang } or null
     */
    findContainingCodeBlock(lineNumber, parsedLines) {
        // Scan backward to find the opening fence
        let startLine = -1;
        let lang = '';
        for (let i = lineNumber; i >= 0; i--) {
            if (parsedLines[i].type === 'code-fence') {
                startLine = i;
                lang = parsedLines[i].lang || '';
                break;
            }
        }

        if (startLine === -1) return null;

        // Find the closing fence
        const endLine = this.findCodeBlockEnd(startLine, parsedLines);

        return { startLine, endLine, lang };
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
