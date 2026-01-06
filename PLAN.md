# FoldingText Web - Implementation Plan

## Executive Summary

Building a web-based version of FoldingText with these key requirements:
- **Serverless**: Runs entirely client-side
- **Storage**: IndexedDB for persistence
- **Format**: Plain text markdown (no WYSIWYG)
- **Performance**: Handle large content (CSV dumps, etc.) without slowdown
- **Core Feature**: Collapse content at ANY point (not just at headers)
- **UI**: Simplistic yet elegant
- **Rich Content**: Support images, attachments, tables, and code previews
- **Navigation**: URL-based focus navigation with hierarchical structure
- **Search**: Powerful regex search/replace with scope control
- **Export/Import**: Encrypted, compressed, header-scoped data portability

---

## 1. Application Architecture

### 1.1 Technology Stack
```
Frontend:
├── Vanilla JavaScript (ES6+ modules) - No framework overhead for performance
├── HTML5 - Semantic structure
└── CSS3 - Modern styling with CSS variables for theming

Storage:
└── IndexedDB - Asynchronous, handles large data efficiently

Optional:
├── Web Workers - For heavy parsing/processing
└── Service Worker - For offline capability (future enhancement)
```

### 1.2 File Structure
```
quick-notes/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest (optional)
├── css/
│   ├── main.css           # Core styles
│   ├── editor.css         # Editor-specific styles
│   ├── themes.css         # Color themes (base + custom)
│   └── richcontent.css    # Styles for images, tables, attachments
├── js/
│   ├── main.js            # Application entry point
│   ├── modules/
│   │   ├── editor.js      # Editor controller
│   │   ├── storage.js     # IndexedDB wrapper
│   │   ├── folding.js     # Folding/collapse logic
│   │   ├── parser.js      # Markdown parsing
│   │   ├── renderer.js    # Virtual rendering engine
│   │   ├── keyboard.js    # Keyboard shortcuts
│   │   ├── search.js      # Search and replace (regex)
│   │   ├── navigation.js  # URL-based navigation
│   │   ├── export.js      # Export with encryption/compression
│   │   ├── import.js      # Import handler
│   │   ├── richcontent.js # Images, attachments, tables
│   │   ├── themes.js      # Theme management
│   │   └── utils.js       # Utility functions
│   └── workers/
│       ├── parser.worker.js    # Background parsing
│       ├── crypto.worker.js    # Encryption/decryption
│       └── compression.worker.js # Compression for export
└── README.md
```

### 1.3 Core Modules

**Editor Module** (`editor.js`)
- Manages the main editing surface
- Handles text input and cursor management
- Coordinates between other modules
- Implements undo/redo

**Storage Module** (`storage.js`)
- IndexedDB wrapper for document persistence
- Auto-save functionality
- Document versioning (optional)
- Import/export capabilities

**Folding Module** (`folding.js`)
- **Critical Innovation**: Arbitrary fold points
- Fold state management
- Visual indicators for folds
- Keyboard navigation through folds

**Parser Module** (`parser.js`)
- Lightweight markdown tokenization
- Line-based parsing for performance
- Incremental parsing (only re-parse changed regions)
- Structure detection (headers, lists, code blocks)

**Renderer Module** (`renderer.js`)
- Virtual scrolling for large documents
- Efficient DOM updates (only visible lines)
- Syntax highlighting for markdown
- Fold visual representation
- Selection-aware rendering (preserve lines during text selection)

**Search Module** (`search.js`)
- Regex-based search and replace
- Scope control: current header, nested headers, entire document
- Search history and incremental search
- Match highlighting

**Navigation Module** (`navigation.js`)
- URL-based focus navigation
- Header hierarchy management (directory-style paths)
- Auto-hide parent headers when focused
- Browser history integration

**Export/Import Module** (`export.js`, `import.js`)
- Header-scoped export (current section + children)
- Compression (gzip/brotli)
- Encryption (AES-256-GCM, discrete UI)
- Directory-style header selection

**Rich Content Module** (`richcontent.js`)
- Inline images with resizing
- File attachments (stored in IndexedDB)
- Graphical table rendering (togglable)
- Code block preview (especially HTML/JS)
- Preview window management

**Themes Module** (`themes.js`)
- Custom theme creation and management
- Theme persistence
- CSS variable manipulation
- Import/export themes

---

## 2. Data Model

### 2.1 Document Structure
```javascript
{
  id: "unique-doc-id",
  title: "Document Title",
  content: "raw markdown text",  // Plain text, newline-separated
  created: timestamp,
  modified: timestamp,
  metadata: {
    lineCount: number,
    charCount: number,
    foldCount: number,
    attachmentCount: number,
    imageCount: number
  },
  folds: [
    {
      id: "fold-uuid",
      startLine: number,        // 0-indexed line number
      endLine: number,          // 0-indexed line number
      collapsed: boolean,
      label: "optional label"   // Preview text when collapsed
    }
  ],
  attachments: [
    {
      id: "attachment-uuid",
      fileName: "document.pdf",
      mimeType: "application/pdf",
      size: number,             // bytes
      data: ArrayBuffer,        // Binary data
      lineNumber: number,       // Where it's referenced in content
      thumbnail: "base64..."    // Optional preview image
    }
  ],
  images: [
    {
      id: "image-uuid",
      fileName: "photo.jpg",
      data: "base64..." or ArrayBuffer,
      width: number,            // Display width (can be resized)
      height: number,           // Display height
      originalWidth: number,
      originalHeight: number,
      lineNumber: number
    }
  ],
  cursor: {
    line: number,
    column: number
  },
  scroll: {
    top: number
  },
  focusedHeader: {
    path: "/Header 1/Subheader 2",  // Directory-style path
    lineNumber: number
  }
}
```

### 2.2 IndexedDB Schema
```javascript
Database: "FoldingTextDB"
Version: 1

Object Stores:
├── documents
│   ├── keyPath: "id"
│   └── indexes: ["modified", "title"]
│
├── attachments
│   ├── keyPath: "id"
│   └── indexes: ["documentId", "fileName"]
│
├── images
│   ├── keyPath: "id"
│   └── indexes: ["documentId"]
│
├── themes
│   ├── keyPath: "id"
│   └── Custom theme definitions
│
├── settings
│   └── keyPath: "key"
│
└── autosave
    ├── keyPath: "id"
    └── Temporary storage for recovery
```

