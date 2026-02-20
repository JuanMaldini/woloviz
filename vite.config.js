import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playgroundDataPath = path.resolve(
  __dirname,
  "src/pages/Projects/Tours/playground/data.js",
);

const playgroundDataWriterPlugin = {
  name: "playground-data-writer",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/__playground/write-data", async (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
        return;
      }

      try {
        let rawBody = "";
        await new Promise((resolve, reject) => {
          req.on("data", (chunk) => {
            rawBody += chunk;
          });
          req.on("end", resolve);
          req.on("error", reject);
        });

        const body = JSON.parse(rawBody || "{}");
        const content = typeof body?.content === "string" ? body.content : "";

        if (!content.trim()) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ ok: false, error: "Missing content payload" }),
          );
          return;
        }

        await fs.writeFile(playgroundDataPath, content, "utf8");

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), playgroundDataWriterPlugin],
  build: {
    emptyOutDir: true,
  },
});
