// src/middleware/safeRecovery.ts
import { PHPRuntime } from '../lib/wp-bridge/php-runtime'; // PHPRuntime 임포트
import { MemoryManager } from '../lib/wp-bridge/memory-manager'; // MemoryManager 임포트

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  // 기타 환경 변수
}

// 세션 ID를 추출하는 가상의 함수 (쿠키, 헤더 등에서)
function getSessionId(request: Request): string {
  // 실제 구현에서는 쿠키 파싱 로직이 필요
  return request.headers.get('X-Session-ID') || 'default-session';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const sessionId = getSessionId(request);
    let php: PHPRuntime | null = null;

    try {
      // PHP-Wasm 인스턴스 로드 및 초기화
      php = new PHPRuntime();
      await php.initialize();
      
      const memoryManager = new MemoryManager(php.instance); // PHP-Wasm 인스턴스 전달

      // 복구 데이터가 있다면 D1에서 가져와 주입
      const recoveryResult = await env.DB.prepare("SELECT state FROM session_recovery WHERE id = ?").bind(sessionId).first();
      if (recoveryResult && recoveryResult.state) {
        // Zstd 압축 해제 (가정)
        // const decompressedState = await zstdDecompress(recoveryResult.state);
        // php.instance.hydrateState(decompressedState); // PHP-Wasm 인스턴스에 상태 주입 (가상의 함수)
        console.log(`[Recovery] 세션 ${sessionId} 상태 복구 완료.`);
        await env.DB.prepare("DELETE FROM session_recovery WHERE id = ?").bind(sessionId).run();
      }

      // 주기적으로 메모리 체크 (예: 중요 루프 사이나 함수 호출 전)
      // 이 로직은 PHP 코드 실행 중에도 호출될 수 있도록 PHP 브릿지 함수로 노출될 수 있습니다.
      // 예: php.registerFunction('check_memory_and_recover', () => memoryManager.monitor(...));
      // 여기서는 JS 레벨에서 주기적으로 체크하는 것을 가정합니다.
      ctx.waitUntil(async () => {
        // 실제 PHP 실행 중 메모리 사용량은 php.instance.binary.buffer.byteLength로 확인
        if (memoryManager.isOverThreshold(110)) { // 110MB 임계치
          console.warn(`[Memory Watchdog] 세션 ${sessionId}: 메모리 임계치 도달! D1에 상태 백업 시작...`);
          const phpState = php?.instance.serializeState(); // PHP-Wasm 인스턴스 상태 직렬화 (가상의 함수)
          
          // Zstd 압축 (가정)
          // const compressedState = await zstdCompress(phpState);

          await env.DB.prepare(
            "INSERT OR REPLACE INTO session_recovery (id, state, last_url) VALUES (?, ?, ?)"
          ).bind(sessionId, phpState, request.url).run(); // compressedState 대신 phpState 사용 예시
          
          // 이 시점에서 요청을 중단하고 클라이언트에게 재시작을 유도해야 합니다.
          // throw new Error("RECOVERY_REQUIRED"); // fetch 밖에서는 throw가 직접 응답을 만들지 않음
        }
      }());


      const output = await php.runCode('index.php'); // 워드프레스 진입점 실행
      return new Response(output, { headers: { 'Content-Type': 'text/html' } });

    } catch (e: any) {
      if (e.message === 'RECOVERY_REQUIRED') {
        // 클라이언트에게 새로고침을 유도하여 새 Worker 인스턴스에서 D1에 저장된 상태로 재시작
        return new Response(
          '<script>alert("메모리 최적화를 위해 페이지를 재구성합니다. 잠시 후 다시 시도합니다."); window.location.reload();</script>', 
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
      console.error(`[Fatal Error] 세션 ${sessionId}:`, e);
      return new Response("Internal Server Error", { status: 500 });
    } finally {
      // PHP 인스턴스 정리 (필요하다면)
      // php?.destroy(); // @php-wasm/universal에 destroy 메서드가 있다면
    }
  }
};
