/**
 * Invisible Characters Plugin for CodeMirror 6
 *
 * Handles the visual presentation of fold markers in the document.
 * The fold markers use zero-width Unicode characters:
 * - U+200B (ZWS) - start marker
 * - U+200C (ZWNJ) - binary 0
 * - U+200D (ZWJ) - binary 1
 * - U+FEFF (BOM) - end marker
 *
 * This plugin:
 * - Hides the invisible fold suffix from view
 * - Shows a visual fold indicator widget
 * - Preserves cursor behavior around markers
 */

import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { ZWS, ZWNJ, ZWJ, BOM } from '../modules/folding';

// Type for fold manager reference
interface FoldManagerLike {
  foldedContent: Map<number, { lineCount: number; label: string }>;
  expandFold(foldId: number): boolean;
  decodeFoldId(encoded: string): number;
}

// Global reference to fold manager (set during initialization)
let foldManagerRef: FoldManagerLike | null = null;

/**
 * Set the fold manager reference for the plugin
 */
export function setFoldManagerRef(fm: FoldManagerLike): void {
  foldManagerRef = fm;
}

/**
 * Widget that replaces the invisible fold marker with a visual indicator
 */
class FoldIndicatorWidget extends WidgetType {
  constructor(
    readonly foldId: number,
    readonly lineCount: number,
    readonly label: string
  ) {
    super();
  }

  toDOM(_view: EditorView): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-fold-indicator';
    span.textContent = `▼ ${this.lineCount} line${this.lineCount !== 1 ? 's' : ''}`;
    span.title = `Click to expand: ${this.label}`;
    span.dataset.foldId = String(this.foldId);

    // Click handler to expand fold
    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (foldManagerRef) {
        foldManagerRef.expandFold(this.foldId);
      }
    });

    return span;
  }

  eq(other: FoldIndicatorWidget): boolean {
    return this.foldId === other.foldId &&
           this.lineCount === other.lineCount;
  }

  ignoreEvent(): boolean {
    return false; // Allow click events
  }
}

/**
 * Regex to find fold markers - matches the entire invisible suffix
 */
const FOLD_MARKER_PATTERN = new RegExp(`${ZWS}[${ZWNJ}${ZWJ}]+${BOM}`, 'g');

/**
 * Build decorations for all fold markers in the visible range
 */
function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    let match;

    FOLD_MARKER_PATTERN.lastIndex = 0;
    while ((match = FOLD_MARKER_PATTERN.exec(text)) !== null) {
      const markerStart = from + match.index;
      const markerEnd = markerStart + match[0].length;

      // Decode the fold ID from the marker
      const encoded = match[0];
      let foldId = 0;
      let lineCount = 0;
      let label = 'Folded';

      if (foldManagerRef) {
        foldId = foldManagerRef.decodeFoldId(encoded);
        const foldData = foldManagerRef.foldedContent.get(foldId);
        if (foldData) {
          lineCount = foldData.lineCount;
          label = foldData.label;
        }
      }

      // Replace the invisible marker with a widget
      builder.add(
        markerStart,
        markerEnd,
        Decoration.replace({
          widget: new FoldIndicatorWidget(foldId, lineCount, label)
        })
      );
    }
  }

  return builder.finish();
}

/**
 * ViewPlugin that manages fold indicator decorations
 */
export const invisibleCharsPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Rebuild decorations if:
      // - Document changed
      // - Viewport changed (scrolled)
      // - View geometry changed
      if (update.docChanged || update.viewportChanged || update.geometryChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);

/**
 * Theme styling for fold indicators
 */
export const invisibleCharsTheme = EditorView.baseTheme({
  '.cm-fold-indicator': {
    display: 'inline-block',
    backgroundColor: '#3e3e42',
    color: '#858585',
    padding: '0 6px',
    borderRadius: '3px',
    fontSize: '11px',
    fontFamily: 'sans-serif',
    cursor: 'pointer',
    marginLeft: '4px',
    verticalAlign: 'middle',
    lineHeight: '1.4',
    transition: 'background-color 0.15s ease, color 0.15s ease'
  },
  '.cm-fold-indicator:hover': {
    backgroundColor: '#4e4e52',
    color: '#d4d4d4'
  },
  '.cm-fold-indicator:active': {
    backgroundColor: '#007acc',
    color: '#ffffff'
  }
});

/**
 * Extension bundle for invisible character handling
 */
export const invisibleCharsExtension = [
  invisibleCharsPlugin,
  invisibleCharsTheme
];

export default invisibleCharsExtension;
