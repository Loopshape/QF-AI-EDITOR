

import { AgentConfig, AgentName, AppSettings, LogType } from './types';

// Tailwind color mapping for agent colors
const AGENT_COLORS: Record<AgentName, string> = {
  [AgentName.Nexus]: '#BB86FC', // purple-400
  [AgentName.Cognito]: '#03DAC6', // teal-400
  [AgentName.Relay]: '#FFD54F', // amber-300
  [AgentName.Sentinel]: '#CF6679', // rose-400
  [AgentName.Echo]: '#4ac94a', // emerald-400
};

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: AgentName.Nexus,
    role: 'Orchestrator',
    expertise: ['architecture', 'integration', 'coordination'],
    systemInstruction: 'You are an advanced Quantum Orchestrator. Your primary role is to coordinate and integrate solutions from other agents, ensuring overall system architecture and flow. Focus on high-level design and integration strategy.',
    model: 'gemini-2.5-pro',
    color: AGENT_COLORS[AgentName.Nexus],
  },
  {
    name: AgentName.Cognito,
    role: 'Analyzer',
    expertise: ['analysis', 'optimization', 'patterns', 'debugging'],
    systemInstruction: 'You are an Enhanced Fractal Analyzer. Your task is to perform deep code analysis, identify inefficiencies, suggest optimizations, and detect common anti-patterns. Focus on performance, memory usage, and code quality.',
    model: 'gemini-2.5-pro',
    color: AGENT_COLORS[AgentName.Cognito],
  },
  {
    name: AgentName.Relay,
    role: 'Communicator',
    expertise: ['synthesis', 'documentation', 'communication', 'code generation'],
    systemInstruction: 'You are a Quantum Communicator. Your role is to synthesize complex information, generate clear and concise code snippets, and assist with documentation. Focus on clear, readable, and well-commented code.',
    model: 'gemini-2.5-flash',
    color: AGENT_COLORS[AgentName.Relay],
  },
  {
    name: AgentName.Sentinel,
    role: 'Validator',
    expertise: ['validation', 'security', 'quality', 'testing'],
    systemInstruction: 'You are a Quantum Monitor and Validator. Your function is to rigorously validate code, identify potential security vulnerabilities, ensure adherence to quality standards, and suggest testing strategies. Focus on robustness and error handling.',
    model: 'gemini-2.5-pro',
    color: AGENT_COLORS[AgentName.Sentinel],
  },
  {
    name: AgentName.Echo,
    role: 'Synthesizer',
    expertise: ['summarization', 'presentation', 'consensus', 'reporting'],
    systemInstruction: 'You are a Quantum Reporter and Synthesizer. Your responsibility is to summarize key findings, present consolidated solutions, and drive consensus from various agent inputs. Focus on clarity and actionable recommendations.',
    model: 'gemini-2.5-flash',
    color: AGENT_COLORS[AgentName.Echo],
  },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  quantumMode: true,
  hyperthreading: true,
  multiAgentMode: true,
  autoSave: true,
  agentCount: AGENT_CONFIGS.length, // Use all defined agents by default
  maxRounds: 3,
  reasoningDepth: 3,
  ollamaConnected: false, // Default to false, check on startup
};

