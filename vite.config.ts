import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const enableLovableTagger = isDev && process.env.VITE_LOVABLE_TAGGER !== "false";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      // Enable Lovable component tagger in development mode
      enableLovableTagger && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Optimize for Lovable platform
    build: {
      // Ensure proper source maps for Lovable debugging
      sourcemap: isDev,
      // Optimize chunk splitting for better Lovable performance
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          },
        },
      },
    },
    // Define environment variables for Lovable
    define: {
      __LOVABLE_MODE__: JSON.stringify(isDev && enableLovableTagger),
    },
  };
});
