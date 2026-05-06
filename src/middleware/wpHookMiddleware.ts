// src/middleware/wpHookMiddleware.ts
import { wp_hooks, do_action } from '../lib/wp-bridge/hooks';

export async function handleRequest(request: Request, next: () => Promise<Response>) {
  const response = await next();
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  let html = await response.text();

  const headBuffer: string[] = [];
  // wp_head 액션 실행 (등록된 모든 플러그인의 스크립트/스타일이 headBuffer에 쌓임)
  // 실제 구현에서는 do_action 내부에서 phpRuntime.runCode()를 호출하여 PHP 플러그인의 출력을 캡처해야 합니다.
  // 여기서는 예시를 위해 직접 headBuffer에 push하는 로직을 가정합니다.
  wp_hooks.add_action('wp_head', (content: string) => headBuffer.push(content));
  do_action('wp_head'); 

  html = html.replace('</head>', `${headBuffer.join('\n')}\n</head>`);

  const footerBuffer: string[] = [];
  wp_hooks.add_action('wp_footer', (content: string) => footerBuffer.push(content));
  do_action('wp_footer'); 
  
  html = html.replace('</body>', `${footerBuffer.join('\n')}\n</body>`);

  return new Response(html, {
    headers: response.headers
  });
}
