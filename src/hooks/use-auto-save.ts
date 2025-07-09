'use client';

import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
    onSave: () => void;
    activeFileId: string | null;
    content: string;
    delayMs?: number; // Default to 3 seconds like Google Docs
}

export const useAutoSave = ({
    onSave,
    activeFileId,
    content,
    delayMs = 3000
}: UseAutoSaveOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedContentRef = useRef<string>('');

    useEffect(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Only set up auto-save if there's an active file
        if (!activeFileId) return;

        // Don't save if content hasn't changed since last save
        if (content === lastSavedContentRef.current) return;

        // Set up debounced save - save after user stops typing
        timeoutRef.current = setTimeout(() => {
            onSave();
            lastSavedContentRef.current = content;
        }, delayMs);

        // Cleanup timeout
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [activeFileId, content, onSave, delayMs]);

    // Reset saved content when file changes
    useEffect(() => {
        lastSavedContentRef.current = '';
    }, [activeFileId]);

    // Save on window blur (when user switches tabs/apps)
    useEffect(() => {
        const handleBlur = () => {
            if (activeFileId && content !== lastSavedContentRef.current) {
                onSave();
                lastSavedContentRef.current = content;
            }
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [activeFileId, content, onSave]);
}; 