
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Ensure _redirects file is copied to dist folder
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === '_redirects') {
            return '_redirects';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Copy public files including _redirects to dist
    copyPublicDir: true
  }
}));
