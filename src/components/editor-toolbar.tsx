'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Eye,
    Edit3,
    Save,
    Download,
    FileText,
    Columns,
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Link,
    Image,
    Heading1,
    Heading2,
    Heading3
} from 'lucide-react';
import { EditorMode } from '@/types/file';

interface EditorToolbarProps {
    mode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
    onSave?: () => void | Promise<void>;
    onDownload?: () => void;
    onFormat?: (format: string) => void;
    fileName?: string;
    hasActiveFile: boolean;
    lastSaved?: Date;
    isSaving?: boolean;
    hasUnsavedChanges?: boolean;
    isTyping?: boolean;
}

export function EditorToolbar({
    mode,
    onModeChange,
    onSave,
    onDownload,
    onFormat,
    fileName,
    hasActiveFile,
    lastSaved,
    isSaving = false,
    hasUnsavedChanges = false,
    isTyping = false,
}: EditorToolbarProps) {
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every 10 seconds for relative timestamps
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 10000);

        return () => clearInterval(interval);
    }, []);
    const getSaveStatus = () => {
        // Show "Saving..." when typing OR actually saving (Google Docs style)
        if (isTyping || isSaving) {
            return { text: 'Saving...', className: 'text-blue-600' };
        }

        // Never saved
        if (!lastSaved) {
            return { text: 'Not saved', className: 'text-muted-foreground' };
        }

        // If no unsaved changes, show "Saved" (like Google Docs)
        if (!hasUnsavedChanges) {
            return { text: 'Saved', className: 'text-green-600' };
        }

        // If there are unsaved changes, show relative time
        const diff = Math.floor((currentTime - lastSaved.getTime()) / 1000);
        let timeText = '';
        if (diff < 60) timeText = `${diff}s ago`;
        else if (diff < 3600) timeText = `${Math.floor(diff / 60)}m ago`;
        else if (diff < 86400) timeText = `${Math.floor(diff / 3600)}h ago`;
        else timeText = `${Math.floor(diff / 86400)}d ago`;

        return { text: `Last saved ${timeText}`, className: 'text-muted-foreground' };
    };

    const markdownButtons = [
        { icon: Bold, format: 'bold', tooltip: 'Bold (Ctrl+B)' },
        { icon: Italic, format: 'italic', tooltip: 'Italic (Ctrl+I)' },
        { icon: Strikethrough, format: 'strikethrough', tooltip: 'Strikethrough' },
        { icon: Code, format: 'code', tooltip: 'Inline Code' },
        { icon: Heading1, format: 'heading1', tooltip: 'Heading 1' },
        { icon: Heading2, format: 'heading2', tooltip: 'Heading 2' },
        { icon: Heading3, format: 'heading3', tooltip: 'Heading 3' },
        { icon: List, format: 'bulletList', tooltip: 'Bullet List' },
        { icon: ListOrdered, format: 'numberedList', tooltip: 'Numbered List' },
        { icon: Quote, format: 'blockquote', tooltip: 'Blockquote' },
        { icon: Link, format: 'link', tooltip: 'Link' },
        { icon: Image, format: 'image', tooltip: 'Image' },
    ];

    return (
        <div className="flex items-center justify-between flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                {/* File name - truncated on mobile */}
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                        {fileName || 'No file selected'}
                    </span>
                </div>

                {hasActiveFile && (
                    <>
                        <Separator orientation="vertical" className="h-6 hidden sm:block" />

                        {/* Mode tabs - simplified on mobile */}
                        <Tabs value={mode} onValueChange={(value) => onModeChange(value as EditorMode)}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="edit" className="flex items-center gap-1 md:gap-2">
                                    <Edit3 className="h-3 w-3" />
                                    <span className="hidden sm:inline">Edit</span>
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="flex items-center gap-1 md:gap-2">
                                    <Eye className="h-3 w-3" />
                                    <span className="hidden sm:inline">Preview</span>
                                </TabsTrigger>
                                <TabsTrigger value="split" className="flex items-center gap-1 md:gap-2">
                                    <Columns className="h-3 w-3" />
                                    <span className="hidden sm:inline">Split</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Markdown formatting buttons - hidden on mobile */}
                        {(mode === 'edit' || mode === 'split') && onFormat && (
                            <>
                                <Separator orientation="vertical" className="h-6 hidden lg:block" />

                                <div className="hidden lg:flex items-center gap-1">
                                    {markdownButtons.map(({ icon: Icon, format, tooltip }) => (
                                        <Button
                                            key={format}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onFormat(format)}
                                            title={tooltip}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Icon className="h-3 w-3" />
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {hasActiveFile && (
                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    {/* Save status - hidden on small mobile */}
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                        <span className={getSaveStatus().className}>
                            {getSaveStatus().text}
                        </span>
                    </div>

                    {/* Action buttons - simplified on mobile */}
                    <div className="flex items-center gap-1 md:gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onSave}
                            className="flex items-center gap-1 md:gap-2"
                        >
                            <Save className="h-3 w-3" />
                            <span className="hidden sm:inline">Save</span>
                            <span className="hidden md:inline text-xs text-muted-foreground ml-1">Ctrl+S</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDownload}
                            className="flex items-center gap-1 md:gap-2"
                        >
                            <Download className="h-3 w-3" />
                            <span className="hidden sm:inline">Download</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 