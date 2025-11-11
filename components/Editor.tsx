

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { quantumSyntaxHighlighter } from '../utils/syntaxHighlighter';
import { quantumNotify } from '../utils/notifications';
import { quantumMemoryManager } from '../utils/memoryManager';
import { DEFAULT_EDITOR_CONTENT, SYNTAX_HIGHLIGHTING_CLASSES, TAILWIND_THEME } from '../constants';

interface EditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  currentFileName: string | null;
  currentFileType: string;
  onFileTypeChange: (type: string) => void;
  onEditorMetaChange: (meta: { cursor: string; lines: number; chars: number; history: number }) => void;
  history: string[];
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
  redoStack: string[];
  setRedoStack: React.Dispatch<React.SetStateAction<string[]>>;
  isGenerating: boolean;
}

const MAX_HISTORY_SIZE = 50;
const DEBOUNCE_DELAY = 100; // milliseconds

const Editor: React.FC<EditorProps> = ({
  content,
  onContentChange,
  currentFileName,
  currentFileType,
  onFileTypeChange,
  onEditorMetaChange,
  history,
  setHistory,
  redoStack,
  setRedoStack,
  isGenerating,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update editor content when prop changes, but only if not composing and not generating
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.textContent && !isComposing && !isGenerating) {
      // Temporarily store cursor position
      const selection = window.getSelection();
      let savedRange: Range | null = null;
      if (selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }

      editorRef.current.textContent = content; // Set raw text
      applyHighlighting();

      // Restore cursor position
      if (savedRange && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedRange);
        } catch (e) {
          // If range is invalid after content change, move to end
          const newRange = document.createRange();
          newRange.selectNodeContents(editorRef.current);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else if (selection && editorRef.current) {
         // If no previous selection, put cursor at end of new content
        const newRange = document.createRange();
        newRange.selectNodeContents(editorRef.current);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  }, [content, isComposing, isGenerating]); // Removed applyHighlighting from dependency array to avoid infinite loop

  // Sync scroll between editor and line numbers
  const syncScroll = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

  const updateLineNumbers = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      const text = editorRef.current.textContent || '';
      const lines = text.split('\n');
      const lineCount = lines.length;

      let lineNumbersHTML = '';
      for (let i = 1; i <= lineCount; i++) {
        lineNumbersHTML += i + '<br>';
      }
      lineNumbersRef.current.innerHTML = lineNumbersHTML;
      lineNumbersRef.current.style.height = editorRef.current.scrollHeight + 'px';
    }
  }, []);

  const updateStatus = useCallback(() => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const text = editorRef.current.textContent || '';
      const lines = text.split('\n');

      let lineNum = 1;
      let colNum = 0;

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        const preCaretText = preCaretRange.toString();
        const preCaretLines = preCaretText.split('\n');

        lineNum = preCaretLines.length;
        colNum = preCaretLines[preCaretLines.length - 1].length;
      }
      onEditorMetaChange({ cursor: `${lineNum}:${colNum}`, lines: lines.length, chars: text.length, history: history.length });
    }
  }, [onEditorMetaChange, history.length]);

  const pushHistory = useCallback((newContent: string) => {
    if (history.length && history[history.length - 1] === newContent) return;

    setHistory((prev) => {
      const newHistory = [...prev, newContent];
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      return newHistory;
    });
    setRedoStack([]); // Clear redo stack on new action
    quantumMemoryManager.store('autosave_content', newContent, 'high'); // Auto-save
  }, [history, setHistory, setRedoStack]);

  const applyHighlighting = useCallback(() => {
    if (editorRef.current) {
      quantumSyntaxHighlighter.setLanguage(currentFileType);
      quantumSyntaxHighlighter.applyHighlightingToElement(editorRef.current, currentFileType);
      updateStatus(); // Update status after highlighting potentially changes content structure
    }
  }, [currentFileType, updateStatus]);

  const handleInput = useCallback(() => {
    if (isComposing) return;
    if (highlightTimeout.current) clearTimeout(highlightTimeout.current);

    highlightTimeout.current = setTimeout(() => {
      if (editorRef.current) {
        const newContent = editorRef.current.textContent || '';
        if (newContent !== content) { // Only update if content actually changed
          onContentChange(newContent);
          pushHistory(newContent);
        }
      }
      applyHighlighting();
      updateLineNumbers();
      updateStatus();
    }, DEBOUNCE_DELAY);
  }, [isComposing, content, onContentChange, pushHistory, applyHighlighting, updateLineNumbers, updateStatus]);

  const handleKeydown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
    }
    // Handle Undo/Redo - these are handled by the global actions now
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    // Allow a short delay for the DOM to update before re-highlighting
    setTimeout(() => handleInput(), 10);
  }, [handleInput]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('input', handleInput);
      editorElement.addEventListener('compositionstart', () => setIsComposing(true));
      editorElement.addEventListener('compositionend', () => setIsComposing(false));
      editorElement.addEventListener('keydown', handleKeydown);
      editorElement.addEventListener('keyup', updateStatus);
      editorElement.addEventListener('click', updateStatus);
      editorElement.addEventListener('scroll', syncScroll);
      editorElement.addEventListener('paste', handlePaste);

      // Initial render and setup
      editorElement.textContent = content; // Ensure raw content is set initially
      applyHighlighting();
      updateLineNumbers();
      updateStatus();

      return () => {
        editorElement.removeEventListener('input', handleInput);
        editorElement.removeEventListener('compositionstart', () => setIsComposing(true));
        editorElement.removeEventListener('compositionend', () => setIsComposing(false));
        editorElement.removeEventListener('keydown', handleKeydown);
        editorElement.removeEventListener('keyup', updateStatus);
        editorElement.removeEventListener('click', updateStatus);
        editorElement.removeEventListener('scroll', syncScroll);
        editorElement.removeEventListener('paste', handlePaste);
        if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
      };
    }
  }, [handleInput, handleKeydown, updateStatus, syncScroll, handlePaste, content, applyHighlighting, updateLineNumbers]); // dependencies here ensure hooks are stable

  // Auto-detect file type when currentFileName changes
  useEffect(() => {
    if (currentFileName) {
      const detectedType = quantumSyntaxHighlighter.detectLanguage(currentFileName);
      if (detectedType !== currentFileType) {
        onFileTypeChange(detectedType);
        // Re-apply highlighting with the new type immediately
        if (editorRef.current) {
          quantumSyntaxHighlighter.setLanguage(detectedType);
          quantumSyntaxHighlighter.applyHighlightingToElement(editorRef.current, detectedType);
        }
      }
    } else if (currentFileType !== 'javascript') {
      onFileTypeChange('javascript'); // Default to JS if no file
    }
  }, [currentFileName, currentFileType, onFileTypeChange]);

  // Handle auto-save from memory manager.
  // This useEffect ensures initial load or when auto-save is enabled/disabled.
  useEffect(() => {
    const loadAutosave = async () => {
      const autosaveContent = await quantumMemoryManager.retrieve('autosave_content');
      if (autosaveContent && content === DEFAULT_EDITOR_CONTENT) { // Only load if editor is at default
        onContentChange(autosaveContent);
        pushHistory(autosaveContent);
        quantumNotify('Autosave restored', 'success');
      }
    };
    loadAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Inject syntax highlighting CSS classes dynamically
  const syntaxHighlightingStyles = useMemo(() => {
    const styleElement = document.createElement('style');
    let css = `.editor-content::selection { background: rgba(74, 201, 74, 0.3); }`; // Base selection style
    for (const type in SYNTAX_HIGHLIGHTING_CLASSES) {
      css += `.${type} { ${SYNTAX_HIGHLIGHTING_CLASSES[type].split(' ').map(cls => {
        // Map Tailwind classes to direct CSS properties for contenteditable highlighting
        if (cls.startsWith('text-')) return `color: var(--${cls});`;
        if (cls.startsWith('font-')) return `font-weight: ${cls.replace('font-', '')};`;
        if (cls === 'italic') return `font-style: italic;`;
        if (cls.startsWith('opacity-')) return `opacity: ${parseInt(cls.replace('opacity-', '')) / 100};`;
        return '';
      }).join(' ')} }`;
    }
    // Define CSS variables for colors, extracted from Tailwind config or hardcoded for consistency
    // This is a workaround as Tailwind JIT in browser doesn't apply arbitrary color vars directly to arbitrary class names
    for (const key in TAILWIND_THEME) {
      if (key.startsWith('--text-')) { // Extract --text-emerald-400 etc.
         const tailwindColor = key.replace('--text-', ''); // emerald-400
         const cssColor = key.replace('text-', ''); // --emerald-400
         css += `var(${key}): var(${cssColor});`; // e.g. --text-emerald-400: var(--emerald-400);
      } else if (key.startsWith('--') && key.includes('-')) { // generic --color-shade
          css += `var(${key}): ${TAILWIND_THEME[key as keyof typeof TAILWIND_THEME]};`;
      } else if (key.startsWith('#') || key.startsWith('rgb')) { // direct color values
          css += `var(${key}): ${key};`;
      }
    }

    // Direct mapping for known Tailwind colors used in highlighting
    css += `
      :root {
          --text-slate-500: #64748b;
          --text-lime-400: #a3e635;
          --text-amber-500: #f59e0b;
          --text-fuchsia-400: #f472b6;
          --text-sky-300: #7dd3fc;
          --text-purple-400: #c084fc;
          --text-slate-400: #94a3b8;
          --text-emerald-4400: #4ac94a; /* Adjusted for original intent */
          --text-blue-300: #93c5fd;
          --text-amber-400: #fbbf24;
          --text-red-400: #f87171;
          --text-emerald-500: #10b981;
          --text-blue-500: #3b82f6;
          --text-slate-200: #e2e8f0;
      }
    `;

    styleElement.innerHTML = css;
    document.head.appendChild(styleElement);
    return styleElement;
  }, []); // Only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syntaxHighlightingStyles.parentNode) {
        syntaxHighlightingStyles.parentNode.removeChild(syntaxHighlightingStyles);
      }
    };
  }, [syntaxHighlightingStyles]);

  return (
    <div className="relative flex flex-1 bg-[var(--theme-bg)] overflow-auto">
      <div
        ref={lineNumbersRef}
        className="w-[var(--ln-width)] p-2 pr-2 bg-[var(--panel)] text-[var(--muted-text)] font-mono text-right select-none flex-shrink-0 sticky left-0 z-10 overflow-hidden text-sm leading-[var(--baseline)]"
        style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
      ></div>
      <div
        ref={editorRef}
        id="editor"
        className={`flex-1 min-h-full p-2 pl-3 box-border whitespace-pre-wrap break-normal overflow-auto outline-none caret-[var(--accent)] text-slate-200 text-sm leading-[var(--baseline)]
          ${isGenerating ? 'opacity-70 pointer-events-none' : ''}`}
        contentEditable="true"
        spellCheck="false"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        tabIndex={0}
        style={{ tabSize: 4, MozTabSize: 4, fontFamily: 'inherit', fontSize: 'inherit' }}
      ></div>
    </div>
  );
};

export default Editor;
