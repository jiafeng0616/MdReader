import { useEffect, useMemo, useState } from 'react';

export type Language =
    | 'zh-CN'
    | 'en-US'
    | 'ja-JP'
    | 'ko-KR'
    | 'de-DE'
    | 'fr-FR'
    | 'ru-RU'
    | 'id-ID'
    | 'vi-VN'
    | 'th-TH';

type Dictionary = {
    language: {
        label: string;
    };
    document: {
        untitled: string;
        defaultContent: string;
        genericName: string;
        navTitle: string;
        noOpenDocuments: string;
        newBlankDocument: string;
    };
    status: {
        foundPendingFiles: (count: number) => string;
        fetchPendingFailed: (error: unknown) => string;
        loaded: (fileName: string) => string;
        loadFailed: (error: unknown) => string;
        saveError: (error: unknown) => string;
        saved: string;
        saveFailed: (error: unknown) => string;
        exportPdfFailed?: (error: unknown) => string;
        exportPdfReady?: string;
        switchToReadMode: string;
        cannotGetContent: string;
        copied: string;
        copyFailed: (error: unknown) => string;
        clipboardWriteFailed: string;
        registerMenuSuccess: string;
        unregisterMenuSuccess: string;
        operationFailed: (error: unknown) => string;
    };
    toolbar: {
        newTab: string;
        openFile: string;
        open: string;
        read: string;
        edit: string;
        showNav: string;
        hideNav: string;
        nav: string;
        zoom: string;
        switchLight: string;
        switchDark: string;
        save: string;
        saveAs: string;
        copyToWord: string;
        exportPdf?: string;
        exportHtml?: string;
        settings: string;
        addContextMenu: string;
        removeContextMenu: string;
        normalWidth: string;
        fullWidth: string;
        exitFullScreen: string;
        enterFullScreen: string;
        theme: string;
        themeLight: string;
        themeDark: string;
        themeDarkBlue: string;
        themeSolarizedLight: string;
        themeSolarizedDark: string;
        themeMonokai: string;
    };
    search: {
        placeholder: string;
        noResults: string;
        previous: string;
        next: string;
        close: string;
    };
    preview: {
        optimizing: (progress: number) => string;
        loadingMoreVisible: string;
        loadingMoreHidden: string;
    };
    errorBoundary: {
        title: string;
        description: string;
        refresh: string;
    };
};

export const languageOptions: Array<{ value: Language; nativeName: string; shortLabel: string }> = [
    { value: 'zh-CN', nativeName: '中文', shortLabel: '中文' },
    { value: 'en-US', nativeName: 'English', shortLabel: 'EN' },
    { value: 'ja-JP', nativeName: '日本語', shortLabel: '日本語' },
    { value: 'ko-KR', nativeName: '한국어', shortLabel: '한국어' },
    { value: 'de-DE', nativeName: 'Deutsch', shortLabel: 'DE' },
    { value: 'fr-FR', nativeName: 'Français', shortLabel: 'FR' },
    { value: 'ru-RU', nativeName: 'Русский', shortLabel: 'RU' },
    { value: 'id-ID', nativeName: 'Bahasa Indonesia', shortLabel: 'ID' },
    { value: 'vi-VN', nativeName: 'Tiếng Việt', shortLabel: 'VI' },
    { value: 'th-TH', nativeName: 'ไทย', shortLabel: 'ไทย' },
];

const STORAGE_KEY = 'mdreader.language';

