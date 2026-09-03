/**
 * Server-side HTML sanitization pipeline.
 *
 * Pure string manipulation (no DOM) so it can run in Node.js without
 * external dependencies. Whitelists a safe subset of tags/attributes and
 * strips anything dangerous (scripts, event handlers, javascript: URLs).
 */

// ---------------------------------------------------------------------------
// Whitelists
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "iframe",
  "div",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "hr",
  "pre",
  "code",
]);

/** Per-tag attribute whitelist (in addition to the global attributes). */
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  iframe: new Set([
    "src",
    "width",
    "height",
    "frameborder",
    "allowfullscreen",
    "allow",
    "title",
  ]),
};

/** Attributes allowed on every whitelisted tag. */
const GLOBAL_ATTRIBUTES = new Set(["class", "style"]);

/** CSS properties permitted inside inline `style` attributes. */
const ALLOWED_CSS_PROPERTIES = new Set([
  "color",
  "text-align",
  "font-weight",
  "font-style",
  "text-decoration",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decode the most common HTML entities to a normalized form. */
function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#0*34;/gi, '"')
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&amp;/gi, "&");
}

/** Re-encode the five significant HTML entities. */
function encodeEntities(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Encode entities for use inside an attribute value (quotes matter). */
function encodeAttrValue(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True when a URL is a safe scheme (http(s), mailto, tel, relative, anchor). */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (trimmed === "") return true; // allow empty (will be dropped later)
  if (trimmed.startsWith("javascript:")) return false;
  if (trimmed.startsWith("data:")) return false;
  if (trimmed.startsWith("vbscript:")) return false;
  if (trimmed.startsWith("file:")) return false;
  // Relative URLs, anchors, and absolute http(s)/mailto/tel are fine.
  return /^(https?:|mailto:|tel:|#|\/|\.)/i.test(trimmed) || !/:/.test(trimmed);
}

/** True when a URL is an allowed embed source for <iframe>. */
function isAllowedEmbedUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (!isSafeUrl(url)) return false;
  // Only allow https for embeds.
  if (!trimmed.startsWith("https://")) return false;
  return (
    trimmed.includes("youtube.com/embed/") ||
    trimmed.includes("youtube-nocookie.com/embed/") ||
    trimmed.includes("drive.google.com")
  );
}

/** Sanitize an inline `style` attribute value, keeping only safe properties. */
function sanitizeStyle(styleValue: string): string {
  const declarations = styleValue.split(";");
  const kept: string[] = [];
  for (const raw of declarations) {
    const colonIndex = raw.indexOf(":");
    if (colonIndex === -1) continue;
    const prop = raw.slice(0, colonIndex).trim().toLowerCase();
    const value = raw.slice(colonIndex + 1).trim();
    if (!prop || !value) continue;
    if (!ALLOWED_CSS_PROPERTIES.has(prop)) continue;
    // Block any attempt to smuggle a url() with a dangerous scheme.
    if (/javascript:|expression\(|data:/i.test(value)) continue;
    kept.push(`${prop}: ${value}`);
  }
  return kept.join("; ");
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

interface OpenTag {
  type: "open";
  tag: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
  raw: string;
}
interface CloseTag {
  type: "close";
  tag: string;
  raw: string;
}
interface Comment {
  type: "comment";
  raw: string;
}
interface Text {
  type: "text";
  raw: string;
}
interface Doctype {
  type: "doctype";
  raw: string;
}
type Token = OpenTag | CloseTag | Comment | Text | Doctype;

const TAG_RE =
  /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<(\/)?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(html)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", raw: html.slice(lastIndex, match.index) });
    }
    const [whole, closing, tagName, attrText] = match;
    if (whole.startsWith("<!--")) {
      tokens.push({ type: "comment", raw: whole });
    } else if (whole.startsWith("<!DOCTYPE")) {
      tokens.push({ type: "doctype", raw: whole });
    } else if (closing) {
      tokens.push({ type: "close", tag: tagName.toLowerCase(), raw: whole });
    } else {
      const selfClosing = attrText.endsWith("/");
      const attrs = parseAttributes(
        selfClosing ? attrText.slice(0, -1) : attrText
      );
      tokens.push({
        type: "open",
        tag: tagName.toLowerCase(),
        attrs,
        selfClosing,
        raw: whole,
      });
    }
    lastIndex = TAG_RE.lastIndex;
  }
  if (lastIndex < html.length) {
    tokens.push({ type: "text", raw: html.slice(lastIndex) });
  }
  return tokens;
}

/** Parse the attribute portion of an opening tag into a map. */
function parseAttributes(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let m: RegExpExecArray | null;
  attrRe.lastIndex = 0;
  while ((m = attrRe.exec(attrText)) !== null) {
    const name = m[1].toLowerCase();
    let value = m[2] ?? "";
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'")) {
      value = value.slice(1, -1);
    }
    attrs[name] = decodeEntities(value);
  }
  return attrs;
}

// ---------------------------------------------------------------------------
// Attribute filtering
// ---------------------------------------------------------------------------

function isAllowedAttribute(tag: string, name: string): boolean {
  if (GLOBAL_ATTRIBUTES.has(name)) return true;
  const set = TAG_ATTRIBUTES[tag];
  return set ? set.has(name) : false;
}

