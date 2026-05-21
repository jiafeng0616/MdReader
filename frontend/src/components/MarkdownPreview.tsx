import React, { memo, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

export interface NavItem {
    id: string;
    text: string;
    level: number;
}

interface MarkdownPreviewProps {
    content: string;
    visible?: boolean;
    forceFullRender?: boolean;
    filePath?: string;
    tabId?: string;
    searchQuery?: string;
    messages: {
        optimizing: (progress: number) => string;
        loadingMoreVisible: string;
        loadingMoreHidden: string;
    };
    onHeadingsChange?: (tabId: string, headings: NavItem[]) => void;
    onScrollChange?: (activeId: string) => void;
}

const INITIAL_CHUNK_SIZE = 3000;
const INCREMENTAL_CHUNK_SIZE = 3000;
const RENDER_INTERVAL = 100;

const resolveImageUrl = (src: string, filePath?: string): string => {
    if (!filePath || !src) return src;
    if (/^https?:\/\//i.test(src)) return src;
    if (/^data:/i.test(src)) return src;
    if (/^file:\/\//i.test(src)) return src;

    const dir = filePath.replace(/[\\/][^\\/]*$/, '');
    if (/^[A-Za-z]:[\\\/]/.test(src)) {
        const normalizedPath = src.replace(/\\/g, '/');
        return '/local-file?path=' + encodeURIComponent(normalizedPath);
    }

    const normalizedDir = dir.replace(/\\/g, '/');
    const normalizedSrc = src.replace(/^\.\//, '');
    return '/local-file?path=' + encodeURIComponent(normalizedDir + '/' + normalizedSrc);
};

const createImageComponent = (filePath?: string) => {
    const ImgComponent = ({ src, alt, ...props }: any) => {
        const resolvedSrc = resolveImageUrl(src || '', filePath);
        return <img src={resolvedSrc} alt={alt || ''} {...props} />;
    };
    return ImgComponent;
};

const extractHeadings = (content: string): NavItem[] => {
    const headings: NavItem[] = [];
    const lines = content.split('\n');
    lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].replace(/[*_`~\[\]]/g, '').trim();
            const id = `heading-${text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')}`;
            headings.push({ id, text, level });
        }
    });
    return headings;
};

const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
        if (part.toLowerCase() === query.toLowerCase()) {
            return <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark>;
        }
        return part;
    });
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = memo(({
    content,
    visible = true,
    forceFullRender = false,
    filePath,
    tabId,
    searchQuery = '',
    messages,
    onHeadingsChange,
    onScrollChange,
}) => {
    const [renderedLength, setRenderedLength] = useState(INITIAL_CHUNK_SIZE);
    const [isRendering, setIsRendering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const headings = extractHeadings(content);
        if (tabId) onHeadingsChange?.(tabId, headings);
    }, [content, onHeadingsChange, tabId]);

    useEffect(() => {
        if (!visible || !onScrollChange) return;

        const container = containerRef.current?.closest('[id^="tab-content-"]');
        if (!container) return;

        const handleScroll = () => {
            const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let currentId = '';

            headingElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (rect.top - containerRect.top <= 100) {
                    currentId = el.id;
                }
            });

            onScrollChange(currentId);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [visible, onScrollChange]);

    useEffect(() => {
        if (forceFullRender) {
            setRenderedLength(content.length);
            setIsRendering(false);
            return;
        }
        setRenderedLength(INITIAL_CHUNK_SIZE);
        setIsRendering(visible);
    }, [content, forceFullRender, visible]);

    useEffect(() => {
        if (forceFullRender) {
            setRenderedLength(content.length);
            setIsRendering(false);
            return;
        }
        if (visible && renderedLength < content.length) {
            setIsRendering(true);
        } else if (!visible) {
            setIsRendering(false);
        }
    }, [forceFullRender, visible, renderedLength, content.length]);

    useEffect(() => {
        if (forceFullRender || !isRendering || !visible || renderedLength >= content.length) {
            return;
        }

        const timer = setTimeout(() => {
            setRenderedLength(prev => {
                const next = prev + INCREMENTAL_CHUNK_SIZE;
                if (next >= content.length) {
                    setIsRendering(false);
                    return content.length;
                }
                return next;
            });
        }, RENDER_INTERVAL);

        return () => clearTimeout(timer);
    }, [forceFullRender, isRendering, visible, renderedLength, content.length]);

    const displayContent = forceFullRender ? content : content.slice(0, renderedLength);
    const progress = forceFullRender ? 100 : Math.min(100, Math.round((renderedLength / content.length) * 100));

    const headingComponent = (tag: string) => {
        return ({ children, ...props }: any) => {
            const text = Array.isArray(children) ? children.join('') : String(children);
            const cleanText = String(text).replace(/[*_`~\[\]]/g, '').trim();
            const id = `heading-${cleanText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')}`;
            const Tag = tag as keyof JSX.IntrinsicElements;
            const highlightedText = highlightText(String(children), searchQuery);
            return <Tag id={id} {...props}>{highlightedText}</Tag>;
        };
    };

    return (
        <div ref={containerRef} className="flex flex-col items-center relative">
            {!forceFullRender && isRendering && visible && content.length > INITIAL_CHUNK_SIZE && (
                <div className="word-preview-optimizing fixed top-28 right-8 bg-blue-600/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg z-50 transition-opacity select-none pointer-events-none">
                    {messages.optimizing(progress)}
                </div>
            )}

            <div id="markdown-preview" className="word-theme prose prose-slate dark:prose-invert max-w-none mx-auto">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw as any, [rehypeHighlight, { ignoreMissing: true }], [rehypeKatex, { throwOnError: false }]]}
                    components={{
                        img: createImageComponent(filePath),
                        h1: headingComponent('h1'),
                        h2: headingComponent('h2'),
                        h3: headingComponent('h3'),
                        h4: headingComponent('h4'),
                        h5: headingComponent('h5'),
                        h6: headingComponent('h6'),
                        table: ({ children, ...props }) => {
                            return <table {...props}>{children}</table>;
                        },
                        p: ({ children, ...props }) => {
                            const highlightedChildren = React.Children.map(children, child => {
                                if (typeof child === 'string') {
                                    return highlightText(child, searchQuery);
                                }
                                return child;
                            });
                            return <p {...props}>{highlightedChildren}</p>;
                        },
                        li: ({ children, ...props }) => {
                            const highlightedChildren = React.Children.map(children, child => {
                                if (typeof child === 'string') {
                                    return highlightText(child, searchQuery);
                                }
                                return child;
                            });
                            return <li {...props}>{highlightedChildren}</li>;
                        },
                    }}
                >
                    {displayContent}
                </ReactMarkdown>
            </div>

            {!forceFullRender && renderedLength < content.length && (
                <div className="word-preview-loading w-full py-4 text-center text-gray-400 dark:text-slate-400 text-sm">
                    {visible ? messages.loadingMoreVisible : messages.loadingMoreHidden}
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.content === nextProps.content
        && prevProps.visible === nextProps.visible
        && prevProps.forceFullRender === nextProps.forceFullRender
        && prevProps.filePath === nextProps.filePath
        && prevProps.searchQuery === nextProps.searchQuery
        && prevProps.messages === nextProps.messages;
});
