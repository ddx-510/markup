'use client';

import React, { useState } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FileText,
    Plus,
    Trash2,
    Edit3,
    Save,
    X
} from 'lucide-react';
import { MarkdownFile } from '@/types/file';

interface FileSidebarProps {
    files: MarkdownFile[];
    activeFileId: string | null;
    onFileSelect: (id: string) => void;
    onFileCreate: (name: string) => void;
    onFileDelete: (id: string) => void;
    onFileRename: (id: string, newName: string) => void;
}

export function FileSidebar({
    files,
    activeFileId,
    onFileSelect,
    onFileCreate,
    onFileDelete,
    onFileRename,
}: FileSidebarProps) {
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [editingFileName, setEditingFileName] = useState('');

    const handleCreateFile = () => {
        if (newFileName.trim()) {
            const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
            onFileCreate(fileName);
            setNewFileName('');
            setIsCreatingFile(false);
        }
    };

    const handleRenameFile = (id: string) => {
        if (editingFileName.trim()) {
            const fileName = editingFileName.endsWith('.md') ? editingFileName : `${editingFileName}.md`;
            onFileRename(id, fileName);
            setEditingFileId(null);
            setEditingFileName('');
        }
    };

    const startEditing = (file: MarkdownFile) => {
        setEditingFileId(file.id);
        setEditingFileName(file.name.replace('.md', ''));
    };

    const cancelEditing = () => {
        setEditingFileId(null);
        setEditingFileName('');
    };

    return (
        <Sidebar collapsible="offcanvas" className="border-r">
            <SidebarHeader className="p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Markdown Files</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreatingFile(true)}
                        className="h-8 w-8 p-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent className="flex-1">
                <SidebarGroup>
                    <SidebarGroupLabel>Files</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isCreatingFile && (
                                <SidebarMenuItem>
                                    <div className="flex items-center gap-2 p-2">
                                        <Input
                                            placeholder="File name"
                                            value={newFileName}
                                            onChange={(e) => setNewFileName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateFile();
                                                if (e.key === 'Escape') {
                                                    setIsCreatingFile(false);
                                                    setNewFileName('');
                                                }
                                            }}
                                            className="h-8 text-sm"
                                            autoFocus
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCreateFile}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Save className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setIsCreatingFile(false);
                                                setNewFileName('');
                                            }}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </SidebarMenuItem>
                            )}

                            {files.map((file) => (
                                <SidebarMenuItem key={file.id}>
                                    {editingFileId === file.id ? (
                                        <div className="flex items-center gap-2 p-2">
                                            <Input
                                                value={editingFileName}
                                                onChange={(e) => setEditingFileName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameFile(file.id);
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                                className="h-8 text-sm"
                                                autoFocus
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRenameFile(file.id)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Save className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEditing}
                                                className="h-8 w-8 p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <SidebarMenuButton
                                            onClick={() => onFileSelect(file.id)}
                                            isActive={activeFileId === file.id}
                                            className="group flex items-center justify-between w-full"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <FileText className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate text-sm">{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditing(file);
                                                    }}
                                                    className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                >
                                                    <Edit3 className="h-3 w-3" />
                                                </div>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onFileDelete(file.id);
                                                    }}
                                                    className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </div>
                                            </div>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            ))}

                            {files.length === 0 && !isCreatingFile && (
                                <SidebarMenuItem>
                                    <div className="p-4 text-center text-muted-foreground">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No files yet</p>
                                        <p className="text-xs">Click + to create your first file</p>
                                    </div>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
} 