// src/lib/wp-bridge/hooks.ts
type HookCallback = (...args: any[]) => any;

interface HookInstance {
  callback: HookCallback;
  priority: number;
}

class HookManager {
  private actions: Map<string, HookInstance[]>;
  private filters: Map<string, HookInstance[]>;

  constructor() {
    this.actions = new Map();
    this.filters = new Map();
  }

  private addHook(
    map: Map<string, HookInstance[]>,
    tag: string,
    callback: HookCallback,
    priority: number
  ): void {
    if (!map.has(tag)) {
      map.set(tag, []);
    }

    const hooks = map.get(tag)!;
    hooks.push({ callback, priority });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  public add_action(tag: string, callback: HookCallback, priority: number = 10): void {
    this.addHook(this.actions, tag, callback, priority);
  }

  public do_action(tag: string, ...args: any[]): void {
    const hooks = this.actions.get(tag);
    if (!hooks) return;

    for (const hook of hooks) {
      hook.callback(...args);
    }
  }

  public add_filter(tag: string, callback: HookCallback, priority: number = 10): void {
    this.addHook(this.filters, tag, callback, priority);
  }

  public apply_filters<T>(tag: string, value: T, ...args: any[]): T {
    const hooks = this.filters.get(tag);
    if (!hooks) return value;

    let filteredValue = value;
    for (const hook of hooks) {
      filteredValue = hook.callback(filteredValue, ...args);
    }
    return filteredValue;
  }

  public remove_hook(type: 'action' | 'filter', tag: string): void {
    if (type === 'action') this.actions.delete(tag);
    else this.filters.delete(tag);
  }
}

export const wp_hooks = new HookManager();
export const add_action = wp_hooks.add_action.bind(wp_hooks);
export const do_action = wp_hooks.do_action.bind(wp_hooks);
export const add_filter = wp_hooks.add_filter.bind(wp_hooks);
export const apply_filters = wp_hooks.apply_filters.bind(wp_hooks);
