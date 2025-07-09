'use client';

import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FileText,
    Folder,
    FolderOpen,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    ChevronRight,
    ChevronDown,
    FolderPlus,
    GripVertical,
} from 'lucide-react';
import { MarkdownFile, Folder as FolderType } from '@/types/file';

interface FileSidebarEnhancedProps {
    files: MarkdownFile[];
    folders: FolderType[];
    activeFileId: string | null;
    onFileSelect: (id: string) => void;
    onFileCreate: (name: string, parentId?: string) => void;
    onFolderCreate: (name: string, parentId?: string) => void;
    onFileDelete: (id: string) => void;
    onFolderDelete: (id: string) => void;
    onFileRename: (id: string, newName: string) => void;
    onFolderRename: (id: string, newName: string) => void;
    onFolderToggle: (id: string) => void;
    onItemMove: (itemId: string, newParentId?: string) => void;
}

// Simple flat item structure for easier DND
interface DragItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parentId?: string;
    level: number;
    isExpanded?: boolean;
}

// Build flat list for drag and drop
function buildFlatList(files: MarkdownFile[], folders: FolderType[]): DragItem[] {
    const items: DragItem[] = [];

    // Helper to add items recursively
    const addItems = (parentId: string | undefined, level: number) => {
        // Add folders first
        const folderItems = folders
            .filter(f => f.parentId === parentId)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(folder => ({
                id: folder.id,
                name: folder.name,
                type: 'folder' as const,
                parentId: folder.parentId,
                level,
                isExpanded: folder.isExpanded,
            }));

        // Add files
        const fileItems = files
            .filter(f => f.parentId === parentId)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(file => ({
                id: file.id,
                name: file.name,
                type: 'file' as const,
                parentId: file.parentId,
                level,
            }));

        [...folderItems, ...fileItems].forEach(item => {
            items.push(item);

            // If it's an expanded folder, add its children
            if (item.type === 'folder' && item.isExpanded) {
                addItems(item.id, level + 1);
            }
        });
    };

    addItems(undefined, 0);
    return items;
}

// Sortable item component
function SortableItem({
    item,
    activeFileId,
    onFileSelect,
    onFileDelete,
    onFolderDelete,
    onFileRename,
    onFolderRename,
    onFolderToggle,
    editingId,
    setEditingId,
    editingName,
    setEditingName,
    activeId,
}: {
    item: DragItem;
    activeFileId: string | null;
    onFileSelect: (id: string) => void;
    onFileDelete: (id: string) => void;
    onFolderDelete: (id: string) => void;
    onFileRename: (id: string, newName: string) => void;
    onFolderRename: (id: string, newName: string) => void;
    onFolderToggle: (id: string) => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    editingName: string;
    setEditingName: (name: string) => void;
    activeId: string | null;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleRename = () => {
        if (editingName.trim()) {
            const name = item.type === 'file' && !editingName.endsWith('.md')
                ? `${editingName}.md`
                : editingName;

            if (item.type === 'file') {
                onFileRename(item.id, name);
            } else {
                onFolderRename(item.id, name);
            }
        }
        setEditingId(null);
        setEditingName('');
    };

    const startEditing = () => {
        setEditingId(item.id);
        setEditingName(item.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const isEditing = editingId === item.id;
    const isActive = item.type === 'file' && activeFileId === item.id;
    const paddingLeft = item.level * 20 + 8; // Indentation based on level

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`
                    relative flex items-center gap-2 p-2 rounded-md cursor-pointer
                    hover:bg-muted/50 group transition-colors
                    ${isActive ? 'bg-accent text-accent-foreground' : ''}
                `}
                {...attributes}
            >
                {/* Drag handle */}
                <div
                    {...listeners}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    style={{ marginLeft: paddingLeft }}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Icon and content */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.type === 'folder' ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto w-auto p-0"
                            onClick={() => onFolderToggle(item.id)}
                        >
                            {item.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    ) : (
                        <div className="w-4" /> // Spacer for files
                    )}

                    {item.type === 'folder' ? (
                        item.isExpanded ? (
                            <FolderOpen className="h-4 w-4 text-blue-500" />
                        ) : (
                            <Folder className="h-4 w-4 text-blue-500" />
                        )
                    ) : (
                        <FileText className="h-4 w-4 text-gray-500" />
                    )}

                    {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                            <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') cancelEditing();
                                }}
                                className="h-6 text-sm"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRename}
                                className="h-6 w-6 p-0"
                            >
                                <Save className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditing}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <span
                                className="flex-1 text-sm truncate"
                                onClick={() => item.type === 'file' && onFileSelect(item.id)}
                            >
                                {item.name}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={startEditing}
                                    className="h-6 w-6 p-0"
                                >
                                    <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (item.type === 'file') {
                                            onFileDelete(item.id);
                                        } else {
                                            onFolderDelete(item.id);
                                        }
                                    }}
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Folder drop zone */}
            {item.type === 'folder' && <FolderDropZone folderId={item.id} isActive={!!activeId} />}
        </>
    );
}

