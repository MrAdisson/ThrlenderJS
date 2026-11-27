import { ThrlenderEngine } from '../ThrlenderEngine';
import { DEBUG } from '../debug/debug';
import { eventManager } from '../eventManager';
import { MENU } from '../menu/menu';
import { mouseManager } from '../mouseManager';
import { CONFIG, getConfigCallbacks } from '../utils/config';

// Operations and state the React host needs from the existing Three.js engine.
interface EditorEngine {
  init(host: HTMLElement): void;
  update(): void;
  render(): void;
  dispose(): void;
  syncCameraControls(): void;
}

export function mountEditor(host: HTMLElement): () => void {
  const engine: EditorEngine = new ThrlenderEngine();
  engine.init(host);
  const disposeDebug = DEBUG.init();
  const disposeMouse = mouseManager.init();
  const disposeEvents = eventManager.init();
  const disposeMenu = MENU.initMenu(host);

  const configCallbacks: Record<keyof typeof CONFIG, () => void> = getConfigCallbacks();
  const configKeys = Object.keys(configCallbacks) as (keyof typeof CONFIG)[];
  let previousConfig = { ...CONFIG };
  let frameId: number;

  function animate() {
    engine.update();
    for (const key of configKeys) {
      if (CONFIG[key] !== previousConfig[key]) configCallbacks[key]();
    }
    engine.syncCameraControls();
    previousConfig = { ...CONFIG };
    engine.render();
    frameId = requestAnimationFrame(animate);
  }

  animate();

  return () => {
    cancelAnimationFrame(frameId);
    disposeMenu();
    disposeEvents();
    disposeMouse();
    disposeDebug();
    engine.dispose();
  };
}