const dictionaries: Record<Language, Dictionary> = {
    'zh-CN': {
        language: { label: '语言' },
        document: {
            untitled: '未命名文档',
            defaultContent: '# 欢迎使用 MdReader\n\n请打开文件或开始编辑。',
            genericName: '文档',
            navTitle: '文档导航',
            noOpenDocuments: '没有打开的文档',
            newBlankDocument: '新建空白文档',
        },
        status: {
            foundPendingFiles: (count) => `发现 ${count} 个新文件，正在打开...`,
            fetchPendingFailed: (error) => `拉取文件失败: ${error}`,
            loaded: (fileName) => `已加载: ${fileName}`,
            loadFailed: (error) => `加载失败: ${error}`,
            saveError: (error) => `保存错误: ${error}`,
            saved: '已保存',
            saveFailed: (error) => `保存失败: ${error}`,
            switchToReadMode: '请先切换到阅读模式',
            cannotGetContent: '无法获取内容',
            copied: '已复制到剪贴板！',
            copyFailed: (error) => `复制失败: ${error}`,
            clipboardWriteFailed: '写入剪贴板失败，请确保您在安全上下文中运行。',
            registerMenuSuccess: "成功！已添加右键菜单 '用 MdReader 打开'。",
            unregisterMenuSuccess: '成功！已移除右键菜单。',
            operationFailed: (error) => `操作失败 (可能需要管理员权限):\n${error}`,
        },
        toolbar: {
            newTab: '新建标签页',
            openFile: '打开文件',
            open: '打开',
            read: '阅读',
            edit: '编辑',
            showNav: '显示导航',
            hideNav: '隐藏导航',
            nav: '导航',
            zoom: '阅读区缩放',
            switchLight: '切换到浅色模式',
            switchDark: '切换到暗黑模式',
            save: '保存',
            saveAs: '另存为',
            copyToWord: '复制到 Word',
            exportHtml: '导出 HTML',
            settings: '系统设置',
            addContextMenu: '添加到右键菜单',
            removeContextMenu: '移除右键菜单',
            normalWidth: '正常宽度',
            fullWidth: '全宽显示',
            exitFullScreen: '退出全屏',
            enterFullScreen: '全屏模式',
            theme: '主题',
            themeLight: '浅色',
            themeDark: '黑色',
            themeDarkBlue: '深蓝色',
            themeSolarizedLight: 'Solarized 浅色',
            themeSolarizedDark: 'Solarized 深色',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: '搜索...',
            noResults: '无结果',
            previous: '上一个 (Shift+Enter)',
            next: '下一个 (Enter)',
            close: '关闭搜索',
        },
        preview: {
            optimizing: (progress) => `正在优化渲染... ${progress}%`,
            loadingMoreVisible: '正在平滑加载剩余内容...',
            loadingMoreHidden: '内容较长，切换到此标签页后继续加载...',
        },
        errorBoundary: {
            title: '程序遇到了一点问题',
            description: '请尝试重新启动软件。如果问题持续，请截图反馈。',
            refresh: '刷新页面',
        },
    },
    'en-US': {
        language: { label: 'Language' },
        document: {
            untitled: 'Untitled document',
            defaultContent: '# Welcome to MdReader\n\nOpen a file or start editing.',
            genericName: 'Document',
            navTitle: 'Document outline',
            noOpenDocuments: 'No open documents',
            newBlankDocument: 'New blank document',
        },
        status: {
            foundPendingFiles: (count) => `Found ${count} new file${count === 1 ? '' : 's'}, opening...`,
            fetchPendingFailed: (error) => `Failed to fetch files: ${error}`,
            loaded: (fileName) => `Loaded: ${fileName}`,
            loadFailed: (error) => `Load failed: ${error}`,
            saveError: (error) => `Save error: ${error}`,
            saved: 'Saved',
            saveFailed: (error) => `Save failed: ${error}`,
            exportPdfFailed: (error) => `PDF export failed: ${error}`,
            exportPdfReady: 'Opening the print dialog. Choose Save as PDF.',
            switchToReadMode: 'Switch to read mode first',
            cannotGetContent: 'Unable to get content',
            copied: 'Copied to clipboard.',
            copyFailed: (error) => `Copy failed: ${error}`,
            clipboardWriteFailed: 'Failed to write to the clipboard. Make sure the app is running in a secure context.',
            registerMenuSuccess: "Success. Added the context menu item 'Open with MdReader'.",
            unregisterMenuSuccess: 'Success. Removed the context menu item.',
            operationFailed: (error) => `Operation failed (administrator permission may be required):\n${error}`,
        },
        toolbar: {
            newTab: 'New tab',
            openFile: 'Open file',
            open: 'Open',
            read: 'Read',
            edit: 'Edit',
            showNav: 'Show outline',
            hideNav: 'Hide outline',
            nav: 'Outline',
            zoom: 'Reader zoom',
            switchLight: 'Switch to light mode',
            switchDark: 'Switch to dark mode',
            save: 'Save',
            saveAs: 'Save as',
            copyToWord: 'Copy to Word',
            exportPdf: 'Export PDF',
            exportHtml: 'Export HTML',
            settings: 'Settings',
            addContextMenu: 'Add to context menu',
            removeContextMenu: 'Remove context menu',
            normalWidth: 'Normal width',
            fullWidth: 'Full width',
            exitFullScreen: 'Exit fullscreen',
            enterFullScreen: 'Fullscreen',
            theme: 'Theme',
            themeLight: 'Light',
            themeDark: 'Dark',
            themeDarkBlue: 'Dark Blue',
            themeSolarizedLight: 'Solarized Light',
            themeSolarizedDark: 'Solarized Dark',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'Search...',
            noResults: 'No results',
            previous: 'Previous (Shift+Enter)',
            next: 'Next (Enter)',
            close: 'Close search',
        },
        preview: {
            optimizing: (progress) => `Optimizing render... ${progress}%`,
            loadingMoreVisible: 'Loading the rest of the content...',
            loadingMoreHidden: 'This document is long. Loading will continue when this tab is active.',
        },
        errorBoundary: {
            title: 'Something went wrong',
            description: 'Restart the app and try again. If the problem continues, take a screenshot and report it.',
            refresh: 'Refresh page',
        },
    },
    'ja-JP': {
        language: { label: '言語' },
        document: {
            untitled: '無題のドキュメント',
            defaultContent: '# MdReader へようこそ\n\nファイルを開くか、編集を開始してください。',
            genericName: 'ドキュメント',
            navTitle: 'ドキュメントのアウトライン',
            noOpenDocuments: '開いているドキュメントはありません',
            newBlankDocument: '新しい空白ドキュメント',
        },
        status: {
            foundPendingFiles: (count) => `${count} 件の新しいファイルを見つけました。開いています...`,
            fetchPendingFailed: (error) => `ファイルの取得に失敗しました: ${error}`,
            loaded: (fileName) => `読み込みました: ${fileName}`,
            loadFailed: (error) => `読み込みに失敗しました: ${error}`,
            saveError: (error) => `保存エラー: ${error}`,
            saved: '保存しました',
            saveFailed: (error) => `保存に失敗しました: ${error}`,
            switchToReadMode: '先に閲覧モードに切り替えてください',
            cannotGetContent: 'コンテンツを取得できません',
            copied: 'クリップボードにコピーしました。',
            copyFailed: (error) => `コピーに失敗しました: ${error}`,
            clipboardWriteFailed: 'クリップボードへの書き込みに失敗しました。安全なコンテキストで実行されていることを確認してください。',
            registerMenuSuccess: "成功しました。コンテキストメニュー 'MdReader で開く' を追加しました。",
            unregisterMenuSuccess: '成功しました。コンテキストメニューを削除しました。',
            operationFailed: (error) => `操作に失敗しました (管理者権限が必要な場合があります):\n${error}`,
        },
        toolbar: {
            newTab: '新しいタブ',
            openFile: 'ファイルを開く',
            open: '開く',
            read: '閲覧',
            edit: '編集',
            showNav: 'アウトラインを表示',
            hideNav: 'アウトラインを非表示',
            nav: 'アウトライン',
            zoom: '閲覧ズーム',
            switchLight: 'ライトモードに切り替え',
            switchDark: 'ダークモードに切り替え',
            save: '保存',
            saveAs: '名前を付けて保存',
            copyToWord: 'Word にコピー',
            exportHtml: 'HTML をエクスポート',
            settings: 'システム設定',
            addContextMenu: 'コンテキストメニューに追加',
            removeContextMenu: 'コンテキストメニューを削除',
            normalWidth: '通常の幅',
            fullWidth: '全幅表示',
            exitFullScreen: '全画面を終了',
            enterFullScreen: '全画面',
            theme: 'テーマ',
            themeLight: '明るい',
            themeDark: '暗い',
            themeDarkBlue: 'ダークブルー',
            themeSolarizedLight: 'Solarized 明るい',
            themeSolarizedDark: 'Solarized 暗い',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: '検索...',
            noResults: '結果なし',
            previous: '前へ (Shift+Enter)',
            next: '次へ (Enter)',
            close: '検索を閉じる',
        },
        preview: {
            optimizing: (progress) => `レンダリングを最適化中... ${progress}%`,
            loadingMoreVisible: '残りのコンテンツを読み込んでいます...',
            loadingMoreHidden: 'このドキュメントは長いため、このタブを開くと読み込みを続行します。',
        },
        errorBoundary: {
            title: '問題が発生しました',
            description: 'アプリを再起動してもう一度お試しください。問題が続く場合はスクリーンショットを添えて報告してください。',
            refresh: 'ページを更新',
        },
    },
    'ko-KR': {
        language: { label: '언어' },
        document: {
            untitled: '제목 없는 문서',
            defaultContent: '# MdReader에 오신 것을 환영합니다\n\n파일을 열거나 편집을 시작하세요.',
            genericName: '문서',
            navTitle: '문서 개요',
            noOpenDocuments: '열려 있는 문서가 없습니다',
            newBlankDocument: '새 빈 문서',
        },
        status: {
            foundPendingFiles: (count) => `새 파일 ${count}개를 찾았습니다. 여는 중...`,
            fetchPendingFailed: (error) => `파일을 가져오지 못했습니다: ${error}`,
            loaded: (fileName) => `불러옴: ${fileName}`,
            loadFailed: (error) => `불러오기 실패: ${error}`,
            saveError: (error) => `저장 오류: ${error}`,
            saved: '저장됨',
            saveFailed: (error) => `저장 실패: ${error}`,
            switchToReadMode: '먼저 읽기 모드로 전환하세요',
            cannotGetContent: '내용을 가져올 수 없습니다',
            copied: '클립보드에 복사했습니다.',
            copyFailed: (error) => `복사 실패: ${error}`,
            clipboardWriteFailed: '클립보드에 쓰지 못했습니다. 안전한 컨텍스트에서 실행 중인지 확인하세요.',
            registerMenuSuccess: "성공했습니다. 'MdReader로 열기' 컨텍스트 메뉴를 추가했습니다.",
            unregisterMenuSuccess: '성공했습니다. 컨텍스트 메뉴를 제거했습니다.',
            operationFailed: (error) => `작업 실패 (관리자 권한이 필요할 수 있음):\n${error}`,
        },
        toolbar: {
            newTab: '새 탭',
            openFile: '파일 열기',
            open: '열기',
            read: '읽기',
            edit: '편집',
            showNav: '개요 표시',
            hideNav: '개요 숨기기',
            nav: '개요',
            zoom: '읽기 영역 확대/축소',
            switchLight: '라이트 모드로 전환',
            switchDark: '다크 모드로 전환',
            save: '저장',
            saveAs: '다른 이름으로 저장',
            copyToWord: 'Word로 복사',
            exportHtml: 'HTML 내보내기',
            settings: '시스템 설정',
            addContextMenu: '컨텍스트 메뉴에 추가',
            removeContextMenu: '컨텍스트 메뉴 제거',
            normalWidth: '일반 너비',
            fullWidth: '전체 너비',
            exitFullScreen: '전체 화면 종료',
            enterFullScreen: '전체 화면',
            theme: '테마',
            themeLight: '밝은',
            themeDark: '어두운',
            themeDarkBlue: '어두운 파란색',
            themeSolarizedLight: 'Solarized 밝은',
            themeSolarizedDark: 'Solarized 어두운',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: '검색...',
            noResults: '결과 없음',
            previous: '이전 (Shift+Enter)',
            next: '다음 (Enter)',
            close: '검색 닫기',
        },
        preview: {
            optimizing: (progress) => `렌더링 최적화 중... ${progress}%`,
            loadingMoreVisible: '나머지 내용을 불러오는 중...',
            loadingMoreHidden: '문서가 깁니다. 이 탭으로 전환하면 계속 불러옵니다.',
        },
        errorBoundary: {
            title: '문제가 발생했습니다',
            description: '앱을 다시 시작해 보세요. 문제가 계속되면 스크린샷을 찍어 보고하세요.',
            refresh: '페이지 새로 고침',
        },
    },
    'de-DE': {
        language: { label: 'Sprache' },
        document: {
            untitled: 'Unbenanntes Dokument',
            defaultContent: '# Willkommen bei MdReader\n\nÖffnen Sie eine Datei oder beginnen Sie mit der Bearbeitung.',
            genericName: 'Dokument',
            navTitle: 'Dokumentgliederung',
            noOpenDocuments: 'Keine Dokumente geöffnet',
            newBlankDocument: 'Neues leeres Dokument',
        },
        status: {
            foundPendingFiles: (count) => `${count} neue Datei${count === 1 ? '' : 'en'} gefunden, wird geöffnet...`,
            fetchPendingFailed: (error) => `Dateien konnten nicht abgerufen werden: ${error}`,
            loaded: (fileName) => `Geladen: ${fileName}`,
            loadFailed: (error) => `Laden fehlgeschlagen: ${error}`,
            saveError: (error) => `Speicherfehler: ${error}`,
            saved: 'Gespeichert',
            saveFailed: (error) => `Speichern fehlgeschlagen: ${error}`,
            switchToReadMode: 'Wechseln Sie zuerst in den Lesemodus',
            cannotGetContent: 'Inhalt kann nicht abgerufen werden',
            copied: 'In die Zwischenablage kopiert.',
            copyFailed: (error) => `Kopieren fehlgeschlagen: ${error}`,
            clipboardWriteFailed: 'Schreiben in die Zwischenablage fehlgeschlagen. Stellen Sie sicher, dass die App in einem sicheren Kontext ausgeführt wird.',
            registerMenuSuccess: "Erfolg. Der Kontextmenüeintrag 'Mit MdReader öffnen' wurde hinzugefügt.",
            unregisterMenuSuccess: 'Erfolg. Der Kontextmenüeintrag wurde entfernt.',
            operationFailed: (error) => `Vorgang fehlgeschlagen (möglicherweise sind Administratorrechte erforderlich):\n${error}`,
        },
        toolbar: {
            newTab: 'Neuer Tab',
            openFile: 'Datei öffnen',
            open: 'Öffnen',
            read: 'Lesen',
            edit: 'Bearbeiten',
            showNav: 'Gliederung anzeigen',
            hideNav: 'Gliederung ausblenden',
            nav: 'Gliederung',
            zoom: 'Lesezoom',
            switchLight: 'Zum hellen Modus wechseln',
            switchDark: 'Zum dunklen Modus wechseln',
            save: 'Speichern',
            saveAs: 'Speichern unter',
            copyToWord: 'In Word kopieren',
            exportHtml: 'HTML exportieren',
            settings: 'Systemeinstellungen',
            addContextMenu: 'Zum Kontextmenü hinzufügen',
            removeContextMenu: 'Kontextmenü entfernen',
            normalWidth: 'Normale Breite',
            fullWidth: 'Volle Breite',
            exitFullScreen: 'Vollbild verlassen',
            enterFullScreen: 'Vollbild',
            theme: 'Design',
            themeLight: 'Hell',
            themeDark: 'Dunkel',
            themeDarkBlue: 'Dunkelblau',
            themeSolarizedLight: 'Solarized Hell',
            themeSolarizedDark: 'Solarized Dunkel',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'Suchen...',
            noResults: 'Keine Ergebnisse',
            previous: 'Zurück (Shift+Enter)',
            next: 'Weiter (Enter)',
            close: 'Suche schließen',
        },
        preview: {
            optimizing: (progress) => `Darstellung wird optimiert... ${progress}%`,
            loadingMoreVisible: 'Restlichen Inhalt laden...',
            loadingMoreHidden: 'Dieses Dokument ist lang. Das Laden wird fortgesetzt, wenn dieser Tab aktiv ist.',
        },
        errorBoundary: {
            title: 'Etwas ist schiefgelaufen',
            description: 'Starten Sie die App neu und versuchen Sie es erneut. Wenn das Problem weiter besteht, melden Sie es mit einem Screenshot.',
            refresh: 'Seite aktualisieren',
        },
    },
    'fr-FR': {
        language: { label: 'Langue' },
        document: {
            untitled: 'Document sans titre',
            defaultContent: '# Bienvenue dans MdReader\n\nOuvrez un fichier ou commencez à modifier.',
            genericName: 'Document',
            navTitle: 'Plan du document',
            noOpenDocuments: 'Aucun document ouvert',
            newBlankDocument: 'Nouveau document vierge',
        },
        status: {
            foundPendingFiles: (count) => `${count} nouveau${count === 1 ? '' : 'x'} fichier${count === 1 ? '' : 's'} trouvé${count === 1 ? '' : 's'}, ouverture...`,
            fetchPendingFailed: (error) => `Impossible de récupérer les fichiers : ${error}`,
            loaded: (fileName) => `Chargé : ${fileName}`,
            loadFailed: (error) => `Échec du chargement : ${error}`,
            saveError: (error) => `Erreur d'enregistrement : ${error}`,
            saved: 'Enregistré',
            saveFailed: (error) => `Échec de l'enregistrement : ${error}`,
            switchToReadMode: 'Passez d’abord en mode lecture',
            cannotGetContent: 'Impossible d’obtenir le contenu',
            copied: 'Copié dans le presse-papiers.',
            copyFailed: (error) => `Échec de la copie : ${error}`,
            clipboardWriteFailed: 'Impossible d’écrire dans le presse-papiers. Vérifiez que l’application s’exécute dans un contexte sécurisé.',
            registerMenuSuccess: "Succès. L’entrée de menu contextuel 'Ouvrir avec MdReader' a été ajoutée.",
            unregisterMenuSuccess: 'Succès. L’entrée de menu contextuel a été supprimée.',
            operationFailed: (error) => `Échec de l’opération (des droits administrateur peuvent être requis) :\n${error}`,
        },
        toolbar: {
            newTab: 'Nouvel onglet',
            openFile: 'Ouvrir un fichier',
            open: 'Ouvrir',
            read: 'Lire',
            edit: 'Modifier',
            showNav: 'Afficher le plan',
            hideNav: 'Masquer le plan',
            nav: 'Plan',
            zoom: 'Zoom de lecture',
            switchLight: 'Passer au mode clair',
            switchDark: 'Passer au mode sombre',
            save: 'Enregistrer',
            saveAs: 'Enregistrer sous',
            copyToWord: 'Copier vers Word',
            exportHtml: 'Exporter en HTML',
            settings: 'Paramètres système',
            addContextMenu: 'Ajouter au menu contextuel',
            removeContextMenu: 'Supprimer le menu contextuel',
            normalWidth: 'Largeur normale',
            fullWidth: 'Pleine largeur',
            exitFullScreen: 'Quitter le plein écran',
            enterFullScreen: 'Plein écran',
            theme: 'Thème',
            themeLight: 'Clair',
            themeDark: 'Sombre',
            themeDarkBlue: 'Bleu sombre',
            themeSolarizedLight: 'Solarized Clair',
            themeSolarizedDark: 'Solarized Sombre',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'Rechercher...',
            noResults: 'Aucun résultat',
            previous: 'Précédent (Shift+Enter)',
            next: 'Suivant (Enter)',
            close: 'Fermer la recherche',
        },
        preview: {
            optimizing: (progress) => `Optimisation du rendu... ${progress}%`,
            loadingMoreVisible: 'Chargement du reste du contenu...',
            loadingMoreHidden: 'Ce document est long. Le chargement continuera lorsque cet onglet sera actif.',
        },
        errorBoundary: {
            title: 'Une erreur est survenue',
            description: 'Redémarrez l’application puis réessayez. Si le problème persiste, signalez-le avec une capture d’écran.',
            refresh: 'Actualiser la page',
        },
    },
    'ru-RU': {
        language: { label: 'Язык' },
        document: {
            untitled: 'Документ без названия',
            defaultContent: '# Добро пожаловать в MdReader\n\nОткройте файл или начните редактирование.',
            genericName: 'Документ',
            navTitle: 'Структура документа',
            noOpenDocuments: 'Нет открытых документов',
            newBlankDocument: 'Новый пустой документ',
        },
        status: {
            foundPendingFiles: (count) => `Найдено новых файлов: ${count}. Открытие...`,
            fetchPendingFailed: (error) => `Не удалось получить файлы: ${error}`,
            loaded: (fileName) => `Загружено: ${fileName}`,
            loadFailed: (error) => `Ошибка загрузки: ${error}`,
            saveError: (error) => `Ошибка сохранения: ${error}`,
            saved: 'Сохранено',
            saveFailed: (error) => `Не удалось сохранить: ${error}`,
            switchToReadMode: 'Сначала переключитесь в режим чтения',
            cannotGetContent: 'Не удалось получить содержимое',
            copied: 'Скопировано в буфер обмена.',
            copyFailed: (error) => `Ошибка копирования: ${error}`,
            clipboardWriteFailed: 'Не удалось записать в буфер обмена. Убедитесь, что приложение запущено в безопасном контексте.',
            registerMenuSuccess: "Готово. Пункт контекстного меню 'Открыть с помощью MdReader' добавлен.",
            unregisterMenuSuccess: 'Готово. Пункт контекстного меню удален.',
            operationFailed: (error) => `Операция не выполнена (могут потребоваться права администратора):\n${error}`,
        },
        toolbar: {
            newTab: 'Новая вкладка',
            openFile: 'Открыть файл',
            open: 'Открыть',
            read: 'Чтение',
            edit: 'Правка',
            showNav: 'Показать структуру',
            hideNav: 'Скрыть структуру',
            nav: 'Структура',
            zoom: 'Масштаб чтения',
            switchLight: 'Переключить на светлую тему',
            switchDark: 'Переключить на темную тему',
            save: 'Сохранить',
            saveAs: 'Сохранить как',
            copyToWord: 'Копировать в Word',
            exportHtml: 'Экспорт в HTML',
            settings: 'Системные настройки',
            addContextMenu: 'Добавить в контекстное меню',
            removeContextMenu: 'Удалить контекстное меню',
            normalWidth: 'Обычная ширина',
            fullWidth: 'Полная ширина',
            exitFullScreen: 'Выйти из полноэкранного режима',
            enterFullScreen: 'Полноэкранный режим',
            theme: 'Тема',
            themeLight: 'Светлая',
            themeDark: 'Темная',
            themeDarkBlue: 'Темно-синий',
            themeSolarizedLight: 'Solarized Светлая',
            themeSolarizedDark: 'Solarized Темная',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'Поиск...',
            noResults: 'Нет результатов',
            previous: 'Назад (Shift+Enter)',
            next: 'Далее (Enter)',
            close: 'Закрыть поиск',
        },
        preview: {
            optimizing: (progress) => `Оптимизация отображения... ${progress}%`,
            loadingMoreVisible: 'Загрузка оставшегося содержимого...',
            loadingMoreHidden: 'Документ большой. Загрузка продолжится, когда эта вкладка станет активной.',
        },
        errorBoundary: {
            title: 'Что-то пошло не так',
            description: 'Перезапустите приложение и попробуйте снова. Если проблема повторится, отправьте отчет со снимком экрана.',
            refresh: 'Обновить страницу',
        },
    },
    'id-ID': {
        language: { label: 'Bahasa' },
        document: {
            untitled: 'Dokumen tanpa judul',
            defaultContent: '# Selamat datang di MdReader\n\nBuka file atau mulai mengedit.',
            genericName: 'Dokumen',
            navTitle: 'Kerangka dokumen',
            noOpenDocuments: 'Tidak ada dokumen yang terbuka',
            newBlankDocument: 'Dokumen kosong baru',
        },
        status: {
            foundPendingFiles: (count) => `Menemukan ${count} file baru, membuka...`,
            fetchPendingFailed: (error) => `Gagal mengambil file: ${error}`,
            loaded: (fileName) => `Dimuat: ${fileName}`,
            loadFailed: (error) => `Gagal memuat: ${error}`,
            saveError: (error) => `Kesalahan simpan: ${error}`,
            saved: 'Tersimpan',
            saveFailed: (error) => `Gagal menyimpan: ${error}`,
            switchToReadMode: 'Beralih ke mode baca terlebih dahulu',
            cannotGetContent: 'Tidak dapat mengambil konten',
            copied: 'Disalin ke clipboard.',
            copyFailed: (error) => `Gagal menyalin: ${error}`,
            clipboardWriteFailed: 'Gagal menulis ke clipboard. Pastikan aplikasi berjalan dalam konteks yang aman.',
            registerMenuSuccess: "Berhasil. Item menu konteks 'Buka dengan MdReader' telah ditambahkan.",
            unregisterMenuSuccess: 'Berhasil. Item menu konteks telah dihapus.',
            operationFailed: (error) => `Operasi gagal (mungkin memerlukan izin administrator):\n${error}`,
        },
        toolbar: {
            newTab: 'Tab baru',
            openFile: 'Buka file',
            open: 'Buka',
            read: 'Baca',
            edit: 'Edit',
            showNav: 'Tampilkan kerangka',
            hideNav: 'Sembunyikan kerangka',
            nav: 'Kerangka',
            zoom: 'Zoom baca',
            switchLight: 'Beralih ke mode terang',
            switchDark: 'Beralih ke mode gelap',
            save: 'Simpan',
            saveAs: 'Simpan sebagai',
            copyToWord: 'Salin ke Word',
            exportHtml: 'Ekspor HTML',
            settings: 'Pengaturan sistem',
            addContextMenu: 'Tambahkan ke menu konteks',
            removeContextMenu: 'Hapus menu konteks',
            normalWidth: 'Lebar normal',
            fullWidth: 'Lebar penuh',
            exitFullScreen: 'Keluar dari layar penuh',
            enterFullScreen: 'Layar penuh',
            theme: 'Tema',
            themeLight: 'Terang',
            themeDark: 'Gelap',
            themeDarkBlue: 'Biru gelap',
            themeSolarizedLight: 'Solarized Terang',
            themeSolarizedDark: 'Solarized Gelap',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'Cari...',
            noResults: 'Tidak ada hasil',
            previous: 'Sebelumnya (Shift+Enter)',
            next: 'Berikutnya (Enter)',
            close: 'Tutup pencarian',
        },
        preview: {
            optimizing: (progress) => `Mengoptimalkan render... ${progress}%`,
            loadingMoreVisible: 'Memuat sisa konten...',
            loadingMoreHidden: 'Dokumen ini panjang. Pemuatan akan dilanjutkan saat tab ini aktif.',
        },
        errorBoundary: {
            title: 'Terjadi kesalahan',
            description: 'Mulai ulang aplikasi dan coba lagi. Jika masalah berlanjut, laporkan dengan tangkapan layar.',
            refresh: 'Muat ulang halaman',
        },
    },
    'vi-VN': {
        language: { label: 'Ngôn ngữ' },
        document: {
            untitled: 'Tài liệu chưa đặt tên',
            defaultContent: '# Chào mừng đến với MdReader\n\nMở một tệp hoặc bắt đầu chỉnh sửa.',
            genericName: 'Tài liệu',
            navTitle: 'Dàn ý tài liệu',
            noOpenDocuments: 'Không có tài liệu nào đang mở',
            newBlankDocument: 'Tài liệu trống mới',
        },
        status: {
            foundPendingFiles: (count) => `Tìm thấy ${count} tệp mới, đang mở...`,
            fetchPendingFailed: (error) => `Không thể lấy tệp: ${error}`,
            loaded: (fileName) => `Đã tải: ${fileName}`,
            loadFailed: (error) => `Tải thất bại: ${error}`,
            saveError: (error) => `Lỗi lưu: ${error}`,
            saved: 'Đã lưu',
            saveFailed: (error) => `Lưu thất bại: ${error}`,
            switchToReadMode: 'Hãy chuyển sang chế độ đọc trước',
            cannotGetContent: 'Không thể lấy nội dung',
            copied: 'Đã sao chép vào bảng tạm.',
            copyFailed: (error) => `Sao chép thất bại: ${error}`,
            clipboardWriteFailed: 'Không thể ghi vào bảng tạm. Hãy đảm bảo ứng dụng đang chạy trong ngữ cảnh an toàn.',
            registerMenuSuccess: "Thành công. Đã thêm mục menu ngữ cảnh 'Mở bằng MdReader'.",
            unregisterMenuSuccess: 'Thành công. Đã xóa mục menu ngữ cảnh.',
            operationFailed: (error) => `Thao tác thất bại (có thể cần quyền quản trị):\n${error}`,
        },
        toolbar: {
            newTab: 'Tab mới',
            openFile: 'Mở tệp',
            open: 'Mở',
            read: 'Đọc',
            edit: 'Sửa',
            showNav: 'Hiển thị dàn ý',
            hideNav: 'Ẩn dàn ý',
            nav: 'Dàn ý',
            zoom: 'Thu phóng vùng đọc',
            switchLight: 'Chuyển sang chế độ sáng',
            switchDark: 'Chuyển sang chế độ tối',
            save: 'Lưu',
            saveAs: 'Lưu dưới dạng',
            copyToWord: 'Sao chép sang Word',
            exportHtml: 'Xuất HTML',
            settings: 'Cài đặt hệ thống',
            addContextMenu: 'Thêm vào menu ngữ cảnh',
            removeContextMenu: 'Xóa menu ngữ cảnh',
            normalWidth: 'Chiều rộng bình thường',
            fullWidth: 'Chiều rộng đầy đủ',
            exitFullScreen: 'Thoát chế độ toàn màn hình',
            enterFullScreen: 'Toàn màn hình',
            theme: 'Chủ đề',
            themeLight: 'Sáng',
            themeDark: 'Tối',
            themeDarkBlue: 'Xanh đậm',
            themeSolarizedLight: 'Solarized Sáng',
            themeSolarizedDark: 'Solarized Tối',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'Tìm kiếm...',
            noResults: 'Không có kết quả',
            previous: 'Trước (Shift+Enter)',
            next: 'Tiếp (Enter)',
            close: 'Đóng tìm kiếm',
        },
        preview: {
            optimizing: (progress) => `Đang tối ưu hiển thị... ${progress}%`,
            loadingMoreVisible: 'Đang tải phần nội dung còn lại...',
            loadingMoreHidden: 'Tài liệu này dài. Quá trình tải sẽ tiếp tục khi tab này hoạt động.',
        },
        errorBoundary: {
            title: 'Đã xảy ra lỗi',
            description: 'Khởi động lại ứng dụng rồi thử lại. Nếu sự cố tiếp diễn, hãy báo cáo kèm ảnh chụp màn hình.',
            refresh: 'Tải lại trang',
        },
    },
    'th-TH': {
        language: { label: 'ภาษา' },
        document: {
            untitled: 'เอกสารไม่มีชื่อ',
            defaultContent: '# ยินดีต้อนรับสู่ MdReader\n\nเปิดไฟล์หรือเริ่มแก้ไข',
            genericName: 'เอกสาร',
            navTitle: 'โครงร่างเอกสาร',
            noOpenDocuments: 'ไม่มีเอกสารที่เปิดอยู่',
            newBlankDocument: 'เอกสารเปล่าใหม่',
        },
        status: {
            foundPendingFiles: (count) => `พบไฟล์ใหม่ ${count} ไฟล์ กำลังเปิด...`,
            fetchPendingFailed: (error) => `ดึงไฟล์ไม่สำเร็จ: ${error}`,
            loaded: (fileName) => `โหลดแล้ว: ${fileName}`,
            loadFailed: (error) => `โหลดไม่สำเร็จ: ${error}`,
            saveError: (error) => `ข้อผิดพลาดในการบันทึก: ${error}`,
            saved: 'บันทึกแล้ว',
            saveFailed: (error) => `บันทึกไม่สำเร็จ: ${error}`,
            switchToReadMode: 'โปรดเปลี่ยนเป็นโหมดอ่านก่อน',
            cannotGetContent: 'ไม่สามารถรับเนื้อหาได้',
            copied: 'คัดลอกไปยังคลิปบอร์ดแล้ว',
            copyFailed: (error) => `คัดลอกไม่สำเร็จ: ${error}`,
            clipboardWriteFailed: 'เขียนไปยังคลิปบอร์ดไม่สำเร็จ โปรดตรวจสอบว่าแอปทำงานในบริบทที่ปลอดภัย',
            registerMenuSuccess: "สำเร็จ เพิ่มรายการเมนูคลิกขวา 'เปิดด้วย MdReader' แล้ว",
            unregisterMenuSuccess: 'สำเร็จ ลบรายการเมนูคลิกขวาแล้ว',
            operationFailed: (error) => `ดำเนินการไม่สำเร็จ (อาจต้องใช้สิทธิ์ผู้ดูแลระบบ):\n${error}`,
        },
        toolbar: {
            newTab: 'แท็บใหม่',
            openFile: 'เปิดไฟล์',
            open: 'เปิด',
            read: 'อ่าน',
            edit: 'แก้ไข',
            showNav: 'แสดงโครงร่าง',
            hideNav: 'ซ่อนโครงร่าง',
            nav: 'โครงร่าง',
            zoom: 'ซูมการอ่าน',
            switchLight: 'เปลี่ยนเป็นโหมดสว่าง',
            switchDark: 'เปลี่ยนเป็นโหมดมืด',
            save: 'บันทึก',
            saveAs: 'บันทึกเป็น',
            copyToWord: 'คัดลอกไปยัง Word',
            exportHtml: 'ส่งออก HTML',
            settings: 'การตั้งค่าระบบ',
            addContextMenu: 'เพิ่มในเมนูคลิกขวา',
            removeContextMenu: 'ลบเมนูคลิกขวา',
            normalWidth: 'ความกว้างปกติ',
            fullWidth: 'ความกว้างเต็ม',
            exitFullScreen: 'ออกจากโหมดเต็มหน้าจอ',
            enterFullScreen: 'โหมดเต็มหน้าจอ',
            theme: 'ธีม',
            themeLight: 'สว่าง',
            themeDark: 'มืด',
            themeDarkBlue: 'น้ำเงินเข้ม',
            themeSolarizedLight: 'Solarized สว่าง',
            themeSolarizedDark: 'Solarized มืด',
            themeMonokai: 'Monokai',
        },
        search: {
            placeholder: 'ค้นหา...',
            noResults: 'ไม่มีผลลัพธ์',
            previous: 'ก่อนหน้า (Shift+Enter)',
            next: 'ถัดไป (Enter)',
            close: 'ปิดการค้นหา',
        },
        preview: {
            optimizing: (progress) => `กำลังปรับการแสดงผล... ${progress}%`,
            loadingMoreVisible: 'กำลังโหลดเนื้อหาที่เหลือ...',
            loadingMoreHidden: 'เอกสารนี้มีเนื้อหายาว การโหลดจะดำเนินต่อเมื่อแท็บนี้ทำงาน',
        },
        errorBoundary: {
            title: 'เกิดข้อผิดพลาด',
            description: 'รีสตาร์ทแอปแล้วลองอีกครั้ง หากปัญหายังคงอยู่ โปรดรายงานพร้อมภาพหน้าจอ',
            refresh: 'รีเฟรชหน้า',
        },
    },
};

const isLanguage = (value: string | null): value is Language => {
    return Boolean(value && Object.prototype.hasOwnProperty.call(dictionaries, value));
};

const getInitialLanguage = (): Language => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;

    const browserLanguage = navigator.language.toLowerCase();
    const matchingOption = languageOptions.find(option => {
        const [languagePrefix] = option.value.toLowerCase().split('-');
        return browserLanguage === option.value.toLowerCase() || browserLanguage.startsWith(`${languagePrefix}-`);
    });

    return matchingOption?.value ?? 'en-US';
};

export const useI18n = () => {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.lang = language;
    }, [language]);

    const t = useMemo(() => dictionaries[language], [language]);

    const setLanguage = (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
    };

    return { language, setLanguage, t };
};

const defaultDocumentTitles = new Set(Object.values(dictionaries).map(dictionary => dictionary.document.untitled));
const defaultDocumentContents = new Set(Object.values(dictionaries).map(dictionary => dictionary.document.defaultContent));

export const isDefaultDocumentTitle = (title: string) => defaultDocumentTitles.has(title);

export const isDefaultDocumentContent = (content: string) => defaultDocumentContents.has(content);
