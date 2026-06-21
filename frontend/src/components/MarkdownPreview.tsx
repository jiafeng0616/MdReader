import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { ReadImageAsBase64 } from '../../wailsjs/go/main/App';
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
    isFullWidth?: boolean;
}

const INITIAL_CHUNK_SIZE = 3000;
const INCREMENTAL_CHUNK_SIZE = 3000;
const RENDER_INTERVAL = 100;

const isLocalPath = (src: string): boolean => {
    if (!src) return false;
    if (/^https?:\/\//i.test(src)) return false;
    if (/^data:/i.test(src)) return false;
    if (/^blob:/i.test(src)) return false;
    return true;
};

const toAbsolutePath = (src: string, filePath: string): string => {
    if (/^[A-Za-z]:[\\\/]/.test(src)) return src.replace(/\//g, '\\');
    if (/^file:\/\//i.test(src)) {
        let p = src.replace(/^file:\/\/\/?/i, '');
        p = p.replace(/^\/([A-Za-z]):/i, '$1:');
        return p.replace(/\//g, '\\');
    }
    const dir = filePath.replace(/[\\/][^\\/]*$/, '');
    // Handle relative paths: both ./images/xxx and images/xxx should resolve relative to the markdown file
    const normalizedSrc = src.replace(/^\.\//, '').replace(/^\//, '');
    // Decode URL-encoded characters (rehype encodes Chinese characters in src)
    let decodedSrc: string;
    try {
        decodedSrc = decodeURIComponent(normalizedSrc);
    } catch {
        decodedSrc = normalizedSrc;
    }
    return dir + '\\' + decodedSrc;
};

const createImageComponent = (filePath?: string) => {
    const ImgComponent = ({ src, alt, ...props }: any) => {
        const [dataUrl, setDataUrl] = useState('');
        const imgSrc = src || '';

        useEffect(() => {
            if (!imgSrc || !isLocalPath(imgSrc) || !filePath) return;
            const absPath = toAbsolutePath(imgSrc, filePath);
            ReadImageAsBase64(absPath)
                .then((data: string) => setDataUrl(data))
                .catch((err: any) => console.error('ReadImageAsBase64 failed:', absPath, err));
        }, [imgSrc, filePath]);

        if (isLocalPath(imgSrc) && filePath) {
            if (dataUrl) {
                return <img src={dataUrl} alt={alt || ''} {...props} />;
            }
            return null;
        }
        return <img src={imgSrc} alt={alt || ''} {...props} />;
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

// Mermaid diagram renderer component
const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);
    const mermaidRef = useRef<any>(null);

    useEffect(() => {
        let cancelled = false;

        const initAndRender = async () => {
            try {
                // Dynamically import mermaid to ensure it's loaded
                const mermaidModule = await import('mermaid');
                const mermaidApi = mermaidModule.default || mermaidModule;

                if (!cancelled) {
                    mermaidRef.current = mermaidApi;

                    // Initialize mermaid with theme detection
                    mermaidApi.initialize({
                        startOnLoad: false,
                        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                        securityLevel: 'loose',
                        fontFamily: 'inherit',
                    });

                    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                    const result = await mermaidApi.render(id, code.trim());

                    if (!cancelled) {
                        // Handle both object result (v10) and direct string return
                        const svgCode = typeof result === 'string' ? result : (result as any).svg;
                        setSvg(svgCode);
                        setError('');
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : String(err));
                    setSvg('');
                }
            }
        };

        initAndRender();
        return () => { cancelled = true; };
    }, [code]);

    if (error) {
        return (
            <div className="mermaid-error my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Mermaid Diagram Error</div>
                <pre className="text-xs text-red-500 dark:text-red-300 whitespace-pre-wrap overflow-auto">{error}</pre>
                <details className="mt-2">
                    <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">View source code</summary>
                    <pre className="mt-1 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{code}</pre>
                </details>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="mermaid-loading my-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <span className="text-gray-400 dark:text-gray-500 text-sm">Loading diagram...</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="mermaid-svg my-4 flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
    );
};

// Draw.io diagram renderer component
const DrawioDiagram: React.FC<{ code: string }> = ({ code }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isDrawioXml = code.includes('<mxfile') || code.includes('<diagram');

    if (isExpanded) {
        return (
            <div className="drawio-expanded my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Draw.io Diagram</span>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Collapse
                    </button>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 overflow-auto max-h-96">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{code}</pre>
                </div>
            </div>
        );
    }

    if (isDrawioXml) {
        return (
            <div className="drawio-preview my-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Draw.io Diagram</span>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                        View XML
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-4 text-center">
                    <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">
                        Draw.io diagram preview
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                        Click "View XML" to see the source code
                    </div>
                    <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                        Tip: Use the{' '}
                        <a
                            href="https://app.diagrams.net/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                            diagrams.net
                        </a>{' '}
                        editor to open and edit this diagram
                    </div>
                </div>
            </div>
        );
    }

    // Non-XML drawio code (e.g., simple diagram text format)
    return (
        <div className="drawio-preview my-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Draw.io Diagram</div>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-auto">{code}</pre>
        </div>
    );
};

// Excalidraw diagram renderer component
const ExcalidrawDiagram: React.FC<{ code: string }> = ({ code }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    let parsedData: any = null;
    let elements: any[] = [];

    try {
        parsedData = JSON.parse(code);
        elements = parsedData?.elements || [];
    } catch {
        // Invalid JSON
    }

    const isValidExcalidraw = parsedData && typeof parsedData === 'object' && elements.length > 0;

    if (isExpanded) {
        return (
            <div className="excalidraw-expanded my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Excalidraw Diagram ({elements.length} elements)</span>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Collapse
                    </button>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 overflow-auto max-h-96">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{code}</pre>
                </div>
            </div>
        );
    }

    if (isValidExcalidraw) {
        const rectangles = elements.filter((el: any) => el.type === 'rectangle').length;
        const ellipses = elements.filter((el: any) => el.type === 'ellipse').length;
        const arrows = elements.filter((el: any) => el.type === 'arrow').length;
        const lines = elements.filter((el: any) => el.type === 'line').length;
        const texts = elements.filter((el: any) => el.type === 'text').length;

        return (
            <div className="excalidraw-preview my-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Excalidraw Diagram ({elements.length} elements)</span>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                        View JSON
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-center mb-3">
                        <div className="text-gray-400 dark:text-gray-500 text-sm">
                            Excalidraw hand-drawn diagram
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {rectangles > 0 && <span className="mr-2">Rectangles: {rectangles}</span>}
                            {ellipses > 0 && <span className="mr-2">Ellipses: {ellipses}</span>}
                            {arrows > 0 && <span className="mr-2">Arrows: {arrows}</span>}
                            {lines > 0 && <span className="mr-2">Lines: {lines}</span>}
                            {texts > 0 && <span className="mr-2">Texts: {texts}</span>}
                        </div>
                    </div>
                    <div className="text-center text-xs text-gray-400 dark:text-gray-500">
                        Tip: Use{' '}
                        <a
                            href="https://excalidraw.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                            Excalidraw
                        </a>{' '}
                        to edit this diagram
                    </div>
                </div>
            </div>
        );
    }

    // Invalid or empty excalidraw data
    return (
        <div className="excalidraw-preview my-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Excalidraw Diagram</div>
            <div className="text-xs text-red-500 dark:text-red-400 mb-2">Invalid or empty Excalidraw data</div>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-32">{code.slice(0, 200)}...</pre>
        </div>
    );
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
    isFullWidth = false,
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

    const ImageComponent = useMemo(() => createImageComponent(filePath), [filePath]);

    const components = useMemo(() => ({
        img: ImageComponent,
        h1: headingComponent('h1'),
        h2: headingComponent('h2'),
        h3: headingComponent('h3'),
        h4: headingComponent('h4'),
        h5: headingComponent('h5'),
        h6: headingComponent('h6'),
        table: ({ children, ...props }: any) => {
            return <table {...props}>{children}</table>;
        },
        p: ({ children, ...props }: any) => {
            const highlightedChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    return highlightText(child, searchQuery);
                }
                return child;
            });
            return <p {...props}>{highlightedChildren}</p>;
        },
        li: ({ children, ordered, ...props }: any) => {
            const highlightedChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    return highlightText(child, searchQuery);
                }
                return child;
            });
            return <li {...props}>{highlightedChildren}</li>;
        },
        code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');

            if (match && match[1] === 'mermaid') {
                return <MermaidDiagram code={code} />;
            }

            if (match && match[1] === 'drawio') {
                return <DrawioDiagram code={code} />;
            }

            if (match && match[1] === 'excalidraw') {
                return <ExcalidrawDiagram code={code} />;
            }

            // Default code block rendering
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        a: ({ href, children, ...props }: any) => {
            // Internal anchor link (e.g., [text](#heading-id))
            if (href && href.startsWith('#')) {
                // Decode URL-encoded characters (e.g., %E7%AC%AC -> 第)
                let targetId = decodeURIComponent(href.slice(1));
                
                const handleClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    const container = containerRef.current?.closest('[id^="tab-content-"]');
                    if (!container) return;

                    // Try exact id first, then with heading- prefix
                    let element = container.querySelector(`#${CSS.escape(targetId)}`);
                    if (!element && !targetId.startsWith('heading-')) {
                        element = container.querySelector(`#${CSS.escape('heading-' + targetId)}`);
                    }

                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                };
                return (
                    <a
                        href={href}
                        onClick={handleClick}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer"
                        {...props}
                    >
                        {children}
                    </a>
                );
            }
            // External link - open in default browser
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
                    {...props}
                >
                    {children}
                </a>
            );
        },
    }), [ImageComponent, searchQuery]);

    return (
        <div ref={containerRef} className="flex flex-col items-center relative">
            {!forceFullRender && isRendering && visible && content.length > INITIAL_CHUNK_SIZE && (
                <div className="word-preview-optimizing fixed top-28 right-8 bg-blue-600/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg z-50 transition-opacity select-none pointer-events-none">
                    {messages.optimizing(progress)}
                </div>
            )}

            <div 
                id="markdown-preview" 
                className={`word-theme prose prose-slate dark:prose-invert max-w-none mx-auto ${isFullWidth ? 'word-theme-fullwidth' : ''}`}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw as any, [rehypeHighlight, { ignoreMissing: true }], [rehypeKatex, { throwOnError: false }]]}
                    components={components}
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
        && prevProps.messages === nextProps.messages
        && prevProps.isFullWidth === nextProps.isFullWidth;
});
