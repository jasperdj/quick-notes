/**
 * Document Module - Document management for folded
 * Coordinates between editor and storage
 */

import storage from './storage.js';
import editor from './editor.js';

class Document {
    constructor() {
        this.currentId = null;
        this.currentDoc = null;
        this.dirty = false;
        this.autoSaveTimer = null;
        this.autoSaveDelay = 2000; // 2 seconds
        this.saveIndicator = null;
    }

    /**
     * Initialize the document manager
     */
    async initialize() {
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
     * @param {string} name - Document name
     * @returns {object} Created document
     */
    async create(name = 'Untitled') {
        const id = this.generateId();
        const content = '';

        const doc = await storage.saveDocument(id, content, {
            name,
            created: Date.now(),
            modified: Date.now()
        });

        this.currentId = id;
        this.currentDoc = doc;
        this.dirty = false;

        editor.setContent(content);
        this.updateUI();

        console.log('Created new document:', id);
        return doc;
    }

    /**
     * Load an existing document
     * @param {string} id - Document ID
     * @returns {object|null} Loaded document or null if not found
     */
    async load(id) {
        const doc = await storage.loadDocument(id);

        if (!doc) {
            console.error('Document not found:', id);
            return null;
        }

        this.currentId = id;
        this.currentDoc = doc;
        this.dirty = false;

        editor.setContent(doc.content || '');
        this.updateUI();

        console.log('Loaded document:', id);
        return doc;
    }

    /**
     * Save the current document
     * @returns {object|null} Saved document or null on error
     */
    async save() {
        if (!this.currentId) {
            console.error('No document to save');
            return null;
        }

        this.updateSaveIndicator('saving');

        const content = editor.getContent();

        try {
            const doc = await storage.saveDocument(this.currentId, content, {
                name: this.currentDoc?.name || 'Untitled',
                created: this.currentDoc?.created || Date.now(),
                modified: Date.now()
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
     * @param {string} id - Document ID (defaults to current document)
     * @returns {boolean} Success status
     */
    async delete(id = null) {
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
     * @returns {object|null} Document metadata
     */
    getMetadata() {
        return this.currentDoc ? {
            id: this.currentId,
            name: this.currentDoc.name,
            created: this.currentDoc.created,
            modified: this.currentDoc.modified
        } : null;
    }

    /**
     * Set document content
     * @param {string} content - New content
     */
    setContent(content) {
        editor.setContent(content);
        this.markDirty();
    }

    /**
     * Get document content
     * @returns {string} Current content
     */
    getContent() {
        return editor.getContent();
    }

    /**
     * Mark document as dirty (needs saving)
     */
    markDirty() {
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
    scheduleAutoSave() {
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
     * @param {string} state - 'saving', 'saved', 'unsaved', 'error'
     */
    updateSaveIndicator(state) {
        if (!this.saveIndicator) return;

        this.saveIndicator.className = 'save-indicator';

        switch (state) {
            case 'saving':
                this.saveIndicator.textContent = 'Saving...';
                this.saveIndicator.classList.add('saving');
                break;
            case 'saved':
                this.saveIndicator.textContent = 'Saved ✓';
                this.saveIndicator.classList.add('saved');
                // Clear after 2 seconds
                setTimeout(() => {
                    if (this.saveIndicator.textContent === 'Saved ✓') {
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
    updateUI() {
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
     * @returns {string} Unique ID
     */
    generateId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * List all documents
     * @returns {array} Array of document metadata
     */
    async listAll() {
        return await storage.listDocuments();
    }

    /**
     * Get or create a default document
     * Loads the last opened document or creates a new one
     */
    async getOrCreateDefault() {
        // Try to load last opened document
        const lastDocId = await storage.loadSetting('lastOpenedDocument');

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
    async saveAsLastOpened() {
        if (this.currentId) {
            await storage.saveSetting('lastOpenedDocument', this.currentId);
        }
    }
}

// Export singleton instance
const doc = new Document();
export default doc;
