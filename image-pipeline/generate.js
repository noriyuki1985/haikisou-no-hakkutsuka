const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT_DIR = __dirname;
const MANIFEST_PATH = path.join(ROOT_DIR, "manifest.json");
const GRID_PATH = path.join(ROOT_DIR, "grid.html");
const OUT_DIR = path.join(ROOT_DIR, "out");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertSafeId(id) {
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid character id: ${String(id)}`);
  }
}

async function readManifest() {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw);

  if (!Array.isArray(manifest.characters)) {
    throw new Error("manifest.json must contain a characters array.");
  }

  manifest.characters.forEach((character) => assertSafeId(character.id));
  return manifest;
}

async function readStyle(manifest) {
  const styleRef = manifest.style_ref || "style.md";
  const stylePath = path.join(ROOT_DIR, styleRef);
  return fs.readFile(stylePath, "utf8");
}

function buildPrompt(style, character) {
  const lines = [
    style.trim(),
    "",
    `Character ID: ${character.id}`,
    `Character name: ${character.name || character.id}`,
    character.character_type ? `Character type: ${character.character_type}` : "",
    Array.isArray(character.tags) && character.tags.length
      ? `Tags: ${character.tags.join(", ")}`
      : "",
    "",
    character.prompt || "",
  ];

  return lines.filter(Boolean).join("\n");
}

function characterOutputPath(character) {
  return path.join(OUT_DIR, character.id, `${character.id}.png`);
}

function characterRelativeOutputPath(character) {
  return path.posix.join("out", character.id, `${character.id}.png`);
}

async function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const mod = await import("openai");
  const OpenAI = mod.default || mod.OpenAI;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateCharacter(client, style, character) {
  const outputPath = characterOutputPath(character);

  if (await exists(outputPath)) {
    console.log(`skip ${character.id}: ${outputPath}`);
    return { character, outputPath, skipped: true };
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const result = await client.images.generate({
    model: "gpt-image-2",
    prompt: buildPrompt(style, character),
    size: "1024x1536",
  });

  const imageBase64 = result?.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error(`No image data returned for ${character.id}.`);
  }

  await fs.writeFile(outputPath, Buffer.from(imageBase64, "base64"));
  console.log(`generated ${character.id}: ${outputPath}`);
  return { character, outputPath, skipped: false };
}

async function collectGridItems(manifest) {
  return Promise.all(
    manifest.characters.map(async (character) => {
      const filePath = characterRelativeOutputPath(character);
      const outputPath = characterOutputPath(character);
      return {
        id: character.id,
        name: character.name || character.id,
        filePath,
        exists: await exists(outputPath),
      };
    }),
  );
}

function buildGridHtml(manifest, items) {
  const data = JSON.stringify(
    {
      project: manifest.project,
      generatedAt: new Date().toISOString(),
      items,
    },
    null,
    2,
  );

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${manifest.project || "image-pipeline"} image grid</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #ffffff;
      --fg: #111111;
      --muted: #666666;
      --line: #dddddd;
      --panel: #f7f7f7;
      --checker-a: #e9e9e9;
      --checker-b: #ffffff;
    }

    body.dark {
      color-scheme: dark;
      --bg: #050505;
      --fg: #f5f5f5;
      --muted: #aaaaaa;
      --line: #333333;
      --panel: #161616;
      --checker-a: #2a2a2a;
      --checker-b: #080808;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px;
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }

    button {
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      color: var(--fg);
      cursor: pointer;
      font: inherit;
      padding: 0 14px;
    }

    main {
      padding: 20px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .cell {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
    }

    .preview {
      display: grid;
      place-items: center;
      min-height: 280px;
      background-image:
        linear-gradient(45deg, var(--checker-a) 25%, transparent 25%),
        linear-gradient(-45deg, var(--checker-a) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--checker-a) 75%),
        linear-gradient(-45deg, transparent 75%, var(--checker-a) 75%);
      background-color: var(--checker-b);
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      background-size: 16px 16px;
    }

    .preview img {
      display: block;
      max-width: 100%;
      max-height: 360px;
      image-rendering: pixelated;
      cursor: zoom-in;
    }

    .missing {
      color: var(--muted);
      font-size: 14px;
    }

    .meta {
      display: grid;
      gap: 6px;
      padding: 12px;
      border-top: 1px solid var(--line);
      font-size: 13px;
      line-height: 1.35;
    }

    .id {
      font-weight: 700;
      font-size: 15px;
    }

    .path {
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    dialog {
      width: min(92vw, 900px);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0;
      background: var(--bg);
      color: var(--fg);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.72);
    }

    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-bottom: 1px solid var(--line);
    }

    .modal-body {
      display: grid;
      place-items: center;
      min-height: 60vh;
      padding: 16px;
      background-image:
        linear-gradient(45deg, var(--checker-a) 25%, transparent 25%),
        linear-gradient(-45deg, var(--checker-a) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--checker-a) 75%),
        linear-gradient(-45deg, transparent 75%, var(--checker-a) 75%);
      background-color: var(--checker-b);
      background-position: 0 0, 0 10px, 10px -10px, -10px 0;
      background-size: 20px 20px;
    }

    .modal-body img {
      max-width: 100%;
      max-height: 78vh;
      image-rendering: pixelated;
    }

    @media (max-width: 860px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 560px) {
      header {
        align-items: flex-start;
        flex-direction: column;
      }

      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1 id="title"></h1>
    <button id="toggleBg" type="button">背景: 白</button>
  </header>
  <main>
    <div class="grid" id="grid"></div>
  </main>
  <dialog id="modal">
    <div class="modal-head">
      <strong id="modalTitle"></strong>
      <button id="closeModal" type="button">閉じる</button>
    </div>
    <div class="modal-body">
      <img id="modalImage" alt="">
    </div>
  </dialog>
  <script id="grid-data" type="application/json">${data.replace(/</g, "\\u003c")}</script>
  <script>
    const data = JSON.parse(document.getElementById("grid-data").textContent);
    const grid = document.getElementById("grid");
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
    const toggleBg = document.getElementById("toggleBg");

    document.getElementById("title").textContent = data.project + " image grid";

    for (const item of data.items) {
      const cell = document.createElement("article");
      cell.className = "cell";

      const preview = document.createElement("div");
      preview.className = "preview";

      if (item.exists) {
        const image = document.createElement("img");
        image.src = item.filePath;
        image.alt = item.name + " (" + item.id + ")";
        image.addEventListener("click", () => {
          modalImage.src = item.filePath;
          modalImage.alt = image.alt;
          modalTitle.textContent = item.name + " / " + item.id;
          modal.showModal();
        });
        preview.appendChild(image);
      } else {
        const missing = document.createElement("div");
        missing.className = "missing";
        missing.textContent = "画像未生成";
        preview.appendChild(missing);
      }

      const meta = document.createElement("div");
      meta.className = "meta";

      const id = document.createElement("div");
      id.className = "id";
      id.textContent = item.id;

      const name = document.createElement("div");
      name.textContent = item.name;

      const filePath = document.createElement("div");
      filePath.className = "path";
      filePath.textContent = item.filePath;

      meta.append(id, name, filePath);
      cell.append(preview, meta);
      grid.appendChild(cell);
    }

    toggleBg.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      toggleBg.textContent = document.body.classList.contains("dark") ? "背景: 黒" : "背景: 白";
    });

    document.getElementById("closeModal").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.close();
      }
    });
  </script>
</body>
</html>
`;
}

async function writeGrid(manifest) {
  const items = await collectGridItems(manifest);
  await fs.writeFile(GRID_PATH, buildGridHtml(manifest, items), "utf8");
  console.log(`wrote ${GRID_PATH}`);
}

async function main() {
  const manifest = await readManifest();
  const style = await readStyle(manifest);
  const pendingCharacters = [];

  for (const character of manifest.characters) {
    if (!(await exists(characterOutputPath(character)))) {
      pendingCharacters.push(character);
    } else {
      console.log(`skip ${character.id}: ${characterOutputPath(character)}`);
    }
  }

  if (pendingCharacters.length) {
    const client = await createOpenAIClient();
    await Promise.all(
      pendingCharacters.map((character) => generateCharacter(client, style, character)),
    );
  }

  await writeGrid(manifest);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
