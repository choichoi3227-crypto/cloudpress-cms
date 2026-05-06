// src/lib/wp-bridge/memory-manager.ts
/**
 * PHP-Wasm 메모리 관리 및 강제 GC 유틸리티
 */
export class MemoryManager {
  constructor(private phpInstance: any) {} // @php-wasm/universal의 PHP 인스턴스

  /**
   * PHP 내부의 순환 참조 및 미사용 객체를 강제로 해제합니다.
   */
  public forceCollect() {
    this.phpInstance.run(`
      gc_collect_cycles(); // 순환 참조 해제
      gc_mem_used();       // 메모리 사용량 확인 (디버깅용)
    `);
    
    const used = this.phpInstance.binary.buffer.byteLength;
    console.log(`[Memory Monitor] Current Wasm Heap: ${(used / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * 메모리 사용량이 임계치에 도달했는지 확인합니다.
   */
  public isOverThreshold(limitMb: number = 110): boolean {
    const used = this.phpInstance.binary.buffer.byteLength;
    return used > limitMb * 1024 * 1024;
  }

  /**
   * 매우 무거운 작업 후 메모리를 '소프트 리셋'하는 로직
   * PHP 변수들을 해제하여 힙 내부의 빈 공간(Free List)을 확보합니다.
   * 경고: 이 작업은 전역 변수를 제거하므로 주의해서 사용해야 합니다.
   */
  public softReset() {
    this.phpInstance.run(`
      $globals = array_keys($GLOBALS);
      foreach ($globals as $global) {
          if ($global !== 'GLOBALS' && $global !== '_GET' && $global !== '_POST' && $global !== '_SERVER' && $global !== '_COOKIE' && $global !== '_FILES' && $global !== '_ENV') {
              unset($$global);
          }
      }
      gc_collect_cycles();
    `);
  }
}
