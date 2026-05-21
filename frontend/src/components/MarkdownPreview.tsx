import React, { memo, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

// 导航项类型
export interface NavItem {
    id: string;
    text: string;
    level: number; // 1-6 对应 h1-h6
}

interface MarkdownPreviewProps {
    content: string;
    visible?: boolean;
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

// 初始渲染长度
const INITIAL_CHUNK_SIZE = 3000;

// 增量步长
const INCREMENTAL_CHUNK_SIZE = 3000;

// 渲染间隔：稍微放宽到 100ms，减轻渲染压力
const RENDER_INTERVAL = 100;

// 解析图片 URL：将相对路径和本地绝对路径转换为本地文件服务器 URL
const resolveImageUrl = (src: string, filePath?: string): string => {
    if (!filePath || !src) return src;
    if (/^https?:\/\//i.test(src)) return src;
    if (/^data:/i.test(src)) return src;
    if (/^file:\/\//i.test(src)) return src;

    // 获取 .md 文件所在目录
    const dir = filePath.replace(/[\\/][^\\/]*$/, '');

    // 处理 Windows 绝对路径 C:\... 或 C:/...
    if (/^[A-Za-z]:[\\\/]/.test(src)) {
        const normalizedPath = src.replace(/\\/g, '/');
        return '/local-file?path=' + encodeURIComponent(normalizedPath);
    }

    // 处理相对路径 ./images/xxx.png 或 images/xxx.png
    const normalizedDir = dir.replace(/\\/g, '/');
    const normalizedSrc = src.replace(/^\.\//, '');
    return '/local-file?path=' + encodeURIComponent(normalizedDir + '/' + normalizedSrc);
};

// 自定义 img 组件，解析本地图片路径
const createImageComponent = (filePath?: string) => {
    const ImgComponent = ({ src, alt, ...props }: any) => {
        const resolvedSrc = resolveImageUrl(src || '', filePath);
        return <img src={resolvedSrc} alt={alt || ''} {...props} />;
    };
    return ImgComponent;
};

// 从 Markdown 内容中提取标题
const extractHeadings = (content: string): NavItem[] => {
    const headings: NavItem[] = [];
    const lines = content.split('\n');
    lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].replace(/[*_`~\[\]]/g, '').trim();
            const id = `heading-${text.toLowerCase().replace(/[^\w一-龥]+/g, '-')}`;
            headings.push({ id, text, level });
        }
    });
    return headings;
};

// 高亮搜索关键词
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

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = memo(({ content, visible = true, filePath, tabId, searchQuery = '', messages, onHeadingsChange, onScrollChange }) => {
    const [renderedLength, setRenderedLength] = useState(INITIAL_CHUNK_SIZE);
    const [isRendering, setIsRendering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 提取标题并通知父组件
    useEffect(() => {
        const headings = extractHeadings(content);
        if (tabId) onHeadingsChange?.(tabId, headings);
    }, [content, onHeadingsChange, tabId]);

    // 监听滚动位置，高亮当前标题
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

    // 1. 当内容改变时，重置
    useEffect(() => {
        setRenderedLength(INITIAL_CHUNK_SIZE);
        setIsRendering(visible);
    }, [content]);

    // 2. 当可见性改变时，决定是否继续/暂停
    useEffect(() => {
        if (visible && renderedLength < content.length) {
            setIsRendering(true);
        } else if (!visible) {
            setIsRendering(false);
        }
    }, [visible, renderedLength, content.length]);

    // 3. 渲染循环
    useEffect(() => {
        if (!isRendering || !visible || renderedLength >= content.length) {
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
    }, [isRendering, visible, renderedLength, content.length]);

    const displayContent = content.slice(0, renderedLength);
    const progress = Math.min(100, Math.round((renderedLength / content.length) * 100));

    // 自定义标题组件，添加 ID 用于导航跳转
    const headingComponent = (tag: string) => {
        return ({ children, ...props }: any) => {
            const text = Array.isArray(children) ? children.join('') : String(children);
            const cleanText = String(text).replace(/[*_`~\[\]]/g, '').trim();
            const id = `heading-${cleanText.toLowerCase().replace(/[^\w一-龥]+/g, '-')}`;
            const Tag = tag as keyof JSX.IntrinsicElements;
            const highlightedText = highlightText(String(children), searchQuery);
            return <Tag id={id} {...props}>{highlightedText}</Tag>;
        };
    };

    return (
        <div ref={containerRef} className="flex flex-col items-center relative">
            {isRendering && visible && content.length > INITIAL_CHUNK_SIZE && (
                <div className="fixed top-28 right-8 bg-blue-600/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg z-50 transition-opacity select-none pointer-events-none">
                    {messages.optimizing(progress)}
                </div>
            )}

            <div id="markdown-preview" className="word-theme prose prose-slate dark:prose-invert mx-auto w-full">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw as any, [rehypeHighlight, { ignoreMissing: true }]]}
                    components={{
                        img: createImageComponent(filePath),
                        h1: headingComponent('h1'),
                        h2: headingComponent('h2'),
                        h3: headingComponent('h3'),
                        h4: headingComponent('h4'),
                        h5: headingComponent('h5'),
                        h6: headingComponent('h6'),
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

            {renderedLength < content.length && (
                <div className="w-full py-4 text-center text-gray-400 dark:text-slate-400 text-sm">
                    {visible ? messages.loadingMoreVisible : messages.loadingMoreHidden}
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.content === nextProps.content && prevProps.visible === nextProps.visible && prevProps.filePath === nextProps.filePath && prevProps.searchQuery === nextProps.searchQuery && prevProps.messages === nextProps.messages;
});
