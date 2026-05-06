// src/lib/wp-bridge/github-loader.ts
import { GitHubFS } from './github-fs'; // GitHubFS 클래스 임포트

export async function setupGithubLoader(php: any, storage: GitHubFS, kv: any) {
  // PHP에서 호출할 수 있는 JS 함수 등록
  php.registerFunction('github_fetch_and_include', async (path: string) => {
    // 1. KV 캐시 확인 (속도 최적화)
    const cacheKey = `file_cache:${path}`;
    let content = await kv.get(cacheKey);
    if (content) return content;

    // 2. GitHub에서 파일 내용 가져오기
    content = await storage.getFile(path);
    
    // 3. 캐시에 저장 및 반환
    await kv.put(cacheKey, content, { expirationTtl: 86400 }); // 24시간 캐시
    return content;
  });
}
