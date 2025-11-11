
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Editor from './components/Editor';
import LeftPanel from './components/LeftPanel';
import AiResponsePanel from './components/AiResponsePanel';
import { AgentStatus, AppSettings, LogEntry, AgentName, ConsensusResult, RecentFile, LogType } from './types';
import { AGENT_CONFIGS, DEFAULT_APP_SETTINGS, DEFAULT_EDITOR_CONTENT, QUANTUM_COMMAND_SUGGESTIONS, MEMORY_STATUS_CLASSES, BUTTON_CLASSES } from './constants';
import { quantumMemoryManager } from './utils/memoryManager';
import { quantumNotify } from './utils/notifications';
import { runMultiAgentOrchestration } from './services/geminiService';
import { quantumSyntaxHighlighter } from './utils/syntaxHighlighter';

const App: React.FC = () => {
  const [editorContent, setEditorContent] = useState<string>(DEFAULT_EDITOR_CONTENT);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentFileType, setCurrentFileType] = useState<string>('javascript');
  const [editorMeta, setEditorMeta] = useState({ cursor: '0:0', lines: 0, chars: 0, history: 0 });
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionsPanelRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Agent Statuses
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(
    AGENT_CONFIGS.map((config) => ({
      name: config.name,
      status: 'Idle',
      logs: [],
      currentResponse: '',
      active: false,
    }))
  );
  const [consensusResult, setConsensusResult] = useState<ConsensusResult | null>(null);

  // Settings state, initialized from memory manager
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Initialize Memory Manager and load settings/recent files
  useEffect(() => {
    quantumMemoryManager.init((loadedSettings) => {
      setSettings(loadedSettings);
      setRecentFiles(quantumMemoryManager.loadRecentFiles());
    });
    const memoryStatusEl = document.getElementById('memory-status');
    if (memoryStatusEl) {
      quantumMemoryManager.setMemoryStatusElement(memoryStatusEl);
    }

    // Load editor content on initial mount
    const loadInitialContent = async () => {
      const autosaveContent = await quantumMemoryManager.retrieve('autosave_content');
      if (autosaveContent) {
        setEditorContent(autosaveContent);
        setHistory([autosaveContent]);
      } else {
        setHistory([DEFAULT_EDITOR_CONTENT]);
      }
    };
    loadInitialContent();

    return () => quantumMemoryManager.cleanup();
  }, []);

  const handleEditorContentChange = useCallback((newContent: string) => {
    setEditorContent(newContent);
  }, []);

  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    // Auto-save logic for settings is handled within LeftPanel when a setting changes
  }, []);

  const logAgentActivity = useCallback((agentName: AgentName, logEntry: LogEntry) => {
    setAgentStatuses((prev) =>
      prev.map((agent) =>
        agent.name === agentName
          ? {
              ...agent,
              logs: [...agent.logs, logEntry],
              currentResponse: logEntry.message,
              active: true, // Activate card on new log
            }
          : agent
      )
    );
    // Deactivate after a short period (controlled by CSS animation)
    setTimeout(() => {
      setAgentStatuses((prev) =>
        prev.map((agent) => (agent.name === agentName ? { ...agent, active: false } : agent))
      );
    }, 800);
  }, []);

  const handleMultiAgentRun = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setAiPanelOpen(true);
    setConsensusResult(null); // Clear previous results

    // Reset agent statuses and logs for a new run
    setAgentStatuses(
      AGENT_CONFIGS.map((config) => ({
        name: config.name,
        status: 'Idle',
        logs: [],
        currentResponse: '',
        active: false,
      }))
    );

    try {
      const result = await runMultiAgentOrchestration(
        promptInput,
        editorContent,
        logAgentActivity,
        settings.agentCount,
        settings.maxRounds,
        settings.reasoningDepth
      );
      setConsensusResult(result);
      quantumNotify('Orchestration complete!', 'success');
    } catch (error: any) {
      console.error('Orchestration failed:', error);
      quantumNotify(`Orchestration error: ${error.message}`, 'error');
      logAgentActivity(AgentName.Nexus, {
        timestamp: new Date().toLocaleTimeString(),
        message: `Critical Orchestration Failure: ${error.message}`,
        type: LogType.Error, // Corrected LogType usage
      });
    } finally {
      setIsGenerating(false);
      setPromptInput('');
    }
  }, [
    isGenerating,
    promptInput,
    editorContent,
    logAgentActivity,
    settings.agentCount,
    settings.maxRounds,
    settings.reasoningDepth,
  ]);

  const handleQuickAction = useCallback(async (action: 'optimize' | 'document' | 'refactor' | 'orchestrate') => {
    if (!settings.multiAgentMode) {
      quantumNotify('Multi-Agent Consensus must be enabled for this action.', 'warn');
      return;
    }

    let actionPrompt = '';
    switch (action) {
      case 'optimize':
        actionPrompt = 'Optimize the provided code for performance, readability, and resource usage.';
        break;
      case 'document':
        actionPrompt = 'Generate comprehensive documentation for the provided code, including function descriptions, parameters, and examples.';
        break;
      case 'refactor':
        actionPrompt = 'Refactor the provided code to improve its structure, maintainability, and adherence to best practices, without changing its core functionality.';
        break;
      case 'orchestrate':
        actionPrompt = promptInput || 'Perform a general enhancement on the provided code.'; // Use current prompt or default
        break;
    }
    setPromptInput(actionPrompt); // Set prompt input for visibility
    await handleMultiAgentRun();
  }, [settings.multiAgentMode, promptInput, handleMultiAgentRun]);

  const handleCopyConsensus = useCallback(() => {
    if (consensusResult?.bestCandidate) {
      navigator.clipboard.writeText(consensusResult.bestCandidate).then(() => {
        quantumNotify('Best candidate code copied to clipboard!', 'success');
      });
    }
  }, [consensusResult]);

  const handleApplyConsensus = useCallback(
    (type: 'best' | 'meta') => {
      const codeToApply = type === 'best' ? consensusResult?.bestCandidate : consensusResult?.metaConsensus;
      if (codeToApply) {
        setEditorContent(codeToApply);
        setHistory((prev) => [...prev, codeToApply]);
        setRedoStack([]); // Clear redo stack on new content
        quantumNotify(`${type === 'best' ? 'Best candidate' : 'Meta-consensus'} applied to editor!`, 'success');
      }
    },
    [consensusResult, setHistory, setRedoStack]
  );

  const handleUndo = useCallback(() => {
    if (history.length > 1) {
      const lastContent = history[history.length - 1];
      const previousContent = history[history.length - 2];
      setRedoStack((prev) => [lastContent, ...prev]);
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setEditorContent(previousContent);
      quantumNotify('Undo successful', 'info');
    } else {
      quantumNotify('Nothing to undo', 'warn');
    }
  }, [history, setHistory, setRedoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[0];
      setHistory((prev) => [...prev, nextContent]);
      setRedoStack((prev) => prev.slice(1));
      setEditorContent(nextContent);
      quantumNotify('Redo successful', 'info');
    } else {
      quantumNotify('Nothing to redo', 'warn');
    }
  }, [redoStack, setHistory, setRedoStack]);

  const handleBeautifyCode = useCallback(() => {
    try {
      const content = editorContent;
      let formatted = content;

      // Basic formatting rules (can be expanded with a proper formatter like Prettier if client-side available)
      formatted = formatted.replace(/\s*([{};,])\s*/g, '$1\n'); // Add newline after braces, semicolons, commas
      formatted = formatted.replace(/(\(|\)|\[|\])/g, ' $1 '); // Add space around parentheses/brackets
      formatted = formatted.replace(/\s+/g, ' '); // Remove extra whitespace
      formatted = formatted.replace(/;\n(\s*)\}/g, ';\n$1 }'); // Fix bracket placement
      formatted = formatted.replace(/(\w+)\s*=\s*(\w+)/g, '$1 = $2'); // Standardize assignment spacing
      formatted = formatted.replace(/,\n/g, ', '); // Remove newlines after commas within one-liners

      // Indentation (very basic - just for lines starting with '}')
      let indentLevel = 0;
      formatted = formatted.split('\n').map(line => {
        if (line.trim().startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indentedLine = '    '.repeat(indentLevel) + line.trim();
        if (line.trim().endsWith('{')) {
          indentLevel++;
        }
        return indentedLine;
      }).join('\n');

      setEditorContent(formatted);
      setHistory((prev) => [...prev, formatted]);
      setRedoStack([]);
      quantumNotify('Code beautified', 'success');
    } catch (error) {
      quantumNotify('Beautification failed', 'error');
      console.error('Beautification error:', error);
    }
  }, [editorContent, setHistory, setRedoStack]);

  // File handling
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileOpenClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileOpen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const fileName = file.name;
      const fileType = quantumSyntaxHighlighter.detectLanguage(fileName);
      const content = ev.target?.result as string;

      setEditorContent(content);
      setCurrentFileName(fileName);
      setCurrentFileType(fileType);
      setHistory([content]); // Reset history for new file
      setRedoStack([]); // Clear redo stack

      quantumMemoryManager.addRecentFile(fileName, content, setRecentFiles);
      quantumNotify(`Opened file: ${fileName}`, 'success');
    };
    reader.readAsText(file);
  }, []);

  const handleSaveFile = useCallback(() => {
    if (!currentFileName) {
      handleSaveAsFile();
      return;
    }

    const blob = new Blob([editorContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    quantumNotify('File saved successfully', 'success');
  }, [currentFileName, editorContent]);

  const handleSaveAsFile = useCallback(() => {
    const fileName = prompt('Enter file name:', currentFileName || 'quantum_code.js');
    if (fileName) {
      setCurrentFileName(fileName);
      const fileType = quantumSyntaxHighlighter.detectLanguage(fileName);
      setCurrentFileType(fileType); // Update file type based on new extension
      handleSaveFile(); // Now save with the new name
    }
  }, [currentFileName, handleSaveFile]);

  const handleRenderHTML = useCallback(() => {
    try {
      const previewContent = document.getElementById('preview-content') as HTMLIFrameElement;
      if (previewContent) {
        const blob = new Blob([editorContent], { type: 'text/html' });
        previewContent.src = URL.createObjectURL(blob);
        document.getElementById('preview-panel')?.classList.add('flex');
        document.getElementById('preview-panel')?.classList.remove('hidden');
      }
    } catch (e: any) {
      quantumNotify('Quantum rendering error: ' + e.message, 'error');
    }
  }, [editorContent]);

  const closePreview = useCallback(() => {
    const previewContent = document.getElementById('preview-content') as HTMLIFrameElement;
    document.getElementById('preview-panel')?.classList.remove('flex');
    document.getElementById('preview-panel')?.classList.add('hidden');
    if (previewContent && previewContent.src.startsWith('blob:')) {
      URL.revokeObjectURL(previewContent.src);
    }
  }, []);

  const handlePromptInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPromptInput(value);
    if (value.length > 1) {
      const filteredSuggestions = QUANTUM_COMMAND_SUGGESTIONS.filter(cmd =>
        cmd.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPromptInput(suggestion);
    setSuggestions([]);
    promptInputRef.current?.focus();
  }, []);

  const handlePromptInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleMultiAgentRun();
    }
    // Handle suggestion navigation with arrow keys and Enter
    if (suggestions.length > 0) {
      // Basic navigation for simplicity, could be enhanced
      if (e.key === 'ArrowDown' && suggestionsPanelRef.current) {
        e.preventDefault();
        const next = (suggestionsPanelRef.current.querySelector('.suggestion-item.focused') || suggestionsPanelRef.current.firstElementChild)?.nextElementSibling;
        if (next) {
          (next as HTMLElement).focus();
        } else {
          (suggestionsPanelRef.current.firstElementChild as HTMLElement)?.focus();
        }
      } else if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[0]); // Select first suggestion on enter
      }
    }
  }, [suggestions, handleSuggestionClick, handleMultiAgentRun]);

  // Auto-save interval from settings
  useEffect(() => {
    let autoSaveInterval: ReturnType<typeof setInterval> | null = null;
    if (settings.autoSave) {
      autoSaveInterval = setInterval(() => {
        if (!isGenerating && editorContent.trim().length > 0) {
          quantumMemoryManager.store('autosave_content', editorContent, 'high');
        }
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [settings.autoSave, isGenerating, editorContent]);

  // Quantum visuals (fractal nodes)
  const quantumThinkingRef = useRef<HTMLDivElement>(null);
  const createFractalNodes = useCallback(() => {
    if (!settings.quantumMode || !quantumThinkingRef.current) {
      if (quantumThinkingRef.current) quantumThinkingRef.current.innerHTML = '';
      return;
    }

    quantumThinkingRef.current.innerHTML = '';
    const nodeCount = settings.hyperthreading ? 12 : 6;

    for (let i = 0; i < nodeCount; i++) {
      const node = document.createElement('div');
      node.className = 'fractal-node absolute w-1 h-1 rounded-full animate-ping';
      node.style.left = `${Math.random() * 100}%`;
      node.style.top = `${Math.random() * 100}%`;
      node.style.animationDelay = `${Math.random() * 2}s`;
      node.style.backgroundColor = i % 2 === 0 ? 'var(--agent-nexus)' : 'var(--agent-cognito)';
      quantumThinkingRef.current.appendChild(node);
    }
  }, [settings.quantumMode, settings.hyperthreading]);

  useEffect(() => {
    createFractalNodes();
  }, [settings.quantumMode, settings.hyperthreading, createFractalNodes]);

  // Dynamic Tailwind classes based on CSS variables
  const getDynamicTailwindClasses = (variable: string, defaultClass: string = '') => {
    return `[background:var(${variable})] ${defaultClass}`;
  };

  return (
    <div className="h-screen grid grid-rows-[var(--header-h)_var(--status-h)_1fr_var(--footer-h)] overflow-hidden">
      {/* Header */}
      <header className="row-span-1 col-span-full bg-[var(--header-bg)] border-b border-zinc-900 flex items-center justify-between px-3 py-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-quantum-scan"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default} lg:hidden`}>
            {leftPanelOpen ? '✕' : '☰'}
          </button>
          <div className="font-extrabold text-lg animate-pulse-quantum text-slate-100">Nemodian 2244-1 :: Quantum Fractal AI</div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <div className="flex items-center gap-1 text-xs text-zinc-300">
            <div className={`w-2 h-2 rounded-full ${settings.ollamaConnected ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
            <div>Quantum AI: {settings.ollamaConnected ? 'Connected' : 'Simulated'}</div>
          </div>
          <button onClick={handleFileOpenClick} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Open</button>
          <input type="file" ref={fileInputRef} onChange={handleFileOpen} className="hidden" accept=".js,.html,.css,.txt,.json,.ts,.jsx,.tsx,.py,.php,.sql,.md,.xml,.yaml,.yml" />
          <button onClick={handleSaveFile} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Save</button>
          <button onClick={handleSaveAsFile} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Save As</button>
          <button onClick={handleRenderHTML} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.warn}`}>Render HTML</button>
          <button onClick={handleMultiAgentRun} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.success}`}>Enhanced Orchestrator</button>
        </div>
      </header>

      {/* Status Bar */}
      <div id="status-bar" className="row-span-1 col-span-full bg-[var(--status-bg)] flex justify-between items-center px-3 py-1 text-xs relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-thread-flow" style={{ left: `${20 + i * 15}%`, animationDelay: `${i * 0.3}s` }}></div>
          ))}
        </div>
        <div className="relative z-10 text-zinc-300">File: {currentFileName || 'No File Loaded'} ({currentFileType})</div>
        <div className="relative z-10 text-zinc-300">
          Cursor: {editorMeta.cursor} | Lines: {editorMeta.lines} | Chars: {editorMeta.chars} | History: {editorMeta.history}
          <span className="ml-2">{settings.quantumMode ? `Quantum: ${settings.hyperthreading ? 'Hyperthreaded' : 'Standard'}` : 'Classical Mode'}</span>
          <span className="ml-2">{settings.multiAgentMode ? 'Multi-Agent' : 'Single-Agent'}</span>
        </div>
        <div id="memory-status" className={`relative z-10 text-xs p-0.5 rounded ${MEMORY_STATUS_CLASSES.good}`}>RAM: OK</div>
      </div>

      {/* Editor Stage */}
      <div className={`relative flex-1 bg-[var(--theme-bg)] flex transition-all duration-300 ease-in-out`}>
        <LeftPanel
          isOpen={leftPanelOpen}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onBeautify={handleBeautifyCode}
          onRenderHTML={handleRenderHTML}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onQuickAction={handleQuickAction}
          recentFiles={recentFiles}
          onRecentFileOpen={(filename, content) => {
            setEditorContent(content);
            setCurrentFileName(filename);
            setCurrentFileType(quantumSyntaxHighlighter.detectLanguage(filename));
            setHistory([content]);
            setRedoStack([]);
            setLeftPanelOpen(false); // Close panel on file open
          }}
        />
        <div className={`relative flex-1 flex transition-all duration-300 ease-in-out ${leftPanelOpen ? 'lg:ml-60' : ''}`}>
          <div ref={quantumThinkingRef} className="absolute inset-0 pointer-events-none z-0 opacity-20"></div>
          <Editor
            content={editorContent}
            onContentChange={handleEditorContentChange}
            currentFileName={currentFileName}
            currentFileType={currentFileType}
            onFileTypeChange={setCurrentFileType}
            onEditorMetaChange={setEditorMeta}
            history={history}
            setHistory={setHistory}
            redoStack={redoStack}
            setRedoStack={setRedoStack}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="row-span-1 col-span-full bg-[var(--header-bg)] border-t border-zinc-900 flex items-center p-2 sticky bottom-0 z-20">
        <div className="relative flex-1 mr-2">
          <input
            ref={promptInputRef}
            id="prompt-input"
            className="flex-1 w-full p-2 bg-[var(--status-bg)] border border-emerald-400 text-white font-mono rounded text-base focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Enter quantum command (e.g., 'create a function to sort arrays')"
            value={promptInput}
            onChange={handlePromptInputChange}
            onKeyDown={handlePromptInputKeyDown}
            disabled={isGenerating}
          />
          {suggestions.length > 0 && (
            <div
              ref={suggestionsPanelRef}
              id="suggestions-panel"
              className="absolute bottom-full left-0 mb-1 w-full bg-[var(--panel)] border border-emerald-400 rounded-md shadow-lg max-h-48 overflow-y-auto z-50"
              style={{ display: suggestions.length > 0 ? 'block' : 'none' }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item p-2 text-sm border-b border-zinc-800 last:border-b-0 hover:bg-white/10 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleMultiAgentRun} className={`px-4 py-2 text-sm rounded ${BUTTON_CLASSES.success} ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={isGenerating}>
          {isGenerating ? (
            <span className="flex items-center">
              <span className="w-4 h-4 inline-block mr-2 relative">
                <span className="absolute w-full h-full border-2 border-transparent border-t-purple-400 rounded-full animate-spin"></span>
                <span className="absolute w-full h-full border-2 border-transparent border-b-teal-400 rounded-full animate-spin-reverse"></span>
              </span>
              QUANTUM PROCESSING...
            </span>
          ) : (
            'ENHANCED QUANTUM PROCESS'
          )}
        </button>
      </footer>

      {/* Panels */}
      <div id="preview-panel" className="hidden fixed inset-0 bg-black/70 z-50 justify-center items-center">
        <div className="bg-white rounded-lg border-2 border-emerald-400 w-11/12 h-11/12 flex flex-col">
          <div className="bg-[var(--header-bg)] text-white p-2 flex justify-between items-center border-b border-emerald-400">
            <span className="text-lg font-bold">Quantum Preview</span>
            <button onClick={closePreview} className="text-xl leading-none text-white hover:text-red-400 transition-colors">×</button>
          </div>
          <iframe id="preview-content" className="w-full h-full border-none bg-white"></iframe>
        </div>
      </div>

      <AiResponsePanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        agentStatuses={agentStatuses}
        consensusResult={consensusResult}
        onCopyConsensus={handleCopyConsensus}
        onApplyConsensus={handleApplyConsensus}
        onRerunOrchestrator={handleMultiAgentRun}
      />
    </div>
  );
};

export default App;