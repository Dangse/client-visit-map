
import { defineConfig } from 'vite';

export default defineConfig({
  // base를 './'로 설정하면 저장소 이름에 상관없이 상대 경로로 리소스를 찾습니다.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
