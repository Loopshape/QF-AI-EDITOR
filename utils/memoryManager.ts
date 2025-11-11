
import { AppSettings, RecentFile } from '../types';
import { DEFAULT_APP_SETTINGS } from '../constants';
import { quantumNotify } from './notifications';

class QuantumMemoryManager {
  private storageKey = 'quantum_editor_cache';
  private settingsKey = 'quantum_editor_settings';
  private recentFilesKey = 'quantum_recent_files';
  private maxMemoryThreshold = 50 * 1024 * 1024; // 50 MB
  private cacheLimit = 40960; // Arbitrary number of cache entries
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private memoryStatusElement: HTMLElement | null = null;

  constructor() {
    // Dynamically get the memory status element once DOM is ready, or rely on external setter
  }

  public setMemoryStatusElement(element: HTMLElement): void {
    this.memoryStatusElement = element;
  }

  public init(onSettingsLoaded?: (settings: AppSettings) => void): void {
    const loadedSettings = this.loadSettings();
    if (onSettingsLoaded) {
      onSettingsLoaded(loadedSettings);
    }
    this.loadRecentFiles();
    this.startMemoryMonitoring();
    this.cleanupOldCache();
  }

  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private startMemoryMonitoring(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval); // Clear existing interval if any
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 3200);

    window.addEventListener('beforeunload', () => this.cleanup());
  }

  private checkMemoryUsage(): void {
    if (!this.memoryStatusElement) return;

    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const limit = memory.jsHeapSizeLimit;

        const usagePercent = (used / limit) * 100;

        if (usagePercent > 80) {
          this.memoryStatusElement.textContent = 'RAM: CRITICAL';
          this.memoryStatusElement.className = 'memory-status low bg-red-700/10 text-red-400 p-1 rounded';
          this.emergencyCleanup();
        } else if (usagePercent > 60) {
          this.memoryStatusElement.textContent = 'RAM: WARNING';
          this.memoryStatusElement.className = 'memory-status warning bg-amber-700/10 text-amber-400 p-1 rounded';
          this.aggressiveCleanup();
        } else {
          this.memoryStatusElement.textContent = 'RAM: OK';
          this.memoryStatusElement.className = 'memory-status good bg-emerald-700/10 text-emerald-400 p-1 rounded';
        }
      } else {
        this.memoryStatusElement.textContent = 'RAM: N/A';
        this.memoryStatusElement.className = 'memory-status good bg-zinc-700/10 text-zinc-400 p-1 rounded';
      }
    } catch (error) {
      console.warn('Memory monitoring unavailable:', error);
      this.memoryStatusElement.textContent = 'RAM: N/A (Error)';
      this.memoryStatusElement.className = 'memory-status error bg-red-700/10 text-red-400 p-1 rounded';
    }
  }

  // Settings management
  public loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.settingsKey);
      if (stored) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Settings load failed:', error);
    }
    return DEFAULT_APP_SETTINGS;
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (error) {
      console.warn('Settings save failed:', error);
    }
  }

  // Recent files management
  public loadRecentFiles(): RecentFile[] {
    try {
      const stored = localStorage.getItem(this.recentFilesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Recent files load failed:', error);
      return [];
    }
  }

  public saveRecentFiles(recentFiles: RecentFile[]): void {
    try {
      localStorage.setItem(this.recentFilesKey, JSON.stringify(recentFiles));
    } catch (error) {
      console.warn('Recent files save failed:', error);
    }
  }

  public addRecentFile(filename: string, content: string, updateUiCallback: (files: RecentFile[]) => void): void {
    let recentFiles = this.loadRecentFiles();
    // Remove if already exists
    recentFiles = recentFiles.filter(f => f.filename !== filename);

    // Add to beginning
    recentFiles.unshift({
      filename,
      content: content.substring(0, 1000), // Store only preview
      timestamp: Date.now(),
    });

    // Keep only last 10 files
    recentFiles = recentFiles.slice(0, 10);

    this.saveRecentFiles(recentFiles);
    updateUiCallback(recentFiles);
  }

  public async store(key: string, data: any, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<boolean> {
    try {
      const cache = this.getCache();
      const dataSize = new Blob([JSON.stringify(data)]).size;
      if (dataSize > this.maxMemoryThreshold) {
        throw new Error('Data too large for storage');
      }

      cache[key] = {
        data: data,
        timestamp: Date.now(),
        priority: priority,
        size: dataSize,
      };

      if (Object.keys(cache).length > this.cacheLimit) {
        this.cleanupCache();
      }

      await this.saveCache(cache);
      return true;
    } catch (error) {
      console.warn('LocalStorage storage failed, falling back to session storage:', error);
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (sessionError) {
        console.warn('SessionStorage storage also failed:', sessionError);
        quantumNotify('Memory full, failed to store data.', 'error');
        return false;
      }
    }
  }

  public async retrieve(key: string): Promise<any | null> {
    try {
      const cache = this.getCache();
      if (cache[key]) {
        return cache[key].data;
      }

      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      return null;
    } catch (error) {
      console.warn('Retrieval failed:', error);
      return null;
    }
  }

  private cleanupCache(): void {
    try {
      const cache = this.getCache();
      const entries = Object.entries(cache);

      if (entries.length > this.cacheLimit) {
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Sort by oldest
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.3)); // Remove 30%
        toRemove.forEach(([key]) => delete cache[key]);
        this.saveCache(cache);
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  public emergencyCleanup(): void {
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.clear();
      // Clear global in-memory caches if they exist
      if ((window as any).quantumMemoryCache) {
        (window as any).quantumMemoryCache.clear();
      }
      if ((window as any).gc) (window as any).gc(); // Explicit garbage collection if available
      this.clearLargeArrays();
      console.log('Emergency memory cleanup completed');
      quantumNotify('Emergency memory cleanup initiated!', 'error');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  public aggressiveCleanup(): void {
    try {
      const cache = this.getCache();
      const entries = Object.entries(cache);
      const toKeep = entries.filter(([key, entry]) =>
        entry.priority === 'high' && entry.size < 1024 * 1024 // Keep high priority and smaller items
      );
      this.saveCache(Object.fromEntries(toKeep));

      // Clear half of session storage if it exists
      for (let i = 0; i < sessionStorage.length / 2; i++) {
        const key = sessionStorage.key(i);
        if (key) sessionStorage.removeItem(key);
      }
      console.log('Aggressive memory cleanup completed');
      quantumNotify('Aggressive memory optimization applied.', 'warn');
    } catch (error) {
      console.warn('Aggressive cleanup failed:', error);
    }
  }

  private clearLargeArrays(): void {
    // This is a placeholder for application-specific large data structures
    if ((window as any).largeArrays) {
      (window as any).largeArrays.clear();
    }
  }

  private cleanupOldCache(): void {
    const cache = this.getCache();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // Keep cache for 1 hour

    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > oneHour) {
        delete cache[key];
      }
    });
    this.saveCache(cache);
  }

  private getCache(): { [key: string]: { data: any; timestamp: number; priority: string; size: number } } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return {};
    }
  }

  private async saveCache(cache: { [key: string]: { data: any; timestamp: number; priority: string; size: number } }): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cache));
    } catch (error) {
      console.warn('Cache save failed (localStorage full?):', error);
      quantumNotify('Local storage full. Cannot save cache.', 'error');
    }
  }

  public async exportSession(): Promise<boolean> {
    try {
      const sessionData = {
        timestamp: Date.now(),
        cache: this.getCache(),
        settings: this.loadSettings(),
        recentFiles: this.loadRecentFiles(),
      };

      const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quantum_session_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Session export failed:', error);
      return false;
    }
  }

  public async clearAllCache(): Promise<boolean> {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.settingsKey);
      localStorage.removeItem(this.recentFilesKey);
      sessionStorage.clear();
      // Also clear global in-memory caches if they exist
      if ((window as any).quantumMemoryCache) {
        (window as any).quantumMemoryCache.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache clearance failed:', error);
      return false;
    }
  }
}

export const quantumMemoryManager = new QuantumMemoryManager();
