import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"],
    globals: true,
  },
});