### 2.3 In-Memory Representation
For performance, maintain in-memory structures:
```javascript
{
  lines: [                    // Array of line objects
    {
      text: "line content",
      lineNumber: number,
      tokens: [],             // Parsed markdown tokens
      isFoldStart: boolean,
      isFoldEnd: boolean,
      isHidden: boolean,      // Hidden by parent fold
      foldId: "fold-uuid"     // If part of a fold
    }
  ],
  visibleLines: [],           // Indexes of visible lines
  foldMap: Map(),            // foldId -> fold object
  lineToFoldMap: Map()       // lineNumber -> foldId[]
}
```

---

## 3. Folding/Collapsing Mechanism

### 3.1 The Innovation: Arbitrary Folding
Unlike traditional outliners that only fold at headers, this implementation allows:
- **Selection-based folding**: Select any range and fold it
- **Smart folding**: Auto-detect foldable regions (headers, lists, code blocks)
- **Inline folding**: Collapse in the middle of content without scrolling

### 3.2 Folding Behavior
```
User Actions:
1. Manual Selection Fold
   - Select text (multiple lines)
   - Press fold shortcut (Cmd/Ctrl + .)
   - Creates fold from selection start to end

2. Smart Fold
   - Cursor on header line → fold entire section
   - Cursor in list → fold list items
   - Cursor in code block → fold block
   - Cursor anywhere → fold paragraph

3. Fold All/Unfold All
   - Collapse all headers
   - Collapse all code blocks
   - Expand everything

Visual Representation:
┌─────────────────────────────────┐
│ # Header 1                      │
│ Some content...                 │
│ ▶ [Lines 3-15 collapsed] ...    │ ← Fold indicator
│ More content after fold         │
│ ## Header 2                     │
└─────────────────────────────────┘
```

### 3.3 Fold Management
```javascript
class FoldManager {
  createFold(startLine, endLine, label?)
  removeFold(foldId)
  toggleFold(foldId)
  getFoldsInRange(startLine, endLine)
  getVisibleLines()
  navigateToNextFold()
  navigateToPreviousFold()
}
```

### 3.4 Edge Cases
- Nested folds: Allow folds within folds
- Overlapping folds: Prevent or merge
- Editing folded content: Auto-expand or edit in-place
- Moving/deleting folded regions: Update fold boundaries

---

## 4. Search & Replace

### 4.1 Powerful Regex Search
Full-featured search with scope control and regex support:

```javascript
class SearchEngine {
  constructor(document) {
    this.document = document
    this.currentMatches = []
    this.currentMatchIndex = 0
  }

  search(pattern, options = {}) {
    const {
      regex = false,        // Enable regex patterns
      caseSensitive = false,
      scope = 'document',   // 'document', 'header', 'nested'
      headerPath = null     // For header/nested scope
    } = options

    const searchRange = this.getSearchRange(scope, headerPath)
    const flags = caseSensitive ? 'g' : 'gi'
    const searchRegex = regex ? new RegExp(pattern, flags) : new RegExp(this.escapeRegex(pattern), flags)

    this.currentMatches = this.findMatches(searchRegex, searchRange)
    return this.currentMatches
  }

  replace(pattern, replacement, options = {}) {
    // Similar to search, but with replacement logic
    // Supports regex capture groups ($1, $2, etc.)
  }

  replaceAll(pattern, replacement, options = {}) {
    // Replace all matches within scope
  }

  getSearchRange(scope, headerPath) {
    switch (scope) {
      case 'document':
        return { start: 0, end: this.document.lines.length }
      case 'header':
        // Only direct children of current header
        return this.getHeaderRange(headerPath, false)
      case 'nested':
        // Current header and all nested subheaders
        return this.getHeaderRange(headerPath, true)
    }
  }

  getHeaderRange(headerPath, includeNested) {
    // Parse path like "/Header 1/Subheader 2"
    // Find header line number
    // Determine end based on next header of same or higher level
    // If includeNested, include all subheaders
  }
}
```

### 4.2 Search UI
```
┌────────────────────────────────────────┐
│ Search: /api.*error/gi           [×]   │
│ Replace: $1_fixed                      │
│                                        │
│ Scope: [Document ▼] [Regex ✓] [Aa]   │
│   • Document (entire file)             │
│   • Current Header                     │
│   • Nested (current + subheaders)      │
│                                        │
│ 24 matches found                       │
│ [Replace] [Replace All] [Next] [Prev]  │
└────────────────────────────────────────┘
```

### 4.3 Search Scope Examples
```
Document structure:
# Project Overview
  Some text with "api"
  ## Backend API
    API documentation with "api"
    ### Error Handling
      Error codes with "api"
  ## Frontend
    Frontend "api" calls

Current header: "/Project Overview/Backend API"

Scope "header":     Only "API documentation with api"
Scope "nested":     API documentation + Error Handling section
Scope "document":   All occurrences
```

---

## 5. URL-Based Focus Navigation

### 5.1 Hierarchical Navigation
Navigate and focus on specific sections using URL parameters:

```
URL Structure:
https://app.com/#/document/abc123?focus=/Header1/Subheader2

Components:
- Document ID: abc123
- Focus path: /Header1/Subheader2 (directory-style)
```

### 5.2 Focus Behavior
When focused on a header:
1. **Hide parent/sibling headers** above the focused section
2. **Show the focused header** and all content below it
3. **Update URL** in browser address bar
4. **Enable navigation**: Browser back/forward buttons work
5. **Shareable**: URL can be copied and shared

```javascript
class NavigationManager {
  focusHeader(headerPath) {
    // Parse path: "/Header 1/Subheader 2"
    const headerLine = this.findHeaderByPath(headerPath)

    // Calculate visible range
    const visibleRange = {
      start: headerLine,
      end: this.findNextSameOrHigherLevelHeader(headerLine)
    }

    // Update render state
    this.renderer.setVisibleRange(visibleRange)

    // Update URL
    const url = new URL(window.location)
    url.searchParams.set('focus', headerPath)
    history.pushState({ focus: headerPath }, '', url)

    // Scroll to focused header
    this.scrollToLine(headerLine)
  }

  findHeaderByPath(path) {
    // Split path: "/Header 1/Subheader 2" → ["Header 1", "Subheader 2"]
    const parts = path.split('/').filter(Boolean)

    let currentLine = 0
    for (const headerText of parts) {
      currentLine = this.findNextHeader(headerText, currentLine)
      if (currentLine === -1) return null
    }
    return currentLine
  }

  buildHeaderPath(lineNumber) {
    // Build path from document root to header at lineNumber
    // Example: line 42 → "/Project/API/Endpoints"
    const headers = this.getHeaderHierarchy(lineNumber)
    return '/' + headers.map(h => h.text).join('/')
  }
}
```

