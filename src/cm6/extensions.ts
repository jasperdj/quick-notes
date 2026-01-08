/**
 * CodeMirror 6 Extensions Setup
 * Base configuration for the editor
 */

import { EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  highlightSpecialChars,
  ViewUpdate
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {
  foldGutter,
  foldKeymap,
  codeFolding,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldService
} from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

// Import our custom plugins
import { invisibleCharsExtension } from './invisible-chars';
import { clipboardExtension } from './clipboard';

// Fold suffix regex (imported from folding module)
import { FOLD_SUFFIX_REGEX } from '../modules/folding';

/**
 * Custom markdown fold service
 * Detects headers and provides fold ranges
 * Respects our invisible fold markers
 */
const markdownFoldService = foldService.of((state, from, _to) => {
  const line = state.doc.lineAt(from);
  const text = line.text;

  // If line has our fold suffix, it's already folded by our system
  // Don't offer native CM6 folding for it
  if (FOLD_SUFFIX_REGEX.test(text)) {
    return null;
  }

  // Check for markdown header
  const headerMatch = text.match(/^(#{1,6})\s/);
  if (headerMatch) {
    const level = headerMatch[1].length;

    // Find the end of this section (next header of same or higher level, or end of doc)
    let endLine = line.number;
    for (let i = line.number + 1; i <= state.doc.lines; i++) {
      const nextLine = state.doc.line(i);

      // Stop at lines with our fold markers (already folded)
      if (FOLD_SUFFIX_REGEX.test(nextLine.text)) {
        endLine = i - 1;
        break;
      }

      // Stop at same/higher level header
      const nextHeader = nextLine.text.match(/^(#{1,6})\s/);
      if (nextHeader && nextHeader[1].length <= level) {
        endLine = i - 1;
        break;
      }
      endLine = i;
    }

    // Skip trailing empty lines
    while (endLine > line.number && state.doc.line(endLine).text.trim() === '') {
      endLine--;
    }

    if (endLine > line.number) {
      return { from: line.to, to: state.doc.line(endLine).to };
    }
  }

  // Check for code block start
  const codeBlockMatch = text.match(/^(`{3,})(\w*)/);
  if (codeBlockMatch) {
    const fence = codeBlockMatch[1];
    // Find closing fence
    for (let i = line.number + 1; i <= state.doc.lines; i++) {
      const nextLine = state.doc.line(i);
      if (nextLine.text.match(new RegExp(`^${fence}\\s*$`))) {
        return { from: line.to, to: nextLine.to };
      }
    }
  }

  return null;
});

/**
 * Custom fold placeholder widget
 */
function customFoldPlaceholder(_view: EditorView, onclick: (event: Event) => void) {
  const span = document.createElement('span');
  span.textContent = '...';
  span.className = 'cm-fold-placeholder';
  span.onclick = onclick;
  span.title = 'Click to expand';
  return span;
}

/**
 * Editor theme customizations
 */
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace"
  },
  '.cm-content': {
    padding: '20px 0'
  },
  '.cm-line': {
    padding: '0 20px'
  },
  '.cm-fold-placeholder': {
    background: '#3e3e42',
    color: '#858585',
    padding: '0 6px',
    borderRadius: '3px',
    fontSize: '11px',
    cursor: 'pointer',
    margin: '0 4px'
  },
  '.cm-fold-placeholder:hover': {
    background: '#4e4e52',
    color: '#d4d4d4'
  },
  '.cm-foldGutter .cm-gutterElement': {
    cursor: 'pointer',
    color: '#858585',
    transition: 'color 0.15s ease'
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    color: '#007acc'
  }
});

export interface ExtensionOptions {
  onUpdate?: (update: ViewUpdate) => void;
}

/**
 * Create the full extension set for the editor
 */
export function setupExtensions(options: ExtensionOptions = {}): Extension[] {
  const extensions: Extension[] = [
    // Basic editor features
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    rectangularSelection(),
    crosshairCursor(),
    bracketMatching(),

    // Folding
    codeFolding({
      placeholderDOM: customFoldPlaceholder
    }),
    foldGutter({
      openText: '\u25BC', // ▼
      closedText: '\u25B6' // ▶
    }),
    markdownFoldService,

    // Markdown support with code block highlighting
    markdown({
      base: markdownLanguage,
      codeLanguages: languages
    }),

    // Syntax highlighting
    syntaxHighlighting(defaultHighlightStyle),

    // Theme
    oneDark,
    editorTheme,

    // Keymaps
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap
    ]),

    // Our custom plugins for invisible fold markers and clipboard
    invisibleCharsExtension,
    clipboardExtension()
  ];

  // Add update listener if provided
  if (options.onUpdate) {
    extensions.push(
      EditorView.updateListener.of(options.onUpdate)
    );
  }

  return extensions;
}

export { EditorState, EditorView };
