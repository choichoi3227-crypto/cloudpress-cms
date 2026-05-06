// src/lib/wp-bridge/d1-binding.ts
export function bindD1ToPHP(php: any, d1: D1Database) {
  // 쿼리 실행 브릿지 (SELECT 등)
  php.registerFunction('d1_query_bridge', async (sql: string) => {
    try {
      const result = await d1.prepare(sql).all();
      return JSON.stringify({ success: true, results: result.results });
    } catch (e: any) {
      console.error("D1 Query Error:", e);
      return JSON.stringify({ success: false, error: e.message });
    }
  });

  // 실행 브릿지 (INSERT/UPDATE/DELETE)
  php.registerFunction('d1_execute_bridge', async (sql: string, paramsJson: string) => {
    try {
      const params = JSON.parse(paramsJson || '{}');
      const boundValues = Object.values(params); // 바인딩된 값들만 추출
      const result = await d1.prepare(sql).bind(...boundValues).run();
      return JSON.stringify({ success: result.success, results: result.results, changes: result.changes });
    } catch (e: any) {
      console.error("D1 Execute Error:", e);
      return JSON.stringify({ success: false, error: e.message });
    }
  });
}
