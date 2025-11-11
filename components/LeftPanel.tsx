
import React, { useCallback } from 'react';
import { AppSettings, RecentFile } from '../types';
import { quantumNotify } from '../utils/notifications';
import { quantumMemoryManager } from '../utils/memoryManager';
import { QUANTUM_COMMAND_SUGGESTIONS, BUTTON_CLASSES } from '../constants';

interface LeftPanelProps {
  isOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBeautify: () => void;
  onRenderHTML: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onQuickAction: (action: 'optimize' | 'document' | 'refactor' | 'orchestrate') => void;
  recentFiles: RecentFile[];
  onRecentFileOpen: (filename: string, content: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  isOpen,
  onUndo,
  onRedo,
  onBeautify,
  onRenderHTML,
  settings,
  onSettingsChange,
  onQuickAction,
  recentFiles,
  onRecentFileOpen,
}) => {
  const handleSettingChange = useCallback((key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
    quantumMemoryManager.saveSettings(newSettings);
  }, [settings, onSettingsChange]);

  const handleClearCache = useCallback(async () => {
    const success = await quantumMemoryManager.clearAllCache();
    quantumNotify(success ? 'Cache cleared' : 'Cache clearance failed', success ? 'success' : 'error');
  }, []);

  const handleOptimizeMemory = useCallback(() => {
    quantumMemoryManager.aggressiveCleanup();
    quantumNotify('Memory optimized', 'success');
  }, []);

  const handleExportSession = useCallback(async () => {
    const success = await quantumMemoryManager.exportSession();
    quantumNotify(success ? 'Session exported' : 'Export failed', success ? 'success' : 'error');
  }, []);

  return (
    <aside
      id="left-panel"
      className={`fixed top-[var(--header-h)] left-0 h-[calc(100vh_-_var(--header-h)_-_var(--footer-h)_-_var(--status-h))]
                  bg-[var(--panel)] border-r border-zinc-800 p-2 box-border flex flex-col gap-2 overflow-y-auto
                  w-60 transition-transform duration-300 ease-in-out z-30
                  lg:static lg:h-auto lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <button onClick={onUndo} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>UNDO</button>
      <button onClick={onRedo} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>REDO</button>
      <button onClick={onBeautify} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Beautify</button>
      <button onClick={onRenderHTML} className={`px-2 py-1 text-xs rounded ${BUTTON_CLASSES.warn}`}>Render HTML</button>

      <div className="mt-5 text-xs text-[var(--muted-text)]">
        <p className="font-bold mb-1">Quantum AI Commands:</p>
        <ul className="pl-4 list-disc list-inside">
          {QUANTUM_COMMAND_SUGGESTIONS.slice(0, 5).map((cmd, index) => (
            <li key={index}>{cmd}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 text-xs text-[var(--muted-text)]">
        <p className="font-bold mb-1">Quantum Actions:</p>
        <button onClick={() => onQuickAction('optimize')} className={`w-full mb-1 px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Quantum Optimize</button>
        <button onClick={() => onQuickAction('document')} className={`w-full mb-1 px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Fractal Document</button>
        <button onClick={() => onQuickAction('refactor')} className={`w-full px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Hyper Refactor</button>
        <button onClick={() => onQuickAction('orchestrate')} className={`w-full mt-1 px-2 py-1 text-xs rounded ${BUTTON_CLASSES.success}`}>Enhanced Multi-Agent</button>
      </div>

      <div className="mt-5 text-xs text-[var(--muted-text)]">
        <p className="font-bold mb-1">Memory Management:</p>
        <button onClick={handleClearCache} className={`w-full mb-1 px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Clear Cache</button>
        <button onClick={handleOptimizeMemory} className={`w-full mb-1 px-2 py-1 text-xs rounded ${BUTTON_CLASSES.info}`}>Optimize Memory</button>
        <button onClick={handleExportSession} className={`w-full px-2 py-1 text-xs rounded ${BUTTON_CLASSES.default}`}>Export Session</button>
      </div>

      <div className="mt-5 text-xs text-[var(--muted-text)]">
        <p className="font-bold mb-1">Quantum Settings:</p>
        <div className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            id="quantum-mode"
            checked={settings.quantumMode}
            onChange={(e) => handleSettingChange('quantumMode', e.target.checked)}
            className="form-checkbox h-3 w-3 text-emerald-600 rounded border-gray-600 bg-gray-700 focus:ring-emerald-500"
          />
          <label htmlFor="quantum-mode">Quantum Fractal Mode</label>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            id="hyperthreading"
            checked={settings.hyperthreading}
            onChange={(e) => handleSettingChange('hyperthreading', e.target.checked)}
            className="form-checkbox h-3 w-3 text-emerald-600 rounded border-gray-600 bg-gray-700 focus:ring-emerald-500"
          />
          <label htmlFor="hyperthreading">Hyperthreading</label>
        </div>
        <div className="flex items-center gap-2 mt-1 mb-1">
          <input
            type="checkbox"
            id="multi-agent-mode"
            checked={settings.multiAgentMode}
            onChange={(e) => handleSettingChange('multiAgentMode', e.target.checked)}
            className="form-checkbox h-3 w-3 text-emerald-600 rounded border-gray-600 bg-gray-700 focus:ring-emerald-500"
          />
          <label htmlFor="multi-agent-mode">Multi-Agent Consensus</label>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            id="auto-save"
            checked={settings.autoSave}
            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            className="form-checkbox h-3 w-3 text-emerald-600 rounded border-gray-600 bg-gray-700 focus:ring-emerald-500"
          />
          <label htmlFor="auto-save">Auto Save</label>
        </div>
      </div>

      <div className="mt-5 text-xs text-[var(--muted-text)]">
        <p className="font-bold mb-1">Orchestrator Settings:</p>
        <div className="mb-1">
          <label htmlFor="agent-count" className="mr-2">Agent Count:</label>
          <input
            type="number"
            id="agent-count"
            min="1"
            max="5" // Max agents based on AGENT_CONFIGS.length
            value={settings.agentCount}
            onChange={(e) => handleSettingChange('agentCount', parseInt(e.target.value))}
            className="w-16 bg-[var(--status-bg)] text-white border border-[var(--muted-text)] p-0.5 rounded text-xs"
          />
        </div>
        <div className="mb-1">
          <label htmlFor="max-rounds" className="mr-2">Max Rounds:</label>
          <input
            type="number"
            id="max-rounds"
            min="1"
            max="10"
            value={settings.maxRounds}
            onChange={(e) => handleSettingChange('maxRounds', parseInt(e.target.value))}
            className="w-16 bg-[var(--status-bg)] text-white border border-[var(--muted-text)] p-0.5 rounded text-xs"
          />
        </div>
        <div>
          <label htmlFor="reasoning-depth" className="mr-2">Reasoning Depth:</label>
          <input
            type="number"
            id="reasoning-depth"
            min="1"
            max="5"
            value={settings.reasoningDepth}
            onChange={(e) => handleSettingChange('reasoningDepth', parseInt(e.target.value))}
            className="w-16 bg-[var(--status-bg)] text-white border border-[var(--muted-text)] p-0.5 rounded text-xs"
          />
        </div>
      </div>

      <div className="mt-5 text-xs text-[var(--muted-text)]">
        <p className="font-bold mb-1">Recent Files:</p>
        <div id="recent-files" className="max-h-[100px] overflow-y-auto">
          {recentFiles.length === 0 ? (
            <div className="p-2 text-[var(--muted-text)] text-xs">No recent files</div>
          ) : (
            recentFiles.map((file, index) => (
              <div
                key={index}
                className="p-2 border-b border-[var(--muted-text)] cursor-pointer hover:bg-white/10 last:border-b-0"
                onClick={() => onRecentFileOpen(file.filename, file.content)}
              >
                <div className="font-bold">{file.filename}</div>
                <div className="text-[9px] text-[var(--muted-text)]">{new Date(file.timestamp).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default LeftPanel;
