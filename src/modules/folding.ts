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

import editor from './editor';

// Zero-width characters for invisible fold encoding
export const ZWS = '\u200B';   // Start marker
export const ZWNJ = '\u200C';  // Binary 0
export const ZWJ = '\u200D';   // Binary 1
export const BOM = '\uFEFF';   // End marker

// Regex to detect invisible fold suffix
export const FOLD_SUFFIX_REGEX = new RegExp(`${ZWS}[${ZWNJ}${ZWJ}]+${BOM}$`);

export interface FoldedContentData {
  lines: string[];
  label: string;
  lineCount: number;
}

export interface FoldInfo {
  foldId: number;
  label: string;
  lineCount: number;
}

export interface ParsedLine {
  type: string;
  level?: number;
  text?: string;
  raw: string;
  lineNumber: number;
  isFolded?: boolean;
  foldId?: number;
  indent?: number;
  lang?: string;
}

export interface FoldRegion {
  startLine: number;
  endLine: number;
  type: string;
  label: string;
}

export interface FoldState {
  nextFoldId: number;
  folds: Array<{
    foldId: number;
    lines: string[];
    label: string;
    lineCount: number;
  }>;
}

interface EditorLike {
  getLines(): string[];
  setLines(lines: string[]): void;
}

class FoldManager {
  // Stores the actual content that was folded
  foldedContent: Map<number, FoldedContentData> = new Map();
  nextFoldId = 1;
  private changeCallbacks: Array<() => void> = [];
  private editorRef: EditorLike | null = null;

  /**
   * Set the editor reference (called during initialization)
   */
  setEditor(editorInstance: EditorLike): void {
    this.editorRef = editorInstance;
  }

  /**
   * Get the editor reference
   */
  private getEditor(): EditorLike {
    return this.editorRef || editor;
  }

