import * as THREE from 'three';
import { selectionnableObjectsTypes } from './utils/config';

/**
 * @param {import('./ThrlenderEngine').ThrlenderEngine} thrlender
 * @param {ReturnType<import('./debug/debug').DEBUG.init>} debug
 */
const init = (thrlender, debug) => {
  const canvas = thrlender.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseClick = (event) => {
    if (thrlender.transformControls.dragging) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(mouse, thrlender.camera);
    const intersects = raycaster
      .intersectObjects(thrlender.scene.children)
      .filter((obj) => selectionnableObjectsTypes.includes(obj.object?.name) || obj.object?.type === 'Group');
    const hit = intersects[0]?.object;
    const selection = hit?.light ?? hit ?? null;
    thrlender.setSelectedObject(selection);
    debug.showSelection(selection);
  };

  canvas.addEventListener('mousedown', onMouseClick);
  return () => canvas.removeEventListener('mousedown', onMouseClick);
};

export const mouseManager = {
  init,
};
