export interface MarkdownFile {
    id: string;
    name: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    lastSaved?: Date;
    parentId?: string; // null/undefined for root level
}

export interface Folder {
    id: string;
    name: string;
    createdAt: Date;
    parentId?: string; // null/undefined for root level
    isExpanded?: boolean;
}

export type FileSystemItem = MarkdownFile | Folder;

export interface FileState {
    files: MarkdownFile[];
    folders: Folder[];
    activeFileId: string | null;
    editorMode: 'edit' | 'preview' | 'split';
}

export type EditorMode = 'edit' | 'preview' | 'split';

// Type guards
export function isFile(item: FileSystemItem): item is MarkdownFile {
    return 'content' in item;
}

export function isFolder(item: FileSystemItem): item is Folder {
    return !('content' in item);
} 