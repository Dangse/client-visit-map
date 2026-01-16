
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
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
