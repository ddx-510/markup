'use client';

import React, { useState, useCallback } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { FileSidebarEnhanced } from '@/components/file-sidebar-enhanced';
import { EditorToolbar } from '@/components/editor-toolbar';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MarkdownPreview } from '@/components/markdown-preview';
import { useFileManager } from '@/hooks/use-file-manager';
import { useAutoSave } from '@/hooks/use-auto-save';
import { toast } from 'sonner';

function AppContent() {
    const { setOpen } = useSidebar();
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedContent, setLastSavedContent] = useState<string>('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const {
        files,
        folders,
        activeFile,
        editorMode,
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
    } = useFileManager();

    // Track if there are unsaved changes (Google Docs style)
    const hasUnsavedChanges = activeFile && activeFile.content !== lastSavedContent;

    // Reset lastSavedContent when file changes
    React.useEffect(() => {
        if (activeFile) {
            // If file has been saved before, use current content as baseline
            // If new file, start with empty string so initial content shows as unsaved
            setLastSavedContent(activeFile.lastSaved ? activeFile.content : '');
        } else {
            setLastSavedContent('');
        }

        // Reset typing state when switching files
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, [activeFile?.id]);

    // Cleanup typing timeout on unmount
    React.useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const handleFileCreate = (name: string, parentId?: string) => {
        createFile(name, parentId);
        toast.success(`Created ${name}`, {
            description: 'New file ready for editing.',
        });
    };

    const handleFolderCreate = (name: string, parentId?: string) => {
        createFolder(name, parentId);
        toast.success(`Created folder ${name}`, {
            description: 'New folder ready for organizing files.',
        });
    };

    const handleFileDelete = (id: string) => {
        const fileToDelete = files.find(f => f.id === id);
        deleteFile(id);
        if (fileToDelete) {
            toast.success(`Deleted ${fileToDelete.name}`, {
                description: 'File removed successfully.',
            });
        }
    };

    const handleFolderDelete = (id: string) => {
        const folderToDelete = folders.find(f => f.id === id);
        deleteFolder(id);
        if (folderToDelete) {
            toast.success(`Deleted folder ${folderToDelete.name}`, {
                description: 'Folder and its contents removed successfully.',
            });
        }
    };

    const handleFileRename = (id: string, newName: string) => {
        const oldFile = files.find(f => f.id === id);
        updateFile(id, { name: newName });
        if (oldFile) {
            toast.success(`Renamed to ${newName}`, {
                description: `File updated from ${oldFile.name}`,
            });
        }
    };

    const handleFolderRename = (id: string, newName: string) => {
        const oldFolder = folders.find(f => f.id === id);
        updateFolder(id, { name: newName });
        if (oldFolder) {
            toast.success(`Renamed to ${newName}`, {
                description: `Folder updated from ${oldFolder.name}`,
            });
        }
    };

    const handleFolderToggle = (id: string) => {
        toggleFolder(id);
    };

    const handleItemMove = (itemId: string, newParentId?: string) => {
        console.log(`🔧 handleItemMove: ${itemId} to parent ${newParentId}`);
        const itemBefore = files.find(f => f.id === itemId) || folders.find(f => f.id === itemId);
        console.log(`🔧 Item before move:`, itemBefore);

        // Move the item
        moveItem(itemId, newParentId);

        // If moving into a folder, auto-expand that folder to show the moved item
        if (newParentId) {
            const targetFolder = folders.find(f => f.id === newParentId);
            if (targetFolder && !targetFolder.isExpanded) {
                console.log(`📂 Auto-expanding folder: ${targetFolder.name}`);
                toggleFolder(newParentId);
            }
        }

        // Check item after move
        setTimeout(() => {
            const itemAfter = files.find(f => f.id === itemId) || folders.find(f => f.id === itemId);
            console.log(`🔧 Item after move:`, itemAfter);
            if (!itemAfter) {
                console.error(`❌ Item ${itemId} disappeared after move!`);
            }
        }, 100);

        const movedItem = files.find(f => f.id === itemId) || folders.find(f => f.id === itemId);
        if (movedItem) {
            toast.success(`Moved ${movedItem.name}`, {
                description: newParentId ? 'Item moved into folder successfully.' : 'Item moved to root level successfully.',
            });
        } else {
            console.error(`❌ Could not find moved item ${itemId}`);
        }
    };

    const handleFileSelect = (id: string) => {
        setActiveFile(id);
    };

    const handleContentChange = (content: string) => {
        if (activeFile) {
            updateFile(activeFile.id, { content });

            // Show "Saving..." while typing (Google Docs style)
            setIsTyping(true);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Reset typing state after user stops typing for 1 second
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
            }, 1000);
        }
    };

    const handleSave = useCallback(async () => {
        if (!activeFile) return;

        setIsSaving(true);

        // Simulate brief saving delay for better UX (like Google Docs)
        await new Promise(resolve => setTimeout(resolve, 100));

        // In a real app, this would save to a backend or local file system
        console.log('File saved:', activeFile.name);
        saveFile(activeFile.id);

        // Update last saved content to match current content
        setLastSavedContent(activeFile.content);

        setIsSaving(false);

        // Show toast notification for manual saves only
        toast.success(`${activeFile.name} saved successfully!`, {
            description: 'Your changes have been saved. Use Ctrl+S anytime to save.',
            duration: 2000,
        });
    }, [activeFile, saveFile]);

    // Auto-save handler (debounced save like Google Docs)
    const handleAutoSave = useCallback(async () => {
        if (!activeFile) return;

        setIsSaving(true);

        // Brief delay for saving state (shorter for auto-save)
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('Auto-saving:', activeFile.name);
        saveFile(activeFile.id);

        // Update last saved content to match current content
        setLastSavedContent(activeFile.content);

        setIsSaving(false);
    }, [activeFile, saveFile]);

    // Auto-save hook - saves when user stops typing (like Google Docs)
    useAutoSave({
        onSave: handleAutoSave,
        activeFileId: activeFile?.id || null,
        content: activeFile?.content || '',
    });

    const handleDownload = () => {
        if (activeFile) {
            try {
                const element = document.createElement('a');
                const file = new Blob([activeFile.content], { type: 'text/markdown' });
                element.href = URL.createObjectURL(file);
                element.download = activeFile.name;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);

                toast.success(`Downloaded ${activeFile.name}`, {
                    description: 'File saved to your downloads folder.',
                });
            } catch (error) {
                toast.error('Download failed', {
                    description: 'Could not download the file. Please try again.',
                });
            }
        }
    };

    const handleContentFocus = () => {
        // Auto-collapse sidebar when editor gets focus or preview is clicked
        setOpen(false);
    };

    const handleFormat = useCallback((format: string) => {
        // Trigger formatting via the global function (hacky but works)
        if ((window as any).editorFormat) {
            (window as any).editorFormat(format);
        }
    }, []);

    const renderContent = () => {
        if (!activeFile) {
            return (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-2xl font-semibold mb-2">Welcome to Markdown Editor</h2>
                        <p className="text-lg mb-4">Create a new file to get started</p>
                        <p className="text-sm">
                            Use the sidebar to create and manage your markdown files
                        </p>
                    </div>
                </div>
            );
        }

        switch (editorMode) {
            case 'edit':
                return (
                    <MarkdownEditor
                        content={activeFile.content}
                        onChange={handleContentChange}
                        onSave={handleSave}
                        onFocus={handleContentFocus}
                        onFormat={handleFormat}
                    />
                );
            case 'preview':
                return (
                    <div onClick={handleContentFocus}>
                        <MarkdownPreview content={activeFile.content} />
                    </div>
                );
            case 'split':
                return (
                    <div className="h-full flex">
                        <div className="flex-1 border-r">
                            <MarkdownEditor
                                content={activeFile.content}
                                onChange={handleContentChange}
                                onSave={handleSave}
                                onFocus={handleContentFocus}
                                onFormat={handleFormat}
                            />
                        </div>
                        <div className="flex-1">
                            <MarkdownPreview content={activeFile.content} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Sidebar */}
            <FileSidebarEnhanced
                files={files}
                folders={folders}
                activeFileId={activeFile?.id || null}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFolderCreate={handleFolderCreate}
                onFileDelete={handleFileDelete}
                onFolderDelete={handleFolderDelete}
                onFileRename={handleFileRename}
                onFolderRename={handleFolderRename}
                onFolderToggle={handleFolderToggle}
                onItemMove={handleItemMove}
            />

            {/* Main Content Area */}
            <SidebarInset className="flex flex-col min-h-screen">
                {/* Toolbar */}
                <header className="h-12 border-b flex items-center px-4 gap-4 flex-shrink-0">
                    <SidebarTrigger />
                    <EditorToolbar
                        mode={editorMode}
                        onModeChange={setEditorMode}
                        onSave={handleSave}
                        onDownload={handleDownload}
                        onFormat={handleFormat}
                        fileName={activeFile?.name}
                        hasActiveFile={!!activeFile}
                        lastSaved={activeFile?.lastSaved}
                        isSaving={isSaving}
                        hasUnsavedChanges={!!hasUnsavedChanges}
                        isTyping={isTyping}
                    />
                </header>

                {/* Editor/Preview Area */}
                <main className="flex-1 overflow-hidden">
                    {renderContent()}
                </main>
            </SidebarInset>
        </>
    );
}

export function MarkdownApp() {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppContent />
        </SidebarProvider>
    );
} 