
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({config: path.resolve(__dirname, 'tailwind.config.js')}),
        autoprefixer()
      ],
    },
  },
  // GitHub Pages의 리포지토리 이름과 일치시켜야 합니다.
  // 예: https://user.github.io/client-visit-map/
  base: '/client-visit-map/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  // GitHub Secrets에 저장된 API_KEY를 브라우저 환경에서 인식할 수 있게 변환합니다.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});