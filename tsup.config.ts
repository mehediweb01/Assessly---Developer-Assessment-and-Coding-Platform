import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/app.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  bundle: true,
  splitting: false,
  clean: true,
  outDir: "dist",
  external: ["@prisma/client"],
});
