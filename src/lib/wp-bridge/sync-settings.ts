// src/lib/wp-bridge/sync-settings.ts
import { add_action } from './hooks';

export function setupSettingsSync(d1: D1Database) {
  const targetOptions = ['wp_rocket_settings', 'active_plugins', 'template', 'stylesheet'];

  targetOptions.forEach(optionName => {
    add_action(`update_option_${optionName}`, async (oldValue: any, newValue: any) => {
      const serializedValue = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
      
      await d1.prepare("INSERT OR REPLACE INTO wp_options (option_name, option_value) VALUES (?, ?)")
        .bind(optionName, serializedValue)
        .run();
        
      console.log(`[D1 Sync] ${optionName} 설정이 업데이트되었습니다.`);
    }, 10);
  });
}
