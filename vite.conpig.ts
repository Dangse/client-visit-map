
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub 저장소 이름인 'client-visit-map'을 base 경로로 지정합니다.
  // 이 설정을 통해 배포된 페이지에서 자바스크립트와 CSS 파일을 올바른 경로에서 불러옵니다.
  base: '/client-visit-map/', 
  build: {
    outDir: 'dist',
  }
});