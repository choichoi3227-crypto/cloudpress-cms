# CloudPress CMS 배포 가이드

## 빠른 시작

### 1. Cloudflare 리소스 생성

```bash
cd cloudpress-cms-main

# D1 데이터베이스 생성
wrangler d1 create cloudpress-cms-db
# → 출력된 database_id를 wrangler.toml의 database_id에 입력

# KV 네임스페이스 생성
wrangler kv namespace create CACHE
# → 출력된 id를 wrangler.toml 첫 번째 [[kv_namespaces]]의 id에 입력

wrangler kv namespace create SESSION_SWAP
# → 출력된 id를 wrangler.toml 두 번째 [[kv_namespaces]]의 id에 입력
```

### 2. Secrets 설정

```bash
wrangler secret put JWT_SECRET
wrangler secret put GITHUB_TOKEN
wrangler secret put WP_ADMIN_USER
wrangler secret put WP_ADMIN_PASS
wrangler secret put WP_ADMIN_EMAIL
```

### 3. DB 초기화

```bash
# 원격 D1에 스키마 적용
wrangler d1 execute cloudpress-cms-db --remote --file=schema.sql
```

### 4. 빌드 & 배포

```bash
npm install
npm run build
wrangler deploy
```

## CloudPress 어드민과 연동

### zip 파일 업로드 방법

1. `npm run build` 후 생성된 `dist/` 폴더를 포함하여 CMS 전체를 zip으로 압축:
   ```bash
   zip -r cloudpress-cms.zip . -x "node_modules/*" -x ".wrangler/*"
   ```
2. CloudPress 어드민 → **시스템 설정** → **CMS 배포 설정** 섹션에서 zip 업로드
3. GitHub 레포(`owner/repo`)와 Personal Access Token 입력 후 저장

### 자동 배포 흐름

호스팅 생성 시 자동으로 실행됩니다:

```
CMS zip (D1 저장) → zip 파싱 → GitHub 레포에 파일 업로드
                                          ↓
                      Cloudflare Workers에 CMS Worker 배포
                                          ↓
                      각 사이트 Worker와 cms_worker_name으로 연결
```

## wrangler.toml 설정 후 예시

```toml
[[d1_databases]]
binding       = "DB"
database_name = "cloudpress-cms-db"
database_id   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 실제 ID

[[kv_namespaces]]
binding = "CACHE"
id      = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← 실제 ID

[[kv_namespaces]]
binding = "SESSION_SWAP"
id      = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # ← 실제 ID
```
