import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      // Resolves `igniteui-theming` to this repo's engine through the workspace link.
      scss: { loadPaths: ["../../node_modules"] },
    },
  },
});
