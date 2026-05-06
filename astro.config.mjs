// astro.config.mjs — CloudPress CMS
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',        // dist/_worker.js 생성 (wrangler.toml main과 일치)
    functionPerRoute: false,  // 단일 Worker 번들
    imageService: 'passthrough',
  }),
  vite: {
    build: {
      minify: true,
    },
    // Cloudflare Workers 환경에서 Node.js 내장 모듈 폴리필
    ssr: {
      target: 'webworker',
      noExternal: ['@php-wasm/web'],
    },
    define: {
      // php-wasm 빌드에 필요한 환경 변수
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  },
  // TypeScript 경로 별칭
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
