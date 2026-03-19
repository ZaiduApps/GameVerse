import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeMarkdownInput = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return String(value);
};

const isHttpsUrl = (value: string): boolean => /^https:\/\//i.test(value.trim());
const isAcboxUrl = (value: string): boolean => /^acbox:\/\//i.test(value.trim());
const isAppDeepLink = (value: string): boolean =>
  /^(acbox|uu-mobile):\/\//i.test(value.trim());

const preprocessHtmlImageAsMarkdown = (raw: string): string =>
  raw
    .replace(
      /<p[^>]*class=["']defined-image["'][^>]*>\s*<img[^>]*src=["']([^"']+)["'][^>]*>\s*<\/p>/gi,
      (_m, src) => `![](${src})`,
    )
    .replace(
      /<img[^>]*src=["']([^"']+)["'][^>]*>/gi,
      (_m, src) => `![](${src})`,
    );

const preprocessCodeLinkAsQuote = (raw: string): string =>
  raw.replace(
    /<p[^>]*class=["'][^"']*code-link[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi,
    (_m, inner) => {
      const text = String(inner || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?span[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (!text) return "";
      return text
        .split("\n")
        .map((line) => `> ${line.trim()}`)
        .join("\n");
    },
  );

const preprocessPartingLine = (raw: string): string =>
  raw.replace(
    /<p[^>]*class=["'][^"']*parting-line[^"']*["'][^>]*>\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?\s*<\/p>/gi,
    (_m, inner) => {
      const text = String(inner || "")
        .replace(/<[^>]+>/g, "")
        .trim();
      return text ? `---\n${text}` : "---";
    },
  );

const renderSafeLink = (label: string, urlRaw: string): string => {
  const url = urlRaw.trim();
  if (isHttpsUrl(url)) {
    return `<a href="${url}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
  if (isAppDeepLink(url)) {
    return `<a href="#" data-app-link="${url}" class="text-primary hover:underline">${label}</a>`;
  }
  return `<span class="text-muted-foreground">${label} (${url})</span>`;
};

const renderSafeImage = (alt: string, urlRaw: string): string => {
  const url = urlRaw.trim();
  if (!isHttpsUrl(url)) {
    return `<span class="text-muted-foreground">[图片链接已拦截: ${url}]</span>`;
  }
  return `<img alt="${alt}" src="${url}" class="rounded-lg my-4 max-w-full h-auto" />`;
};

export const renderMarkdown = (input: unknown): { __html: string } => {
  try {
    const raw = normalizeMarkdownInput(input);
    if (!raw.trim()) return { __html: "" };

    const preprocessed = preprocessPartingLine(
      preprocessCodeLinkAsQuote(
        preprocessHtmlImageAsMarkdown(raw.replace(/\r\n?/g, "\n")),
      ),
    );

    let html = escapeHtml(preprocessed)
      .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold my-2">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-4 border-b pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-5 border-b pb-3">$1</h1>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (_m, alt, src) => renderSafeImage(alt, src))
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_m, label, target) => {
        const rawTarget = String(target || '').trim();
        const urlOnly = rawTarget.split(/\s+/)[0] || rawTarget;
        return renderSafeLink(label, urlOnly);
      })
      .replace(
        /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/gim,
        (_m, lang, code) =>
          `<pre class="bg-muted p-3 rounded-md text-sm my-4 overflow-x-auto"><code${lang ? ` class="language-${lang}"` : ""}>${code}</code></pre>`,
      )
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-1 rounded-sm text-sm">$1</code>')
      .replace(
        /^&gt;\s*#### (.*$)/gim,
        '<blockquote class="border-l-4 border-primary bg-primary/10 pl-4 py-2 my-4 rounded-r-md text-foreground/90"><h4 class="text-lg font-semibold my-1">$1</h4></blockquote>',
      )
      .replace(
        /^&gt;\s*### (.*$)/gim,
        '<blockquote class="border-l-4 border-primary bg-primary/10 pl-4 py-2 my-4 rounded-r-md text-foreground/90"><h3 class="text-xl font-semibold my-1">$1</h3></blockquote>',
      )
      .replace(
        /^&gt;\s*## (.*$)/gim,
        '<blockquote class="border-l-4 border-primary bg-primary/10 pl-4 py-2 my-4 rounded-r-md text-foreground/90"><h2 class="text-2xl font-bold my-1">$1</h2></blockquote>',
      )
      .replace(
        /^&gt;\s*# (.*$)/gim,
        '<blockquote class="border-l-4 border-primary bg-primary/10 pl-4 py-2 my-4 rounded-r-md text-foreground/90"><h1 class="text-3xl font-bold my-1">$1</h1></blockquote>',
      )
      .replace(
        /^&gt; (.*$)/gim,
        '<blockquote class="border-l-4 border-primary bg-primary/10 pl-4 py-2 my-4 rounded-r-md text-foreground/90">$1</blockquote>',
      )
      .replace(/^---$/gim, '<hr class="my-6" />');

    const tableRegex = /\|(.+)\|\n\|( *[-:]+ *\|)+([\s\S]*?)(?=\n\n|$)/g;
    html = html.replace(tableRegex, (match) => {
      const rows = match.trim().split("\n");
      const headerCells = rows[0].split("|").map((h) => h.trim()).filter(Boolean);

      let tableHtml =
        '<div class="overflow-x-auto my-4"><table class="w-full text-left border-collapse"><thead><tr>';
      headerCells.forEach((h) => {
        tableHtml += `<th class="border p-2 bg-muted font-semibold">${h}</th>`;
      });
      tableHtml += "</tr></thead><tbody>";

      rows.slice(2).forEach((rowLine) => {
        const cells = rowLine.split("|").map((c) => c.trim()).slice(1, -1);
        if (cells.length === headerCells.length) {
          tableHtml += "<tr>";
          cells.forEach((cell) => {
            tableHtml += `<td class="border p-2">${cell}</td>`;
          });
          tableHtml += "</tr>";
        }
      });
      tableHtml += "</tbody></table></div>";
      return tableHtml;
    });

    const lines = html.split("\n").filter((line) => line.trim() !== "");
    let finalHtml = "";
    let inUnorderedList = false;
    let inOrderedList = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<div class="overflow-x-auto')) {
        if (inUnorderedList) {
          finalHtml += "</ul>";
          inUnorderedList = false;
        }
        if (inOrderedList) {
          finalHtml += "</ol>";
          inOrderedList = false;
        }
        finalHtml += trimmed;
        return;
      }

      const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (unorderedMatch) {
        if (inOrderedList) {
          finalHtml += "</ol>";
          inOrderedList = false;
        }
        if (!inUnorderedList) {
          finalHtml += '<ul class="list-disc list-inside my-2 space-y-1">';
          inUnorderedList = true;
        }
        finalHtml += `<li>${unorderedMatch[1]}</li>`;
        return;
      }

      const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (orderedMatch) {
        if (inUnorderedList) {
          finalHtml += "</ul>";
          inUnorderedList = false;
        }
        if (!inOrderedList) {
          finalHtml += '<ol class="list-decimal list-inside my-2 space-y-1">';
          inOrderedList = true;
        }
        finalHtml += `<li>${orderedMatch[1]}</li>`;
        return;
      }

      if (inUnorderedList) {
        finalHtml += "</ul>";
        inUnorderedList = false;
      }
      if (inOrderedList) {
        finalHtml += "</ol>";
        inOrderedList = false;
      }

      if (!trimmed.startsWith("<")) {
        finalHtml += `<p class="my-2">${trimmed}</p>`;
      } else {
        finalHtml += trimmed;
      }
    });

    if (inUnorderedList) finalHtml += "</ul>";
    if (inOrderedList) finalHtml += "</ol>";

    return { __html: finalHtml };
  } catch {
    const fallback = escapeHtml(normalizeMarkdownInput(input));
    return { __html: fallback ? `<p class="my-2">${fallback}</p>` : "" };
  }
};
