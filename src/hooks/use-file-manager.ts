'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MarkdownFile, Folder, FileState, EditorMode } from '@/types/file';

const STORAGE_KEY = 'markdown-editor-files';

// Default empty state for consistent hydration
const getDefaultState = (): FileState => ({
    files: [],
    folders: [],
    activeFileId: null,
    editorMode: 'edit',
});

// Load state from localStorage (client-side only)
const loadFromStorage = (): FileState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convert date strings back to Date objects
            if (parsed.files) {
                parsed.files = parsed.files.map((file: any) => ({
                    ...file,
                    createdAt: new Date(file.createdAt),
                    updatedAt: new Date(file.updatedAt),
                    lastSaved: file.lastSaved ? new Date(file.lastSaved) : undefined,
                }));
            }
            if (parsed.folders) {
                parsed.folders = parsed.folders.map((folder: any) => ({
                    ...folder,
                    createdAt: new Date(folder.createdAt),
                }));
            }
            // Ensure folders array exists for backwards compatibility
            if (!parsed.folders) {
                parsed.folders = [];
            }
            return parsed;
        }
    } catch (error) {
        console.error('Failed to load files from localStorage:', error);
    }
    return getDefaultState();
};

// Save state to localStorage
const saveToStorage = (state: FileState) => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save files to localStorage:', error);
    }
};

export const useFileManager = () => {
    // Start with default state for consistent hydration
    const [fileState, setFileState] = useState<FileState>(getDefaultState);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage after hydration
    useEffect(() => {
        if (typeof window !== 'undefined' && !isHydrated) {
            const storedState = loadFromStorage();
            setFileState(storedState);
            setIsHydrated(true);
        }
    }, [isHydrated]);

    // Save to localStorage whenever state changes (but only after hydration)
    useEffect(() => {
        if (isHydrated) {
            saveToStorage(fileState);
        }
    }, [fileState, isHydrated]);

    const createFile = useCallback((name: string = 'Untitled.md', parentId?: string) => {
        const newFile: MarkdownFile = {
            id: uuidv4(),
            name,
            content: '# New Document\n\nStart writing your markdown here...',
            createdAt: new Date(),
            updatedAt: new Date(),
            parentId,
        };

        setFileState(prev => ({
            ...prev,
            files: [...prev.files, newFile],
            activeFileId: newFile.id,
        }));

        return newFile;
    }, []);

    const createFolder = useCallback((name: string = 'New Folder', parentId?: string) => {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            createdAt: new Date(),
            parentId,
            isExpanded: true,
        };

        setFileState(prev => ({
            ...prev,
            folders: [...prev.folders, newFolder],
        }));

        return newFolder;
    }, []);

    const deleteFile = useCallback((id: string) => {
        setFileState(prev => {
            const newFiles = prev.files.filter(file => file.id !== id);
            const newActiveFileId = prev.activeFileId === id
                ? (newFiles.length > 0 ? newFiles[0].id : null)
                : prev.activeFileId;

            return {
                ...prev,
                files: newFiles,
                activeFileId: newActiveFileId,
            };
        });
    }, []);

    const deleteFolder = useCallback((id: string) => {
        setFileState(prev => {
            // Also delete all files and subfolders in this folder
            const newFiles = prev.files.filter(file => file.parentId !== id);
            const newFolders = prev.folders.filter(folder => folder.id !== id && folder.parentId !== id);

            // If active file was in deleted folder, clear selection
            const activeFileDeleted = prev.files.some(file =>
                file.id === prev.activeFileId && file.parentId === id
            );
            const newActiveFileId = activeFileDeleted ? null : prev.activeFileId;

            return {
                ...prev,
                files: newFiles,
                folders: newFolders,
                activeFileId: newActiveFileId,
            };
        });
    }, []);

    const toggleFolder = useCallback((id: string) => {
        setFileState(prev => ({
            ...prev,
            folders: prev.folders.map(folder =>
                folder.id === id
                    ? { ...folder, isExpanded: !folder.isExpanded }
                    : folder
            ),
        }));
    }, []);

    const updateFile = useCallback((id: string, updates: Partial<MarkdownFile>) => {
        setFileState(prev => ({
            ...prev,
            files: prev.files.map(file =>
                file.id === id
                    ? { ...file, ...updates, updatedAt: new Date() }
                    : file
            ),
        }));
    }, []);

    const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
        setFileState(prev => ({
            ...prev,
            folders: prev.folders.map(folder =>
                folder.id === id
                    ? { ...folder, ...updates }
                    : folder
            ),
        }));
    }, []);

    const moveItem = useCallback((itemId: string, newParentId?: string) => {
        console.log(`🔧 moveItem called: ${itemId} to parent ${newParentId}`);

        setFileState(prev => {
            console.log(`🔧 Current state - Files: ${prev.files.length}, Folders: ${prev.folders.length}`);

            const targetFile = prev.files.find(f => f.id === itemId);
            const targetFolder = prev.folders.find(f => f.id === itemId);

            console.log(`🔧 Found target file:`, targetFile?.name);
            console.log(`🔧 Found target folder:`, targetFolder?.name);

            const newFiles = prev.files.map(file =>
                file.id === itemId
                    ? { ...file, parentId: newParentId }
                    : file
            );
            const newFolders = prev.folders.map(folder =>
                folder.id === itemId
                    ? { ...folder, parentId: newParentId }
                    : folder
            );

            console.log(`🔧 New state - Files: ${newFiles.length}, Folders: ${newFolders.length}`);

            const movedFile = newFiles.find(f => f.id === itemId);
            const movedFolder = newFolders.find(f => f.id === itemId);
            console.log(`🔧 After move - File parentId: ${movedFile?.parentId}, Folder parentId: ${movedFolder?.parentId}`);

            return {
                ...prev,
                files: newFiles,
                folders: newFolders,
            };
        });
    }, []);

    const saveFile = useCallback((id: string) => {
        setFileState(prev => ({
            ...prev,
            files: prev.files.map(file =>
                file.id === id
                    ? { ...file, lastSaved: new Date() }
                    : file
            ),
        }));
    }, []);

    const setActiveFile = useCallback((id: string | null) => {
        setFileState(prev => ({
            ...prev,
            activeFileId: id,
        }));
    }, []);

    const setEditorMode = useCallback((mode: EditorMode) => {
        setFileState(prev => ({
            ...prev,
            editorMode: mode,
        }));
    }, []);

    const activeFile = fileState.files.find(file => file.id === fileState.activeFileId) || null;

    return {
        files: fileState.files,
        folders: fileState.folders,
        activeFile,
        activeFileId: fileState.activeFileId,
        editorMode: fileState.editorMode,
        createFile,
        createFolder,
        deleteFile,
        deleteFolder,
        updateFile,
        updateFolder,
        toggleFolder,
        moveItem,
        saveFile,
        setActiveFile,
        setEditorMode,
    };
}; 