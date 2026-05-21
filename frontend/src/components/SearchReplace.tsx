import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface SearchReplaceProps {
    isVisible: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    onNextMatch?: () => void;
    onPrevMatch?: () => void;
    matchCount?: number;
    currentMatchIndex?: number;
    messages: {
        placeholder: string;
        noResults: string;
        previous: string;
        next: string;
        close: string;
    };
}

export const SearchReplace: React.FC<SearchReplaceProps> = ({
    isVisible,
    onClose,
    onSearch,
    onNextMatch,
    onPrevMatch,
    matchCount = 0,
    currentMatchIndex = 0,
    messages,
}) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isVisible]);

    useEffect(() => {
        onSearch(query);
    }, [query, onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter') {
            if (e.shiftKey) {
                onPrevMatch?.();
            } else {
                onNextMatch?.();
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="absolute top-16 right-4 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 min-w-[320px]">
            <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={messages.placeholder}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500 dark:text-slate-400 min-w-[60px] text-center">
                    {query ? `${currentMatchIndex + 1} / ${matchCount}` : messages.noResults}
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"
                    title={messages.close}
                >
                    <X size={14} />
                </button>
            </div>

            <div className="flex items-center gap-1 mt-2">
                <button
                    onClick={onPrevMatch}
                    disabled={!query || matchCount === 0}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 disabled:opacity-40"
                    title={messages.previous}
                >
                    <ChevronUp size={16} />
                </button>
                <button
                    onClick={onNextMatch}
                    disabled={!query || matchCount === 0}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 disabled:opacity-40"
                    title={messages.next}
                >
                    <ChevronDown size={16} />
                </button>
            </div>
        </div>
    );
};
