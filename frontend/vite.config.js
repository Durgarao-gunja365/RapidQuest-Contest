import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // This helps with Fast Refresh issues
      fastRefresh: true,
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