### 5.3 Directory-Style Paths Throughout App
Use consistent path syntax everywhere:

**Navigation breadcrumbs:**
```
Home > Project Overview > Backend API > Error Handling
```

**Export dialog:**
```
Export from: [/Project Overview/Backend API     ▼]
  /Project Overview
  /Project Overview/Backend API
  /Project Overview/Backend API/Error Handling
  /Project Overview/Frontend
```

**Search scope:**
```
Search in: [Current Header (/Backend API)       ▼]
```

### 5.4 URL State Management
```javascript
// On page load
window.addEventListener('load', () => {
  const url = new URL(window.location)
  const focusPath = url.searchParams.get('focus')
  if (focusPath) {
    navigation.focusHeader(focusPath)
  }
})

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
  if (e.state?.focus) {
    navigation.focusHeader(e.state.focus)
  }
})
```

---

## 6. Rich Content Support

### 6.1 Inline Images
Support markdown image syntax with enhancements:

```markdown
![Alt text](image.jpg)
![Alt text](image.jpg){width=500}  <!-- Custom width -->
![Alt text](data:image/png;base64,...)  <!-- Base64 embedded -->
```

**Features:**
- Drag & drop image upload
- Paste images from clipboard
- Resize handles on images
- Store in IndexedDB (no external dependencies)
- Lazy loading for performance

```javascript
class ImageHandler {
  async insertImage(file, lineNumber) {
    // Convert to base64 or ArrayBuffer
    const data = await this.readFile(file)

    // Store in IndexedDB
    const imageId = uuid()
    await db.images.add({
      id: imageId,
      fileName: file.name,
      data: data,
      width: null,  // Use original size initially
      height: null,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
      lineNumber: lineNumber
    })

    // Insert markdown reference
    const markdown = `![${file.name}](#${imageId})`
    this.editor.insertText(markdown, lineNumber)
  }

  renderImage(imageId, maxWidth = 800) {
    const img = await db.images.get(imageId)
    const el = document.createElement('img')
    el.src = typeof img.data === 'string' ? img.data : this.arrayBufferToBase64(img.data)
    el.style.maxWidth = img.width ? `${img.width}px` : `${maxWidth}px`

    // Add resize handles
    this.addResizeHandles(el, imageId)

    return el
  }

  addResizeHandles(imgEl, imageId) {
    // Add corner handles for resizing
    // On resize, update IndexedDB with new dimensions
  }
}
```

### 6.2 File Attachments
Attach any file type to the document:

```markdown
[📎 document.pdf](attachment:uuid-here)
[📎 data.xlsx](attachment:uuid-here)
```

```javascript
class AttachmentHandler {
  async attachFile(file, lineNumber) {
    const attachmentId = uuid()
    const data = await file.arrayBuffer()

    await db.attachments.add({
      id: attachmentId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      data: data,
      lineNumber: lineNumber,
      thumbnail: await this.generateThumbnail(file)
    })

    // Insert markdown link
    const icon = this.getFileIcon(file.type)
    const markdown = `[${icon} ${file.name}](attachment:${attachmentId})`
    this.editor.insertText(markdown, lineNumber)
  }

