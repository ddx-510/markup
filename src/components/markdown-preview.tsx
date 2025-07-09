'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'highlight.js/styles/github.css';

interface MarkdownPreviewProps {
    content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
    return (
        <div className="h-full bg-background">
            <ScrollArea className="h-full">
                <div className="prose prose-neutral dark:prose-invert max-w-none p-6">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            // Custom components for better styling
                            h1: ({ children }) => (
                                <h1 className="text-3xl font-bold mb-6 text-foreground border-b pb-2">
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-xl font-semibold mb-3 text-foreground">
                                    {children}
                                </h3>
                            ),
                            p: ({ children }) => (
                                <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                            ),
                            code: (props) => {
                                const { inline, className, children, ...rest } = props as {
                                    inline?: boolean;
                                    className?: string;
                                    children: React.ReactNode;
                                };

                                return !inline ? (
                                    <pre className="bg-muted p-4 rounded-md overflow-auto mb-4">
                                        <code className={className} {...rest}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code
                                        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                                        {...rest}
                                    >
                                        {children}
                                    </code>
                                );
                            },
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-4">
                                    {children}
                                </blockquote>
                            ),
                            ul: ({ children }) => (
                                <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                                <li className="text-foreground">{children}</li>
                            ),
                            a: ({ href, children }) => (
                                <a
                                    href={href}
                                    className="text-primary hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {children}
                                </a>
                            ),
                            table: ({ children }) => (
                                <div className="overflow-auto mb-4">
                                    <table className="min-w-full border-collapse border border-border">
                                        {children}
                                    </table>
                                </div>
                            ),
                            th: ({ children }) => (
                                <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td className="border border-border px-4 py-2">{children}</td>
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </ScrollArea>
        </div>
    );
} 