export const SYNTAX_HIGHLIGHTING_PATTERNS: { [key: string]: { pattern: RegExp; type: string }[] } = {
  javascript: [
    { pattern: /\/\/.*$/gm, type: 'sh-comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, type: 'sh-comment' },
    { pattern: /`(?:\\.|[^`\\])*`/g, type: 'sh-template-string' },
    { pattern: /'(?:\\.|[^'\\])*'/g, type: 'sh-string' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /\/(?![*\/])(?:\\.|[^\/\\\n])+\/[gimuy]*/g, type: 'sh-regex' },
    { pattern: /\b\d+(\.\d+)?\b/g, type: 'sh-number' },
    { pattern: /\b0x[a-fA-F0-9]+\b/g, type: 'sh-number' },
    { pattern: /\b(?:function|class|const|let|var|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|extends|implements|import|export|from|default|async|await|yield|static|public|private|protected|abstract|interface|type|namespace|module|declare|get|set|of|in|instanceof|typeof|void|delete)\b/g, type: 'sh-keyword' },
    { pattern: /\b(?:console|Math|Date|Array|Object|String|Number|Boolean|Symbol|Map|Set|Promise|JSON|RegExp|Error|Function|Proxy|Reflect)\b/g, type: 'sh-type' },
    { pattern: /\b[a-zA-Z_$][\w$]*(?=\s*\()/g, type: 'sh-function' },
    { pattern: /[+\-*/%=<>!&|^~?:.,;]/g, type: 'sh-operator' },
    { pattern: /[{}()[\]<>]/g, type: 'sh-bracket' },
  ],
  typescript: [
    { pattern: /\/\/.*$/gm, type: 'sh-comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, type: 'sh-comment' },
    { pattern: /`(?:\\.|[^`\\])*`/g, type: 'sh-template-string' },
    { pattern: /'(?:\\.|[^'\\])*'/g, type: 'sh-string' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /\/(?![*\/])(?:\\.|[^\/\\\n])+\/[gimuy]*/g, type: 'sh-regex' },
    { pattern: /\b\d+(\.\d+)?\b/g, type: 'sh-number' },
    { pattern: /\b0x[a-fA-F0-9]+\b/g, type: 'sh-number' },
    { pattern: /\b(?:function|class|const|let|var|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|extends|implements|import|export|from|default|async|await|yield|static|public|private|protected|abstract|interface|type|namespace|module|declare|get|set|of|in|instanceof|typeof|void|delete|readonly)\b/g, type: 'sh-keyword' },
    { pattern: /:\s*\w+/g, type: 'sh-type' },
    { pattern: /\b(?:console|Math|Date|Array|Object|String|Number|Boolean|Symbol|Map|Set|Promise|JSON|RegExp|Error|Function|Proxy|Reflect)\b/g, type: 'sh-type' },
    { pattern: /\b[a-zA-Z_$][\w$]*(?=\s*\()/g, type: 'sh-function' },
    { pattern: /[+\-*/%=<>!&|^~?:.,;]/g, type: 'sh-operator' },
    { pattern: /[{}()[\]<>]/g, type: 'sh-bracket' },
  ],
  html: [
    { pattern: /<!--[\s\S]*?-->/g, type: 'sh-comment' },
    { pattern: /<\/?[\w][\w-]*/g, type: 'sh-tag' },
    { pattern: /(?<=<\/?[\w][\w-]*\s+)[\w-]+(?=\s*=)/g, type: 'sh-property' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /'(?:\\.|[^'\\])*'/g, type: 'sh-string' },
    { pattern: /<!DOCTYPE\s+[^>]+>/gi, type: 'sh-keyword' }
  ],
  css: [
    { pattern: /\/\*[\s\S]*?\*\//g, type: 'sh-comment' },
    { pattern: /[.#]?[\w-]+\s*(?={)/g, type: 'sh-css-selector' },
    { pattern: /[\w-]+(?=\s*:)/g, type: 'sh-css-property' },
    { pattern: /:\s*[^;]+/g, type: 'sh-css-value' },
    { pattern: /!important/gi, type: 'sh-keyword' },
    { pattern: /@\w+/g, type: 'sh-keyword' }
  ],
  python: [
    { pattern: /#.*$/gm, type: 'sh-comment' },
    { pattern: /"""(?:.|\n)*?"""/g, type: 'sh-string' },
    { pattern: /'''(?:.|\n)*?'''/g, type: 'sh-string' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /'(?:\\.|[^'\\])*'/g, type: 'sh-string' },
    { pattern: /\b\d+(\.\d+)?\b/g, type: 'sh-number' },
    { pattern: /\b(?:def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|async|await|lambda|None|True|False|and|or|not|in|is|global|nonlocal|del|pass|break|continue|raise)\b/g, type: 'sh-keyword' },
    { pattern: /\b[a-zA-Z_][\w]*(?=\s*\()/g, type: 'sh-function' },
    { pattern: /@\w+/g, type: 'sh-function' }
  ],
  json: [
    { pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/g, type: 'sh-key' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /\b\d+(\.\d+)?\b/g, type: 'sh-number' },
    { pattern: /\b(?:true|false|null)\b/g, type: 'sh-keyword' }
  ],
  xml: [
    { pattern: /<!--[\s\S]*?-->/g, type: 'sh-comment' },
    { pattern: /<\/?[\w][\w-]*/g, type: 'sh-tag' },
    { pattern: /(?<=<\/?[\w][\w-]*\s+)[\w-]+(?=\s*=)/g, type: 'sh-property' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /'(?:\\.|[^'\\])*'/g, type: 'sh-string' }
  ],
  yaml: [
    { pattern: /#.*$/gm, type: 'sh-comment' },
    { pattern: /"(?:\\.|[^"\\])*"/g, type: 'sh-string' },
    { pattern: /'(?:\\.|[^'\\])*'/g, type: 'sh-string' },
    { pattern: /\b\d+(\.\d+)?\b/g, type: 'sh-number' },
    { pattern: /^(?:\s*)[\w-]+(?=\s*:)/gm, type: 'sh-key' },
    { pattern: /\b(?:true|false|null|yes|no|on|off)\b/gi, type: 'sh-keyword' }
  ]
};

// Styling for syntax highlighting (mimicking original CSS)
export const SYNTAX_HIGHLIGHTING_CLASSES: { [key: string]: string } = {
  'sh-comment': 'text-slate-500 italic opacity-80',
  'sh-string': 'text-lime-400 font-medium',
  'sh-number': 'text-amber-500 font-semibold',
  'sh-keyword': 'text-fuchsia-400 font-semibold',
  'sh-type': 'text-sky-300 font-medium',
  'sh-bracket': 'text-purple-400 font-bold',
  'sh-id': 'text-slate-400',
  'sh-op': 'text-slate-400 font-medium',
  'sh-ws': 'opacity-30',
  'sh-key': 'text-sky-300 font-medium',
  'sh-number2': 'text-amber-500 font-semibold',
  'sh-text': 'text-slate-200',
  'sh-unknown': 'text-red-400',
  'sh-tag': 'text-fuchsia-400 font-semibold',
  'sh-property': 'text-sky-300 font-medium',
  'sh-function': 'text-emerald-400 font-medium',
  'sh-operator': 'text-blue-300 font-semibold',
  'sh-regex': 'text-amber-400',
  'sh-html-entity': 'text-amber-500',
  'sh-css-selector': 'text-purple-400',
  'sh-css-property': 'text-blue-500',
  'sh-css-value': 'text-emerald-500',
  'sh-jsx-tag': 'text-fuchsia-400',
  'sh-jsx-attribute': 'text-sky-300',
  'sh-template-string': 'text-lime-400 font-medium',
};

export const DEFAULT_EDITOR_CONTENT = `// Enhanced Quantum Fractal AI Editor - Ready
// Start coding or use the prompt below for AI assistance

function welcome() {
    return "Welcome to the Enhanced Quantum Fractal AI Editor!";
}
`;

export const AGENT_COLOR_MAP: Record<AgentName, string> = {
  [AgentName.Nexus]: 'border-purple-400 text-purple-400',
  [AgentName.Cognito]: 'border-teal-400 text-teal-400',
  [AgentName.Relay]: 'border-amber-300 text-amber-300',
  [AgentName.Sentinel]: 'border-rose-400 text-rose-400',
  [AgentName.Echo]: 'border-emerald-400 text-emerald-400',
};

export const LOG_TYPE_CLASS_MAP: Record<LogType, string> = {
  [LogType.Genesis]: 'border-purple-400 text-purple-400',
  [LogType.Origin]: 'border-teal-400 text-teal-400',
  [LogType.Event]: 'border-amber-300 text-amber-300',
  [LogType.Fragment]: 'border-rose-400 text-rose-400',
  [LogType.Consensus]: 'border-emerald-400 text-emerald-400',
  [LogType.Shim]: 'border-blue-400 text-blue-400',
  [LogType.Info]: 'border-blue-500 text-blue-500',
  [LogType.Warn]: 'border-yellow-500 text-yellow-500',
  [LogType.Error]: 'border-red-500 text-red-500',
  [LogType.Success]: 'border-green-500 text-green-500',
};

export const QUANTUM_COMMAND_SUGGESTIONS = [
  'create a function to sort arrays',
  'optimize this code for performance',
  'add error handling to this function',
  'convert this to TypeScript',
  'explain this code',
  'refactor this code',
  'write unit tests for this function',
  'create a React component',
  'implement a database query',
  'add comments to this code',
  'fix bugs in this code',
  'improve code readability',
  'implement authentication',
  'create API endpoints',
  'optimize database queries',
  'add input validation',
  'implement caching',
  'create documentation',
  'set up logging',
  'handle edge cases'
];

// Custom CSS variables mapped to Tailwind colors for consistency
export const TAILWIND_THEME: Record<string, string> = {
  '--theme-bg': '#3a3c31', // bg-zinc-800
  '--panel': '#313328',    // bg-zinc-700
  '--header-bg': '#2e3026',// bg-zinc-900
  '--status-bg': '#22241e',// bg-zinc-950
  '--accent': '#4ac94a',   // text-emerald-400
  '--muted-text': '#999966',// text-zinc-500
  '--err': '#a03333',      // bg-red-700
  '--warn-bg': '#f0ad4e',  // bg-amber-400
  '--hover-blue': '#3366a0',// bg-blue-700
  '--info-bg': '#5bc0de',  // bg-cyan-500
  '--agent-nexus': '#BB86FC', // text-purple-400
  '--agent-cognito': '#03DAC6', // text-teal-400
  '--agent-relay': '#FFD54F', // text-amber-300
  '--agent-sentinel': '#CF6679', // text-rose-400
  '--agent-echo': '#4ac94a', // text-emerald-400
  '--quantum-glow': 'rgba(187, 134, 252, 0.6)', // purple-400 with opacity
};

export const MEMORY_STATUS_CLASSES: Record<string, string> = {
  'good': 'bg-emerald-700/10 text-emerald-400',
  'warning': 'bg-amber-700/10 text-amber-400',
  'low': 'bg-red-700/10 text-red-400',
};

export const BUTTON_CLASSES: Record<string, string> = {
  'default': 'bg-red-700 border border-red-700 text-gray-50 hover:bg-blue-700 hover:border-blue-700',
  'success': 'bg-emerald-600 border border-emerald-600 text-gray-50 hover:bg-blue-700 hover:border-blue-700',
  'info': 'bg-cyan-600 border border-cyan-600 text-gray-50 hover:bg-blue-700 hover:border-blue-700',
  'warn': 'bg-amber-400 border border-amber-400 text-zinc-900 hover:bg-blue-700 hover:border-blue-700 hover:text-gray-50',
  'nexus': 'bg-purple-600 border border-purple-600 text-gray-50 hover:bg-blue-700 hover:border-blue-700',
};