// Folder drop zone component
function FolderDropZone({ folderId, isActive }: { folderId: string; isActive: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${folderId}`,
    });

    // Only show when actively dragging
    if (!isActive) return null;

    return (
        <div
            ref={setNodeRef}
            className={`
                mx-6 rounded-sm transition-all duration-200
                ${isOver
                    ? 'h-10 bg-blue-100 border border-dashed border-blue-400 dark:bg-blue-950/30'
                    : 'h-2 bg-transparent'
                }
            `}
        >
            {isOver && (
                <div className="flex items-center justify-center h-full text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    Drop into folder
                </div>
            )}
        </div>
    );
}

export function FileSidebarEnhanced({
    files,
    folders,
    activeFileId,
    onFileSelect,
    onFileCreate,
    onFolderCreate,
    onFileDelete,
    onFolderDelete,
    onFileRename,
    onFolderRename,
    onFolderToggle,
    onItemMove,
}: FileSidebarEnhancedProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [newFileName, setNewFileName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const flatItems = buildFlatList(files, folders);
    const itemIds = flatItems.map(item => item.id);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const overId = over.id as string;
        const activeId = active.id as string;

        // Check if dropping into a folder
        if (overId.startsWith('folder-')) {
            const folderId = overId.replace('folder-', '');

            // Prevent folder from being dropped into itself
            if (activeId === folderId) {
                console.log(`❌ Cannot move folder into itself: ${activeId}`);
                return;
            }

            // Prevent folder from being dropped into its own descendants (circular reference)
            const activeItem = flatItems.find(item => item.id === activeId);
            if (activeItem?.type === 'folder') {
                const isDescendant = (checkId: string, parentId: string): boolean => {
                    const items = [...files, ...folders];
                    const item = items.find(i => i.id === checkId);
                    if (!item?.parentId) return false;
                    if (item.parentId === parentId) return true;
                    return isDescendant(item.parentId, parentId);
                };

                if (isDescendant(folderId, activeId)) {
                    console.log(`❌ Cannot move folder into its own descendant: ${activeId} -> ${folderId}`);
                    return;
                }
            }

            console.log(`📁 Moving ${activeId} into folder ${folderId}`);
            onItemMove(activeId, folderId);
            return;
        }

        // Check if this is a move between different levels
        if (activeId !== overId) {
            const activeItem = flatItems.find(item => item.id === activeId);
            const targetItem = flatItems.find(item => item.id === overId);

            if (activeItem && targetItem) {
                // If the parentId is different, this is a move operation
                if (activeItem.parentId !== targetItem.parentId) {
                    console.log(`🔄 Moving ${activeId} from ${activeItem.parentId || 'root'} to ${targetItem.parentId || 'root'}`);
                    onItemMove(activeId, targetItem.parentId);
                    return;
                }

                // Same parent = just reordering (which @dnd-kit handles automatically in the UI)
                console.log(`📊 Reordering ${activeId} within same parent`);
                // Note: @dnd-kit handles visual reordering automatically
                // We could implement actual data reordering here if needed
            }
        }
    };

    const handleCreateFile = () => {
        if (newFileName.trim()) {
            const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
            onFileCreate(fileName);
            setNewFileName('');
            setIsCreatingFile(false);
        }
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            onFolderCreate(newFolderName);
            setNewFolderName('');
            setIsCreatingFolder(false);
        }
    };

    const activeItem = flatItems.find(item => item.id === activeId);

    return (
        <Sidebar>
            <SidebarHeader className="border-b p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Files</h2>
                    <div className="flex gap-2 ml-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreatingFolder(true)}
                            className="h-8 w-8 p-0"
                            title="New Folder"
                        >
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreatingFile(true)}
                            className="h-8 w-8 p-0"
                            title="New File"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* New folder creation */}
                            {isCreatingFolder && (
                                <SidebarMenuItem>
                                    <div className="flex items-center gap-2 p-2">
                                        <Folder className="h-4 w-4" />
                                        <Input
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateFolder();
                                                if (e.key === 'Escape') {
                                                    setIsCreatingFolder(false);
                                                    setNewFolderName('');
                                                }
                                            }}
                                            placeholder="Folder name"
                                            className="h-8 text-sm"
                                            autoFocus
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCreateFolder}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Save className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setIsCreatingFolder(false);
                                                setNewFolderName('');
                                            }}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </SidebarMenuItem>
                            )}

                            {/* New file creation */}
                            {isCreatingFile && (
                                <SidebarMenuItem>
                                    <div className="flex items-center gap-2 p-2">
                                        <FileText className="h-4 w-4" />
                                        <Input
                                            value={newFileName}
                                            onChange={(e) => setNewFileName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateFile();
                                                if (e.key === 'Escape') {
                                                    setIsCreatingFile(false);
                                                    setNewFileName('');
                                                }
                                            }}
                                            placeholder="File name"
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

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={itemIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {flatItems.map((item) => (
                                        <SortableItem
                                            key={item.id}
                                            item={item}
                                            activeFileId={activeFileId}
                                            onFileSelect={onFileSelect}
                                            onFileDelete={onFileDelete}
                                            onFolderDelete={onFolderDelete}
                                            onFileRename={onFileRename}
                                            onFolderRename={onFolderRename}
                                            onFolderToggle={onFolderToggle}
                                            editingId={editingId}
                                            setEditingId={setEditingId}
                                            editingName={editingName}
                                            setEditingName={setEditingName}
                                            activeId={activeId}
                                        />
                                    ))}
                                </SortableContext>

                                <DragOverlay>
                                    {activeItem ? (
                                        <div className="bg-background border border-border rounded p-2 shadow-lg">
                                            <div className="flex items-center gap-2">
                                                {activeItem.type === 'folder' ? (
                                                    <Folder className="h-4 w-4 text-blue-500" />
                                                ) : (
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                )}
                                                <span className="text-sm">{activeItem.name}</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
} 