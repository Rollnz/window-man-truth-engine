import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent duplicate React instances (fixes useState null error)
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React - absolute minimum for FCP
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react-core';
          }
          
          // Router - needed for navigation but can be slightly deferred
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          
          // Data layer - Supabase & TanStack Query (deferred until needed)
          if (id.includes('@supabase/') || id.includes('@tanstack/')) {
            return 'vendor-data';
          }
          
          // Radix UI - split into critical (tooltip/slot) and deferred
          if (id.includes('@radix-ui/react-tooltip') || 
              id.includes('@radix-ui/react-slot') ||
              id.includes('@radix-ui/react-primitive')) {
            return 'vendor-ui-core';
          }
          
          // Heavy Radix components (dialogs, dropdowns, etc.)
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui-deferred';
          }
          
          // Charts - only loaded when needed (lazy routes)
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          
          // Forms - only needed on form pages
          if (id.includes('react-hook-form') || 
              id.includes('@hookform/') || 
              id.includes('zod')) {
            return 'vendor-forms';
          }
          
          // Lucide icons - tree-shaken but still a chunk
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          
          // Helmet/SEO
          if (id.includes('react-helmet')) {
            return 'vendor-seo';
          }
        },
      },
    },
    // Increase chunk size warning limit since we're intentionally chunking
    chunkSizeWarningLimit: 600,
    // Enable minification optimizations
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
}));
