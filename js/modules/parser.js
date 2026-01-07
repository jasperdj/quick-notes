/**
 * Parser Module - Markdown parser for folded
 * Provides incremental line-based parsing
 */

class Parser {
    constructor() {
        this.lines = [];
        this.parsedLines = [];
        this.headerTree = [];
    }

    /**
     * Parse entire document
     * @param {string} content - Document content
     * @returns {array} Parsed lines with token information
     */
    parse(content) {
        this.lines = content.split('\n');
        this.parsedLines = [];
        this.headerTree = [];

        let inCodeBlock = false;
        let codeBlockLang = '';

        for (let i = 0; i < this.lines.length; i++) {
            const parsed = this.parseLine(this.lines[i], i, { inCodeBlock, codeBlockLang });

            // Update code block state
            if (parsed.type === 'code-fence') {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeBlockLang = parsed.lang || '';
                } else {
                    inCodeBlock = false;
                    codeBlockLang = '';
                }
            }

            // Track header tree
            if (parsed.type === 'header') {
                this.headerTree.push({
                    level: parsed.level,
                    text: parsed.text,
                    line: i
                });
            }

            this.parsedLines.push(parsed);
        }

        return this.parsedLines;
    }

    /**
     * Parse a single line
     * @param {string} line - Line content
     * @param {number} lineNumber - Line number
     * @param {object} context - Parsing context (code block state, etc.)
     * @returns {object} Parsed line data
     */
    parseLine(line, lineNumber, context = {}) {
        const trimmed = line.trim();

        // Headers with fold suffix: # Header ⟨id⟩
        // Check this BEFORE regular headers
        const foldedHeaderMatch = line.match(/^(#{1,6})\s+(.+?)\s*⟨(\d+)⟩$/);
        if (foldedHeaderMatch) {
            return {
                type: 'header',
                level: foldedHeaderMatch[1].length,
                text: foldedHeaderMatch[2],
                foldId: parseInt(foldedHeaderMatch[3], 10),
                isFolded: true,
                raw: line,
                lineNumber
            };
        }

        // Code fence with fold suffix: ```lang ⟨id⟩
        const foldedCodeMatch = line.match(/^```(\w*)\s*⟨(\d+)⟩$/);
        if (foldedCodeMatch) {
            return {
                type: 'code-fence',
                lang: foldedCodeMatch[1] || '',
                foldId: parseInt(foldedCodeMatch[2], 10),
                isFolded: true,
                raw: line,
                lineNumber
            };
        }

        // Code fence
        if (trimmed.startsWith('```')) {
            const lang = trimmed.slice(3).trim();
            return {
                type: 'code-fence',
                lang,
                isFolded: false,
                raw: line,
                lineNumber
            };
        }

        // Inside code block
        if (context.inCodeBlock) {
            return {
                type: 'code-block-line',
                raw: line,
                lineNumber
            };
        }

        // Headers (# through ######)
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            return {
                type: 'header',
                level: headerMatch[1].length,
                text: headerMatch[2],
                isFolded: false,
                raw: line,
                lineNumber
            };
        }

        // Checkboxes (- [ ] or - [x])
        const checkboxMatch = line.match(/^(\s*)-\s+\[([ x])\]\s+(.+)$/i);
        if (checkboxMatch) {
            return {
                type: 'checkbox',
                checked: checkboxMatch[2].toLowerCase() === 'x',
                text: checkboxMatch[3],
                indent: checkboxMatch[1].length,
                raw: line,
                lineNumber
            };
        }

        // Unordered lists (-, *, +)
        const unorderedListMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
        if (unorderedListMatch) {
            return {
                type: 'list-unordered',
                text: unorderedListMatch[2],
                indent: unorderedListMatch[1].length,
                raw: line,
                lineNumber
            };
        }

        // Ordered lists (1., 2., etc.)
        const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
        if (orderedListMatch) {
            return {
                type: 'list-ordered',
                number: parseInt(orderedListMatch[2]),
                text: orderedListMatch[3],
                indent: orderedListMatch[1].length,
                raw: line,
                lineNumber
            };
        }

        // Blockquotes (>)
        const blockquoteMatch = line.match(/^>\s+(.+)$/);
        if (blockquoteMatch) {
            return {
                type: 'blockquote',
                text: blockquoteMatch[1],
                raw: line,
                lineNumber
            };
        }

        // Horizontal rule (---, ___, ***)
        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
            return {
                type: 'hr',
                raw: line,
                lineNumber
            };
        }

        // Default: plain text
        return {
            type: 'text',
            raw: line,
            lineNumber,
            tokens: this.parseInlineTokens(line)
        };
    }

    /**
     * Parse inline markdown tokens (bold, italic, code, links)
     * @param {string} text - Text to parse
     * @returns {array} Array of tokens
     */
    parseInlineTokens(text) {
        const tokens = [];
        let current = 0;

        // Regex patterns for inline elements
        const patterns = [
            { name: 'code', regex: /`([^`]+)`/g },
            { name: 'bold', regex: /\*\*([^*]+)\*\*/g },
            { name: 'italic', regex: /\*([^*]+)\*/g },
            { name: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g }
        ];

        const matches = [];

        // Find all matches
        for (const pattern of patterns) {
            const regex = new RegExp(pattern.regex);
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    type: pattern.name,
                    start: match.index,
                    end: regex.lastIndex,
                    text: match[1],
                    url: match[2] // for links
                });
            }
        }

        // Sort matches by position
        matches.sort((a, b) => a.start - b.start);

        // Build token array
        for (const match of matches) {
            // Add plain text before this token
            if (match.start > current) {
                tokens.push({
                    type: 'text',
                    text: text.substring(current, match.start)
                });
            }

            // Add the token
            tokens.push(match);
            current = match.end;
        }

        // Add remaining text
        if (current < text.length) {
            tokens.push({
                type: 'text',
                text: text.substring(current)
            });
        }

        return tokens.length > 0 ? tokens : [{ type: 'text', text }];
    }

    /**
     * Get header tree structure
     * @returns {array} Array of header objects
     */
    getHeaderTree() {
        return this.headerTree;
    }

    /**
     * Get header path for a specific line
     * @param {number} lineNumber - Line number
     * @returns {string} Header path (e.g., "/Budget/Q1/Revenue")
     */
    getHeaderPath(lineNumber) {
        const path = [];
        let currentLevel = 0;

        for (const header of this.headerTree) {
            if (header.line > lineNumber) {
                break;
            }

            if (header.level > currentLevel) {
                path.push(header.text);
                currentLevel = header.level;
            } else if (header.level === currentLevel) {
                path[path.length - 1] = header.text;
            } else {
                // Going back up the tree
                path.splice(header.level - 1);
                path.push(header.text);
                currentLevel = header.level;
            }
        }

        return '/' + path.join('/');
    }

    /**
     * Invalidate and re-parse a range of lines
     * @param {number} start - Start line
     * @param {number} end - End line
     */
    invalidateRange(start, end) {
        // For now, just re-parse the entire document
        // Can be optimized later for incremental parsing
        if (this.lines.length > 0) {
            this.parse(this.lines.join('\n'));
        }
    }

    /**
     * Get parsed line data
     * @param {number} lineNumber - Line number
     * @returns {object|null} Parsed line data or null
     */
    getParsedLine(lineNumber) {
        return this.parsedLines[lineNumber] || null;
    }

    /**
     * Get all parsed lines
     * @returns {array} All parsed lines
     */
    getParsedLines() {
        return this.parsedLines;
    }
}

// Export singleton instance
const parser = new Parser();
export default parser;
