import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ReadFile, SaveFile, GetCommandLineArgs, OpenFileDialog, SaveFileDialog, ExportHTMLDialog, SaveHTMLFile, RegisterContextMenu, UnregisterContextMenu, CheckPendingFiles, GetSettings, SaveSettings } from '../wailsjs/go/main/App';
import { EventsOn, WindowGetSize, WindowIsMaximised, WindowSetDarkTheme, WindowSetLightTheme, WindowFullscreen, WindowUnfullscreen, WindowIsFullscreen } from '../wailsjs/runtime/runtime';
import { main as models } from '../wailsjs/go/models';
import { MarkdownPreview, NavItem } from './components/MarkdownPreview';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SearchReplace } from './components/SearchReplace';
import { isDefaultDocumentContent, isDefaultDocumentTitle, languageOptions, useI18n } from './i18n';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { search } from '@codemirror/search';
import { FileText, Edit3, Save, Copy, FileIcon, Plus, X, FolderOpen, Settings, Check, Trash2, Sun, Moon, List, Printer, Maximize, Maximize2, Minimize2, Download, FileCode } from 'lucide-react';
import { copyHtmlToClipboard } from './utils/clipboard';
import { generateHtmlDocument } from './utils/markdownToHtml';

type Messages = ReturnType<typeof useI18n>['t'];

declare global {
    interface Window {
        CheckFiles: () => void;
    }
}

interface Tab {
    id: string;
    title: string;
    filePath: string;
    content: string;
    isEditMode: boolean;
    isDirty: boolean;
}

type ThemeMode = 'light' | 'dark' | 'dark-blue' | 'solarized-light' | 'solarized-dark' | 'monokai';
interface WindowState {
    width: number;
    height: number;
    maximized: boolean;
}