function isEventHandler(name: string): boolean {
  return name.startsWith("on");
}

/** Filter and transform attributes for a single tag. Returns the cleaned map. */
function sanitizeAttributes(
  tag: string,
  attrs: Record<string, string>,
  stripIframes: boolean
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(attrs)) {
    // Always strip event handlers regardless of whitelist.
    if (isEventHandler(name)) continue;
    if (!isAllowedAttribute(tag, name)) continue;

    if (name === "style") {
      const cleaned = sanitizeStyle(value);
      if (cleaned) result.style = cleaned;
      continue;
    }

    if (name === "href") {
      if (!isSafeUrl(value)) continue;
      result.href = value;
      continue;
    }

    if (name === "src") {
      if (tag === "iframe") {
        if (stripIframes || !isAllowedEmbedUrl(value)) continue;
        result.src = value;
      } else {
        if (!isSafeUrl(value)) continue;
        result.src = value;
      }
      continue;
    }

    // Generic copy-through for remaining whitelisted attributes.
    result[name] = value;
  }

  // Tag-specific enforcement.
  if (tag === "a") {
    if (result.target === "_blank") {
      result.rel = "noopener noreferrer";
    }
  }
  if (tag === "img") {
    if (!result.loading) result.loading = "lazy";
  }

  return result;
}

function serializeAttributes(attrs: Record<string, string>): string {
  const parts: string[] = [];
  for (const [name, value] of Object.entries(attrs)) {
    parts.push(`${name}="${encodeAttrValue(value)}"`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

// ---------------------------------------------------------------------------
// Core sanitizer
// ---------------------------------------------------------------------------

/** Tags whose content should be dropped entirely when the tag is disallowed. */
const DROP_CONTENT_TAGS = new Set(["script", "style", "noscript", "template"]);

/**
 * Render the sanitized output for a single opening tag.
 * Returns the serialized tag string, or "" when the tag should be dropped.
 */
function serializeOpenTag(
  tag: string,
  attrs: Record<string, string>,
  selfClosing: boolean
): string {
  if (!ALLOWED_TAGS.has(tag)) return "";
  const attrStr = serializeAttributes(attrs);
  // Void elements never need a closing slash but tolerate it.
  return `<${tag}${attrStr}${selfClosing ? " /" : ""}>`;
}

function serializeCloseTag(tag: string): string {
  if (!ALLOWED_TAGS.has(tag)) return "";
  return `</${tag}>`;
}

/**
 * Internal sanitizer. When `stripIframes` is true, <iframe> tags (and their
 * content) are removed entirely — used for previews/summaries.
 */
function sanitize(html: string, stripIframes: boolean): string {
  if (html == null) return "";
  const source = typeof html === "string" ? html : String(html);

  const tokens = tokenize(source);
  const out: string[] = [];

  // Depth counter for tags whose content we want to discard entirely.
  let dropDepth = 0;
  let dropTag = "";

  for (const token of tokens) {
    if (token.type === "text") {
      if (dropDepth === 0) out.push(encodeEntities(decodeEntities(token.raw)));
      continue;
    }
    if (token.type === "comment" || token.type === "doctype") {
      // Drop comments and doctypes entirely.
      continue;
    }

    const tag = token.tag;

    // Handle content-dropping for script/style/etc.
    if (dropDepth > 0) {
      if (token.type === "open" && DROP_CONTENT_TAGS.has(tag) && !token.selfClosing) {
        if (tag === dropTag) dropDepth++;
      } else if (token.type === "close" && tag === dropTag) {
        dropDepth--;
        if (dropDepth === 0) dropTag = "";
      }
      continue;
    }

    if (token.type === "open") {
      // Iframe stripping for previews.
      if (tag === "iframe" && stripIframes) {
        if (!token.selfClosing) {
          dropDepth = 1;
          dropTag = "iframe";
        }
        continue;
      }
      // Script/style/etc.: drop the tag and everything until its closer.
      if (DROP_CONTENT_TAGS.has(tag)) {
        if (!token.selfClosing) {
          dropDepth = 1;
          dropTag = tag;
        }
        continue;
      }
      const attrs = sanitizeAttributes(tag, token.attrs, stripIframes);
      const serialized = serializeOpenTag(tag, attrs, token.selfClosing);
      if (serialized) out.push(serialized);
      continue;
    }

    if (token.type === "close") {
      if (tag === "iframe" && stripIframes) continue;
      if (DROP_CONTENT_TAGS.has(tag)) continue;
      const serialized = serializeCloseTag(tag);
      if (serialized) out.push(serialized);
      continue;
    }
  }

  return out.join("");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sanitize an HTML string for safe storage/rendering.
 *
 * - Allows a curated whitelist of formatting, media, and table tags.
 * - Strips scripts, event handlers, and dangerous URLs.
 * - Restricts <iframe> sources to YouTube and Google Drive embeds.
 * - Forces `rel="noopener noreferrer"` on `target="_blank"` links.
 * - Forces `loading="lazy"` on <img> when not explicitly set.
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, false);
}

/**
 * Strict variant that also strips <iframe> tags entirely (content included).
 * Use this for previews, summaries, RSS feeds, search indexing, etc.
 */
export function sanitizeHtmlStrict(html: string): string {
  return sanitize(html, true);
}
