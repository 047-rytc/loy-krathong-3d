import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // ใช้ relative base path เพื่อให้รองรับทั้ง localhost และ GitHub Pages
});
