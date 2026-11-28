import { ThrlenderEngine } from '../ThrlenderEngine';
import { eventManager } from '../eventManager';
import { mouseManager } from '../mouseManager';
import { getConfigCallbacks } from '../utils/config';

export function mountEditor(host: HTMLElement, refresh: () => void) {
  const engine = new ThrlenderEngine();
  const cleanup: (() => void)[] = [() => engine.dispose()];

  function dispose() {
    while (cleanup.length) cleanup.pop()?.();
  }

  try {
    engine.init(host);
    cleanup.push(mouseManager.init(engine));
    cleanup.push(eventManager.init(engine));
    engine.addEventListener('selection-changed', refresh);
    engine.addEventListener('scene-loaded', refresh);
    engine.addEventListener('scene-changed', refresh);
    const transformControls = engine.transformControls!;
    transformControls.addEventListener('objectChange', refresh);
    cleanup.push(() => {
      engine.removeEventListener('selection-changed', refresh);
      engine.removeEventListener('scene-loaded', refresh);
      engine.removeEventListener('scene-changed', refresh);
      transformControls.removeEventListener('objectChange', refresh);
    });

    function resize(width: number, height: number) {
      if (width > 0 && height > 0) engine.resize(width, height);
    }

    resize(host.clientWidth, host.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      resize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(host);
    cleanup.push(() => observer.disconnect());

    const config = engine.config;
    const configCallbacks: Record<keyof typeof config, () => void> = getConfigCallbacks(engine);
    const configKeys = Object.keys(configCallbacks) as (keyof typeof config)[];
    const previousConfig = { ...config };
    let frameId: number;

    function animate() {
      let configChanged = false;
      for (const key of configKeys) {
        if (config[key] !== previousConfig[key]) {
          configCallbacks[key]();
          configChanged = true;
        }
      }
      Object.assign(previousConfig, config);
      if (configChanged) refresh();
      engine.update();
      engine.render();
      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    cleanup.push(() => cancelAnimationFrame(frameId));
    return { engine, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
