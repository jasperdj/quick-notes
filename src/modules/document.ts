/**
 * Document Module - Document management for folded
 * Coordinates between editor and storage
 */

import storage, { DocumentData } from './storage';
import editor from './editor';
// Note: foldManager will be imported after it's created
// For now, we'll use a late-binding approach

type SaveIndicatorState = 'saving' | 'saved' | 'unsaved' | 'error' | '';

interface FoldManager {
  getState(): unknown;
  setState(state: unknown): void;
  clear(): void;
}

// Late-bound fold manager reference
let foldManager: FoldManager | null = null;

export function setFoldManager(fm: FoldManager): void {
  foldManager = fm;
}

class Document {
  currentId: string | null = null;
  currentDoc: DocumentData | null = null;
  dirty = false;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSaveDelay = 2000; // 2 seconds
  private saveIndicator: HTMLElement | null = null;

  /**
   * Initialize the document manager
   */
  async initialize(): Promise<void> {
    await storage.initDB();

    // Set up save indicator
    this.saveIndicator = document.getElementById('save-indicator');

    // Set up auto-save on editor changes
    editor.onChange(() => {
      this.markDirty();
    });

    console.log('Document manager initialized');
  }

  /**
   * Create a new document
   */
  async create(name = 'Untitled'): Promise<DocumentData | null> {
    const id = this.generateId();
    const content = '';

    const doc = await storage.saveDocument(id, content, {
      name,
      created: Date.now(),
      foldState: null // No folds in new document
    });

    this.currentId = id;
    this.currentDoc = doc;
    this.dirty = false;

    editor.setContent(content);
    foldManager?.clear(); // Clear folds for new document

    this.updateUI();

    console.log('Created new document:', id);
    return doc;
  }

  /**
   * Load an existing document
   */
  async load(id: string): Promise<DocumentData | null> {
    const doc = await storage.loadDocument(id);

    if (!doc) {
      console.error('Document not found:', id);
      return null;
    }

    this.currentId = id;
    this.currentDoc = doc;
    this.dirty = false;

    editor.setContent(doc.content || '');

    // Restore fold state
    if (doc.foldState && foldManager) {
      foldManager.setState(doc.foldState);
    } else {
      foldManager?.clear();
    }

    this.updateUI();

    console.log('Loaded document:', id);
    return doc;
  }

  /**
   * Save the current document
   */
  async save(): Promise<DocumentData | null> {
    if (!this.currentId) {
      console.error('No document to save');
      return null;
    }

    this.updateSaveIndicator('saving');

    const content = editor.getContent();
    const foldState = foldManager?.getState() ?? null;

    try {
      const doc = await storage.saveDocument(this.currentId, content, {
        name: this.currentDoc?.name || 'Untitled',
        created: this.currentDoc?.created || Date.now(),
        foldState // Save fold state
      });

      this.currentDoc = doc;
      this.dirty = false;

      this.updateSaveIndicator('saved');

      console.log('Saved document:', this.currentId);
      return doc;
    } catch (error) {
      console.error('Error saving document:', error);
      this.updateSaveIndicator('error');
      return null;
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string | null = null): Promise<boolean> {
    const targetId = id || this.currentId;

    if (!targetId) {
      console.error('No document to delete');
      return false;
    }

    const result = await storage.deleteDocument(targetId);

    if (result && targetId === this.currentId) {
      this.currentId = null;
      this.currentDoc = null;
      this.dirty = false;
      editor.setContent('');
      this.updateUI();
    }

    console.log('Deleted document:', targetId);
    return result;
  }

  /**
   * Get document metadata
   */
  getMetadata(): { id: string; name: string; created: number; modified: number } | null {
    return this.currentDoc ? {
      id: this.currentId!,
      name: this.currentDoc.name,
      created: this.currentDoc.created,
      modified: this.currentDoc.modified
    } : null;
  }

  /**
   * Set document content
   */
  setContent(content: string): void {
    editor.setContent(content);
    this.markDirty();
  }

  /**
   * Get document content
   */
  getContent(): string {
    return editor.getContent();
  }

  /**
   * Mark document as dirty (needs saving)
   */
  markDirty(): void {
    if (!this.dirty) {
      this.dirty = true;
      this.updateSaveIndicator('unsaved');
    }

    // Schedule auto-save
    this.scheduleAutoSave();
  }

  /**
   * Schedule auto-save
   */
  private scheduleAutoSave(): void {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Schedule new save
    this.autoSaveTimer = setTimeout(() => {
      if (this.dirty && this.currentId) {
        this.save();
      }
    }, this.autoSaveDelay);
  }

  /**
   * Update save indicator
   */
  private updateSaveIndicator(state: SaveIndicatorState): void {
    if (!this.saveIndicator) return;

    this.saveIndicator.className = 'save-indicator';

    switch (state) {
      case 'saving':
        this.saveIndicator.textContent = 'Saving...';
        this.saveIndicator.classList.add('saving');
        break;
      case 'saved':
        this.saveIndicator.textContent = 'Saved';
        this.saveIndicator.classList.add('saved');
        // Clear after 2 seconds
        setTimeout(() => {
          if (this.saveIndicator?.textContent === 'Saved') {
            this.saveIndicator.textContent = '';
            this.saveIndicator.className = 'save-indicator';
          }
        }, 2000);
        break;
      case 'unsaved':
        this.saveIndicator.textContent = 'Unsaved';
        break;
      case 'error':
        this.saveIndicator.textContent = 'Error saving';
        break;
      default:
        this.saveIndicator.textContent = '';
    }
  }

  /**
   * Update UI with current document info
   */
  updateUI(): void {
    const nameElement = document.getElementById('document-name');
    if (nameElement && this.currentDoc) {
      nameElement.textContent = this.currentDoc.name || 'Untitled';
    }

    const lineCountElement = document.getElementById('line-count');
    if (lineCountElement) {
      const lineCount = editor.getLineCount();
      lineCountElement.textContent = `${lineCount} line${lineCount !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Generate a unique document ID
   */
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * List all documents
   */
  async listAll(): Promise<DocumentData[]> {
    return await storage.listDocuments();
  }

  /**
   * Get or create a default document
   * Loads the last opened document or creates a new one
   */
  async getOrCreateDefault(): Promise<DocumentData | null> {
    // Try to load last opened document
    const lastDocId = await storage.loadSetting<string | null>('lastOpenedDocument', null);

    if (lastDocId) {
      const doc = await this.load(lastDocId);
      if (doc) {
        return doc;
      }
    }

    // Otherwise, check if any documents exist
    const allDocs = await this.listAll();
    if (allDocs.length > 0) {
      return await this.load(allDocs[0].id);
    }

    // Create a new document
    return await this.create('Welcome');
  }

  /**
   * Save current document ID as last opened
   */
  async saveAsLastOpened(): Promise<void> {
    if (this.currentId) {
      await storage.saveSetting('lastOpenedDocument', this.currentId);
    }
  }
}

// Export singleton instance
const doc = new Document();
export default doc;
