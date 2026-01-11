import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const renderMarkdown = (text: string) => {
    if (!text) return { __html: '' };

    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-4 border-b pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-5 border-b pb-3">$1</h1>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" class="rounded-lg my-4 max-w-full h-auto" />')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/```bash\n([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md text-sm my-4 overflow-x-auto"><code class="language-bash">$1</code></pre>')
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md text-sm my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-1 rounded-sm text-sm">$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>')
      .replace(/^---$/gim, '<hr class="my-6" />');

    // Process tables
    const tableRegex = /\|(.+)\|\n\|( *[-:]+ *\|)+([\s\S]*?)(?=\n\n|^\s*$)/g;
    html = html.replace(tableRegex, (match) => {
        const rows = match.trim().split('\n');
        const headerCells = rows[0].split('|').map(h => h.trim()).filter(Boolean);
        
        let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full text-left border-collapse">';
        
        // Header
        tableHtml += '<thead><tr>';
        headerCells.forEach(h => {
            tableHtml += `<th class="border p-2 bg-muted font-semibold">${h}</th>`;
        });
        tableHtml += '</tr></thead>';

        // Body
        tableHtml += '<tbody>';
        const bodyRows = rows.slice(2); // Skip header and separator
        bodyRows.forEach(rowLine => {
            const cells = rowLine.split('|').map(c => c.trim()).slice(1, -1); // Remove first and last empty strings
            if(cells.length === headerCells.length) {
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    // This will render markdown inside cells, e.g., **bold**
                    const cellContent = cell
                        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/gim, '<em>$1</em>');
                    tableHtml += `<td class="border p-2">${cellContent}</td>`;
                });
                tableHtml += '</tr>';
            }
        });
        tableHtml += '</tbody></table></div>';
        
        return tableHtml;
    });

    const lines = html.split('\n').filter(line => line.trim() !== '');
    let finalHtml = '';
    let inList = false;

    lines.forEach(line => {
      // Skip lines that have been converted to tables
      if (line.startsWith('<div class="overflow-x-auto')) {
          finalHtml += line;
          return;
      }
      
      if (line.trim().startsWith('* ')) {
          if (!inList) {
              finalHtml += '<ul class="list-disc list-inside my-2 space-y-1">';
              inList = true;
          }
          finalHtml += `<li>${line.substring(line.indexOf('* ') + 2)}</li>`;
      } else {
          if (inList) {
              finalHtml += '</ul>';
              inList = false;
          }
          // Avoid wrapping already converted HTML blocks in <p> tags
          if (!line.startsWith('<')) {
              finalHtml += `<p class="my-2">${line}</p>`;
          } else {
              finalHtml += line;
          }
      }
    });

    if (inList) {
        finalHtml += '</ul>';
    }

    // This is to avoid paragraphs for lines that are part of a table that wasn't at the start of the string
    finalHtml = finalHtml.replace(/<p>(\s*<div class="overflow-x-auto my-4"><table.*<\/table><\/div>\s*)<\/p>/gs, '$1');


    return { __html: finalHtml };
};
