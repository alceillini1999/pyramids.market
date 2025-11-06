import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// يجعل روابط الأصول نسبية حتى تُحمّل assets بشكل صحيح على Render/static hosts
export default defineConfig({
  base: "./",
  plugins: [react()],
});
