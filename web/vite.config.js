import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change "gridiron-report" below to match your actual GitHub repo name.
export default defineConfig({
  plugins: [react()],
  base: "/gridiron-report/",
});
