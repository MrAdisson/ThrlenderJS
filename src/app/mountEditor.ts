import { ThrlenderEngine } from '../ThrlenderEngine';
import { DEBUG } from '../debug/debug';
import { eventManager } from '../eventManager';
import { MENU } from '../menu/menu';
import { mouseManager } from '../mouseManager';
import { getConfigCallbacks } from '../utils/config';

interface EditorEngine {
  init(host: HTMLElement): void;
  resize(width: number, height: number): void;
  update(): void;
  render(): void;
  dispose(): void;
  syncCameraControls(): void;
}

export function mountEditor(host: HTMLElement): () => void {
  const thrlender = new ThrlenderEngine();
  const engine: EditorEngine = thrlender;
  const cleanup: (() => void)[] = [() => engine.dispose()];

  function dispose() {
    while (cleanup.length) cleanup.pop()?.();
  }

  try {
    engine.init(host);
    const debug = DEBUG.init(host, thrlender);
    cleanup.push(debug.dispose);
    cleanup.push(mouseManager.init(thrlender, debug));
    cleanup.push(eventManager.init(thrlender));
    cleanup.push(MENU.initMenu(host, thrlender));

    function resize(width: number, height: number) {
      if (width > 0 && height > 0) engine.resize(width, height);
    }

    resize(host.clientWidth, host.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      resize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(host);
    cleanup.push(() => observer.disconnect());

    const config = thrlender.config;
    const configCallbacks: Record<keyof typeof config, () => void> = getConfigCallbacks(thrlender);
    const configKeys = Object.keys(configCallbacks) as (keyof typeof config)[];
    const previousConfig = { ...config };
    let frameId: number;

    function animate() {
      for (const key of configKeys) {
        if (config[key] !== previousConfig[key]) configCallbacks[key]();
      }
      Object.assign(previousConfig, config);
      engine.syncCameraControls();
      engine.update();
      engine.render();
      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    cleanup.push(() => cancelAnimationFrame(frameId));
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
