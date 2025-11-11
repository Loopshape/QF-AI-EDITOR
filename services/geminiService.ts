

import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from '@google/genai';
import { AgentConfig, AgentName, LogEntry, LogType, GeminiContentPart, CandidateResult, ConsensusResult, AIStudio } from '../types';
import { AGENT_CONFIGS } from '../constants';

// Declare window.aistudio for API key selection for Veo models
// The global declaration for `window.aistudio` is now in `types.ts`

// Utility function to get a fresh API key or ensure one is selected
const getGeminiClient = async () => {
  if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.hasSelectedApiKey === 'function') {
    let hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // Assume success after opening dialog to prevent race condition.
      // Actual key availability will be through process.env.API_KEY
    }
  }
  // Always create a new GoogleGenAI instance right before making an API call
  // to ensure it uses the most up-to-date API key from the dialog.
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateCode = async (
  prompt: string,
  context: string,
  model: string,
  systemInstruction: string,
  config?: Partial<GenerateContentParameters['config']>
): Promise<string> => {
  try {
    const ai = await getGeminiClient();
    
    const contents: GeminiContentPart[] = [
      { text: `Current code context:\n\`\`\`\n${context}\n\`\`\`\n` },
      { text: `User request: ${prompt}` },
      { text: 'Please provide a comprehensive and robust code solution or refinement based on the request and context.' }
    ];

    const generateConfig: GenerateContentParameters['config'] = {
      ...config,
      systemInstruction: systemInstruction,
      maxOutputTokens: 2000, // Reasonable default, adjust if needed
      thinkingConfig: { thinkingBudget: 500 }, // Allocate thinking tokens for complex tasks
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: contents },
      config: generateConfig,
    });

    if (response.text) {
      return response.text;
    } else {
      console.warn('Gemini API response did not contain text:', response);
      return 'No text response from AI. Please try again or refine your prompt.';
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    if (error.message.includes("Requested entity was not found.")) {
      // API key might be invalid or not selected. Prompt user again.
      if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      }
      return `Gemini API Error: ${error.message}. Please select your API key and try again.`;
    }
    return `Gemini API Error: ${error.message || 'Unknown error'}`;
  }
};

export const runMultiAgentOrchestration = async (
  prompt: string,
  code: string,
  logAgentActivity: (agentName: AgentName, logEntry: LogEntry) => void,
  agentCount: number,
  maxRounds: number,
  reasoningDepth: number
): Promise<ConsensusResult> => {
  const activeAgents = AGENT_CONFIGS.slice(0, agentCount);
  const allFragments: CandidateResult[] = [];

  logAgentActivity(AgentName.Nexus, {
    timestamp: new Date().toLocaleTimeString(),
    message: `Initiating multi-agent orchestration for '${prompt.substring(0, 50)}...'`,
    type: LogType.Genesis,
  });

  for (let round = 0; round < maxRounds; round++) {
    logAgentActivity(AgentName.Nexus, {
      timestamp: new Date().toLocaleTimeString(),
      message: `--- Collaboration Round ${round + 1}/${maxRounds} ---`,
      type: LogType.Event,
    });

    const roundPromises = activeAgents.map(async (agent) => {
      logAgentActivity(agent.name, {
        timestamp: new Date().toLocaleTimeString(),
        message: `Thinking (Round ${round + 1}, Depth ${reasoningDepth})...`,
        type: LogType.Origin,
      });

      const agentPrompt = `
        You are ${agent.role} (Agent: ${agent.name}). Your expertise includes: ${agent.expertise.join(', ')}.
        ${agent.systemInstruction}

        The user's primary request is: "${prompt}".
        Here is the current code context:
        \`\`\`
        ${code}
        \`\`\`

        Based on your role and expertise, analyze the request and the code, and propose a solution or refinement.
        Be concise but comprehensive. Focus on the core aspects of your specialization.
        Consider previous discussions if any (though this is the initial phase).
        Output ONLY the code or detailed text relevant to your solution, without conversational filler.
      `;

      try {
        const response = await generateCode(
          agentPrompt,
          code,
          agent.model,
          agent.systemInstruction,
          { thinkingConfig: { thinkingBudget: reasoningDepth * 100 } }
        );

        const entropy = calculateEntropy(response); // Simulate entropy based on response complexity

        const candidate: CandidateResult = {
          agentId: agent.name,
          candidate: response,
          score: Math.random() * 100, // Simulate score
          entropy: entropy,
          specialization: agent.role,
          collaborative: Math.random() > 0.7, // Simulate collaboration
        };
        allFragments.push(candidate);

        logAgentActivity(agent.name, {
          timestamp: new Date().toLocaleTimeString(),
          message: `Generated fragment (Entropy: ${entropy.toFixed(3)})`,
          type: LogType.Fragment,
        });

        return candidate;
      } catch (err: any) {
        logAgentActivity(agent.name, {
          timestamp: new Date().toLocaleTimeString(),
          message: `Error during reasoning: ${err.message}`,
          type: LogType.Error,
        });
        return null;
      }
    });

    await Promise.all(roundPromises);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate round break
  }

  logAgentActivity(AgentName.Nexus, {
    timestamp: new Date().toLocaleTimeString(),
    message: 'All agents completed their reasoning cycles.',
    type: LogType.Event,
  });

  const consensus = formAdvancedConsensus(allFragments, logAgentActivity);

  logAgentActivity(AgentName.Echo, {
    timestamp: new Date().toLocaleTimeString(),
    message: `Consensus achieved with score: ${consensus.score.toFixed(2)}`,
    type: LogType.Consensus,
  });

  return consensus;
};

