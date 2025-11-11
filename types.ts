

export enum AgentName {
  Nexus = 'Nexus',
  Cognito = 'Cognito',
  Relay = 'Relay',
  Sentinel = 'Sentinel',
  Echo = 'Echo',
}

export enum LogType {
  Genesis = 'genesis',
  Origin = 'origin',
  Event = 'event',
  Fragment = 'fragment',
  Consensus = 'consensus',
  Shim = 'shim',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Success = 'success',
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: LogType;
}

export interface AgentConfig {
  name: AgentName;
  role: string;
  expertise: string[];
  systemInstruction: string;
  model: string; // Gemini model to use for this agent
  color: string;
}

export interface AgentStatus {
  name: AgentName;
  status: string; // e.g., 'Idle', 'Thinking', 'Ready', 'Error'
  logs: LogEntry[];
  currentResponse: string;
  active: boolean;
}

export interface EditorContentPart {
  type: 'text' | 'image';
  content: string; // text or base64 data
  mimeType?: string; // e.g., 'image/png'
}

export interface CandidateResult {
  agentId: string;
  candidate: string;
  score: number;
  entropy: number;
  specialization: string;
  collaborative: boolean;
}

export interface ConsensusResult {
  bestCandidate: string;
  metaConsensus: string;
  score: number;
  metrics: {
    coverage: number;
    avgClusterScore: number;
    scoreVariance: number;
    clusterCount: number;
    consensusStrength: number;
  };
  diversity: number;
  collaboration: number;
  agentCount: number;
  roundCount: number;
  avgEntropy: number;
}

export interface AppSettings {
  quantumMode: boolean;
  hyperthreading: boolean;
  multiAgentMode: boolean;
  autoSave: boolean;
  agentCount: number;
  maxRounds: number;
  reasoningDepth: number;
  ollamaConnected: boolean; // Indicates if Ollama is connected or simulated
}

export interface FileMeta {
  name: string;
  lastModified: number;
}

export interface RecentFile {
  filename: string;
  content: string; // partial content for preview
  timestamp: number;
}

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

// Interface for AI Studio specific functions available on the window object
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Augment the Window interface directly, instead of using `declare global`
interface Window {
  aistudio: AIStudio;
}