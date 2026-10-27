import { escapeHTML } from './escapeHtml.js';

export function formatEventDescription(desc) {
  if (!desc) return '';
  const lines = String(desc).split(/\r?\n/);
  
  let html = [];
  let inList = false;

  function formatInline(text) {
    let escaped = escapeHTML(text);
    
    // Markdown bold: **text** or __text__
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Markdown italic: *text* or _text_
    escaped = escaped.replace(/(^|[^\*])\*([^\*]+?)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    escaped = escaped.replace(/(^|[^_])_([^_]+?)_([^_]|$)/g, '$1<em>$2</em>$3');

    // Remove any leftover stray asterisks
    escaped = escaped.replace(/\*{1,3}/g, '');

    // Auto-bold key in "Key: Value" if not already bolded
    if (!escaped.includes('<strong>')) {
      escaped = escaped.replace(/^([A-Za-z0-9\s/&()–-]+?):(\s+|$)/, '<strong>$1:</strong>$2');
    }
    
    // Convert markdown links: [Label](url)
    escaped = escaped.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="desc-link">$1</a>'
    );

    // Clickable URLs: http:// or https:// (not inside an already created href)
    escaped = escaped.replace(
      /(^|[^">])(https?:\/\/[^\s<]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="desc-link">$2</a>'
    );
    
    return escaped;
  }
  
  for (let line of lines) {
    const trimmed = line.trim();
    // Match bullet points starting with -, *, +, or • followed by optional spaces
    const listMatch = trimmed.match(/^([-\*\+•])\s*(.+)$/);
    
    if (listMatch) {
      if (!inList) {
        html.push('<ul class="modal-desc-list">');
        inList = true;
      }
      html.push(`<li>${formatInline(listMatch[2])}</li>`);
    } else {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        html.push('<div class="desc-empty-line" style="height: 6px;"></div>');
      } else {
        html.push(`<p class="desc-text-line">${formatInline(line)}</p>`);
      }
    }
  }
  if (inList) {
    html.push('</ul>');
  }
  return html.join('');
}
