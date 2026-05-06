// src/lib/wp-bridge/php-runtime.ts
import { PHP } from '@php-wasm/universal';

export class PHPRuntime {
  private php: any;
  private outputBuffer: string = "";

  async initialize() {
    this.php = await PHP.load('8.2', {
      onStdout: (data: Uint8Array) => {
        const text = new TextDecoder().decode(data);
        this.outputBuffer += text;
      },
      onStderr: (data: Uint8Array) => {
        console.error("PHP Error:", new TextDecoder().decode(data));
      }
    });
  }

  async runCode(code: string): Promise<string> {
    this.outputBuffer = ""; // 버퍼 초기화
    await this.php.run(code);
    return this.outputBuffer; // 가로채진 echo 결과 반환
  }

  setGlobal(name: string, value: any) {
    this.php.setVariable(name, value);
  }

  // PHP-Wasm 인스턴스 자체를 반환 (저수준 접근용)
  get instance() {
    return this.php;
  }
}
