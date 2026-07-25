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

const escapeHtmlAttribute = (text: string): string =>
  String(text || "")
    .replace(
      /&(?!amp;|lt;|gt;|quot;|apos;|#39;|#x27;|#\d+;|#x[0-9a-f]+;)/gi,
      "&amp;",
    )
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
const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());
const hasMalformedPercentEncoding = (value: string): boolean =>
  /%(?![0-9a-fA-F]{2})/.test(value);
const isSafeSiteRelativeUrl = (value: string): boolean => {
  const url = value.trim();
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) {
    return false;
  }
  if (hasMalformedPercentEncoding(url) || /[\u0000-\u001F\u007F\s<>"']/.test(url)) {
    return false;
  }
  try {
    decodeURI(url);
    return true;
  } catch {
    return false;
  }
};
const isSafeHttpUrl = (value: string): boolean => {
  const url = value.trim();
  if (!isHttpUrl(url) || hasMalformedPercentEncoding(url)) return false;
  try {
    decodeURI(url);
    if (typeof URL !== "undefined") {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    return /^https?:\/\/[^/?#:\s]+(?::\d+)?(?:[/?#]|$)/i.test(url);
  } catch {
    return false;
  }
};
const isSafeHttpsUrl = (value: string): boolean =>
  isHttpsUrl(value) && isSafeHttpUrl(value);
const isAcboxUrl = (value: string): boolean => /^acbox:\/\//i.test(value.trim());
const isAppDeepLink = (value: string): boolean =>
  /^(acbox|uu-mobile):\/\//i.test(value.trim());

interface RenderMarkdownOptions {
  blockedLinkHosts?: string[];
  preset?: "default" | "detail";
  injectHeadingAnchors?: boolean;
  renderFirstHeadingMatchingTextAsPlainBlock?: string;
  hiddenHeadingTexts?: string[];
}

export interface MarkdownHeadingItem {
  id: string;
  text: string;
  level: number;
  source: "heading" | "inferred";
}

export interface RenderedMarkdownDocument {
  html: string;
  headings: MarkdownHeadingItem[];
}

type MarkdownClassPreset = "default" | "detail";

type MarkdownTokenMap = Map<string, string>;

interface MarkdownClassSet {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  paragraph: string;
  unorderedList: string;
  unorderedListItem: string;
  orderedList: string;
  orderedListItem: string;
  blockquote: string;
  quoteH1: string;
  quoteH2: string;
  quoteH3: string;
  quoteH4: string;
  hr: string;
  link: string;
  appLink: string;
  blockedLink: string;
  invalidLink: string;
  codeBlock: string;
  inlineCode: string;
  tableWrap: string;
  table: string;
  tableRow: string;
  tableHeaderCell: string;
  tableBodyCell: string;
  image: string;
}

const MARKDOWN_CLASS_SETS: Record<MarkdownClassPreset, MarkdownClassSet> = {
  default: {
    h1: "text-3xl font-bold my-5 border-b pb-3",
    h2: "text-2xl font-bold my-4 border-b pb-2",
    h3: "text-xl font-semibold my-3",
    h4: "text-lg font-semibold my-2",
    paragraph: "my-2",
    unorderedList: "list-disc list-inside my-2 space-y-1",
    unorderedListItem: "",
    orderedList: "list-decimal list-inside my-2 space-y-1",
    orderedListItem: "",
    blockquote: "border-l-4 border-primary bg-primary/10 pl-4 py-2 my-4 rounded-r-md text-foreground/90",
    quoteH1: "text-3xl font-bold my-1",
    quoteH2: "text-2xl font-bold my-1",
    quoteH3: "text-xl font-semibold my-1",
    quoteH4: "text-lg font-semibold my-1",
    hr: "my-6",
    link: "text-primary hover:underline",
    appLink: "text-primary hover:underline",
    blockedLink: "text-foreground/90",
    invalidLink: "text-muted-foreground",
    codeBlock: "bg-muted p-3 rounded-md text-sm my-4 overflow-x-auto",
    inlineCode: "bg-muted px-1.5 py-1 rounded-sm text-sm",
    tableWrap: "overflow-x-auto my-4",
    table: "w-full text-left border-collapse",
    tableRow: "",
    tableHeaderCell: "border p-2 bg-muted font-semibold",
    tableBodyCell: "border p-2",
    image: "block mx-auto w-full max-w-[600px] max-h-[44vh] sm:max-h-[52vh] h-auto rounded-lg mt-5 mb-8 sm:mt-7 sm:mb-10",
  },
  detail: {
    h1: "mt-8 mb-5 text-3xl font-semibold tracking-[0.01em] text-foreground sm:text-[2rem]",
    h2: "relative mt-8 mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-primary/[0.12] via-accent/[0.05] to-transparent px-4 py-3 pl-6 text-2xl font-semibold text-foreground sm:px-5 sm:pl-7 sm:text-[1.7rem] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-full before:bg-primary/75 before:content-['']",
    h3: "relative mt-6 mb-4 overflow-hidden rounded-lg bg-muted/45 px-3.5 py-2.5 pl-5 text-xl font-semibold text-foreground sm:text-[1.35rem] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-full before:bg-accent/70 before:content-['']",
    h4: "relative mt-5 mb-3 overflow-hidden rounded-md bg-primary/[0.05] px-3 py-2 pl-5 text-lg font-semibold text-foreground/95 sm:text-[1.12rem] before:absolute before:left-2 before:top-1/2 before:h-4 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-primary/65 before:content-['']",
    paragraph: "my-3 leading-8 text-foreground/90",
    unorderedList: "my-4 list-none space-y-3 pl-0",
    unorderedListItem: "relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/[0.08] via-accent/[0.04] to-transparent px-4 py-3 pl-6 leading-7 text-foreground/90 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-primary/55 before:content-[''] after:absolute after:left-2.5 after:top-[1.2rem] after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary/80 after:content-['']",
    orderedList: "my-4 list-decimal space-y-2 pl-6 leading-8 text-foreground/90 marker:font-semibold marker:text-primary/75",
    orderedListItem: "pl-1",
    blockquote: "relative my-5 overflow-hidden rounded-r-xl bg-gradient-to-r from-accent/[0.08] via-muted/55 to-transparent px-4 py-3 pl-5 leading-7 text-foreground/85 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-full before:bg-accent/65 before:content-['']",
    quoteH1: "text-2xl font-semibold text-foreground",
    quoteH2: "text-xl font-semibold text-foreground",
    quoteH3: "text-lg font-semibold text-foreground",
    quoteH4: "text-base font-semibold text-foreground",
    hr: "my-8 h-px rounded-full bg-gradient-to-r from-transparent via-primary/25 to-transparent",
    link: "text-primary underline decoration-primary/45 underline-offset-4 transition-colors hover:text-primary/80",
    appLink: "text-primary underline decoration-primary/45 underline-offset-4 transition-colors hover:text-primary/80",
    blockedLink: "text-foreground/90",
    invalidLink: "text-muted-foreground",
    codeBlock: "my-5 overflow-x-auto rounded-lg bg-muted/70 px-4 py-3 text-[13px] leading-6 text-foreground/90",
    inlineCode: "rounded bg-muted/80 px-1.5 py-[2px] text-[0.9em] text-foreground",
    tableWrap: "my-5 overflow-x-auto",
    table: "w-full min-w-[420px] text-left text-sm text-foreground/90",
    tableRow: "odd:bg-muted/[0.16]",
    tableHeaderCell: "bg-muted/65 px-3 py-2.5 font-semibold text-foreground",
    tableBodyCell: "px-3 py-2.5 align-top",
    image: "mt-7 mb-10 block h-auto max-h-[48vh] w-full max-w-[680px] rounded-xl bg-muted/20 object-contain sm:mt-9 sm:mb-12 sm:max-h-[56vh]",
  },
};

const resolveMarkdownClassSet = (
  preset?: MarkdownClassPreset,
): MarkdownClassSet =>
  MARKDOWN_CLASS_SETS[preset === "detail" ? "detail" : "default"];

const parseHostname = (url: string): string => {
  try {
    return new URL(url).hostname.trim().toLowerCase();
  } catch {
    const match = String(url || "").match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#:]+)/i);
    return String(match?.[1] || "").trim().toLowerCase();
  }
};

const isBlockedLinkHost = (
  host: string,
  blockedHosts: ReadonlySet<string>,
): boolean => {
  const normalizedHost = String(host || "").trim().toLowerCase();
  if (!normalizedHost) return false;
  for (const blockedHost of blockedHosts) {
    if (!blockedHost) continue;
    if (
      normalizedHost === blockedHost ||
      normalizedHost.endsWith(`.${blockedHost}`)
    ) {
      return true;
    }
  }
  return false;
};

const preprocessHtmlImageAsMarkdown = (raw: string): string => {
  let result = raw.replace(
    /<p[^>]*class=["']defined-image["'][^>]*>\s*<img([^>]*)>\s*<\/p>/gi,
    (_m, imgAttrs) => {
      const src = imgAttrs.match(/src=["']([^"']+)["']/i)?.[1] || '';
      const alt = imgAttrs.match(/alt=["']([^"']*)["']/i)?.[1] || '';
      return `![${alt}](${src})`;
    },
  );
  result = result.replace(
    /<img([^>]*)>/gi,
    (_m, imgAttrs) => {
      const src = imgAttrs.match(/src=["']([^"']+)["']/i)?.[1] || '';
      const alt = imgAttrs.match(/alt=["']([^"']*)["']/i)?.[1] || '';
      if (!src) return _m;
      return `![${alt}](${src})`;
    },
  );
  return result;
};

const preprocessHtmlHeadings = (raw: string): string =>
  raw.replace(
    /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, level, inner) => {
      const text = String(inner || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) return "";
      return `${"#".repeat(Number(level))} ${text}`;
    },
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

const preprocessBareAutolinks = (raw: string): string =>
  raw.replace(/<((?:https?:\/\/)[^\s<>]+)>/gi, "$1");

const normalizeBareMarkdownUrl = (rawUrl: string): { tail: string; url: string } => {
  let url = String(rawUrl || "");
  let tail = "";

  const moveTail = (count: number) => {
    tail = `${url.slice(url.length - count)}${tail}`;
    url = url.slice(0, -count);
  };

  while (/[.,;!?，。；！？、]$/.test(url)) {
    moveTail(1);
  }

  const openParenCount = (url.match(/\(/g) || []).length;
  let closeParenCount = (url.match(/\)/g) || []).length;
  while (url.endsWith(")") && closeParenCount > openParenCount) {
    moveTail(1);
    closeParenCount -= 1;
  }

  return { url, tail };
};

const renderSafeLink = (
  label: string,
  urlRaw: string,
  blockedHosts: ReadonlySet<string>,
  classSet: MarkdownClassSet,
): string => {
  const url = urlRaw.trim();
  if (isSafeSiteRelativeUrl(url)) {
    const safeHref = escapeHtmlAttribute(url);
    return `<a href="${safeHref}" class="${classSet.link}" data-acbox-action="markdown_internal_link" data-acbox-label="${safeHref}">${label}</a>`;
  }
  if (isHttpUrl(url)) {
    if (!isSafeHttpUrl(url)) {
      return `<span class="${classSet.invalidLink}">${label} (${url})</span>`;
    }
    const host = parseHostname(url);
    const safeHref = escapeHtmlAttribute(url);
    if (isBlockedLinkHost(host, blockedHosts)) {
      return `<span class="${classSet.blockedLink}">${label}</span>`;
    }
    if (/^http:\/\//i.test(url)) {
      return `<a href="${safeHref}" class="${classSet.link}" target="_blank" rel="noopener noreferrer nofollow ugc" data-acbox-action="markdown_http_link" data-acbox-label="${safeHref}">${label}</a>`;
    }
    return `<a href="${safeHref}" class="${classSet.link}" target="_blank" rel="noopener noreferrer ugc" data-acbox-action="markdown_https_link" data-acbox-label="${safeHref}">${label}</a>`;
  }
  if (isAppDeepLink(url)) {
    return `<a href="#" data-app-link="${escapeHtmlAttribute(url)}" class="${classSet.appLink}" data-acbox-action="markdown_app_link" data-acbox-label="${escapeHtmlAttribute(url)}">${label}</a>`;
  }
  return `<span class="${classSet.invalidLink}">${label} (${url})</span>`;
};

const stashMarkdownToken = (tokens: MarkdownTokenMap, html: string): string => {
  const token = `@@ACBOX_MD_TOKEN_${tokens.size}@@`;
  tokens.set(token, html);
  return token;
};

const restoreMarkdownTokens = (value: string, tokens: MarkdownTokenMap): string => {
  let next = value;
  for (const [token, html] of tokens) {
    next = next.split(token).join(html);
  }
  return next;
};

const findMarkdownTargetEnd = (
  value: string,
  targetStartIndex: number,
): number => {
  let depth = 1;
  for (let index = targetStartIndex; index < value.length; index += 1) {
    const char = value[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
};

const replaceMarkdownImageSyntax = (
  value: string,
  tokens: MarkdownTokenMap,
  classSet: MarkdownClassSet,
): string => {
  let output = "";
  let index = 0;
  let renderedImageCount = 0;

  while (index < value.length) {
    const start = value.indexOf("![", index);
    if (start < 0) {
      output += value.slice(index);
      break;
    }

    const labelEnd = value.indexOf("]", start + 2);
    if (labelEnd < 0 || value[labelEnd + 1] !== "(") {
      output += value.slice(index, start + 2);
      index = start + 2;
      continue;
    }

    const targetStart = labelEnd + 2;
    const targetEnd = findMarkdownTargetEnd(value, targetStart);
    if (targetEnd < 0) {
      output += value.slice(index, targetStart);
      index = targetStart;
      continue;
    }

    output += value.slice(index, start);
    const rawUrl = value.slice(targetStart, targetEnd);
    const imageLoading = renderedImageCount < 3 ? "eager" : "lazy";
    const imageFetchPriority = renderedImageCount === 0 ? "high" : undefined;
    output += stashMarkdownToken(
      tokens,
      renderSafeImage(
        value.slice(start + 2, labelEnd),
        rawUrl,
        classSet,
        imageLoading,
        imageFetchPriority,
      ),
    );
    if (isSafeHttpsUrl(rawUrl.trim())) {
      renderedImageCount += 1;
    }
    index = targetEnd + 1;
  }

  return output;
};

const replaceMarkdownLinkSyntax = (
  value: string,
  tokens: MarkdownTokenMap,
  blockedHosts: ReadonlySet<string>,
  classSet: MarkdownClassSet,
): string => {
  let output = "";
  let index = 0;

  while (index < value.length) {
    const start = value.indexOf("[", index);
    if (start < 0) {
      output += value.slice(index);
      break;
    }

    const labelEnd = value.indexOf("]", start + 1);
    if (labelEnd < 0 || value[labelEnd + 1] !== "(") {
      output += value.slice(index, start + 1);
      index = start + 1;
      continue;
    }

    const targetStart = labelEnd + 2;
    const targetEnd = findMarkdownTargetEnd(value, targetStart);
    if (targetEnd < 0) {
      output += value.slice(index, targetStart);
      index = targetStart;
      continue;
    }

    const rawTarget = value.slice(targetStart, targetEnd).trim();
    const urlOnly = rawTarget.split(/\s+/)[0] || rawTarget;
    output += value.slice(index, start);
    output += stashMarkdownToken(
      tokens,
      renderSafeLink(
        value.slice(start + 1, labelEnd),
        urlOnly,
        blockedHosts,
        classSet,
      ),
    );
    index = targetEnd + 1;
  }

  return output;
};

const renderBareUrls = (
  value: string,
  blockedHosts: ReadonlySet<string>,
  classSet: MarkdownClassSet,
): string =>
  value.replace(
    /(^|[\s>：:])((?:https?:\/\/)[^\s<]+)/gim,
    (match, prefix, rawUrl) => {
      const { url, tail } = normalizeBareMarkdownUrl(String(rawUrl || ""));
      if (!isSafeHttpUrl(url)) return match;
      return `${prefix}${renderSafeLink(url, url, blockedHosts, classSet)}${tail}`;
    },
  );

const renderSafeImage = (
  alt: string,
  urlRaw: string,
  classSet: MarkdownClassSet,
  loading: "eager" | "lazy",
  fetchPriority?: "high",
): string => {
  const url = urlRaw.trim();
  if (!isSafeHttpsUrl(url)) {
    return `<span class="${classSet.invalidLink}">[图片链接已拦截: ${url}]</span>`;
  }
  const safeAlt = escapeHtmlAttribute((alt || '').trim() || '内容配图');
  const safeSrc = escapeHtmlAttribute(url);
  const priorityAttr = fetchPriority ? ` fetchpriority="${fetchPriority}"` : "";
  return `<img alt="${safeAlt}" src="${safeSrc}" loading="${loading}" decoding="async"${priorityAttr} class="${classSet.image}" />`;
};

const stripHtmlTags = (value: string): string =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeHeadingComparisonText = (value: string): string =>
  stripHtmlTags(value).replace(/\s+/g, " ").trim().toLowerCase();

const normalizeHeadingLooseComparisonText = (value: string): string =>
  normalizeHeadingComparisonText(value).replace(
    /[\s\u3000\-_|:：;；,.，。!?！？'"“”‘’()[\]{}【】《》<>/\\]+/g,
    "",
  );

const isFirstHeadingDemotionMatch = (headingText: string, targetText: string): boolean => {
  const heading = normalizeHeadingComparisonText(headingText);
  const target = normalizeHeadingComparisonText(targetText);
  if (!heading || !target) return false;
  if (heading === target) return true;

  const looseHeading = normalizeHeadingLooseComparisonText(heading);
  const looseTarget = normalizeHeadingLooseComparisonText(target);
  if (!looseHeading || !looseTarget) return false;
  if (looseHeading === looseTarget) return true;
  if (looseHeading.length < 6 || looseTarget.length < 6) return false;
  return looseTarget.includes(looseHeading) || looseHeading.includes(looseTarget);
};

const isHiddenHeadingMatch = (
  headingText: string,
  hiddenHeadingTexts: readonly string[],
): boolean => {
  const heading = normalizeHeadingLooseComparisonText(headingText);
  if (!heading) return false;
  return hiddenHeadingTexts.some((item) => {
    const hidden = normalizeHeadingLooseComparisonText(item);
    return Boolean(hidden && heading === hidden);
  });
};

const renderListItem = (content: string, className: string): string =>
  className ? `<li class="${className}">${content}</li>` : `<li>${content}</li>`;

const resolveHeadingAttrs = (
  rawAttrs: string,
  headingId: string,
  injectHeadingAnchors: boolean,
): string => {
  let nextAttrs = rawAttrs
    .replace(/\sdata-toc-source="[^"]*"/g, "")
    .replace(/\sid="[^"]*"/g, "");

  if (!injectHeadingAnchors) return nextAttrs;

  if (/class="/.test(nextAttrs)) {
    nextAttrs = nextAttrs.replace(
      /class="([^"]*)"/,
      (_m, className) => `class="${String(className || "").trim()} scroll-mt-24"`,
    );
  } else {
    nextAttrs += ' class="scroll-mt-24"';
  }

  nextAttrs += ` id="${headingId}"`;
  return nextAttrs;
};

export const buildRenderedMarkdownDocument = (
  input: unknown,
  options?: RenderMarkdownOptions,
): RenderedMarkdownDocument => {
  try {
    const classSet = resolveMarkdownClassSet(options?.preset);
    const blockedHosts = new Set(
      (options?.blockedLinkHosts || [])
        .map((host) => String(host || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const raw = normalizeMarkdownInput(input);
    if (!raw.trim()) return { html: "", headings: [] };

    const tokens: MarkdownTokenMap = new Map();
    const normalizedRaw = raw.replace(/\r\n?/g, "\n");
    const codeProtectedRaw = normalizedRaw
      .replace(
        /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/gim,
        (_m, lang, code) =>
          stashMarkdownToken(
            tokens,
            `<pre class="${classSet.codeBlock}"><code${lang ? ` class="language-${lang}"` : ""}>${escapeHtml(String(code || "").replace(/\n$/, ""))}</code></pre>`,
          ),
      )
      .replace(/`([^`]+)`/gim, (_m, code) =>
        stashMarkdownToken(
          tokens,
          `<code class="${classSet.inlineCode}">${escapeHtml(code)}</code>`,
        ),
      );

    const preprocessed = preprocessPartingLine(
      preprocessCodeLinkAsQuote(
        preprocessHtmlHeadings(
          preprocessHtmlImageAsMarkdown(
            preprocessBareAutolinks(codeProtectedRaw),
          ),
        ),
      ),
    );

    let html = escapeHtml(preprocessed)
      .replace(/^#### (.*$)/gim, `<h4 data-toc-source="heading" class="${classSet.h4}">$1</h4>`)
      .replace(/^### (.*$)/gim, `<h3 data-toc-source="heading" class="${classSet.h3}">$1</h3>`)
      .replace(/^## (.*$)/gim, `<h2 data-toc-source="heading" class="${classSet.h2}">$1</h2>`)
      .replace(/^# (.*$)/gim, `<h1 data-toc-source="heading" class="${classSet.h1}">$1</h1>`)
      ;

    html = replaceMarkdownImageSyntax(html, tokens, classSet)
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      ;

    html = replaceMarkdownLinkSyntax(html, tokens, blockedHosts, classSet)
      .replace(
        /^&gt;\s*#### (.*$)/gim,
        `<blockquote class="${classSet.blockquote}"><h4 data-toc-source="heading" class="${classSet.quoteH4}">$1</h4></blockquote>`,
      )
      .replace(
        /^&gt;\s*### (.*$)/gim,
        `<blockquote class="${classSet.blockquote}"><h3 data-toc-source="heading" class="${classSet.quoteH3}">$1</h3></blockquote>`,
      )
      .replace(
        /^&gt;\s*## (.*$)/gim,
        `<blockquote class="${classSet.blockquote}"><h2 data-toc-source="heading" class="${classSet.quoteH2}">$1</h2></blockquote>`,
      )
      .replace(
        /^&gt;\s*# (.*$)/gim,
        `<blockquote class="${classSet.blockquote}"><h1 data-toc-source="heading" class="${classSet.quoteH1}">$1</h1></blockquote>`,
      )
      .replace(
        /^&gt; (.*$)/gim,
        `<blockquote class="${classSet.blockquote}">$1</blockquote>`,
      )
      .replace(/^---$/gim, `<hr class="${classSet.hr}" />`);

    html = renderBareUrls(html, blockedHosts, classSet);

    const tableRegex = /\|(.+)\|\n\|( *[-:]+ *\|)+([\s\S]*?)(?=\n\n|$)/g;
    html = html.replace(tableRegex, (match) => {
      const rows = match.trim().split("\n");
      const headerCells = rows[0].split("|").map((h) => h.trim()).filter(Boolean);

      let tableHtml =
        `<div class="${classSet.tableWrap}"><table class="${classSet.table}"><thead><tr>`;
      headerCells.forEach((h) => {
        tableHtml += `<th class="${classSet.tableHeaderCell}">${h}</th>`;
      });
      tableHtml += "</tr></thead><tbody>";

      rows.slice(2).forEach((rowLine) => {
        const cells = rowLine.split("|").map((c) => c.trim()).slice(1, -1);
        if (cells.length === headerCells.length) {
          tableHtml += classSet.tableRow
            ? `<tr class="${classSet.tableRow}">`
            : "<tr>";
          cells.forEach((cell) => {
            tableHtml += `<td class="${classSet.tableBodyCell}">${cell}</td>`;
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
      const inferredHeadingMatch = trimmed.match(/^<strong>(.+?)<\/strong>$/);
      const tokenOnlyMatch = trimmed.match(/^@@ACBOX_MD_TOKEN_\d+@@$/);

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

      if (tokenOnlyMatch) {
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
          finalHtml += `<ul class="${classSet.unorderedList}">`;
          inUnorderedList = true;
        }
        finalHtml += renderListItem(
          unorderedMatch[1],
          classSet.unorderedListItem,
        );
        return;
      }

      const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (orderedMatch) {
        if (inUnorderedList) {
          finalHtml += "</ul>";
          inUnorderedList = false;
        }
        if (!inOrderedList) {
          finalHtml += `<ol class="${classSet.orderedList}">`;
          inOrderedList = true;
        }
        finalHtml += renderListItem(
          orderedMatch[1],
          classSet.orderedListItem,
        );
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

      if (inferredHeadingMatch) {
        finalHtml += `<h3 data-toc-source="inferred" class="${classSet.h3}">${inferredHeadingMatch[1]}</h3>`;
        return;
      }

      if (!trimmed.startsWith("<")) {
        finalHtml += `<p class="${classSet.paragraph}">${trimmed}</p>`;
      } else {
        finalHtml += trimmed;
      }
    });

    if (inUnorderedList) finalHtml += "</ul>";
    if (inOrderedList) finalHtml += "</ol>";

    const headings: MarkdownHeadingItem[] = [];
    let headingIndex = 0;
    const headingDemotionTarget = String(options?.renderFirstHeadingMatchingTextAsPlainBlock || "");
    const hiddenHeadingTexts = (options?.hiddenHeadingTexts || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const htmlWithAnchors = finalHtml.replace(
      /<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/g,
      (match, level, rawAttrs, inner) => {
        const text = stripHtmlTags(restoreMarkdownTokens(inner, tokens));
        if (!text) return match;
        if (isHiddenHeadingMatch(text, hiddenHeadingTexts)) return "";
        const shouldRenderHeadingAsPlainBlock =
          Number(level) === 1 &&
          headingDemotionTarget &&
          isFirstHeadingDemotionMatch(text, headingDemotionTarget);
        if (shouldRenderHeadingAsPlainBlock) {
          const plainAttrs = rawAttrs
            .replace(/\sdata-toc-source="[^"]*"/g, "")
            .replace(/\sid="[^"]*"/g, "");
          return `<p${plainAttrs}>${inner}</p>`;
        }
        const nextLevel = level;
        const headingId = `post-heading-${headingIndex}`;
        headingIndex += 1;
        headings.push({
          id: headingId,
          text,
          level: Number(nextLevel),
          source: /data-toc-source="inferred"/.test(rawAttrs) ? "inferred" : "heading",
        });
        const nextAttrs = resolveHeadingAttrs(
          rawAttrs,
          headingId,
          Boolean(options?.injectHeadingAnchors),
        );
        return `<h${nextLevel}${nextAttrs}>${inner}</h${nextLevel}>`;
      },
    );

    return { html: restoreMarkdownTokens(htmlWithAnchors, tokens), headings };
  } catch {
    const fallback = escapeHtml(normalizeMarkdownInput(input));
    return {
      html: fallback ? `<p class="my-2">${fallback}</p>` : "",
      headings: [],
    };
  }
};

export const renderMarkdown = (
  input: unknown,
  options?: RenderMarkdownOptions,
): { __html: string } => ({
  __html: buildRenderedMarkdownDocument(input, options).html,
});
