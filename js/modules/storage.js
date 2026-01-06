/**
 * Storage Module - IndexedDB wrapper for folded
 * Handles document and settings persistence
 */

const DB_NAME = 'folded';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_SETTINGS = 'settings';

class Storage {
    constructor() {
        this.db = null;
        this.ready = false;
    }

    /**
     * Initialize the database
     * Creates object stores if they don't exist
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Database failed to open:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.ready = true;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create documents store
                if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
                    const documentsStore = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
                    documentsStore.createIndex('modified', 'modified', { unique: false });
                    documentsStore.createIndex('created', 'created', { unique: false });
                    console.log('Documents store created');
                }

                // Create settings store
                if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                    db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
                    console.log('Settings store created');
                }
            };
        });
    }

    /**
     * Save a document to the database
     * @param {string} id - Document ID
     * @param {string} content - Document content
     * @param {object} metadata - Additional metadata
     */
    async saveDocument(id, content, metadata = {}) {
        if (!this.ready) {
            console.error('Database not initialized');
            return null;
        }

        try {
            const transaction = this.db.transaction([STORE_DOCUMENTS], 'readwrite');
            const store = transaction.objectStore(STORE_DOCUMENTS);

            const document = {
                id,
                content,
                modified: Date.now(),
                created: metadata.created || Date.now(),
                name: metadata.name || 'Untitled',
                ...metadata
            };

            const request = store.put(document);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(document);
                request.onerror = () => {
                    console.error('Error saving document:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Exception saving document:', error);
            return null;
        }
    }

    /**
     * Load a document from the database
     * @param {string} id - Document ID
     */
    async loadDocument(id) {
        if (!this.ready) {
            console.error('Database not initialized');
            return null;
        }

        try {
            const transaction = this.db.transaction([STORE_DOCUMENTS], 'readonly');
            const store = transaction.objectStore(STORE_DOCUMENTS);
            const request = store.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    resolve(request.result || null);
                };
                request.onerror = () => {
                    console.error('Error loading document:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Exception loading document:', error);
            return null;
        }
    }

    /**
     * Delete a document from the database
     * @param {string} id - Document ID
     */
    async deleteDocument(id) {
        if (!this.ready) {
            console.error('Database not initialized');
            return false;
        }

        try {
            const transaction = this.db.transaction([STORE_DOCUMENTS], 'readwrite');
            const store = transaction.objectStore(STORE_DOCUMENTS);
            const request = store.delete(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error('Error deleting document:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Exception deleting document:', error);
            return false;
        }
    }

    /**
     * List all document IDs and metadata
     */
    async listDocuments() {
        if (!this.ready) {
            console.error('Database not initialized');
            return [];
        }

        try {
            const transaction = this.db.transaction([STORE_DOCUMENTS], 'readonly');
            const store = transaction.objectStore(STORE_DOCUMENTS);
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const documents = request.result || [];
                    // Sort by modified date, most recent first
                    documents.sort((a, b) => b.modified - a.modified);
                    resolve(documents);
                };
                request.onerror = () => {
                    console.error('Error listing documents:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Exception listing documents:', error);
            return [];
        }
    }

    /**
     * Save a setting to the database
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     */
    async saveSetting(key, value) {
        if (!this.ready) {
            console.error('Database not initialized');
            return false;
        }

        try {
            const transaction = this.db.transaction([STORE_SETTINGS], 'readwrite');
            const store = transaction.objectStore(STORE_SETTINGS);
            const request = store.put({ key, value });

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error('Error saving setting:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Exception saving setting:', error);
            return false;
        }
    }

    /**
     * Load a setting from the database
     * @param {string} key - Setting key
     * @param {any} defaultValue - Default value if setting doesn't exist
     */
    async loadSetting(key, defaultValue = null) {
        if (!this.ready) {
            console.error('Database not initialized');
            return defaultValue;
        }

        try {
            const transaction = this.db.transaction([STORE_SETTINGS], 'readonly');
            const store = transaction.objectStore(STORE_SETTINGS);
            const request = store.get(key);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value : defaultValue);
                };
                request.onerror = () => {
                    console.error('Error loading setting:', request.error);
                    resolve(defaultValue);
                };
            });
        } catch (error) {
            console.error('Exception loading setting:', error);
            return defaultValue;
        }
    }

    /**
     * Clear all data from the database (use with caution!)
     */
    async clearAll() {
        if (!this.ready) {
            console.error('Database not initialized');
            return false;
        }

        try {
            const transaction = this.db.transaction([STORE_DOCUMENTS, STORE_SETTINGS], 'readwrite');

            const documentsStore = transaction.objectStore(STORE_DOCUMENTS);
            const settingsStore = transaction.objectStore(STORE_SETTINGS);

            await documentsStore.clear();
            await settingsStore.clear();

            return true;
        } catch (error) {
            console.error('Exception clearing database:', error);
            return false;
        }
    }
}

// Export singleton instance
const storage = new Storage();
export default storage;
