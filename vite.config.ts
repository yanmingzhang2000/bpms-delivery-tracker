import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 部署在 https://<用户名>.github.io/<仓库名>/ 这样的子路径下，
// 需要把 base 设为仓库名，否则打包后的资源引用会按根路径 "/" 找，导致 404。
// 仅在生产构建（vite build）时使用该 base，本地开发（vite / npm run dev）继续用根路径 "/"，
// 这样 http://localhost:5173/ 访问体验不受影响。
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/bpms-delivery-tracker/" : "/",
  plugins: [react()],
}));