// Simplified entropy calculation for demonstration
const calculateEntropy = (text: string): number => {
  if (!text) return 0;
  const charCounts: { [key: string]: number } = {};
  for (const char of text) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }

  let entropy = 0;
  const length = text.length;

  for (const char in charCounts) {
    const probability = charCounts[char] / length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy / 8; // Normalize to a smaller range
};

const formAdvancedConsensus = (
  fragments: CandidateResult[],
  logAgentActivity: (agentName: AgentName, logEntry: LogEntry) => void
): ConsensusResult => {
  if (fragments.length === 0) {
    return {
      bestCandidate: 'No agents provided a solution.',
      metaConsensus: '',
      score: 0,
      metrics: { coverage: 0, avgClusterScore: 0, scoreVariance: 0, clusterCount: 0, consensusStrength: 0 },
      diversity: 0,
      collaboration: 0,
      agentCount: 0,
      roundCount: 0,
      avgEntropy: 0,
    };
  }

  logAgentActivity(AgentName.Echo, {
    timestamp: new Date().toLocaleTimeString(),
    message: `Analyzing ${fragments.length} candidate fragments for consensus...`,
    type: LogType.Consensus,
  });

  // Simple consensus: select the fragment with the highest 'score' (simulated here)
  // In a real scenario, this would involve more sophisticated clustering and merging
  let bestFragment = fragments.reduce((prev, current) => (prev.score > current.score ? prev : current));

  // Meta-consensus: combine top N fragments or a simple concatenation
  const sortedFragments = [...fragments].sort((a, b) => b.score - a.score);
  const topFragments = sortedFragments.slice(0, Math.min(5, sortedFragments.length));
  const metaConsensus = topFragments.map((f) => `// Agent ${f.agentId} contribution:\n${f.candidate}`).join('\n\n');

  // Simulate metrics
  const totalAgents = new Set(fragments.map((f) => f.agentId)).size;
  const avgEntropy = fragments.reduce((sum, f) => sum + f.entropy, 0) / fragments.length;
  const diversity = fragments.length > 1 ? calculateEntropy(fragments.map((f) => f.specialization).join('')) / AGENT_CONFIGS.length : 0;
  const collaboration = fragments.filter((f) => f.collaborative).length / fragments.length;

  return {
    bestCandidate: bestFragment.candidate,
    metaConsensus: metaConsensus,
    score: bestFragment.score,
    metrics: {
      coverage: fragments.length / (AGENT_CONFIGS.length * 3), // Example metric
      avgClusterScore: bestFragment.score,
      scoreVariance: 0.1, // Placeholder
      clusterCount: Math.ceil(fragments.length / 2), // Placeholder
      consensusStrength: bestFragment.score / 100, // Placeholder
    },
    diversity: diversity,
    collaboration: collaboration,
    agentCount: totalAgents,
    roundCount: 3, // Assuming 3 rounds from input
    avgEntropy: avgEntropy,
  };
};
