
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // This file will contain the custom CSS variables mapped to Tailwind or global styles

// Custom CSS for animations and variable definitions
const globalStyles = `
/* Global CSS variables to allow Tailwind to consume them via custom properties */
:root {
    --muted: #888;
    --info: #2196F3;
    --warn: #FF9800;
    --error: #F44336;
    --success: #4CAF50;
    --baseline: 1.5em;
    --header-h: calc(var(--baseline) * 1.6);
    --status-h: var(--baseline);
    --footer-h: calc(var(--baseline) * 2);
    --font-size: 13px;
    --ln-width: 50px;
    --theme-bg: #3a3c31;
    --panel: #313328;
    --header-bg: #2e3026;
    --status-bg: #22241e;
    --accent: #4ac94a;
    --muted-text: #999966;
    --err: #a03333;
    --warn-bg: #f0ad4e;
    --hover-blue: #3366a0;
    --info-bg: #5bc0de;
    --agent-nexus: #BB86FC;
    --agent-cognito: #03DAC6;
    --agent-relay: #FFD54F;
    --agent-sentinel: #CF6679;
    --agent-echo: #4ac94a;
    --quantum-glow: rgba(187, 134, 252, 0.6);
}

/* Base styles for the dark, futuristic theme */
html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: 'Fira Code', monospace;
    font-size: var(--font-size);
    line-height: var(--baseline);
    background: var(--theme-bg);
    color: #f0f0e0;
    overflow: hidden;
}

/* Animations from original CSS */
@keyframes quantumScan {
    0% { left: -100%; }
    100% { left: 100%; }
}

.animate-quantum-scan {
    animation: quantumScan 3s infinite linear;
}

@keyframes quantumPulse {
    0% { opacity: 0.7; transform: scale(1); }
    100% { opacity: 1; transform: scale(1.05); }
}

.animate-pulse-quantum {
    animation: quantumPulse 2s infinite alternate;
}

@keyframes threadFlow {
    0% { top: -100%; }
    100% { top: 100%; }
}

.animate-thread-flow {
    animation: threadFlow 2s infinite linear;
}

@keyframes fractalPulse {
    0% { transform: scale(1); opacity: 0.3; }
    100% { transform: scale(1.5); opacity: 0.8; }
}

.fractal-node.animate-ping { /* Using Tailwind's ping, or custom if needed */
    animation: fractalPulse 1.5s infinite alternate;
}

@keyframes pulse-once-on-active {
    0% { left: -100%; opacity: 0; }
    50% { left: 0%; opacity: 1; }
    100% { left: 100%; opacity: 0; }
}

.agent-card.active .animate-pulse-once-on-active {
    animation: pulse-once-on-active 0.5s ease-out forwards;
}

/* Ensure editor content inherits font and line height */
.editor-content {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
}
`;

// Inject global styles
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = globalStyles;
document.head.appendChild(styleSheet);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
