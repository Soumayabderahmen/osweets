import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "lovable-export");
const outputHtml = path.join(outputDir, "lovable-local-project-export.html");
const outputManifest = path.join(outputDir, "lovable-local-project-manifest.json");

const excludedDirs = new Set([
  ".git",
  ".tanstack",
  ".vinxi",
  ".nitro",
  ".output",
  "dist",
  "dist-ssr",
  "node_modules",
  "lovable-export",
]);

const excludedOptionalDirs = new Set([
  ".claude",
]);

const textExtensions = new Set([
  ".cjs",
  ".conf",
  ".config",
  ".css",
  ".csv",
  ".env.example",
  ".eslintignore",
  ".gitignore",
  ".html",
  ".js",
  ".json",
  ".lock",
  ".md",
  ".mjs",
  ".prettierignore",
  ".prettierrc",
  ".py",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const neverIncludeFiles = new Set([
  ".env",
]);

const sensitivePatterns = [
  /^\.env\.(?!example$).+/i,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.key$/i,
  /^\.npmrc$/i,
];

const maxPreviewBase64Bytes = 2 * 1024 * 1024;

function toRel(absPath) {
  return path.relative(root, absPath).replaceAll(path.sep, "/");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function getGitStatus() {
  try {
    return execFileSync("git", ["status", "--short"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    return `Unable to read git status: ${error.message}`;
  }
}

function isSensitiveFile(name) {
  if (neverIncludeFiles.has(name)) return true;
  return sensitivePatterns.some((pattern) => pattern.test(name));
}

function isTextFile(relPath) {
  const basename = path.basename(relPath);
  const ext = path.extname(relPath).toLowerCase();
  if (textExtensions.has(basename.toLowerCase())) return true;
  if (textExtensions.has(ext)) return true;
  if (basename === "AGENTS.md") return true;
  return false;
}

function isImageFile(relPath) {
  return imageExtensions.has(path.extname(relPath).toLowerCase());
}

function walk(dir, records = [], skipped = []) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    const relPath = toRel(absPath);

    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) {
        skipped.push({ path: relPath, reason: "generated/dependency/internal directory" });
        continue;
      }

      if (excludedOptionalDirs.has(entry.name)) {
        skipped.push({ path: relPath, reason: "local assistant tooling, not app source" });
        continue;
      }

      walk(absPath, records, skipped);
      continue;
    }

    if (!entry.isFile()) continue;

    if (isSensitiveFile(entry.name)) {
      skipped.push({ path: relPath, reason: "sensitive local secret file" });
      continue;
    }

    const stats = statSync(absPath);
    const buffer = readFileSync(absPath);
    const kind = isTextFile(relPath) ? "text" : isImageFile(relPath) ? "image" : "binary";

    records.push({
      absPath,
      path: relPath,
      kind,
      size: stats.size,
      mtime: stats.mtime.toISOString(),
      sha256: sha256(buffer),
    });
  }

  return { records, skipped };
}

function buildTree(records) {
  const rootNode = { name: ".", children: new Map(), file: null };

  for (const record of records) {
    const parts = record.path.split("/");
    let cursor = rootNode;

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      if (!cursor.children.has(part)) {
        cursor.children.set(part, { name: part, children: new Map(), file: null });
      }
      cursor = cursor.children.get(part);
      if (index === parts.length - 1) cursor.file = record;
    }
  }

  function render(node, depth = 0) {
    const lines = [];
    const children = [...node.children.values()].sort((a, b) => {
      const aIsDir = a.children.size > 0 && !a.file;
      const bIsDir = b.children.size > 0 && !b.file;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const child of children) {
      const prefix = "  ".repeat(depth);
      if (child.file) {
        lines.push(`${prefix}- ${child.name} (${child.file.kind}, ${formatBytes(child.file.size)})`);
      } else {
        lines.push(`${prefix}- ${child.name}/`);
        lines.push(...render(child, depth + 1));
      }
    }

    return lines;
  }

  return render(rootNode).join("\n");
}

function mimeFor(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (ext === ".avif") return "image/avif";
  if (ext === ".gif") return "image/gif";
  if (ext === ".jpeg" || ext === ".jpg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function renderTextFile(record) {
  const content = readFileSync(record.absPath, "utf8");
  return `
    <article class="file">
      <h3>${escapeHtml(record.path)}</h3>
      <p class="meta">${escapeHtml(record.kind)} | ${escapeHtml(formatBytes(record.size))} | sha256: <code>${escapeHtml(record.sha256)}</code></p>
      <pre><code>${escapeHtml(content)}</code></pre>
    </article>`;
}

function renderImageFile(record) {
  const buffer = readFileSync(record.absPath);
  const canPreview = record.size <= maxPreviewBase64Bytes;
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeFor(record.path)};base64,${base64}`;
  const preview = canPreview
    ? `<img src="${dataUrl}" alt="${escapeHtml(record.path)}" loading="lazy" />`
    : `<p class="warning">Preview skipped because the file is larger than ${formatBytes(maxPreviewBase64Bytes)}.</p>`;

  return `
    <article class="file image-file">
      <h3>${escapeHtml(record.path)}</h3>
      <p class="meta">image | ${escapeHtml(formatBytes(record.size))} | sha256: <code>${escapeHtml(record.sha256)}</code></p>
      ${preview}
      <details>
        <summary>Base64 file content</summary>
        <textarea readonly>${escapeHtml(base64)}</textarea>
      </details>
    </article>`;
}

function renderBinaryFile(record) {
  return `
    <article class="file">
      <h3>${escapeHtml(record.path)}</h3>
      <p class="meta">binary | ${escapeHtml(formatBytes(record.size))} | sha256: <code>${escapeHtml(record.sha256)}</code></p>
      <p class="warning">Binary content is not rendered inline. Use the manifest hash to verify the original file.</p>
    </article>`;
}

function buildHtml(records, skipped) {
  const gitStatus = getGitStatus();
  const tree = buildTree(records);
  const textFiles = records.filter((record) => record.kind === "text");
  const imageFiles = records.filter((record) => record.kind === "image");
  const binaryFiles = records.filter((record) => record.kind === "binary");
  const generatedAt = new Date().toISOString();
  const totalBytes = records.reduce((sum, record) => sum + record.size, 0);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lovable Local Project Export</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #fbfaf7;
      --panel: #ffffff;
      --ink: #1f1b18;
      --muted: #766f68;
      --line: #ded7ce;
      --accent: #9c5d2e;
      --soft: #f1e7da;
      --code: #111827;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    header {
      padding: 40px min(6vw, 72px) 28px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, #fff, var(--bg));
    }
    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 28px 0 56px;
    }
    h1, h2, h3 { line-height: 1.15; }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 4vw, 3.5rem);
      letter-spacing: 0;
    }
    h2 {
      margin: 36px 0 12px;
      font-size: 1.35rem;
      border-bottom: 1px solid var(--line);
      padding-bottom: 8px;
    }
    h3 {
      margin: 0 0 8px;
      font-size: 1rem;
      color: var(--accent);
      overflow-wrap: anywhere;
    }
    p { margin: 0 0 12px; }
    a { color: var(--accent); }
    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    pre {
      margin: 12px 0 0;
      padding: 16px;
      max-height: 560px;
      overflow: auto;
      background: var(--code);
      color: #f9fafb;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre;
    }
    textarea {
      width: 100%;
      min-height: 180px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 11px;
      line-height: 1.4;
    }
    img {
      display: block;
      max-width: min(100%, 760px);
      max-height: 420px;
      object-fit: contain;
      margin: 12px 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }
    .lede {
      max-width: 860px;
      color: var(--muted);
      font-size: 1.05rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 24px 0 0;
    }
    .stat, .file, .note {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 2px rgba(31, 27, 24, 0.04);
    }
    .stat strong {
      display: block;
      font-size: 1.35rem;
    }
    .stat span, .meta, .muted {
      color: var(--muted);
      font-size: 0.9rem;
    }
    .file {
      margin: 14px 0;
    }
    .warning {
      color: #8a4b12;
      background: var(--soft);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .toc {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
    }
    .toc a {
      display: inline-flex;
      min-height: 36px;
      align-items: center;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .tree {
      max-height: 640px;
      overflow: auto;
      background: #fff;
      color: var(--ink);
      border: 1px solid var(--line);
    }
    summary {
      cursor: pointer;
      color: var(--accent);
      font-weight: 650;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      display: block;
      max-height: 520px;
      overflow-y: auto;
    }
    th, td {
      text-align: left;
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      font-size: 0.9rem;
      vertical-align: top;
    }
    th {
      position: sticky;
      top: 0;
      background: var(--soft);
      z-index: 1;
    }
  </style>
</head>
<body>
  <header>
    <h1>Lovable Local Project Export</h1>
    <p class="lede">Export autonome du projet local pour aider Lovable a reproduire l'etat actuel. Les secrets locaux comme <code>.env</code>, <code>node_modules</code>, <code>.git</code> et les dossiers de build sont exclus.</p>
    <div class="stats">
      <div class="stat"><strong>${records.length}</strong><span>fichiers exportes</span></div>
      <div class="stat"><strong>${textFiles.length}</strong><span>fichiers texte avec contenu</span></div>
      <div class="stat"><strong>${imageFiles.length}</strong><span>images avec base64</span></div>
      <div class="stat"><strong>${escapeHtml(formatBytes(totalBytes))}</strong><span>taille source incluse</span></div>
    </div>
    <nav class="toc" aria-label="Sections">
      <a href="#instructions">Instructions Lovable</a>
      <a href="#git-status">Git status</a>
      <a href="#tree">Architecture</a>
      <a href="#text-files">Code</a>
      <a href="#image-files">Images</a>
      <a href="#binary-files">Autres binaires</a>
      <a href="#skipped">Exclusions</a>
    </nav>
  </header>
  <main>
    <section id="instructions">
      <h2>Instructions Lovable</h2>
      <div class="note">
        <p>Objectif: mettre le projet Lovable au meme etat fonctionnel que ce projet local, en utilisant les fichiers ci-dessous comme source de verite.</p>
        <p>A ne pas copier: <code>.env</code>, <code>node_modules</code>, <code>.git</code>, dossiers de build/cache. Les vraies variables d'environnement doivent etre configurees dans Lovable a partir de <code>.env.example</code>.</p>
        <p>Pour les images, chaque fichier image contient un apercu et son contenu base64. Les chemins exacts sont ceux a recreer dans le projet.</p>
      </div>
    </section>

    <section id="git-status">
      <h2>Git status local</h2>
      <pre class="tree"><code>${escapeHtml(gitStatus || "Clean working tree")}</code></pre>
    </section>

    <section id="tree">
      <h2>Architecture</h2>
      <pre class="tree"><code>${escapeHtml(tree)}</code></pre>
    </section>

    <section id="text-files">
      <h2>Code et fichiers texte</h2>
      ${textFiles.map(renderTextFile).join("\n")}
    </section>

    <section id="image-files">
      <h2>Images et assets visuels</h2>
      ${imageFiles.map(renderImageFile).join("\n")}
    </section>

    <section id="binary-files">
      <h2>Autres fichiers binaires</h2>
      ${binaryFiles.length ? binaryFiles.map(renderBinaryFile).join("\n") : "<p class=\"muted\">Aucun autre fichier binaire detecte.</p>"}
    </section>

    <section id="skipped">
      <h2>Fichiers et dossiers exclus</h2>
      <table>
        <thead><tr><th>Chemin</th><th>Raison</th></tr></thead>
        <tbody>
          ${skipped.map((item) => `<tr><td><code>${escapeHtml(item.path)}</code></td><td>${escapeHtml(item.reason)}</td></tr>`).join("\n")}
        </tbody>
      </table>
    </section>

    <p class="muted">Genere le ${escapeHtml(generatedAt)} depuis ${escapeHtml(root)}.</p>
  </main>
</body>
</html>`;
}

const { records, skipped } = walk(root);
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputHtml, buildHtml(records, skipped), "utf8");
writeFileSync(
  outputManifest,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      root,
      outputHtml: toRel(outputHtml),
      files: records.map(({ absPath, ...record }) => record),
      skipped,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`HTML export: ${outputHtml}`);
console.log(`Manifest: ${outputManifest}`);
console.log(`Files exported: ${records.length}`);