  async downloadAttachment(attachmentId) {
    const attachment = await db.attachments.get(attachmentId)
    const blob = new Blob([attachment.data], { type: attachment.mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = attachment.fileName
    a.click()

    URL.revokeObjectURL(url)
  }
}
```

### 6.3 Graphical Table Rendering
Render markdown tables as pretty, interactive tables:

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

**Rendering Modes:**
1. **Text mode**: Plain markdown (default for large tables)
2. **Graphical mode**: Styled HTML table (toggle with button)

```javascript
class TableRenderer {
  parseTable(lines) {
    // Parse markdown table syntax
    // Return structured data
    return {
      headers: ['Header 1', 'Header 2', 'Header 3'],
      rows: [
        ['Cell 1', 'Cell 2', 'Cell 3'],
        ['Cell 4', 'Cell 5', 'Cell 6']
      ],
      alignment: ['left', 'center', 'right']
    }
  }

  renderGraphicalTable(tableData) {
    // Create styled HTML table
    const table = document.createElement('table')
    table.className = 'rendered-table'

    // Add header row
    const thead = table.createTHead()
    const headerRow = thead.insertRow()
    tableData.headers.forEach((header, i) => {
      const th = document.createElement('th')
      th.textContent = header
      th.style.textAlign = tableData.alignment[i]
      headerRow.appendChild(th)
    })

    // Add data rows
    const tbody = table.createTBody()
    tableData.rows.forEach(row => {
      const tr = tbody.insertRow()
      row.forEach((cell, i) => {
        const td = tr.insertCell()
        td.textContent = cell
        td.style.textAlign = tableData.alignment[i]
      })
    })

    // Add toggle button
    const container = document.createElement('div')
    container.className = 'table-container'
    container.appendChild(this.createToggleButton())
    container.appendChild(table)

    return container
  }

  createToggleButton() {
    const btn = document.createElement('button')
    btn.textContent = '⇄ View as Text'
    btn.onclick = () => this.toggleTableMode()
    return btn
  }
}
```

### 6.4 Code Block Previews
Support syntax-highlighted code blocks with live preview for HTML:

````markdown
```javascript
console.log('Hello, world!')
```

```html
<div style="color: red;">
  <h1>Preview Me!</h1>
  <button onclick="alert('Hello!')">Click</button>
</div>
```
````

```javascript
class CodeBlockRenderer {
  renderCodeBlock(code, language) {
    const container = document.createElement('div')
    container.className = 'code-block'

    // Syntax highlighting
    const pre = document.createElement('pre')
    const codeEl = document.createElement('code')
    codeEl.className = `language-${language}`
    codeEl.textContent = code
    pre.appendChild(codeEl)

    // Add preview button for HTML/JS
    if (language === 'html' || language === 'javascript') {
      const previewBtn = document.createElement('button')
      previewBtn.textContent = '👁 Preview'
      previewBtn.onclick = () => this.openPreview(code, language)
      container.appendChild(previewBtn)
    }

    container.appendChild(pre)
    return container
  }

  openPreview(code, language) {
    // Create resizable preview window
    const preview = document.createElement('div')
    preview.className = 'preview-window'
    preview.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 300px;
      border: 2px solid var(--border);
      background: white;
      resize: both;
      overflow: auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    `

    // Create iframe for isolated HTML
    if (language === 'html') {
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'width: 100%; height: 100%; border: none;'
      preview.appendChild(iframe)

      // Write HTML to iframe
      iframe.contentDocument.open()
      iframe.contentDocument.write(code)
      iframe.contentDocument.close()
    }

    // Add close button
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.cssText = 'position: absolute; top: 5px; right: 5px;'
    closeBtn.onclick = () => preview.remove()
    preview.appendChild(closeBtn)

    document.body.appendChild(preview)
  }
}
```

**Preview Window Features:**
- Resizable (CSS resize property)
- Draggable
- Isolated execution (iframe sandbox)
- Multiple preview windows can be open
- Useful for creating "mini apps" within notes

---

## 7. Export & Import with Encryption

### 7.1 Export Features
**Scope-based export:**
- Export current header and all nested content
- Select any header from dropdown (directory-style paths)
- Includes all attachments and images referenced in scope

**Compression:**
- Use gzip or brotli for efficient file size
- Large attachments are compressed separately

**Encryption (Discrete):**
- AES-256-GCM encryption
- Password-based key derivation (PBKDF2)
- Encryption happens silently (no obvious UI indicator)
- When exporting, user provides password
- Export file is `.ftx` (FoldingText Export)

```javascript
class ExportManager {
  async export(options = {}) {
    const {
      headerPath = '/',           // Root = entire document
      includeAttachments = true,
      password = null,            // If provided, encrypt
      compression = 'gzip'
    } = options

    // 1. Get content scope
    const content = this.getContentByPath(headerPath)

    // 2. Collect referenced images/attachments
    const assets = includeAttachments ? await this.collectAssets(content) : []

    // 3. Create export bundle
    const bundle = {
      version: '1.0',
      exported: Date.now(),
      headerPath: headerPath,
      content: content,
      assets: assets,
      metadata: {
        lineCount: content.split('\n').length,
        assetCount: assets.length
      }
    }

    // 4. Serialize to JSON
    let data = JSON.stringify(bundle)

    // 5. Compress
    const compressed = await this.compress(data, compression)

    // 6. Encrypt if password provided
    let finalData = compressed
    if (password) {
      finalData = await this.encrypt(compressed, password)
    }

    // 7. Download
    const blob = new Blob([finalData], { type: 'application/octet-stream' })
    const fileName = this.generateFileName(headerPath, password != null)
    this.download(blob, fileName)
  }

  async encrypt(data, password) {
    // Use Web Crypto API
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    )

    // Prepend salt and IV for decryption
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    result.set(salt, 0)
    result.set(iv, salt.length)
    result.set(new Uint8Array(encrypted), salt.length + iv.length)

    return result
  }

  generateFileName(headerPath, encrypted) {
    const headerName = headerPath.split('/').filter(Boolean).pop() || 'document'
    const sanitized = headerName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const timestamp = new Date().toISOString().split('T')[0]
    const ext = encrypted ? 'ftx' : 'ftx'  // Same extension, discrete encryption
    return `${sanitized}_${timestamp}.${ext}`
  }
}
```

### 7.2 Import Features
**Auto-detection:**
- Detect if file is encrypted (try decryption)
- Handle both encrypted and plain exports
- Merge into existing document or create new

```javascript
class ImportManager {
  async import(file, password = null) {
    // 1. Read file
    const data = await file.arrayBuffer()

    // 2. Try to decrypt if password provided
    let decrypted = data
    if (password) {
      try {
        decrypted = await this.decrypt(data, password)
      } catch (e) {
        throw new Error('Incorrect password or corrupted file')
      }
    }

    // 3. Decompress
    const decompressed = await this.decompress(decrypted)

    // 4. Parse JSON
    const bundle = JSON.parse(decompressed)

    // 5. Validate version
    if (bundle.version !== '1.0') {
      throw new Error('Unsupported export version')
    }

    // 6. Import content
    await this.importContent(bundle)

    return bundle.headerPath
  }

  async importContent(bundle) {
    // Create new document or append to existing
    const doc = {
      id: uuid(),
      title: this.extractTitle(bundle.headerPath),
      content: bundle.content,
      created: Date.now(),
      modified: Date.now()
    }

    // Import assets
    for (const asset of bundle.assets) {
      if (asset.type === 'image') {
        await db.images.add(asset)
      } else if (asset.type === 'attachment') {
        await db.attachments.add(asset)
      }
    }

    // Save document
    await db.documents.add(doc)

    return doc.id
  }
}
```

### 7.3 Export UI
```
┌─────────────────────────────────────────┐
│ Export Document                         │
├─────────────────────────────────────────┤
│                                         │
│ Export from:                            │
│ [/Project Overview/Backend API      ▼] │
│   /                                     │
│   /Project Overview                     │
│   /Project Overview/Backend API         │
│   /Project Overview/Frontend            │
│                                         │
│ [✓] Include images and attachments     │
│                                         │
│ Password (optional):                    │
│ [...................................]   │
│                                         │
│ Preview:                                │
│ • Content: 2,451 lines                  │
│ • Images: 3 (2.4 MB)                    │
│ • Attachments: 1 (512 KB)               │
│ • Estimated size: ~1.2 MB (compressed)  │
│                                         │
│               [Cancel] [Export]         │
└─────────────────────────────────────────┘
```

**Note:** The password field doesn't explicitly say "encrypt" - it's discrete. If password is provided, export is automatically encrypted.

---

## 8. Custom Themes

### 8.1 Theme System
Allow users to create and customize themes beyond the default light/dark modes:

```javascript
class ThemeManager {
  constructor() {
    this.currentTheme = null
    this.customThemes = []
  }

  async loadTheme(themeId) {
    const theme = await db.themes.get(themeId)
    this.applyTheme(theme)
    this.currentTheme = themeId
    await db.settings.put({ key: 'currentTheme', value: themeId })
  }

  applyTheme(theme) {
    // Update CSS variables
    const root = document.documentElement
    for (const [variable, value] of Object.entries(theme.colors)) {
      root.style.setProperty(`--${variable}`, value)
    }

    // Apply custom fonts if specified
    if (theme.fonts) {
      root.style.setProperty('--font-mono', theme.fonts.mono)
      root.style.setProperty('--font-sans', theme.fonts.sans)
    }

    // Apply spacing/sizing
    if (theme.spacing) {
      root.style.setProperty('--line-height', theme.spacing.lineHeight)
      root.style.setProperty('--editor-padding', theme.spacing.padding)
    }
  }

  createCustomTheme(name, baseTheme = 'light') {
    const base = this.getBuiltInTheme(baseTheme)
    return {
      id: uuid(),
      name: name,
      custom: true,
      colors: { ...base.colors },
      fonts: { ...base.fonts },
      spacing: { ...base.spacing }
    }
  }

  async saveTheme(theme) {
    await db.themes.put(theme)
    this.customThemes.push(theme)
  }

  async exportTheme(themeId) {
    const theme = await db.themes.get(themeId)
    const json = JSON.stringify(theme, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    this.download(blob, `${theme.name}.theme.json`)
  }

  async importTheme(file) {
    const text = await file.text()
    const theme = JSON.parse(text)
    theme.id = uuid()  // Generate new ID
    await this.saveTheme(theme)
    return theme.id
  }
}
```

### 8.2 Theme Structure
```javascript
{
  id: "theme-uuid",
  name: "Solarized Dark",
  custom: true,  // false for built-in themes
  colors: {
    'bg-primary': '#002b36',
    'bg-secondary': '#073642',
    'text-primary': '#839496',
    'text-secondary': '#586e75',
    'accent': '#268bd2',
    'border': '#073642',
    'fold-indicator': '#859900',
    'selection-bg': '#073642',
    'match-highlight': '#b58900'
  },
  fonts: {
    mono: "'Fira Code', 'Monaco', monospace",
    sans: "'Inter', system-ui, sans-serif"
  },
  spacing: {
    lineHeight: '1.8',
    padding: '3rem',
    foldIndent: '2rem'
  }
}
```

### 8.3 Theme Editor UI
```
┌────────────────────────────────────┐
│ Theme Editor: Custom Theme         │
├────────────────────────────────────┤
│                                    │
│ Base: [Solarized Dark        ▼]   │
│                                    │
│ Colors:                            │
│ Background:     [#002b36] [🎨]    │
│ Text:           [#839496] [🎨]    │
│ Accent:         [#268bd2] [🎨]    │
│ Border:         [#073642] [🎨]    │
│                                    │
│ Typography:                        │
│ Monospace:  [Fira Code............]│
│ Sans-serif: [Inter................]│
│                                    │
│ Spacing:                           │
│ Line height: [1.8    ] (1.0-2.5)  │
│ Padding:     [3rem   ]            │
│                                    │
│ Preview:                           │
│ ┌──────────────────────────────┐  │
│ │ # Header                     │  │
│ │ Some **bold** and *italic*   │  │
│ │ ```code block```             │  │
│ └──────────────────────────────┘  │
│                                    │
│ [Export] [Save] [Cancel]           │
└────────────────────────────────────┘
```

### 8.4 Built-in Themes
Ship with several quality themes:
- **Light**: Clean, high contrast
- **Dark**: Easy on eyes
- **Solarized Light/Dark**: Popular color scheme
- **Gruvbox**: Retro warm colors
- **Nord**: Cool blue tones
- **Dracula**: Purple accent, dark background

---

## 9. Performance Optimizations

### 9.1 Selection-Aware Virtual Scrolling
**Critical**: When user selects text, don't despawn lines from DOM

```javascript
class VirtualScroller {
  constructor(container, totalLines, lineHeight) {
    this.viewportHeight = container.clientHeight
    this.bufferSize = 20
    this.lineHeight = lineHeight
    this.selectionActive = false
    this.selectionRange = { start: null, end: null }
  }

  onSelectionChange() {
    const selection = window.getSelection()

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        // Selection is active
        this.selectionActive = true
        this.selectionRange = {
          start: this.getLineNumber(range.startContainer),
          end: this.getLineNumber(range.endContainer)
        }

        // Force render all lines in selection range
        this.forceRenderRange(this.selectionRange.start, this.selectionRange.end)
        return
      }
    }

    // No selection
    this.selectionActive = false
    this.selectionRange = { start: null, end: null }
  }

  getVisibleRange(scrollTop) {
    const start = Math.floor(scrollTop / this.lineHeight) - this.bufferSize
    const end = start + Math.ceil(this.viewportHeight / this.lineHeight) + (2 * this.bufferSize)

    // If selection is active, expand range to include all selected lines
    if (this.selectionActive) {
      return {
        start: Math.min(start, this.selectionRange.start),
        end: Math.max(end, this.selectionRange.end)
      }
    }

    return { start: Math.max(0, start), end }
  }

  forceRenderRange(startLine, endLine) {
    // Ensure all lines in range are rendered and stay in DOM
    // Mark them as "locked" so they won't be recycled
    for (let i = startLine; i <= endLine; i++) {
      const lineEl = this.getOrCreateLineElement(i)
      lineEl.dataset.locked = 'true'
    }
  }

  unlockLines() {
    // After selection is cleared, remove locks
    const lockedLines = this.container.querySelectorAll('[data-locked="true"]')
    lockedLines.forEach(el => delete el.dataset.locked)
  }
}

// Listen to selection changes
document.addEventListener('selectionchange', () => {
  if (!virtualScroller.selectionActive) {
    virtualScroller.onSelectionChange()
  }
})
```

**Why this matters:**
- When selecting 1000 lines of CSV data, browser native selection works correctly
- Without this, virtual scrolling would remove lines from DOM, breaking selection
- The trade-off: Temporarily use more memory during selection, but maintains UX

### 9.2 Virtual Scrolling
**Problem**: Rendering 100,000 lines in DOM = browser freeze
**Solution**: Only render visible lines + buffer

```javascript
class VirtualScroller {
  constructor(container, totalLines, lineHeight) {
    this.viewportHeight = container.clientHeight
    this.bufferSize = 20  // Lines above/below viewport
    this.lineHeight = lineHeight
  }

  getVisibleRange(scrollTop) {
    const start = Math.floor(scrollTop / this.lineHeight) - this.bufferSize
    const end = start + Math.ceil(this.viewportHeight / this.lineHeight) + (2 * this.bufferSize)
    return { start: Math.max(0, start), end }
  }

  render(scrollTop) {
    const { start, end } = this.getVisibleRange(scrollTop)
    // Only render lines[start:end]
    // Use transform: translateY() for positioning
  }
}
```

### 4.2 Incremental Parsing
Don't re-parse entire document on each change:
```javascript
class IncrementalParser {
  parseChange(changeStart, changeEnd, newText) {
    // 1. Find affected line range
    const startLine = this.getLineNumber(changeStart)
    const endLine = this.getLineNumber(changeEnd)

    // 2. Invalidate tokens for affected lines
    this.invalidateLines(startLine, endLine)

    // 3. Re-parse only affected region
    this.parseLines(startLine, endLine)

    // 4. Update line numbers for following lines if needed
    this.updateLineNumbers(endLine + 1)
  }
}
```

### 4.3 Efficient DOM Updates
Use DocumentFragment and minimize reflows:
```javascript
function updateVisibleLines(linesToRender) {
  const fragment = document.createDocumentFragment()
  const existingLines = new Map()

  // Reuse existing DOM elements where possible
  for (const line of linesToRender) {
    const el = existingLines.get(line.number) || createLineElement(line)
    fragment.appendChild(el)
  }

  requestAnimationFrame(() => {
    container.innerHTML = ''  // Or better: differential update
    container.appendChild(fragment)
  })
}
```

### 4.4 Debouncing & Throttling
```javascript
// Auto-save: debounce (wait for typing to stop)
const debouncedSave = debounce(saveToIndexedDB, 1000)

// Scroll rendering: throttle (limit update frequency)
const throttledRender = throttle(renderVisibleLines, 16) // ~60fps
```

### 4.5 Web Worker for Heavy Processing
```javascript
// parser.worker.js
self.addEventListener('message', (e) => {
  const { content, action } = e.data

  if (action === 'parse') {
    const tokens = heavyParseOperation(content)
    self.postMessage({ tokens })
  }
})

// main.js
const parser = new Worker('js/workers/parser.worker.js')
parser.postMessage({ content, action: 'parse' })
parser.onmessage = (e) => updateTokens(e.data.tokens)
```

---

## 5. User Interface Design

### 5.1 Layout
```
┌─────────────────────────────────────────────────┐
│  FoldingText                          [☰ Menu]  │ ← Header (minimal)
├─────────────────────────────────────────────────┤
│  [←] Documents                                  │ ← Sidebar (collapsible)
│  ────────────────                               │
│  ☰ Quick Note                                   │
│  ☰ Meeting Notes                                │
│  ☰ Ideas                                        │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  # Document Title                               │
│                                                  │
│  Start typing...                                │
│                                           |      │ ← Editor (full focus)
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘
│  Line 42, Column 8  |  2,341 words  |  Auto-saved │ ← Status bar
└─────────────────────────────────────────────────┘
```

### 5.2 Visual Design Principles
- **Minimalism**: No visual clutter, focus on content
- **Typography**: Monospace font for editing, clean readable size
- **Spacing**: Generous line height for readability
- **Colors**: Muted palette, high contrast for text
- **Fold Indicators**: Subtle triangles (▶/▼) or custom icons

### 5.3 CSS Architecture
```css
/* CSS Variables for easy theming */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #0066cc;
  --border: #e0e0e0;

  --font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --line-height: 1.6;
  --editor-padding: 2rem;
  --fold-indent: 1.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #e0e0e0;
    --text-secondary: #999999;
    --accent: #4dabf7;
    --border: #404040;
  }
}
```

### 5.4 Markdown Syntax Highlighting
Subtle syntax highlighting without being distracting:
```css
.md-header {
  font-weight: bold;
  color: var(--accent);
}
.md-bold { font-weight: bold; }
.md-italic { font-style: italic; }
.md-code {
  background: var(--bg-secondary);
  font-family: var(--font-mono);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
.md-link {
  color: var(--accent);
  text-decoration: underline;
}
```

---

## 6. Keyboard Shortcuts

Essential for power users:

```
Document Management:
Cmd/Ctrl + N          New document
Cmd/Ctrl + O          Open document
Cmd/Ctrl + S          Save (manual trigger)
Cmd/Ctrl + W          Close document

Editing:
Cmd/Ctrl + Z          Undo
Cmd/Ctrl + Shift + Z  Redo
Cmd/Ctrl + F          Find (regex supported)
Cmd/Ctrl + H          Find and replace (regex supported)
Cmd/Ctrl + K          Insert/edit link

Folding:
Cmd/Ctrl + .          Fold selection / smart fold at cursor
Cmd/Ctrl + ,          Unfold at cursor
Cmd/Ctrl + Shift + .  Fold all
Cmd/Ctrl + Shift + ,  Unfold all
Alt + Arrow Up        Jump to previous fold
Alt + Arrow Down      Jump to next fold

Navigation:
Cmd/Ctrl + G          Go to line
Cmd/Ctrl + Home       Go to document start
Cmd/Ctrl + End        Go to document end

View:
Cmd/Ctrl + B          Toggle sidebar
Cmd/Ctrl + \          Toggle focus mode
Cmd/Ctrl + =          Increase font size
Cmd/Ctrl + -          Decrease font size
Cmd/Ctrl + /          Increase font size (alternative)
Cmd/Ctrl + 0          Reset font size
```

---

## 7. Implementation Phases

### Phase 1: Core Foundation (MVP)
**Goal**: Basic editing and storage

- [x] Set up project structure
- [ ] Create HTML/CSS shell
- [ ] Implement basic text editor (contenteditable or textarea)
- [ ] IndexedDB storage wrapper
- [ ] Document create/save/load
- [ ] Auto-save functionality

**Deliverable**: Can create and edit plain text documents with persistence

---

### Phase 2: Markdown Parsing
**Goal**: Understand document structure

- [ ] Line-based markdown tokenizer
- [ ] Detect headers, lists, code blocks, blockquotes
- [ ] Incremental parsing on edit
- [ ] Syntax highlighting overlay
- [ ] Structure tree representation

**Deliverable**: Markdown is parsed and highlighted in real-time

---

### Phase 3: Folding System
**Goal**: Core differentiator

- [ ] Fold data structure
- [ ] Manual selection-based folding
- [ ] Smart fold (auto-detect foldable regions)
- [ ] Fold/unfold toggle
- [ ] Visual fold indicators
- [ ] Navigate between folds
- [ ] Persist fold state

**Deliverable**: Can fold/unfold content at any point

---

### Phase 4: Performance Optimization
**Goal**: Handle large documents (100K+ lines)

- [ ] Virtual scrolling implementation
- [ ] Only render visible lines
- [ ] Efficient line recycling
- [ ] Debounce/throttle optimizations
- [ ] Web Worker for parsing (if needed)
- [ ] Memory profiling and optimization

**Deliverable**: Smooth scrolling and editing even with massive CSV dumps

---

### Phase 5: Polish & UX
**Goal**: Simplistic yet elegant

- [ ] Refined visual design
- [ ] Animations (subtle fold/unfold)
- [ ] Keyboard shortcuts
- [ ] Command palette
- [ ] Settings panel
- [ ] Dark mode
- [ ] Responsive design

**Deliverable**: Production-ready user interface

---

### Phase 6: Rich Content Support
**Goal**: Images, attachments, tables, code previews

- [ ] Inline image support (drag & drop, paste)
- [ ] Image resizing with handles
- [ ] File attachments (any type)
- [ ] Graphical table rendering (togglable)
- [ ] Code block syntax highlighting
- [ ] HTML code block preview (resizable iframe)
- [ ] Preview window management

**Deliverable**: Can embed and preview rich content within documents

---

### Phase 7: Search, Navigation & Export
**Goal**: Power features for large documents

- [ ] Regex search and replace
- [ ] Search scope (document, header, nested)
- [ ] URL-based focus navigation
- [ ] Directory-style header paths
- [ ] Compressed export/import
- [ ] Encrypted export (discrete)
- [ ] Header-scoped export
- [ ] Ctrl+K link insertion

**Deliverable**: Advanced document management and navigation

---

### Phase 8: Themes & Customization
**Goal**: User personalization

- [ ] Custom theme system
- [ ] Theme editor UI
- [ ] Built-in theme library (6+ themes)
- [ ] Theme import/export
- [ ] Font customization
- [ ] Spacing/sizing controls

**Deliverable**: Fully customizable appearance

---

### Phase 9: Polish & Additional Features (Post-MVP)
**Goal**: Nice-to-have enhancements

- [ ] Multi-document management improvements
- [ ] Full-text search across documents
- [ ] Outline view sidebar
- [ ] Todo list syntax support
- [ ] Tags/metadata
- [ ] Document templates
- [ ] Keyboard shortcut customization
- [ ] Mobile/tablet optimization

---

## 10. Technical Challenges & Solutions

### Challenge 1: Contenteditable vs Textarea
**Problem**: Contenteditable is complex but allows rich display; textarea is simple but plain

**Solution**: Use `textarea` wrapped with syntax highlighting overlay
```html
<div class="editor-container">
  <div class="syntax-overlay" aria-hidden="true">
    <!-- Rendered syntax-highlighted version -->
  </div>
  <textarea class="editor-input"></textarea>
</div>
```
This approach gives us:
- Simple text editing (textarea)
- Visual syntax highlighting (overlay)
- No contenteditable complexity
- Better accessibility

### Challenge 2: Folding with Arbitrary Points
**Problem**: Traditional editors fold at structural boundaries; we need arbitrary folding

**Solution**: Line-range-based folding system
```javascript
// Any selection creates a fold:
const selection = getSelection()
const startLine = getLineNumber(selection.start)
const endLine = getLineNumber(selection.end)
createFold(startLine, endLine)

// Render: Skip hidden lines
function getVisibleLines(allLines, folds) {
  return allLines.filter(line => !isLineHidden(line, folds))
}
```

### Challenge 3: Large Content Performance
**Problem**: 100K lines of CSV data crashes browser

**Solution**: Virtual scrolling + lazy rendering
- Only render ~50 visible lines at a time
- Use `transform: translateY()` for positioning (no layout thrashing)
- Recycle DOM elements instead of creating new ones
- Use `requestAnimationFrame` for smooth updates

### Challenge 4: Maintaining Fold State During Edits
**Problem**: Adding/deleting lines invalidates fold line numbers

**Solution**: Offset adjustment system
```javascript
function onTextChange(change) {
  const { startLine, endLine, linesAdded, linesRemoved } = change
  const delta = linesAdded - linesRemoved

  if (delta !== 0) {
    // Adjust all folds after the change
    for (const fold of folds) {
      if (fold.startLine > endLine) {
        fold.startLine += delta
        fold.endLine += delta
      } else if (fold.endLine > endLine) {
        fold.endLine += delta
      }
    }
  }
}
```

### Challenge 5: IndexedDB Async Complexity
**Problem**: IndexedDB is callback-based and verbose

**Solution**: Promise wrapper
```javascript
class Storage {
  async save(document) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite')
      const store = transaction.objectStore('documents')
      const request = store.put(document)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async load(id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly')
      const store = transaction.objectStore('documents')
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}
```

### Challenge 6: Large Binary Data (Images/Attachments)
**Problem**: Storing many large files in IndexedDB can use a lot of storage

**Solution**:
- Compress images before storing
- Use ArrayBuffer for efficient binary storage
- Implement storage quota checking
- Offer cleanup tools for unused assets
```javascript
async function compressImage(file) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = Math.min(bitmap.width, 1920)  // Max width
  canvas.height = (canvas.width / bitmap.width) * bitmap.height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)  // 85% quality
  )
  return blob
}
```

### Challenge 7: HTML Preview Security
**Problem**: Previewing user-generated HTML can execute malicious scripts

**Solution**: Use sandboxed iframe
```javascript
const iframe = document.createElement('iframe')
iframe.sandbox = 'allow-scripts'  // Limited permissions
iframe.srcdoc = userHTML
// Content Security Policy headers would add another layer
```

### Challenge 8: URL Path Conflicts
**Problem**: Header titles with special characters break URL paths

**Solution**: Encode and normalize header paths
```javascript
function encodeHeaderPath(headerText) {
  return headerText
    .replace(/\//g, '∕')  // Replace forward slash with division slash
    .replace(/[?#&]/g, '')  // Remove query string chars
    .trim()
}

function decodeHeaderPath(encoded) {
  return encoded.replace(/∕/g, '/')
}
```

---

## 11. Testing Strategy

### Unit Tests
- Storage module (CRUD operations)
- Parser (markdown tokenization)
- Fold manager (create, toggle, navigation)
- Virtual scroller (range calculation)
- Search engine (regex, scope filtering)
- Navigation (header path parsing)
- Export/import (encryption, compression)
- Theme manager (apply, save, export)

### Integration Tests
- Full document flow (create → edit → save → load)
- Folding while editing
- Large document performance
- Search and replace across scopes
- URL navigation with browser history
- Export with attachments → import → verify integrity
- Image upload → resize → save → reload

### Manual Testing Scenarios
1. **Large Content Test**: Paste 50,000 line CSV
   - Verify no lag
   - Verify folding works
   - Verify scrolling is smooth
   - Select 1000 lines and verify selection doesn't break

2. **Fold Persistence**: Create folds, close app, reopen
   - Verify folds are restored

3. **Edit Folded Content**: Make changes while folds exist
   - Verify fold positions update correctly

4. **Search & Replace**:
   - Regex search with capture groups
   - Replace within current header only
   - Verify nested scope works correctly

5. **URL Navigation**:
   - Focus on header, copy URL
   - Open URL in new tab, verify correct section shown
   - Use browser back button, verify navigation works

6. **Rich Content**:
   - Drag & drop image, resize, save, reload
   - Attach PDF, download it later
   - Paste large CSV as table, toggle graphical view
   - Create HTML code block, preview in iframe

7. **Export/Import with Encryption**:
   - Export section with password
   - Import in new browser session
   - Verify attachments included
   - Try wrong password, verify error

8. **Custom Themes**:
   - Create custom theme
   - Export and import it
   - Verify colors persist across sessions

9. **Edge Cases**:
   - Fold on line 1
   - Fold last line
   - Nested folds
   - Fold single line
   - Fold entire document
   - Header with special characters (/, ?, #)
   - Very large image (10MB+)
   - Extremely long line (10K+ chars)

---

## 12. Success Metrics

The implementation will be considered successful when:

1. **Performance**: Can handle 100,000+ lines without lag
   - Scrolling at 60fps
   - Typing with <16ms latency
   - Loading in <500ms

2. **Functionality**: All core features work
   - Create/edit/save documents ✓
   - Fold/unfold at any point ✓
   - Markdown syntax highlighting ✓
   - Keyboard shortcuts ✓
   - Regex search with scopes ✓
   - URL-based navigation ✓
   - Rich content (images, attachments, tables) ✓
   - Export/import with encryption ✓
   - Custom themes ✓
   - Selection doesn't break with 1000+ lines ✓

3. **UX**: Feels elegant and simple
   - Clean, minimal interface
   - No visual clutter
   - Intuitive folding interactions
   - Fast and responsive
   - Keyboard-driven workflow

4. **Reliability**: Data safety
   - Auto-save works consistently
   - No data loss on browser crash
   - IndexedDB operations are atomic
   - Encrypted exports work reliably

5. **Rich Content**: Handles media well
   - Images load and resize smoothly
   - Attachments up to 100MB supported
   - HTML previews are sandboxed and safe
   - Tables render beautifully

---

## 13. Future Enhancements

Beyond the initial implementation:

- **Collaboration**: Real-time collaborative editing (WebRTC or WebSocket)
- **Sync**: Cross-device sync (via optional backend or P2P)
- **Plugins**: Extension system for custom functionality
- **Vim/Emacs modes**: Modal editing for power users
- **Git integration**: Version control within the app
- **Mobile support**: Touch-optimized interface (gestures for folding, etc.)
- **Offline PWA**: Full offline capability with service worker
- **Voice input**: Speech-to-text for content entry
- **AI integration**: Optional AI features (summarization, completion)
- **Graph view**: Visualize document structure and links between sections
- **Timeline view**: See document history and changes over time

---

## 14. Open Questions

Before implementation, clarify:

1. **Editor Component**: Textarea + overlay, or custom contenteditable implementation?
   - Recommendation: Textarea + overlay for simplicity

2. **Fold Visualization**: How should folds appear?
   - Option A: Single line with "... X lines hidden"
   - Option B: Collapsed block with preview
   - Recommendation: Single line, cleaner

3. **Multi-document UI**: Tabs vs sidebar vs command palette?
   - Recommendation: Sidebar for browsing, command palette for quick switch

4. **Mobile Support**: Include in Phase 1 or later?
   - Recommendation: Later, focus on desktop experience first

5. **Image Storage Format**: Base64 strings or ArrayBuffer in IndexedDB?
   - Recommendation: ArrayBuffer for better performance and compression

6. **Table Rendering**: Default to text or graphical mode?
   - Recommendation: Text mode default, toggle to graphical (performance for large tables)

7. **Code Preview Sandbox**: How restrictive should iframe sandbox be?
   - Recommendation: `allow-scripts` but monitor for security concerns

8. **Export File Extension**: `.ftx` or something else?
   - Recommendation: `.ftx` (FoldingText Export) - discrete, no indication of encryption

9. **Search Default Scope**: Document, current header, or last used?
   - Recommendation: Remember last used scope per session

10. **Theme Naming**: How to avoid conflicts between custom and built-in themes?
    - Recommendation: Namespace custom themes with "Custom: " prefix

---

## 15. Summary

This plan outlines a complete, feature-rich, performant, serverless markdown editor that goes far beyond basic note-taking. It combines powerful text editing with rich content support, advanced navigation, and robust data management - all running entirely client-side.

**Key Innovations**:
1. **Arbitrary folding**: Collapse content at ANY point, not just headers - fold in the middle of CSV dumps
2. **Selection-aware virtual scrolling**: Handle 100K+ lines while maintaining text selection capability
3. **URL-based navigation**: Focus on any header via URL, with browser history integration
4. **Scope-controlled search**: Regex search/replace within document, header, or nested sections
5. **Directory-style paths**: Consistent `/Header/Subheader` syntax throughout the app
6. **Discrete encryption**: Compressed, encrypted exports without obvious UI indicators
7. **Rich content**: Inline images, attachments, graphical tables, HTML previews
8. **Custom themes**: Full theme editor with import/export
9. **Performance-first**: Virtual scrolling, incremental parsing, Web Workers
10. **Serverless & private**: 100% client-side, no backend required

**Feature Highlights**:
- ✓ Plain markdown editing (no WYSIWYG bloat)
- ✓ Fold anywhere in document
- ✓ Handle massive files (100K+ lines) smoothly
- ✓ Regex search with scopes (document/header/nested)
- ✓ URL navigation with shareable links
- ✓ Images with resizing, file attachments
- ✓ Graphical table rendering (togglable)
- ✓ HTML code preview in sandboxed iframe
- ✓ Export/import with compression & encryption
- ✓ Custom theme creator
- ✓ Complete keyboard control
- ✓ IndexedDB storage (offline-first)
- ✓ Auto-save with crash recovery

**Technical Architecture**:
- Vanilla JavaScript (no framework overhead)
- Virtual scrolling with selection awareness
- Incremental markdown parsing
- Web Workers for heavy operations
- IndexedDB with promise wrappers
- Web Crypto API for encryption
- Textarea + overlay editor approach

**Implementation Path**:
- **Phase 1-2**: Core editing + storage (MVP foundation)
- **Phase 3**: Folding system (key differentiator)
- **Phase 4**: Performance optimization (handle large files)
- **Phase 5**: UI polish (elegant, minimal design)
- **Phase 6**: Rich content (images, attachments, tables)
- **Phase 7**: Search, navigation, export (power features)
- **Phase 8**: Themes & customization (personalization)
- **Phase 9**: Additional polish & features

**Next Steps**:
1. Review this comprehensive plan
2. Clarify open questions (Section 14)
3. Begin Phase 1 implementation
4. Iterate based on testing and feedback

This is a **substantial application** with ambitious features, but the phased approach ensures we can deliver a working MVP (Phases 1-5) while building toward the full vision.
