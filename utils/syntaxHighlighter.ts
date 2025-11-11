
import { SYNTAX_HIGHLIGHTING_PATTERNS, SYNTAX_HIGHLIGHTING_CLASSES } from '../constants';

class QuantumSyntaxHighlighter {
  private currentLanguage: string = 'javascript';

  public detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'html': 'html', 'htm': 'html', 'css': 'css', 'py': 'python',
      'php': 'javascript', 'sql': 'javascript', 'md': 'markdown', 'json': 'json',
      'txt': 'javascript', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml'
    };
    return languageMap[ext || ''] || 'javascript';
  }

  public setLanguage(language: string): void {
    this.currentLanguage = language;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public highlightText(text: string, language: string | null = null): string {
    const lang = language || this.currentLanguage;
    const patterns = SYNTAX_HIGHLIGHTING_PATTERNS[lang] || SYNTAX_HIGHLIGHTING_PATTERNS.javascript;

    let highlighted = this.escapeHtml(text);

    // Sort patterns by length of regex to apply longer matches first (e.g., keywords before identifiers)
    // This isn't perfect for all cases but helps.
    patterns.sort((a, b) => b.pattern.source.length - a.pattern.source.length);

    patterns.forEach(({ pattern, type }) => {
      // Use a replacer function that ensures we don't re-highlight already highlighted parts
      highlighted = highlighted.replace(pattern, (match: string) => {
        // Only wrap if it's not already wrapped in a highlight span
        if (!match.includes('<span class="sh-')) {
          return `<span class="${type}">${match}</span>`;
        }
        return match;
      });
    });

    // Replace newlines with <br> for proper rendering in contenteditable
    highlighted = highlighted.replace(/\n/g, '<br>');

    return highlighted;
  }

  public applyHighlightingToElement(element: HTMLElement, language: string | null = null): void {
    const textContent = element.textContent || '';
    const initialSelection = window.getSelection();
    let range: Range | null = null;

    if (initialSelection && initialSelection.rangeCount > 0) {
      range = initialSelection.getRangeAt(0).cloneRange();
    }

    const highlightedHtml = this.highlightText(textContent, language);
    element.innerHTML = highlightedHtml;

    if (range && initialSelection) {
      // Restore cursor position. This is tricky with contenteditable and HTML changes.
      // A full solution involves tracking character offsets, but for a simple highlight,
      // we'll try to re-apply the range to the (potentially new) text nodes.
      try {
        initialSelection.removeAllRanges();
        initialSelection.addRange(range);
      } catch (e) {
        // Fallback: just put cursor at the end
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        newRange.collapse(false); // to the end
        initialSelection.removeAllRanges();
        initialSelection.addRange(newRange);
      }
    }
  }

  public getTailwindClasses(className: string): string {
    return SYNTAX_HIGHLIGHTING_CLASSES[className] || 'text-slate-200'; // Default text color
  }
}

export const quantumSyntaxHighlighter = new QuantumSyntaxHighlighter();