  /**
   * Encode a fold ID as invisible zero-width characters
   */
  encodeFoldId(foldId: number): string {
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
   */
  decodeFoldId(encoded: string): number {
    const bits = encoded.slice(1, -1);
    let binary = '';
    for (const char of bits) {
      binary += char === ZWJ ? '1' : '0';
    }
    return parseInt(binary, 2);
  }

  /**
   * Create a fold suffix string (invisible)
   */
  createSuffix(foldId: number): string {
    return this.encodeFoldId(foldId);
  }

  /**
   * Parse a fold suffix from a line
   */
  parseSuffix(line: string): { foldId: number; baseLine: string } | null {
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
   */
  hasSuffix(line: string): boolean {
    return FOLD_SUFFIX_REGEX.test(line);
  }

  /**
   * Create a new fold - MODIFIES THE DOCUMENT
   */
  createFold(startLine: number, endLine: number, label = 'Folded'): number | null {
    const editorRef = this.getEditor();

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

    // Modify the document
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
   */
  expandFold(foldId: number): boolean {
    const editorRef = this.getEditor();

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
      this.foldedContent.delete(foldId);
      return false;
    }

    // Get the base line (without suffix)
    const parsed = this.parseSuffix(lines[foldLineIndex])!;
    const baseLine = parsed.baseLine;

    // Build new document
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
   */
  toggleFold(foldId: number): boolean | null {
    if (this.foldedContent.has(foldId)) {
      this.expandFold(foldId);
      return false; // Now expanded
    }

    console.warn('Cannot toggle fold - not found:', foldId);
    return null;
  }

  /**
   * Get all active (collapsed) folds
   */
  getAllFolds(): FoldInfo[] {
    return Array.from(this.foldedContent.entries()).map(([foldId, data]) => ({
      foldId,
      label: data.label,
      lineCount: data.lineCount
    }));
  }

  /**
   * Check if a fold is collapsed
   */
  isCollapsed(foldId: number): boolean {
    return this.foldedContent.has(foldId);
  }

  /**
   * Find the containing header for any line position
   */
  findContainingHeader(lineNumber: number, parsedLines: ParsedLine[]): { headerLine: number; level: number; label: string } | null {
    if (!parsedLines || lineNumber >= parsedLines.length) {
      return null;
    }

    for (let i = lineNumber; i >= 0; i--) {
      const line = parsedLines[i];
      if (line.type === 'header') {
        return {
          headerLine: i,
          level: line.level || 1,
          label: line.text || line.raw.replace(/^#+\s*/, '')
        };
      }
      if (line.type === 'header' && line.isFolded) {
        return null;
      }
    }

    return null;
  }

  /**
   * Detect foldable region at cursor position
   */
  detectFoldableRegion(lineNumber: number, parsedLines: ParsedLine[], findContaining = false): FoldRegion | null {
    if (!parsedLines || lineNumber >= parsedLines.length) {
      return null;
    }

    const currentLine = parsedLines[lineNumber];

    if (currentLine.isFolded) {
      return null;
    }

    // Header folding
    if (currentLine.type === 'header') {
      const endLine = this.findHeaderEnd(lineNumber, currentLine.level || 1, parsedLines);
      if (endLine > lineNumber) {
        return {
          startLine: lineNumber,
          endLine,
          type: 'header',
          label: currentLine.text || currentLine.raw.replace(/^#+\s*/, '')
        };
      }
    }

    // Code block folding
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

    // Find containing header
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

    // Code fence folding
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
  findHeaderEnd(startLine: number, level: number, parsedLines: ParsedLine[]): number {
    for (let i = startLine + 1; i < parsedLines.length; i++) {
      const line = parsedLines[i];
      if (line.type === 'header' && (line.level || 1) <= level) {
        return i - 1;
      }
    }
    return parsedLines.length - 1;
  }

  /**
   * Find end of code block
   */
  findCodeBlockEnd(startLine: number, parsedLines: ParsedLine[]): number {
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
  isInsideCodeBlock(lineNumber: number, parsedLines: ParsedLine[]): boolean {
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
   */
  findContainingCodeBlock(lineNumber: number, parsedLines: ParsedLine[]): { startLine: number; endLine: number; lang: string } | null {
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

    const endLine = this.findCodeBlockEnd(startLine, parsedLines);
    return { startLine, endLine, lang };
  }

  /**
   * Find end of list
   */
  findListEnd(startLine: number, parsedLines: ParsedLine[]): number {
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
  findBlockquoteEnd(startLine: number, parsedLines: ParsedLine[]): number {
    for (let i = startLine + 1; i < parsedLines.length; i++) {
      if (parsedLines[i].type !== 'blockquote') {
        return i - 1;
      }
    }
    return parsedLines.length - 1;
  }

  /**
   * Fold all foldable regions in the document
   */
  foldAll(parsedLines: ParsedLine[]): number {
    let count = 0;
    let i = 0;

    const regionsToFold: FoldRegion[] = [];

    while (i < parsedLines.length) {
      const region = this.detectFoldableRegion(i, parsedLines);
      if (region && region.endLine > region.startLine) {
        regionsToFold.push(region);
        i = region.endLine + 1;
      } else {
        i++;
      }
    }

    // Fold in reverse order
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
   */
  unfoldAll(): number {
    const foldIds = Array.from(this.foldedContent.keys());
    let count = 0;

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
  onChange(callback: () => void): void {
    this.changeCallbacks.push(callback);
  }

  /**
   * Notify all change callbacks
   */
  notifyChange(): void {
    this.changeCallbacks.forEach(callback => callback());
  }

  /**
   * Clear all folds
   */
  clear(): void {
    this.foldedContent.clear();
    this.notifyChange();
  }

  /**
   * Get fold state for persistence
   */
  getState(): FoldState {
    const state: FoldState = {
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
   */
  setState(state: FoldState | unknown): void {
    this.foldedContent.clear();

    if (!state || typeof state !== 'object') {
      return;
    }

    const s = state as FoldState;

    if (s.nextFoldId) {
      this.nextFoldId = s.nextFoldId;
    }

    if (s.folds) {
      for (const fold of s.folds) {
        this.foldedContent.set(fold.foldId, {
          lines: fold.lines,
          label: fold.label,
          lineCount: fold.lineCount
        });

        if (fold.foldId >= this.nextFoldId) {
          this.nextFoldId = fold.foldId + 1;
        }
      }
    }

    this.notifyChange();
    console.log(`Restored ${s.folds?.length || 0} folds`);
  }

  /**
   * Find fold marker at a specific line
   */
  getMarkerAtLine(lineNumber: number): { foldId: number; baseLine: string } | null {
    const editorRef = this.getEditor();
    const lines = editorRef.getLines();

    if (lineNumber < 0 || lineNumber >= lines.length) {
      return null;
    }

    return this.parseSuffix(lines[lineNumber]);
  }
}

// Export singleton instance
const foldManager = new FoldManager();
export default foldManager;
