import { ThrlenderEngine } from './ThrlenderEngine';
import { CONFIG, getConfigCallbacks } from './utils/config';
import { DEBUG } from './debug/debug';
import { mouseManager } from './mouseManager';
import { eventManager } from './eventManager';
import { MENU } from './menu/menu';

// INIT DEBUG

const thrlender = new ThrlenderEngine();
thrlender.init();
DEBUG.init();

// TRIGGER PIPELINE TEST

// UPDATE CONFIG:
let previousConfig = { ...CONFIG };
const updateConfig = function () {
  Object.keys(CONFIG).map((key) => {
    if (CONFIG[key] !== previousConfig[key]) {
      getConfigCallbacks()[key]() && getConfigCallbacks()[key]();
    }
  });
  thrlender.transformControls.dragging ? (thrlender.controls.enabled = false) : (thrlender.controls.enabled = true);
  previousConfig = { ...CONFIG };
};

// INIT :
// initConfig(thrlender);
mouseManager.init();
eventManager.init();
MENU.initMenu();

// ANIMATION LOOP:
const animate = function () {
  thrlender.update();
  updateConfig();
  thrlender.render();
  requestAnimationFrame(animate);
};

animate();
