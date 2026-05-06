// src/lib/wp-bridge/vfs-manager.ts
export async function mountPlugin(php: any, pluginSlug: string, files: Record<string, string>) {
  const baseDir = `/wp-content/plugins/${pluginSlug}`;
  
  // 1. 기본 디렉토리 생성
  php.mkdirRecursive(baseDir); // php.mkdirRecursive는 PHP-Wasm 인스턴스에 추가된 유틸리티 함수라고 가정

  // 2. 모든 파일을 MEMFS에 동시 주입
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = `${baseDir}/${filePath}`;
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    
    php.mkdirRecursive(dir); // 하위 디렉토리 생성 확인
    
    // PHP-Wasm의 가상 파일 시스템에 파일 쓰기
    php.writeFile(fullPath, content);
  }
  
  console.log(`${pluginSlug} 마운트 완료`);
}
