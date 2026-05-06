cloudpress-worker/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── Sidebar.astro
│   │   ├── Editor.tsx
│   │   └── GutenbergIsolated.astro
│   ├── layouts/
│   │   └── AdminLayout.astro
│   ├── lib/
│   │   ├── ast/
│   │   │   ├── include-transformer.ts
│   │   │   └── transformer.ts
│   │   ├── compression/
│   │   │   └── zstd.ts (Zstd Wasm 라이브러리 래퍼)
│   │   ├── wp-bridge/
│   │   │   ├── d1-binding.ts
│   │   │   ├── github-fs.ts
│   │   │   ├── github-loader.ts
│   │   │   ├── hooks.ts
│   │   │   ├── layered-vfs.ts
│   │   │   ├── low-level-ffi.ts (경고: 매우 위험)
│   │   │   ├── low-level-mem.ts (경고: 매우 위험)
│   │   │   ├── memory-manager.ts
│   │   │   ├── php-engine.ts
│   │   │   ├── php-runtime.ts
│   │   │   ├── snapshot-service.ts
│   │   │   ├── sync-settings.ts
│   │   │   └── vfs-manager.ts
│   │   └── utils/
│   │       └── (기타 유틸리티 함수)
│   ├── middleware/
│   │   ├── safeRecovery.ts
│   │   └── wpHookMiddleware.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   └── index.astro
│   │   └── (프론트엔드 페이지)
│   ├── php-bridge/
│   │   ├── cloudpress-bridge.php
│   │   ├── d1-iterator.php
│   │   ├── d1-pdo.php
│   │   └── zend-string-ffi.php
│   └── services/
│       ├── config-sync.ts
│       ├── memory-watchdog.ts
│       ├── pipeline.ts
│       └── snapshot-builder.ts
├── build-scripts/
│   ├── build-theme.js
│   └── build-vfs.js
├── wrangler.toml
├── package.json
└── (기타 설정 파일)
