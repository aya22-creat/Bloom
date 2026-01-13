import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [];

  try {
    const reactSwc = await import("@vitejs/plugin-react-swc");
    plugins.push(reactSwc.default());
  } catch {
    try {
      const reactBabel = await import("@vitejs/plugin-react");
      plugins.push(reactBabel.default());
      console.warn("Using @vitejs/plugin-react (Babel) as a fallback.");
    } catch {
      console.warn("React plugin not found; proceeding without it.");
    }
  }

  // No additional development-only plugins

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
