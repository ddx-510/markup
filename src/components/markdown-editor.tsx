'use client';

import React, { useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface MarkdownEditorProps {
    content: string;
    onChange: (value: string) => void;
    onSave?: () => void;
    onFocus?: () => void;
    onFormat?: (format: string) => void;
}

export function MarkdownEditor({ content, onChange, onSave, onFocus, onFormat }: MarkdownEditorProps) {
    const editorRef = useRef<any>(null);

    const handleEditorChange = useCallback((value: string | undefined) => {
        onChange(value || '');
    }, [onChange]);

    const applyFormat = useCallback((format: string) => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = editor.getSelection();
        const selectedText = editor.getModel()?.getValueInRange(selection) || '';

        let formattedText = '';
        let newSelection = null;

        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                newSelection = selectedText ? null : {
                    startLineNumber: selection.startLineNumber,
                    startColumn: selection.startColumn + 2,
                    endLineNumber: selection.endLineNumber,
                    endColumn: selection.endColumn + 2
                };
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                newSelection = selectedText ? null : {
                    startLineNumber: selection.startLineNumber,
                    startColumn: selection.startColumn + 1,
                    endLineNumber: selection.endLineNumber,
                    endColumn: selection.endColumn + 1
                };
                break;
            case 'strikethrough':
                formattedText = `~~${selectedText}~~`;
                break;
            case 'code':
                formattedText = `\`${selectedText}\``;
                break;
            case 'heading1':
                formattedText = `# ${selectedText}`;
                break;
            case 'heading2':
                formattedText = `## ${selectedText}`;
                break;
            case 'heading3':
                formattedText = `### ${selectedText}`;
                break;
            case 'bulletList':
                formattedText = `- ${selectedText}`;
                break;
            case 'numberedList':
                formattedText = `1. ${selectedText}`;
                break;
            case 'blockquote':
                formattedText = `> ${selectedText}`;
                break;
            case 'link':
                formattedText = `[${selectedText || 'link text'}](url)`;
                newSelection = selectedText ? null : {
                    startLineNumber: selection.startLineNumber,
                    startColumn: selection.startColumn + 1,
                    endLineNumber: selection.endLineNumber,
                    endColumn: selection.endColumn + 10
                };
                break;
            case 'image':
                formattedText = `![${selectedText || 'alt text'}](image-url)`;
                break;
            default:
                return;
        }

        editor.executeEdits('format', [{
            range: selection,
            text: formattedText
        }]);

        if (newSelection) {
            editor.setSelection(newSelection);
        }

        editor.focus();
    }, []);

    const handleEditorMount = useCallback((editor: any, monaco: any) => {
        editorRef.current = editor;

        // Add Ctrl+S shortcut for saving
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            onSave?.();
        });

        // Add Ctrl+B for bold
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
            applyFormat('bold');
        });

        // Add Ctrl+I for italic
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
            applyFormat('italic');
        });

        // Add focus event listener
        editor.onDidFocusEditorText(() => {
            onFocus?.();
        });

        // Set focus on mount
        editor.focus();
    }, [onSave, onFocus, applyFormat]);

    // Expose format function to parent
    React.useEffect(() => {
        if (onFormat) {
            // This is a bit hacky but allows parent to trigger formatting
            (window as any).editorFormat = applyFormat;
        }
    }, [applyFormat, onFormat]);

    return (
        <div className="h-full w-full bg-background">
            <Editor
                height="100%"
                defaultLanguage="markdown"
                value={content}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-light"
                options={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    padding: { top: 16, bottom: 16 },
                    suggest: {
                        showKeywords: true,
                        showSnippets: true,
                    },
                    quickSuggestions: {
                        other: true,
                        comments: true,
                        strings: true,
                    },
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    contextmenu: true,
                    folding: true,
                    fontLigatures: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    renderWhitespace: 'selection',
                    selectOnLineNumbers: true,
                }}
            />
        </div>
    );
} 