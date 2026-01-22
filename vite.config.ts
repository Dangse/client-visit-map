
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages의 리포지토리 이름과 일치시켜야 합니다.
  // 예: https://user.github.io/client-visit-map/
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  // GitHub Secrets에 저장된 API_KEY를 브라우저 환경에서 인식할 수 있게 변환합니다.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});