function App() {
    const { language, setLanguage, t } = useI18n();
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>("");
    const [statusMsg, setStatusMsg] = useState<string>("");
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    const [theme, setTheme] = useState<ThemeMode>('dark-blue');
    const [zoom, setZoom] = useState<number>(100);
    const [windowState, setWindowState] = useState<WindowState>({ width: 1024, height: 768, maximized: true });
    const [isFullWidth, setIsFullWidth] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [settingsReady, setSettingsReady] = useState(false);
    const saveTimerRef = useRef<number | undefined>(undefined);

    // 导航相关状态
    const [showNav, setShowNav] = useState(false);
    const [headingsMap, setHeadingsMap] = useState<Record<string, NavItem[]>>({});
    const [activeHeadingId, setActiveHeadingId] = useState("");

    // 获取当前 tab 的 headings
    const headings = activeTabId ? (headingsMap[activeTabId] || []) : [];

    // 搜索相关状态
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMatches, setSearchMatches] = useState<number>(0);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const activeTab = tabs.find(t => t.id === activeTabId);
    const currentLanguageOption = languageOptions.find(option => option.value === language) || languageOptions[0];

    const isDefaultBlankTab = (tab: Tab) => {
        return !tab.filePath && !tab.isDirty && isDefaultDocumentTitle(tab.title) && isDefaultDocumentContent(tab.content);
    };

    const normalizePath = (p: string) => {
        let x = (p || "").trim();
        // 去掉两侧引号（部分启动方式可能保留引号）
        x = x.replace(/^\"+|\"+$/g, "");
        // 容错：file:///C:/... 形式
        if (x.toLowerCase().startsWith("file:///")) {
            const raw = x.slice("file:///".length);
            try {
                x = decodeURI(raw);
            } catch {
                x = raw;
            }
            // file url 用 /，转回 windows 路径更稳
            x = x.replace(/\//g, "\\");
        }
        return x;
    };

    const isMarkdownPath = (p: string) => {
        const low = normalizePath(p).toLowerCase();
        return low.endsWith(".md") || low.endsWith(".markdown");
    };

    // 核心：处理来自后端的“拉取”信号
    const fetchPendingFiles = useCallback(async (messages: Messages = t) => {
        try {
            const pending = await CheckPendingFiles();
            if (pending && pending.length > 0) {
                console.log("Found pending files:", pending);
                setStatusMsg(messages.status.foundPendingFiles(pending.length));
                for (const path of pending) {
                    if (path && typeof path === 'string' && isMarkdownPath(path)) {
                        await loadFileToNewTab(normalizePath(path));
                    }
                }
                return true;
            }
        } catch (e) {
            console.error("Failed to check pending files", e);
            setStatusMsg(messages.status.fetchPendingFailed(e));
        }
        return false;
    }, [t]);

    // 挂载全局信号处理函数
    useEffect(() => {
        // 1. 暴露给 Go 直接调用的接口
        window.CheckFiles = () => {
            fetchPendingFiles();
        };
        
        // 2. 监听 Wails 事件 (Backup)
        const off = EventsOn("new-files-available", () => {
            fetchPendingFiles();
        });

        // 3. 终极方案：监听窗口焦点 (解决所有唤醒后不执行JS的问题)
        const handleFocus = () => {
            // 当窗口被唤醒并获得焦点时，顺便检查一下有没有新文件
            fetchPendingFiles();
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            // @ts-ignore
            window.CheckFiles = undefined;
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchPendingFiles]); 

    // 读取配置并初始化主题/缩放/窗口状态
    useEffect(() => {
        const applyTheme = (t: ThemeMode) => {
            document.documentElement.classList.toggle('dark', t === 'dark');
            try {
                if (t === 'dark') WindowSetDarkTheme();
                else WindowSetLightTheme();
            } catch {
                // ignore
            }
        };

        const initSettings = async () => {
            try {
                const s = await GetSettings(); // main.UserSettings
                const themeMode: ThemeMode = (s?.theme === 'dark' ? 'dark' : 'light');
                const z = Math.min(300, Math.max(50, Number(s?.zoom ?? 100)));
                setTheme(themeMode);
                setZoom(z);
                if (s?.window) {
                    setWindowState({
                        width: Number(s.window.width ?? 1024),
                        height: Number(s.window.height ?? 768),
                        maximized: Boolean(s.window.maximized),
                    });
                }
                applyTheme(themeMode);
                
                // 恢复上次打开的文档
                if (s?.openDocuments && s.openDocuments.length > 0) {
                    const restoredTabs: Tab[] = await Promise.all(s.openDocuments.map(async (doc: any) => {
                        let content = t.document.defaultContent;
                        // 如果有文件路径，重新读取文件内容
                        if (doc.filePath && doc.filePath.trim()) {
                            try {
                                content = await ReadFile(doc.filePath);
                            } catch {
                                // 文件读取失败，使用默认内容
                                content = t.document.defaultContent;
                            }
                        }
                        return {
                            id: Date.now().toString() + Math.random().toString().slice(2, 5),
                            title: doc.title || t.document.untitled,
                            filePath: doc.filePath || "",
                            content,
                            isEditMode: doc.isEditMode || false,
                            isDirty: false,
                        };
                    }));
                    setTabs(restoredTabs);
                    if (s.activeTabId) {
                        // 找到对应的 tab（使用索引匹配，因为 id 会重新生成）
                        const activeIndex = s.openDocuments.findIndex((doc: any) => doc.isActive);
                        if (activeIndex >= 0 && activeIndex < restoredTabs.length) {
                            setActiveTabId(restoredTabs[activeIndex].id);
                        } else {
                            setActiveTabId(restoredTabs[0].id);
                        }
                    } else {
                        setActiveTabId(restoredTabs[0].id);
                    }
                }
            } catch (e) {
                // fallback: keep defaults
                document.documentElement.classList.toggle('dark', false);
            } finally {
                setSettingsReady(true);
            }
        };

        initSettings();
    }, []);

    // 监听窗口变化：记录宽高 + 是否最大化（保留上一次非最大化尺寸）
    useEffect(() => {
        if (!settingsReady) return;
        let timer: number | undefined;
        const onResize = () => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(async () => {
                try {
                    const maximized = await WindowIsMaximised();
                    const size = await WindowGetSize();
                    setWindowState(prev => {
                        const next: WindowState = { ...prev, maximized };
                        if (!maximized) {
                            next.width = size.w;
                            next.height = size.h;
                        }
                        return next;
                    });
                } catch {
                    // ignore
                }
            }, 200);
        };
        window.addEventListener('resize', onResize);
        onResize();
        return () => {
            window.removeEventListener('resize', onResize);
            if (timer) window.clearTimeout(timer);
        };
    }, [settingsReady]);

    // 持久化配置（debounce，避免拖动/resize 频繁写盘）
    useEffect(() => {
        if (!settingsReady) return;
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
            try {
                // 保存打开的文档列表（仅保存文件路径，不保存内容）
                const openDocuments = tabs.map(tab => ({
                    filePath: tab.filePath,
                    title: tab.title,
                    isEditMode: tab.isEditMode,
                    isActive: tab.id === activeTabId,
                }));
                SaveSettings(models.UserSettings.createFrom({
                    theme,
                    zoom,
                    window: windowState,
                    openDocuments,
                    activeTabId,
                }));
            } catch {
                // ignore
            }
        }, 300);
        return () => {
            if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        };
    }, [settingsReady, theme, zoom, windowState.width, windowState.height, windowState.maximized, tabs, activeTabId]);

    // 初始化逻辑（等待设置加载完成）
    useEffect(() => {
        if (!settingsReady) return;
        
        const init = async () => {
            let hasOpenedFile = false;

            // 1. 获取命令行参数
            const args = await GetCommandLineArgs();
            if (args && args.length > 1) {
                for (let i = 1; i < args.length; i++) {
                    const path = args[i];
                    if (path && isMarkdownPath(path)) {
                        await loadFileToNewTab(normalizePath(path));
                        hasOpenedFile = true;
                    }
                }
            }

            // 2. 初始检查 Pending Files
            if (await fetchPendingFiles(t)) {
                hasOpenedFile = true;
            }

            // 3. 如果没有打开文件且没有从设置中恢复的文档，创建新文档
            if (!hasOpenedFile) {
                setTimeout(() => {
                    setTabs(currentTabs => {
                        if (currentTabs.length === 0) {
                            const newTab: Tab = {
                                id: Date.now().toString(),
                                title: t.document.untitled,
                                filePath: "",
                                content: t.document.defaultContent,
                                isEditMode: false,
                                isDirty: false,
                            };
                            setActiveTabId(newTab.id);
                            return [newTab];
                        }
                        return currentTabs;
                    });
                }, 100);
            }
        };

        init();
    }, [settingsReady]); 

    const createNewTab = (title = t.document.untitled, content = "", filePath = "") => {
        const newTab: Tab = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            title,
            filePath,
            content: content || t.document.defaultContent,
            isEditMode: false,
            isDirty: false,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    };

    const loadFileToNewTab = async (path: string) => {
        try {
            const cleanPath = normalizePath(path);
            const text = await ReadFile(cleanPath);
            const fileName = cleanPath.split(/[\\/]/).pop() || t.document.genericName;
            
            setTabs(prev => {
                const existing = prev.find(t => t.filePath === cleanPath);
                if (existing) {
                    setActiveTabId(existing.id);
                    return prev;
                }
                
                const newTab: Tab = {
                    id: Date.now().toString() + Math.random().toString().slice(2, 5),
                    title: fileName,
                    filePath: cleanPath,
                    content: text,
                    isEditMode: false,
                    isDirty: false,
                };
                setActiveTabId(newTab.id);
                return [...prev, newTab];
            });
            
            setStatusMsg(t.status.loaded(fileName));
        } catch (err) {
            setStatusMsg(t.status.loadFailed(err));
        }
    };

    const handleOpenFile = async () => {
        try {
            const paths = await OpenFileDialog();
            if (paths && paths.length > 0) {
                paths.forEach(path => loadFileToNewTab(path));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const closeTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            if (activeTabId === id && newTabs.length > 0) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            }
            return newTabs;
        });
        if (tabs.length === 1 && tabs[0].id === id) {
             setActiveTabId("");
        }
    };
    
    const handleThemeChange = (newTheme: ThemeMode) => {
        setTheme(newTheme);
        // 移除所有主题类
        document.documentElement.classList.remove('dark', 'dark-blue', 'solarized-light', 'solarized-dark', 'monokai');
        // 添加当前主题类
        document.documentElement.classList.add(newTheme);
        // 判断是否为暗色主题
        const isDarkTheme = newTheme === 'dark' || newTheme === 'dark-blue' || newTheme === 'solarized-dark' || newTheme === 'monokai';
        if (isDarkTheme) {
            document.documentElement.classList.add('dark');
        }
        try {
            if (isDarkTheme) {
                WindowSetDarkTheme();
            } else {
                WindowSetLightTheme();
            }
        } catch {
            // ignore
        }
    };

    const handleSaveAs = async () => {
        if (!activeTab) return;
        try {
            // 使用原文档名 + "_update" 作为默认文件名
            let defaultName = activeTab.title;
            // 移除 .md 后缀（如果有）
            if (defaultName.toLowerCase().endsWith('.md')) {
                defaultName = defaultName.slice(0, -3);
            }
            // 添加 "_update" 后缀
            defaultName += '_update';
            
            let savePath = await SaveFileDialog(defaultName);
            if (!savePath) return;
            if (!savePath.toLowerCase().endsWith(".md")) savePath += ".md";
            const fileName = savePath.split(/[\\/]/).pop() || t.document.genericName;
            await SaveFile(savePath, activeTab.content);
            // 创建新的 tab 来保存为新文件
            const newTab: Tab = {
                id: Date.now().toString() + Math.random().toString().slice(2, 5),
                title: fileName,
                filePath: savePath,
                content: activeTab.content,
                isEditMode: activeTab.isEditMode,
                isDirty: false,
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
            setStatusMsg(`Saved as ${fileName}`);
            setTimeout(() => setStatusMsg(""), 2000);
        } catch (err) {
            setStatusMsg(t.status.saveError(err));
        }
    };

    const handleExportHtml = async () => {
        if (!activeTab) return;
        try {
            // 使用原文档名作为默认文件名（将 .md 改为 .html）
            let defaultName = activeTab.title;
            // 移除 .md 后缀（如果有）
            if (defaultName.toLowerCase().endsWith('.md')) {
                defaultName = defaultName.slice(0, -3);
            }
            // 添加 .html 后缀
            defaultName += '.html';

            // 调用后端对话框，检查文件是否存在
            const result = await ExportHTMLDialog(defaultName);
            if (!result.filePath) return; // 用户取消

            // 生成HTML内容
            const htmlContent = generateHtmlDocument(
                activeTab.title.replace(/\.md$/i, ''),
                activeTab.content,
                activeTab.content
            );

            // 保存HTML文件
            await SaveHTMLFile(result.filePath, htmlContent);

            const fileName = result.filePath.split(/[\\/]/).pop() || 'document.html';
            setStatusMsg(`Exported to ${fileName}`);
            setTimeout(() => setStatusMsg(""), 2000);
        } catch (err) {
            setStatusMsg(t.status.saveError(err));
        }
    };

    const handleFullScreen = async () => {
        try {
            const isFullScreen = await WindowIsFullscreen();
            if (!isFullScreen) {
                WindowFullscreen();
                setIsFullScreen(true);
            } else {
                WindowUnfullscreen();
                setIsFullScreen(false);
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    // 监听全屏状态变化
    useEffect(() => {
        const checkFullScreenState = async () => {
            try {
                const isFullScreen = await WindowIsFullscreen();
                setIsFullScreen(isFullScreen);
            } catch {
                // ignore
            }
        };
        
        // 定期检查全屏状态（因为 Wails 没有全屏状态变化事件）
        const interval = setInterval(checkFullScreenState, 500);
        return () => clearInterval(interval);
    }, []);

    // 监听 tabs 变化，如果关完了自动新建
    useEffect(() => {
        if (tabs.length === 0 && activeTabId === "EMPTY_STATE_CHECK") { 
             createNewTab();
        }
    }, [tabs]);

    const updateTab = (id: string, updates: Partial<Tab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const updateActiveTab = (updates: Partial<Tab>) => {
        if (activeTabId) updateTab(activeTabId, updates);
    };

    useEffect(() => {
        setTabs(prev => prev.map(tab => {
            if (!isDefaultBlankTab(tab)) return tab;
            return {
                ...tab,
                title: t.document.untitled,
                content: t.document.defaultContent,
            };
        }));
    }, [language, t]);

    const handleSave = async () => {
        if (!activeTab) return;
        let targetPath = activeTab.filePath;
        if (!targetPath) {
            try {
                // 使用当前文档名作为默认文件名
                let defaultName = activeTab.title;
                if (defaultName.toLowerCase().endsWith('.md')) {
                    defaultName = defaultName.slice(0, -3);
                }
                targetPath = await SaveFileDialog(defaultName);
                if (!targetPath) return;
                if (!targetPath.toLowerCase().endsWith(".md")) targetPath += ".md";
                const fileName = targetPath.split(/[\\/]/).pop() || t.document.genericName;
                updateActiveTab({ filePath: targetPath, title: fileName });
            } catch (err) {
                setStatusMsg(t.status.saveError(err));
                return;
            }
        }
        try {
            await SaveFile(targetPath, activeTab.content);
            updateActiveTab({ isDirty: false, filePath: targetPath });
            setStatusMsg(t.status.saved);
            setTimeout(() => setStatusMsg(""), 2000);
        } catch (err) {
            setStatusMsg(t.status.saveFailed(err));
        }
    };

    const handleCopyToWord = async () => {
        if (activeTab?.isEditMode) {
            setStatusMsg(t.status.switchToReadMode);
            return;
        }
        const container = document.getElementById(`tab-content-${activeTabId}`);
        const previewDiv = container?.querySelector('#markdown-preview');
        
        if (!previewDiv) {
            setStatusMsg(t.status.cannotGetContent);
            return;
        }

        try {
            await copyHtmlToClipboard(previewDiv.innerHTML, t.status.clipboardWriteFailed);
            setStatusMsg(t.status.copied);
            setTimeout(() => setStatusMsg(""), 2000);
        } catch (err) {
            setStatusMsg(t.status.copyFailed(err));
        }
    };

    const handleExportPdf = async () => {
        if (activeTab?.isEditMode) {
            setStatusMsg(t.status.switchToReadMode);
            return;
        }

        const container = document.getElementById(`tab-content-${activeTabId}`);
        const previewDiv = container?.querySelector('#markdown-preview');

        if (!previewDiv) {
            setStatusMsg(t.status.cannotGetContent);
            return;
        }

        try {
            setIsExportingPdf(true);
            await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            setStatusMsg(t.status.exportPdfReady ?? 'Opening the print dialog. Choose Save as PDF.');
            window.print();
        } catch (err) {
            setIsExportingPdf(false);
            setStatusMsg(t.status.exportPdfFailed?.(err) ?? `PDF export failed: ${err}`);
        }
    };

    const handleRegisterMenu = async () => {
        try {
            await RegisterContextMenu();
            alert(t.status.registerMenuSuccess);
            setShowSettingsMenu(false);
        } catch (err) {
            alert(t.status.operationFailed(err));
        }
    };

    const handleUnregisterMenu = async () => {
        try {
            await UnregisterContextMenu();
            alert(t.status.unregisterMenuSuccess);
            setShowSettingsMenu(false);
        } catch (err) {
            alert(t.status.operationFailed(err));
        }
    };

    // 导航回调
    const handleHeadingsChange = useCallback((tabId: string, newHeadings: NavItem[]) => {
        setHeadingsMap(prev => ({
            ...prev,
            [tabId]: newHeadings,
        }));
    }, []);

    const handleScrollChange = useCallback((activeId: string) => {
        setActiveHeadingId(activeId);
    }, []);

    // 点击导航项跳转
    const handleNavClick = (id: string) => {
        const container = document.querySelector(`[id^="tab-content-${activeTabId}"]`);
        if (!container) return;
        const element = container.querySelector(`#${CSS.escape(id)}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // 搜索功能
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        // 计算匹配数量（仅用于显示）
        if (!activeTab) return;

        if (!query) {
            setSearchMatches(0);
            setCurrentMatchIndex(0);
            return;
        }

        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = activeTab.content.match(regex);
        setSearchMatches(matches ? matches.length : 0);
        setCurrentMatchIndex(matches && matches.length > 0 ? 1 : 0);
    }, [activeTab]);

    const handleNextMatch = () => {
        if (searchMatches === 0) return;
        setCurrentMatchIndex(prev => (prev % searchMatches) + 1);
        scrollToMatch(currentMatchIndex);
    };

    const handlePrevMatch = () => {
        if (searchMatches === 0) return;
        setCurrentMatchIndex(prev => (prev - 2 + searchMatches) % searchMatches + 1);
        scrollToMatch(currentMatchIndex - 2);
    };

    const scrollToMatch = (index: number) => {
        // 使用 CSS :nth-child 选择器高亮当前匹配项
        const container = document.querySelector(`[id^="tab-content-${activeTabId}"]`);
        if (!container) return;

        const highlights = container.querySelectorAll('mark');
        if (highlights.length === 0) return;

        const targetIndex = ((index - 1 + highlights.length) % highlights.length);
        const target = highlights[targetIndex];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeTab?.isEditMode) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setShowSearch(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab?.isEditMode]);

    useEffect(() => {
        const handleAfterPrint = () => setIsExportingPdf(false);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    return (
        <ErrorBoundary messages={t.errorBoundary}>
            <div className="app-shell h-screen flex flex-col bg-gray-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100" onClick={() => { setShowSettingsMenu(false); setShowLanguageMenu(false); }}>
                {/* 1. Tab Bar */}
                <div className="no-print flex items-center bg-gray-200 border-b border-gray-300 dark:bg-slate-800 dark:border-slate-700 pt-1 px-2 gap-1 overflow-x-auto select-none no-scrollbar">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`
                                group relative flex items-center gap-2 px-3 py-2 pr-8 min-w-[120px] max-w-[200px]
                                rounded-t-lg text-sm cursor-pointer transition-colors border-t border-l border-r
                                ${activeTabId === tab.id
                                    ? 'bg-white border-gray-300 border-b-white text-blue-600 font-medium z-10 -mb-[1px] dark:bg-slate-900 dark:border-slate-700 dark:border-b-slate-900 dark:text-blue-400'
                                    : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}
                            `}
                        >
                            <FileIcon size={14} className={activeTabId === tab.id ? "text-blue-500" : "text-gray-400"} />
                            <span className="truncate" title={tab.filePath}>{tab.title}</span>
                            {tab.isDirty && <span className="w-2 h-2 rounded-full bg-orange-400"></span>}

                            <button
                                onClick={(e) => closeTab(e, tab.id)}
                                className="absolute right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-500 dark:hover:bg-slate-600 dark:text-slate-300"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => createNewTab()}
                        className="p-1.5 hover:bg-gray-300 rounded-md text-gray-500 dark:text-slate-300 dark:hover:bg-slate-700 mb-1"
                        title={t.toolbar.newTab}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* 2. Toolbar */}
                <div className={`no-print h-12 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-800 flex items-center px-4 justify-between shadow-sm z-20 relative transition-opacity duration-300 ${isFullScreen ? 'opacity-0 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenFile}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                            title={t.toolbar.openFile}
                        >
                            <FolderOpen size={18} />
                            <span className="hidden sm:inline text-sm">{t.toolbar.open}</span>
                        </button>
                        <div className="h-5 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>
                        <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
                            <button
                                onClick={() => updateActiveTab({ isEditMode: false })}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-2 transition-all ${!activeTab?.isEditMode ? 'bg-white shadow text-blue-600 font-medium dark:bg-slate-900 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <FileText size={15} /> {t.toolbar.read}
                            </button>
                            <button
                                onClick={() => updateActiveTab({ isEditMode: true })}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-2 transition-all ${activeTab?.isEditMode ? 'bg-white shadow text-blue-600 font-medium dark:bg-slate-900 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <Edit3 size={15} /> {t.toolbar.edit}
                            </button>
                        </div>
                        {/* 导航开关 - 仅在阅读模式下显示 */}
                        {!activeTab?.isEditMode && headings.length > 0 && (
                            <button
                                onClick={() => setShowNav(!showNav)}
                                className={`p-2 rounded-lg flex items-center gap-1 text-sm transition-all ${showNav ? 'bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                title={showNav ? t.toolbar.hideNav : t.toolbar.showNav}
                            >
                                <List size={15} />
                                <span className="hidden sm:inline">{t.toolbar.nav}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Slider (阅读区 50%~300%) */}
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800">
                            <span className="text-xs text-gray-500 dark:text-slate-300 w-[44px] text-right tabular-nums">{zoom}%</span>
                            <input
                                type="range"
                                min={50}
                                max={300}
                                step={10}
                                value={zoom}
                                onChange={(e) => setZoom(Math.min(300, Math.max(50, Number(e.target.value))))}
                                className="w-24 sm:w-32 accent-blue-600"
                                title={t.toolbar.zoom}
                            />
                        </div>

                        {/* Full Width Toggle */}
                        <button
                            onClick={() => setIsFullWidth(!isFullWidth)}
                            className={`p-2 rounded-lg transition-colors ${isFullWidth ? 'bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                            title={isFullWidth ? t.toolbar.normalWidth : t.toolbar.fullWidth}
                        >
                            <Maximize2 size={18} />
                        </button>

                        {/* Full Screen Toggle */}
                        <button
                            onClick={handleFullScreen}
                            className={`p-2 rounded-lg transition-colors ${isFullScreen ? 'bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                            title={isFullScreen ? t.toolbar.exitFullScreen : t.toolbar.enterFullScreen}
                        >
                            {isFullScreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
                        </button>

                        {/* Theme Selection Dropdown */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowThemeMenu(!showThemeMenu);
                                    setShowSettingsMenu(false);
                                    setShowLanguageMenu(false);
                                }}
                                className={`p-2 rounded-lg transition-colors ${showThemeMenu ? 'bg-gray-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                title={t.toolbar.theme}
                            >
                                {theme === 'dark' ? <Moon size={18} /> : theme === 'dark-blue' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>

                            {showThemeMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="px-4 py-2 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                                        {t.toolbar.theme}
                                    </div>
                                    <button
                                        onClick={() => { handleThemeChange('light'); setShowThemeMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === 'light' ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Sun size={14} /> {t.toolbar.themeLight}
                                    </button>
                                    <button
                                        onClick={() => { handleThemeChange('dark'); setShowThemeMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === 'dark' ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Moon size={14} /> {t.toolbar.themeDark}
                                    </button>
                                    <button
                                        onClick={() => { handleThemeChange('dark-blue'); setShowThemeMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === 'dark-blue' ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Moon size={14} /> {t.toolbar.themeDarkBlue}
                                    </button>
                                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                                    <button
                                        onClick={() => { handleThemeChange('solarized-light'); setShowThemeMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === 'solarized-light' ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Sun size={14} /> {t.toolbar.themeSolarizedLight}
                                    </button>
                                    <button
                                        onClick={() => { handleThemeChange('solarized-dark'); setShowThemeMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === 'solarized-dark' ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Moon size={14} /> {t.toolbar.themeSolarizedDark}
                                    </button>
                                    <button
                                        onClick={() => { handleThemeChange('monokai'); setShowThemeMenu(false); }}
                                        className={`px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${theme === 'monokai' ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Moon size={14} /> {t.toolbar.themeMonokai}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleSave} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg" title={t.toolbar.save}>
                            <Save size={18} />
                        </button>
                        <button onClick={handleSaveAs} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg" title={t.toolbar.saveAs}>
                            <Download size={18} />
                        </button>
                        <button onClick={handleExportPdf} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg" title={t.toolbar.exportPdf ?? 'Export PDF'}>
                            <Printer size={18} />
                        </button>
                        <button onClick={handleExportHtml} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg" title={t.toolbar.exportHtml ?? 'Export HTML'}>
                            <FileCode size={18} />
                        </button>
                        <button onClick={handleCopyToWord} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                            <Copy size={15} /> <span className="hidden sm:inline">{t.toolbar.copyToWord}</span>
                        </button>
                        <div className="h-5 w-px bg-gray-300 dark:bg-slate-700 mx-2"></div>

                        {/* Language Menu Trigger */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowLanguageMenu(!showLanguageMenu);
                                    setShowSettingsMenu(false);
                                }}
                                className={`px-2 py-2 rounded-lg hover:text-blue-600 transition-colors flex items-center gap-1.5 ${showLanguageMenu ? 'bg-gray-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                title={t.language.label}
                            >
                                <span className="hidden lg:inline text-xs font-medium">{currentLanguageOption.shortLabel}</span>
                            </button>

                            {showLanguageMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="px-4 py-2 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                                        {t.language.label}
                                    </div>
                                    {languageOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setLanguage(option.value);
                                                setShowLanguageMenu(false);
                                            }}
                                            className="px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                        >
                                            <span className="w-4">{language === option.value ? <Check size={14} /> : null}</span>
                                            {option.nativeName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Settings Menu Trigger */}
                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettingsMenu(!showSettingsMenu);
                                    setShowLanguageMenu(false);
                                }}
                                className={`p-2 rounded-lg hover:text-blue-600 transition-colors ${showSettingsMenu ? 'bg-gray-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                title={t.toolbar.settings}
                            >
                                <Settings size={18} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {showSettingsMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={handleRegisterMenu} className="px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                        <Check size={14} /> {t.toolbar.addContextMenu}
                                    </button>
                                    <button onClick={handleUnregisterMenu} className="px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-red-600 flex items-center gap-2 transition-colors">
                                        <Trash2 size={14} /> {t.toolbar.removeContextMenu}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 全屏模式下的悬浮退出按钮 */}
                {isFullScreen && (
                    <div className="fixed top-1 right-4 z-50" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFullScreen();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-all shadow-lg"
                            title={t.toolbar.exitFullScreen}
                        >
                            <Minimize2 size={18} />
                            <span className="text-sm font-medium">{t.toolbar.exitFullScreen}</span>
                        </button>
                    </div>
                )}

                {/* 3. Content Area - 渲染所有 Tab 以保持状态 */}
                <div className="flex-1 bg-gray-50 dark:bg-slate-900 relative"> {/* 移除 overflow-hidden, 让子元素 absolute 定位更自由 */}
                    {tabs.map(tab => (
                        <TabContent
                            key={tab.id}
                            tab={tab}
                            isActive={activeTabId === tab.id}
                            updateTab={updateTab}
                            zoom={zoom}
                            searchQuery={searchQuery}
                            forceFullRender={isExportingPdf && activeTabId === tab.id}
                            previewMessages={t.preview}
                            onHeadingsChange={handleHeadingsChange}
                            onScrollChange={handleScrollChange}
                            isFullWidth={isFullWidth}
                        />
                    ))}

                    {/* 浮动导航栏 */}
                    {showNav && headings.length > 0 && !activeTab?.isEditMode && (
                        <div className="no-print fixed left-0 top-24 bottom-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-gray-200 dark:border-slate-700 shadow-lg z-40 overflow-y-auto">
                            <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                                <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{t.document.navTitle}</span>
                            </div>
                            <nav className="p-2">
                                {headings.map((heading) => (
                                    <button
                                        key={heading.id}
                                        onClick={() => handleNavClick(heading.id)}
                                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors truncate ${
                                            activeHeadingId === heading.id
                                                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`}
                                        style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                                    >
                                        {heading.text}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* 搜索组件 - 仅阅读模式 */}
                    {!activeTab?.isEditMode && (
                        <SearchReplace
                            isVisible={showSearch}
                            onClose={() => setShowSearch(false)}
                            onSearch={handleSearch}
                            onNextMatch={handleNextMatch}
                            onPrevMatch={handlePrevMatch}
                            matchCount={searchMatches}
                            currentMatchIndex={currentMatchIndex - 1}
                            messages={t.search}
                        />
                    )}

                    {tabs.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            {/* 如果没有 tabs，显示一个友好的提示或者按钮 */}
                            <div className="text-center">
                                <p className="mb-4">{t.document.noOpenDocuments}</p>
                                <button
                                    onClick={() => createNewTab()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {t.document.newBlankDocument}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}

// 独立的 Tab 内容组件
const TabContent = ({ tab, isActive, updateTab, zoom, searchQuery, forceFullRender, previewMessages, onHeadingsChange, onScrollChange, isFullWidth }: {
    tab: Tab;
    isActive: boolean;
    updateTab: (id: string, updates: Partial<Tab>) => void;
    zoom: number;
    searchQuery?: string;
    forceFullRender?: boolean;
    previewMessages: {
        optimizing: (progress: number) => string;
        loadingMoreVisible: string;
        loadingMoreHidden: string;
    };
    onHeadingsChange?: (tabId: string, headings: NavItem[]) => void;
    onScrollChange?: (activeId: string) => void;
    isFullWidth: boolean;
}) => {
    const editorExtensions = useMemo(() => [
        markdown(),
        search(),
    ], []);

    return (
        <div
            id={`tab-content-${tab.id}`}
            data-active={isActive ? 'true' : 'false'}
            className="absolute inset-0 overflow-auto scroll-smooth p-4 md:p-6 bg-gray-50 dark:bg-slate-900"
            style={{
                zIndex: isActive ? 10 : 0,
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
            }}
        >
            {tab.isEditMode ? (
                <div className={`${isFullWidth ? 'max-w-none' : 'max-w-5xl'} mx-auto bg-white dark:bg-slate-900 shadow-sm rounded-lg overflow-hidden h-full border border-gray-200 dark:border-slate-700`}>
                    <CodeMirror
                        value={tab.content}
                        height="100%"
                        extensions={editorExtensions}
                        onChange={(val) => updateTab(tab.id, { content: val, isDirty: true })}
                        className="text-base h-full"
                    />
                </div>
            ) : (
                <div className="h-full overflow-visible">
                    <div style={{ zoom: `${zoom / 100}` as any }}>
                        <MarkdownPreview
                            content={tab.content}
                            visible={isActive}
                            forceFullRender={Boolean(forceFullRender)}
                            filePath={tab.filePath}
                            tabId={tab.id}
                            searchQuery={searchQuery}
                            messages={previewMessages}
                            onHeadingsChange={onHeadingsChange}
                            onScrollChange={onScrollChange}
                            isFullWidth={isFullWidth}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
