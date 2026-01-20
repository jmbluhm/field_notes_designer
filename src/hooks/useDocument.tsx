import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type { Document, DocumentAction, Selection, CanvasObject } from '../model/types';
import { documentReducer, createDefaultDocument } from '../model';

const STORAGE_KEY = 'field-notes-cover-studio-document';

interface DocumentContextValue {
  document: Document;
  selection: Selection;
  dispatch: React.Dispatch<DocumentAction>;
  setSelection: (selection: Selection) => void;
  clearSelection: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  exportAsJSON: () => string;
  importFromJSON: (json: string) => boolean;
  resetToDefault: () => void;
  getSelectedObject: () => CanvasObject | null;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, dispatch] = useReducer(documentReducer, null, () => {
    // Try to load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Document;
      } catch {
        console.warn('Failed to parse stored document, using default');
      }
    }
    return createDefaultDocument();
  });

  const [selection, setSelectionState] = React.useState<Selection>({
    side: null,
    objectId: null,
  });

  // Auto-save to localStorage when document changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  }, [document]);

  const setSelection = useCallback((newSelection: Selection) => {
    setSelectionState(newSelection);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState({ side: null, objectId: null });
  }, []);

  const saveToStorage = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  }, [document]);

  const loadFromStorage = useCallback((): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const doc = JSON.parse(stored) as Document;
        dispatch({ type: 'SET_DOCUMENT', document: doc });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const exportAsJSON = useCallback((): string => {
    return JSON.stringify(document, null, 2);
  }, [document]);

  const importFromJSON = useCallback((json: string): boolean => {
    try {
      const doc = JSON.parse(json) as Document;
      dispatch({ type: 'SET_DOCUMENT', document: doc });
      clearSelection();
      return true;
    } catch {
      return false;
    }
  }, [clearSelection]);

  const resetToDefault = useCallback(() => {
    dispatch({ type: 'SET_DOCUMENT', document: createDefaultDocument() });
    clearSelection();
  }, [clearSelection]);

  const getSelectedObject = useCallback((): CanvasObject | null => {
    if (!selection.side || !selection.objectId) return null;
    const objects = selection.side === 'front' ? document.front.objects : document.back.objects;
    return objects.find((obj) => obj.id === selection.objectId) || null;
  }, [document, selection]);

  const value: DocumentContextValue = {
    document,
    selection,
    dispatch,
    setSelection,
    clearSelection,
    saveToStorage,
    loadFromStorage,
    exportAsJSON,
    importFromJSON,
    resetToDefault,
    getSelectedObject,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument(): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
