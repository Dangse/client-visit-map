import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 현재 작업 디렉토리에서 환경 변수를 로드합니다. (Vercel 빌드 시 필요)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Vercel은 루트 경로를 사용하므로 '/'가 맞습니다.
    base: '/', 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true
    },
    // Vite 방식: VITE_로 시작하지 않는 환경 변수를 주입하고 싶을 때 사용
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});